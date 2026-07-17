import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_MODEL_PATH, TARGET_INFERENCE_INTERVAL_MS } from '../constants/detection.js';

export function useInferenceWorker(videoRef, enabled, confidenceThreshold) {
  const workerRef = useRef(null), inFlightRef = useRef(false), reqRef = useRef(0), sessionRef = useRef(0), lastRef = useRef(0), rafRef = useRef(0);
  const [state, setState] = useState({ detections: [], backend: '準備中', modelStatus: 'モデル準備中', inferenceTime: null, error: '', warning: '' });
  const clearDetections = useCallback(() => setState((s) => ({ ...s, detections: [], inferenceTime: null })), []);
  useEffect(() => {
    const worker = new Worker(new URL('../workers/inferenceWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.sessionId !== sessionRef.current && msg.type !== 'ready') return;
      if (msg.type === 'ready') setState((s) => ({ ...s, backend: msg.backendLabel, modelStatus: 'モデル読み込み完了', warning: msg.warning || '' }));
      if (msg.type === 'result') { inFlightRef.current = false; setState((s) => ({ ...s, detections: msg.detections, inferenceTime: msg.inferenceTime, error: '' })); }
      if (msg.type === 'error') { inFlightRef.current = false; console.error('Inference worker error:', msg.detail); setState((s) => ({ ...s, error: msg.message || '推論中にエラーが発生しました。' })); }
    };
    worker.postMessage({ type: 'load', modelPath: DEFAULT_MODEL_PATH, sessionId: sessionRef.current });
    return () => worker.terminate();
  }, []);
  useEffect(() => { sessionRef.current += 1; inFlightRef.current = false; clearDetections(); }, [enabled, clearDetections]);
  useEffect(() => {
    const loop = async (now) => {
      if (enabled && document.visibilityState === 'visible' && !inFlightRef.current && now - lastRef.current >= TARGET_INFERENCE_INTERVAL_MS) {
        const video = videoRef.current;
        if (video?.videoWidth && video?.videoHeight) {
          try { inFlightRef.current = true; lastRef.current = now; const bitmap = await createImageBitmap(video); workerRef.current?.postMessage({ type: 'infer', imageBitmap: bitmap, requestId: ++reqRef.current, sessionId: sessionRef.current, confidenceThreshold }, [bitmap]); }
          catch (err) { inFlightRef.current = false; console.error('Frame capture error:', err); }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [confidenceThreshold, enabled, videoRef]);
  return { ...state, clearDetections };
}

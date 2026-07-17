import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CONFIDENCE_THRESHOLD, DETECTION_MODES } from './constants/detection.js';
import { useInferenceWorker } from './hooks/useInferenceWorker.js';
import { useWebcam } from './hooks/useWebcam.js';
import { countPersons, filterDetectionsByMode, formatConfidence, getJapaneseClassName } from './utils/detectionUtils.js';
import { renderOverlay } from './utils/renderOverlay.js';

export default function App() {
  const videoRef = useRef(null), canvasRef = useRef(null), stageRef = useRef(null);
  const [mode, setMode] = useState(DETECTION_MODES.PERSON_ONLY);
  const [threshold, setThreshold] = useState(DEFAULT_CONFIDENCE_THRESHOLD);
  const [displaySize, setDisplaySize] = useState({ width: 640, height: 480 });
  const webcam = useWebcam(videoRef);
  const inference = useInferenceWorker(videoRef, webcam.isRunning, threshold);
  const visibleDetections = useMemo(() => filterDetectionsByMode(inference.detections, mode), [inference.detections, mode]);
  const personCount = webcam.isRunning ? countPersons(inference.detections) : null;

  useEffect(() => { inference.clearDetections(); }, [mode, inference.clearDetections]);
  useEffect(() => {
    const update = () => { const video = videoRef.current; const width = Math.min(stageRef.current?.clientWidth || 640, 900); const ratio = video?.videoWidth && video?.videoHeight ? video.videoHeight / video.videoWidth : 0.75; setDisplaySize({ width, height: Math.round(width * ratio) }); };
    update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update);
  }, []);
  useEffect(() => { renderOverlay(canvasRef.current, visibleDetections, { width: videoRef.current?.videoWidth || 640, height: videoRef.current?.videoHeight || 480 }, displaySize); }, [visibleDetections, displaySize]);
  useEffect(() => { if (!webcam.isRunning) inference.clearDetections(); }, [webcam.isRunning, inference.clearDetections]);

  return <main className="app-shell">
    <header className="hero"><p className="eyebrow">端末内で完結するYOLO教材アプリ</p><h1>ブラウザAI物体検出</h1><p className="subtitle">Chromebookのカメラで人物や物体をリアルタイム検出</p><div className="privacy-note">🔒 カメラ映像は端末内で処理されます。映像を外部サーバーへ送信・保存することはありません。</div></header>
    <section className="people-card" aria-live="polite"><span>現在の人数</span><strong>{personCount === null ? '--' : `${personCount}人`}</strong><small>直近の推論結果から人物クラスだけを集計</small></section>
    <section className="stage-card" ref={stageRef}>
      <div className="video-stage" style={{ width: displaySize.width, height: displaySize.height }}>
        <video ref={videoRef} playsInline muted onLoadedMetadata={() => setDisplaySize((s) => ({ ...s }))} />
        <canvas ref={canvasRef} />
        {!webcam.isRunning && <div className="empty-state">📷 カメラを開始すると、ここに検出結果が表示されます。</div>}
        {webcam.status === 'starting' && <div className="loading"><span className="spinner" />カメラを起動しています</div>}
      </div>
    </section>
    <section className="control-grid">
      <div className="panel actions"><button className="primary" onClick={() => webcam.startCamera()} disabled={webcam.status === 'starting' || webcam.isRunning}>カメラを開始</button><button className="secondary" onClick={webcam.stopCamera} disabled={!webcam.isRunning}>カメラを停止</button><p>カメラ状態：{webcam.isRunning ? '起動中' : webcam.status === 'starting' ? '起動中…' : '停止中'}</p></div>
      <div className="panel"><h2>検出モード</h2><div className="segmented"><button className={mode===DETECTION_MODES.PERSON_ONLY?'active':''} onClick={()=>setMode(DETECTION_MODES.PERSON_ONLY)}>人物のみ</button><button className={mode===DETECTION_MODES.ALL?'active':''} onClick={()=>setMode(DETECTION_MODES.ALL)}>すべての物体</button></div></div>
      <div className="panel"><label>カメラ選択<select value={webcam.deviceId} onChange={(e)=>webcam.selectDevice(e.target.value)}>{webcam.devices.length===0 && <option value="">カメラ未検出</option>}{webcam.devices.map((d,i)=><option key={d.deviceId} value={d.deviceId}>{d.label || `カメラ ${i+1}`}</option>)}</select></label></div>
      <div className="panel"><label>検出信頼度：{formatConfidence(threshold)}<input type="range" min="0.1" max="0.9" step="0.05" value={threshold} onChange={(e)=>setThreshold(Number(e.target.value))}/></label></div>
    </section>
    {(webcam.error || inference.error || inference.warning) && <section className="notice">{webcam.error || inference.error || inference.warning}</section>}
    <section className="status panel"><h2>実行状態</h2><dl><div><dt>モデル</dt><dd>{inference.modelStatus}</dd></div><div><dt>推論時間</dt><dd>{inference.inferenceTime ? `${inference.inferenceTime} ms` : '--'}</dd></div><div><dt>実行方式</dt><dd>{inference.backend}</dd></div></dl></section>
    <section className="results panel"><h2>検出結果一覧</h2>{visibleDetections.length ? <ul>{visibleDetections.map((d,i)=><li key={`${d.classIdx}-${i}`}>{getJapaneseClassName(d.classIdx)} <span>{formatConfidence(d.score)}</span></li>)}</ul> : <p className="muted">まだ有効な検出結果はありません。</p>}</section>
    <footer className="footer"><h2>利用上の注意</h2><p>AI検出には誤検出や見逃しがあります。防犯設備としての性能を保証するものではありません。録画、顔認証、人物属性判定、外部通知は実装していません。</p><p>Derived from yolo-multi-task-onnxruntime-web / App: MIT License / Bundled YOLO models: see model license notices.</p></footer>
  </main>;
}

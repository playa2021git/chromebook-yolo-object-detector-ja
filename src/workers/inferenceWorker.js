import * as ort from 'onnxruntime-web';
import { COCO_CLASSES_EN } from '../constants/cocoClassesJa.js';

let session = null, inputName = '', backendLabel = '未初期化';
const SIZE = 640;

async function createSession(modelPath) {
  ort.env.wasm.wasmPaths = `${self.location.origin}${import.meta.env.BASE_URL}ort-wasm/`;
  if ('gpu' in navigator) {
    try { session = await ort.InferenceSession.create(modelPath, { executionProviders: ['webgpu'] }); backendLabel = 'WebGPU'; return { warning: '' }; }
    catch (error) { console.warn('WebGPU init failed; fallback to WASM:', error); }
  }
  try { session = await ort.InferenceSession.create(modelPath, { executionProviders: ['wasm'] }); backendLabel = 'WASM（CPU）'; return { warning: 'WebGPUを利用できないため、WASM（CPU）で実行します。' }; }
  catch (error) { throw new Error(`WASM fallback failed: ${error?.message || error}`); }
}

function preprocess(bitmap) {
  const canvas = new OffscreenCanvas(SIZE, SIZE), ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, SIZE, SIZE); bitmap.close?.();
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE), input = new Float32Array(3 * SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i += 1) { input[i] = data[i * 4] / 255; input[i + SIZE * SIZE] = data[i * 4 + 1] / 255; input[i + SIZE * SIZE * 2] = data[i * 4 + 2] / 255; }
  return new ort.Tensor('float32', input, [1, 3, SIZE, SIZE]);
}
function iou(a, b) { const ax2 = a[0]+a[2], ay2=a[1]+a[3], bx2=b[0]+b[2], by2=b[1]+b[3]; const ix=Math.max(0, Math.min(ax2,bx2)-Math.max(a[0],b[0])), iy=Math.max(0, Math.min(ay2,by2)-Math.max(a[1],b[1])); const inter=ix*iy; return inter / (a[2]*a[3]+b[2]*b[3]-inter || 1); }
function nms(dets) { const out=[]; for (const d of dets.sort((a,b)=>b.score-a.score)) if (!out.some((o)=>o.classIdx===d.classIdx && iou(o.bbox,d.bbox)>0.45)) out.push(d); return out.slice(0, 100); }
function postprocess(tensor, threshold, width, height) {
  const data = tensor.data, dims = tensor.dims; const rows = dims.at(-1), attrs = dims.at(-2); const dets = [];
  if (!rows || !attrs) throw new Error('推論結果の形式が不正です。');
  for (let i=0; i<rows; i+=1) { let best=0, cls=0; for (let c=4; c<attrs; c+=1) { const v = data[c*rows+i]; if (v>best) { best=v; cls=c-4; } } if (best >= threshold) { const cx=data[i], cy=data[rows+i], w=data[rows*2+i], h=data[rows*3+i]; dets.push({ classIdx: cls, className: COCO_CLASSES_EN[cls] || `class ${cls}`, score: best, bbox: [(cx-w/2)*width/SIZE, (cy-h/2)*height/SIZE, w*width/SIZE, h*height/SIZE] }); } }
  return nms(dets);
}
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') { const result = await createSession(data.modelPath); inputName = session.inputNames[0]; self.postMessage({ type: 'ready', sessionId: data.sessionId, backendLabel, warning: result.warning }); }
    if (data.type === 'infer') { if (!session) throw new Error('モデルを読み込めません。'); const start = performance.now(); const w = data.imageBitmap.width, h = data.imageBitmap.height; const feeds = { [inputName]: preprocess(data.imageBitmap) }; const output = await session.run(feeds); const tensor = output[session.outputNames[0]]; self.postMessage({ type: 'result', sessionId: data.sessionId, requestId: data.requestId, detections: postprocess(tensor, data.confidenceThreshold, w, h), inferenceTime: Math.round(performance.now() - start), backendLabel }); }
  } catch (error) { data.imageBitmap?.close?.(); self.postMessage({ type: 'error', sessionId: data.sessionId, message: error.message?.includes('WASM') ? 'WASMへのフォールバックに失敗しました。モデルファイルを確認してください。' : 'モデルファイルを読み込めないか、推論中に問題が発生しました。', detail: error?.stack || String(error) }); }
};

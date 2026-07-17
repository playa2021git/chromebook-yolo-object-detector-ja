import { PERSON_CLASS_ID } from '../constants/detection.js';
import { formatConfidence, getJapaneseClassName } from './detectionUtils.js';

const OBJECT_COLORS = ['#14b8a6', '#2563eb', '#7c3aed', '#0891b2', '#65a30d'];

export function renderOverlay(canvas, detections, videoSize, displaySize) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(displaySize.width * dpr);
  canvas.height = Math.round(displaySize.height * dpr);
  canvas.style.width = `${displaySize.width}px`;
  canvas.style.height = `${displaySize.height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, displaySize.width, displaySize.height);
  const scaleX = displaySize.width / videoSize.width;
  const scaleY = displaySize.height / videoSize.height;
  for (const detection of detections) {
    const [x, y, w, h] = detection.bbox;
    const color = detection.classIdx === PERSON_CLASS_ID ? '#f97316' : OBJECT_COLORS[detection.classIdx % OBJECT_COLORS.length];
    const dx = x * scaleX, dy = y * scaleY, dw = w * scaleX, dh = h * scaleY;
    ctx.lineWidth = Math.max(3, Math.min(5, displaySize.width / 220));
    ctx.strokeStyle = color; ctx.strokeRect(dx, dy, dw, dh);
    const label = `${getJapaneseClassName(detection.classIdx)} ${formatConfidence(detection.score)}`;
    ctx.font = '700 14px system-ui, sans-serif';
    const textWidth = ctx.measureText(label).width + 14;
    const labelY = dy < 28 ? dy + 4 : dy - 26;
    ctx.fillStyle = color; ctx.fillRect(Math.max(0, dx), labelY, Math.min(textWidth, displaySize.width - dx), 24);
    ctx.fillStyle = '#ffffff'; ctx.fillText(label, Math.max(6, dx + 7), labelY + 17);
  }
}

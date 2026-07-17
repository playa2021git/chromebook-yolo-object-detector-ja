import { COCO_CLASSES_EN, COCO_CLASSES_JA } from '../constants/cocoClassesJa.js';
import { DETECTION_MODES, PERSON_CLASS_ID } from '../constants/detection.js';

export function normalizeDetections(detections) { return Array.isArray(detections) ? detections.filter((d) => d && Number.isFinite(d.classIdx) && Number.isFinite(d.score) && Array.isArray(d.bbox)) : []; }
export function countPersons(detections) { return normalizeDetections(detections).filter((d) => d.classIdx === PERSON_CLASS_ID).length; }
export function filterDetectionsByMode(detections, mode) { const safe = normalizeDetections(detections); return mode === DETECTION_MODES.PERSON_ONLY ? safe.filter((d) => d.classIdx === PERSON_CLASS_ID) : safe; }
export function getJapaneseClassName(classId, classes = COCO_CLASSES_JA, englishClasses = COCO_CLASSES_EN) { const idx = Number(classId); if (!Number.isInteger(idx) || idx < 0) return '不明な物体'; return classes?.[idx] || englishClasses?.[idx] || `クラス ${idx}`; }
export function formatConfidence(score) { return `${Math.round(Math.max(0, Math.min(1, Number(score) || 0)) * 100)}%`; }

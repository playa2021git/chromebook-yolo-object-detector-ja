export const PERSON_CLASS_ID = 0;
export const DETECTION_MODES = Object.freeze({ PERSON_ONLY: 'person-only', ALL: 'all' });
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.35;
export const APP_BASE_URL = import.meta.env?.BASE_URL || '/chromebook-yolo-object-detector-ja/';
export const DEFAULT_MODEL_PATH = `${APP_BASE_URL}models/yolo11n.onnx`;
export const TARGET_INFERENCE_INTERVAL_MS = 100;

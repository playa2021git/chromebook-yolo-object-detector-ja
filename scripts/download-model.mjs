import { createWriteStream, existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const modelPath = 'public/models/yolo11n.onnx';
const modelUrl = process.env.YOLO_MODEL_URL || 'https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.onnx';

if (existsSync(modelPath)) {
  console.log(`YOLO model already exists: ${modelPath}`);
  process.exit(0);
}

mkdirSync(dirname(modelPath), { recursive: true });
const tmpPath = `${modelPath}.download`;

try {
  console.log(`Downloading YOLO model from ${modelUrl}`);
  const response = await fetch(modelUrl);
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(tmpPath));
  renameSync(tmpPath, modelPath);
  console.log(`Saved YOLO model: ${modelPath}`);
} catch (error) {
  try {
    unlinkSync(tmpPath);
  } catch {
    // The temporary file may not exist if the download failed before writing.
  }
  console.error(`Failed to download YOLO model: ${error?.message || error}`);
  console.error('Place a license-compatible YOLO Detect ONNX model at public/models/yolo11n.onnx, or set YOLO_MODEL_URL to another ONNX model URL.');
  process.exit(1);
}

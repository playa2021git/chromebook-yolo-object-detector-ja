This directory must contain the YOLO Detect ONNX model used by the browser app.

Default expected file:

```
public/models/yolo11n.onnx
```

Run the project helper to download the default model:

```bash
npm run prepare-model
```

If you use a different model, confirm the model license and either place it as `yolo11n.onnx` or set `YOLO_MODEL_URL` before running `npm run prepare-model`. Keep the model's own license notice with the model files.

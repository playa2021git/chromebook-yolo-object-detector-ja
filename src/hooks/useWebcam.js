import { useCallback, useEffect, useRef, useState } from 'react';

function cameraErrorMessage(error) {
  if (!window.isSecureContext) return 'カメラを利用するには HTTPS または localhost で開いてください。';
  if (!navigator.mediaDevices?.getUserMedia) return 'このブラウザはカメラAPIに対応していません。';
  if (error?.name === 'NotAllowedError') return 'カメラの使用が許可されませんでした。ブラウザの権限設定を確認してください。';
  if (error?.name === 'NotFoundError') return '利用できるカメラが見つかりませんでした。';
  if (error?.name === 'NotReadableError') return '選択したカメラを開けません。別のアプリが使用中でないか確認してください。';
  return 'カメラを開始できませんでした。設定を確認して再試行してください。';
}

export function useWebcam(videoRef) {
  const streamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('stopped');
  const [error, setError] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('stopped');
  }, [videoRef]);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const inputs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    setDevices(inputs);
    if (!deviceId && inputs[0]?.deviceId) setDeviceId(inputs[0].deviceId);
  }, [deviceId]);

  const startCamera = useCallback(async (nextDeviceId = deviceId) => {
    try {
      setError(''); setStatus('starting'); stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: nextDeviceId ? { exact: nextDeviceId } : undefined, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setStatus('running'); await refreshDevices();
    } catch (err) { console.error('Camera error:', err); setError(cameraErrorMessage(err)); stopCamera(); }
  }, [deviceId, refreshDevices, stopCamera, videoRef]);

  const selectDevice = useCallback(async (nextDeviceId) => { setDeviceId(nextDeviceId); if (status === 'running') await startCamera(nextDeviceId); }, [startCamera, status]);
  useEffect(() => { refreshDevices().catch((err) => console.warn('Camera device list unavailable:', err)); return stopCamera; }, [refreshDevices, stopCamera]);
  return { devices, deviceId, selectDevice, status, error, startCamera, stopCamera, isRunning: status === 'running' };
}

import { useCallback, useEffect, useRef, useState } from "react";

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const discardRef = useRef(false);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    setBlob(null);
    setSeconds(0);
    setError(null);
    chunksRef.current = [];
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setBlob(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        cleanupStream();
        if (!discardRef.current && chunksRef.current.length > 0) {
          const type = recorder.mimeType || "audio/webm";
          setBlob(new Blob(chunksRef.current, { type }));
        }
        discardRef.current = false;
        setRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone inaccessible. Autorisez l'accès au micro.");
      cleanupStream();
    }
  }, [cleanupStream]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    discardRef.current = true;
    chunksRef.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setRecording(false);
    setSeconds(0);
    setBlob(null);
    setError(null);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    cleanupStream();
  }, [cleanupStream]);

  const formatSeconds = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return { recording, blob, seconds, error, start, stop, cancel, reset, formatSeconds };
}

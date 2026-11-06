"use client";

import { useRef, useState } from "react";

const BARS = 22;

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "";
}

/** Enregistrement type messagerie : onde à la place du champ, fichier prêt à envoyer. */
export function useVoiceDraft() {
  const [recording, setRecording] = useState(false);
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(14));
  const [file, setFile] = useState<File | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const stopWaitRef = useRef<((file: File | null) => void) | null>(null);
  const dropRef = useRef(false);

  function stopMeter() {
    if (timerRef.current != null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
  }

  function releaseStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function finish(blob: Blob | null) {
    stopMeter();
    releaseStream();
    setRecording(false);
    recorderRef.current = null;
    const dropped = dropRef.current;
    dropRef.current = false;
    const voice =
      !dropped && blob && blob.size >= 800
        ? new File([blob], "voix.webm", { type: blob.type || "audio/webm" })
        : null;
    if (voice) setFile(voice);
    const wait = stopWaitRef.current;
    stopWaitRef.current = null;
    wait?.(voice);
  }

  async function start(): Promise<void> {
    if (recording || typeof navigator === "undefined") return;
    setFile(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const bins = new Uint8Array(analyser.frequencyBinCount);
      timerRef.current = window.setInterval(() => {
        analyser.getByteFrequencyData(bins);
        setLevels(
          Array.from({ length: BARS }, (_, index) => {
            const value = bins[index] ?? 0;
            return 14 + (value / 255) * 86;
          }),
        );
      }, 90);
    }
    const mime = pickMime();
    const recorder = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      finish(blob);
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stop(): Promise<File | null> {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve(file);
    }
    return new Promise((resolve) => {
      stopWaitRef.current = resolve;
      recorder.stop();
    });
  }

  function cancel() {
    dropRef.current = true;
    stopWaitRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else finish(null);
    setFile(null);
  }

  function clear() {
    setFile(null);
  }

  return { recording, levels, file, start, stop, cancel, clear };
}

/**
 * MediaRecorder (surtout WebM) produit souvent des blobs sans durée metadata
 * → <audio> affiche 0:00/0:00. On re-encode en WAV PCM pour lecture fiable.
 */

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function interleave(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  if (channels === 1) return buffer.getChannelData(0);
  const len = buffer.length;
  const out = new Float32Array(len * channels);
  const chans: Float32Array[] = [];
  for (let c = 0; c < channels; c++) chans.push(buffer.getChannelData(c));
  let i = 0;
  for (let s = 0; s < len; s++) {
    for (let c = 0; c < channels; c++) out[i++] = chans[c]![s]!;
  }
  return out;
}

function floatTo16BitPcm(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]!));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const samples = interleave(buffer);
  const pcm = floatTo16BitPcm(samples);
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcm.byteLength;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
  return new Blob([header, pcm], { type: "audio/wav" });
}

/** Decode MediaRecorder blob → WAV with real duration for <audio> preview. */
export async function toPlayableWavBlob(blob: Blob): Promise<Blob> {
  if (blob.type.includes("wav") && blob.size > 44) return blob;

  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return blob;

  const ctx = new AC();
  try {
    if (ctx.state === "suspended") await ctx.resume();
    const ab = await blob.arrayBuffer();
    // copy buffer - decodeAudioData may detach
    const copy = ab.slice(0);
    const audioBuffer = await ctx.decodeAudioData(copy);
    if (!audioBuffer.duration || audioBuffer.length < 1) return blob;
    return audioBufferToWavBlob(audioBuffer);
  } finally {
    try {
      await ctx.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Convert Float32Array audio samples to Int16 PCM
 */
export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/**
 * Convert Int16 PCM ArrayBuffer to Float32Array
 */
export function pcm16ToFloat32(pcm16: ArrayBuffer): Float32Array {
  const view = new DataView(pcm16);
  const float32 = new Float32Array(pcm16.byteLength / 2);
  for (let i = 0; i < float32.length; i++) {
    float32[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return float32;
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Audio player that queues and plays PCM chunks seamlessly
 */
export class AudioChunkPlayer {
  private audioContext: AudioContext;
  private nextStartTime = 0;
  private sampleRate: number;
  private gainNode: GainNode;

  constructor(sampleRate: number = 24000) {
    this.audioContext = new AudioContext();
    this.sampleRate = sampleRate;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  play(float32Data: Float32Array) {
    if (float32Data.length === 0) return;

    const buffer = this.audioContext.createBuffer(1, float32Data.length, this.sampleRate);
    buffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    const now = this.audioContext.currentTime;
    const startTime = Math.max(now + 0.01, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
  }

  stop() {
    this.nextStartTime = 0;
    this.audioContext.close();
  }

  get context() {
    return this.audioContext;
  }
}

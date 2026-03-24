import type { RealtimeHandler, RealtimeCallbacks } from '../types';
import { floatTo16BitPCM, arrayBufferToBase64, base64ToArrayBuffer, pcm16ToFloat32 } from './audio-utils';

/**
 * xAI Grok Voice Agent via WebSocket.
 * Compatible with OpenAI protocol but with different event names.
 * PCM 24kHz audio. $0.05/min flat rate.
 */
export function createXAIProvider(callbacks: RealtimeCallbacks): RealtimeHandler {
  let ws: WebSocket | null = null;
  let audioContext: AudioContext | null = null;
  let playbackContext: AudioContext | null = null;
  let localStream: MediaStream | null = null;
  let processor: ScriptProcessorNode | null = null;
  let nextPlayTime = 0;
  let setupReady = false;

  let assistantText = '';

  async function connect(instructions: string) {
    // 1. Get ephemeral token from backend
    const res = await fetch('/.netlify/functions/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'xai' }),
    });
    if (!res.ok) throw new Error('Failed to get session');
    const { token } = await res.json();

    // 2. Connect WebSocket with subprotocol auth
    ws = new WebSocket('wss://api.x.ai/v1/realtime', [
      `xai-client-secret.${token}`,
    ]);

    ws.onopen = () => {
      // Configure session with proper audio format
      ws!.send(JSON.stringify({
        type: 'session.update',
        session: {
          voice: 'Sal',
          instructions,
          turn_detection: {
            type: 'server_vad',
            threshold: 0.85,
            silence_duration_ms: 800,
            prefix_padding_ms: 333,
          },
          audio: {
            input: {
              format: { type: 'audio/pcm', rate: 24000 },
            },
            output: {
              format: { type: 'audio/pcm', rate: 24000 },
            },
          },
        },
      }));
    };

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data);
      handleEvent(event);
    };

    ws.onerror = () => callbacks.onError('WebSocket connection error');
    ws.onclose = () => callbacks.onDisconnected();
  }

  function handleEvent(event: any) {
    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        if (!setupReady) {
          setupReady = true;
          startAudioCapture();
          callbacks.onConnected();
        }
        break;

      // Audio output from the AI
      case 'response.output_audio.delta':
        playAudioChunk(event.delta);
        callbacks.onAiSpeaking(true);
        break;

      case 'response.output_audio.done':
        callbacks.onAiSpeaking(false);
        break;

      // Transcript of AI speech
      case 'response.output_audio_transcript.delta':
        assistantText += event.delta || '';
        callbacks.onTranscript('assistant', assistantText, false);
        break;

      case 'response.output_audio_transcript.done':
        callbacks.onTranscript('assistant', event.transcript || assistantText, true);
        assistantText = '';
        break;

      // Transcript of user speech
      case 'conversation.item.input_audio_transcription.completed':
        callbacks.onTranscript('user', event.transcript || '', true);
        break;

      case 'error':
        callbacks.onError(event.error?.message || JSON.stringify(event.error) || 'Unknown error');
        break;
    }
  }

  async function startAudioCapture() {
    audioContext = new AudioContext({ sampleRate: 24000 });
    playbackContext = new AudioContext({ sampleRate: 24000 });
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const source = audioContext.createMediaStreamSource(localStream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      if (!ws || ws.readyState !== WebSocket.OPEN || !setupReady) return;
      const pcm = e.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(pcm);
      ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: arrayBufferToBase64(pcm16),
      }));
    };
  }

  function playAudioChunk(base64: string) {
    if (!playbackContext || !base64) return;
    const pcm16 = base64ToArrayBuffer(base64);
    const float32 = pcm16ToFloat32(pcm16);
    if (float32.length === 0) return;

    const buffer = playbackContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const source = playbackContext.createBufferSource();
    source.buffer = buffer;
    source.connect(playbackContext.destination);

    const now = playbackContext.currentTime;
    const start = Math.max(now + 0.05, nextPlayTime);
    source.start(start);
    nextPlayTime = start + buffer.duration;
  }

  function disconnect() {
    setupReady = false;
    processor?.disconnect();
    localStream?.getTracks().forEach((t) => t.stop());
    audioContext?.close();
    playbackContext?.close();
    ws?.close();
    ws = null;
    audioContext = null;
    playbackContext = null;
    processor = null;
    localStream = null;
    nextPlayTime = 0;
  }

  function mute(muted: boolean) {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }

  return { connect, disconnect, mute };
}

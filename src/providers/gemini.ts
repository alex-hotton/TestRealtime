import type { RealtimeHandler, RealtimeCallbacks } from '../types';
import { floatTo16BitPCM, arrayBufferToBase64, base64ToArrayBuffer, pcm16ToFloat32 } from './audio-utils';

/**
 * Google Gemini 2.0 Flash via Multimodal Live WebSocket.
 * Audio input: PCM 16kHz. Audio output: PCM 24kHz.
 */
export function createGeminiProvider(callbacks: RealtimeCallbacks): RealtimeHandler {
  let ws: WebSocket | null = null;
  let captureContext: AudioContext | null = null;
  let playbackContext: AudioContext | null = null;
  let localStream: MediaStream | null = null;
  let processor: ScriptProcessorNode | null = null;
  let nextPlayTime = 0;
  let setupDone = false;
  let pendingInstructions = '';

  async function connect(instructions: string) {
    pendingInstructions = instructions;

    // 1. Get API key from backend
    const res = await fetch('/.netlify/functions/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'gemini' }),
    });
    if (!res.ok) throw new Error('Failed to get session');
    const { key } = await res.json();

    // 2. Connect WebSocket
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${key}`;
    ws = new WebSocket(url);

    ws.onopen = () => {
      // Send setup config (must be first message)
      ws!.send(JSON.stringify({
        setup: {
          model: 'models/gemini-2.5-flash-native-audio',
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Puck' },
              },
            },
          },
          systemInstruction: {
            parts: [{ text: pendingInstructions }],
          },
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      }));
    };

    ws.onmessage = (e) => {
      if (typeof e.data === 'string') {
        handleMessage(JSON.parse(e.data));
      } else if (e.data instanceof Blob) {
        e.data.text().then((text) => handleMessage(JSON.parse(text)));
      }
    };

    ws.onerror = () => callbacks.onError('WebSocket connection error');
    ws.onclose = () => callbacks.onDisconnected();
  }

  function handleMessage(msg: any) {
    // Setup complete
    if (msg.setupComplete) {
      setupDone = true;
      startAudioCapture();
      callbacks.onConnected();
      return;
    }

    // Server content (audio + transcripts)
    if (msg.serverContent) {
      const sc = msg.serverContent;

      // Audio output
      if (sc.modelTurn?.parts) {
        for (const part of sc.modelTurn.parts) {
          if (part.inlineData?.data) {
            playAudioChunk(part.inlineData.data);
          }
        }
      }

      // Input transcription (user speech)
      if (sc.inputTranscription?.text) {
        callbacks.onTranscript('user', sc.inputTranscription.text, true);
      }

      // Output transcription (AI speech)
      if (sc.outputTranscription?.text) {
        callbacks.onTranscript('assistant', sc.outputTranscription.text, false);
      }

      // Turn complete
      if (sc.turnComplete) {
        // Final transcript marker
      }
    }
  }

  async function startAudioCapture() {
    captureContext = new AudioContext({ sampleRate: 16000 });
    playbackContext = new AudioContext({ sampleRate: 24000 });
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const source = captureContext.createMediaStreamSource(localStream);
    processor = captureContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(captureContext.destination);

    processor.onaudioprocess = (e) => {
      if (!ws || ws.readyState !== WebSocket.OPEN || !setupDone) return;
      const pcm = e.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(pcm);

      ws.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{
            mimeType: 'audio/pcm;rate=16000',
            data: arrayBufferToBase64(pcm16),
          }],
        },
      }));
    };
  }

  function playAudioChunk(base64: string) {
    if (!playbackContext) return;
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
    processor?.disconnect();
    localStream?.getTracks().forEach((t) => t.stop());
    captureContext?.close();
    playbackContext?.close();
    ws?.close();
    ws = null;
    captureContext = null;
    playbackContext = null;
    processor = null;
    localStream = null;
    nextPlayTime = 0;
    setupDone = false;
  }

  function mute(muted: boolean) {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }

  return { connect, disconnect, mute };
}

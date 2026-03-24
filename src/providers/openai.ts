import type { RealtimeHandler, RealtimeCallbacks, UsageData, VoiceConfig } from '../types';

/**
 * OpenAI Realtime via WebRTC.
 * Audio flows automatically through WebRTC media tracks.
 * Events flow through the "oai-events" data channel.
 */
export function createOpenAIProvider(callbacks: RealtimeCallbacks, model?: string): RealtimeHandler {
  const requestedModel = model || 'gpt-realtime-1.5';
  let pc: RTCPeerConnection | null = null;
  let dc: RTCDataChannel | null = null;
  let audioEl: HTMLAudioElement | null = null;
  let localStream: MediaStream | null = null;

  let assistantText = '';
  let userText = '';

  const totalUsage: UsageData = {
    audioInTokens: 0,
    audioOutTokens: 0,
    textInTokens: 0,
    textOutTokens: 0,
  };

  async function connect(instructions: string, voiceConfig: VoiceConfig) {
    // 1. Get ephemeral token via our proxy (avoids CORS)
    const res = await fetch('/.netlify/functions/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'session', model: requestedModel }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to get session');
    }
    const { token, model: resolvedModel } = await res.json();

    // 2. Create RTCPeerConnection
    pc = new RTCPeerConnection();

    // 3. Audio output
    audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    pc.ontrack = (e) => {
      audioEl!.srcObject = e.streams[0];
    };

    // 4. Microphone
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(localStream.getTracks()[0]);

    // 5. Data channel
    dc = pc.createDataChannel('oai-events');
    dc.onopen = () => {
      dc!.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          voice: voiceConfig.voice,
          instructions,
          temperature: voiceConfig.temperature,
          input_audio_transcription: { model: 'whisper-1' },
          turn_detection: { type: 'semantic_vad' },
        },
      }));
      callbacks.onConnected();
    };
    dc.onmessage = (e) => handleEvent(JSON.parse(e.data));

    // 6. SDP offer — proxied through our Netlify function to avoid CORS
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpRes = await fetch('/.netlify/functions/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sdp',
        sdp: offer.sdp,
        token,
        model: resolvedModel,
      }),
    });
    if (!sdpRes.ok) throw new Error('Failed to establish WebRTC connection');

    const answer = await sdpRes.text();
    await pc.setRemoteDescription({ type: 'answer', sdp: answer });
  }

  function handleEvent(event: any) {
    switch (event.type) {
      case 'response.audio_transcript.delta':
        assistantText += event.delta || '';
        callbacks.onTranscript('assistant', assistantText, false);
        callbacks.onAiSpeaking(true);
        break;

      case 'response.audio_transcript.done':
        callbacks.onTranscript('assistant', event.transcript || assistantText, true);
        callbacks.onAiSpeaking(false);
        assistantText = '';
        break;

      case 'conversation.item.input_audio_transcription.completed':
        callbacks.onTranscript('user', event.transcript || '', true);
        userText = '';
        break;

      case 'conversation.item.input_audio_transcription.delta':
        userText += event.delta || '';
        callbacks.onTranscript('user', userText, false);
        break;

      case 'response.done': {
        const usage = event.response?.usage;
        if (usage) {
          const inDetails = usage.input_token_details || {};
          const outDetails = usage.output_token_details || {};
          totalUsage.audioInTokens += inDetails.audio_tokens || 0;
          totalUsage.textInTokens += inDetails.text_tokens || 0;
          totalUsage.audioOutTokens += outDetails.audio_tokens || 0;
          totalUsage.textOutTokens += outDetails.text_tokens || 0;
          callbacks.onUsageUpdate({ ...totalUsage });
        }
        break;
      }

      case 'error':
        callbacks.onError(event.error?.message || 'Unknown error');
        break;
    }
  }

  function disconnect() {
    localStream?.getTracks().forEach((t) => t.stop());
    dc?.close();
    pc?.close();
    audioEl?.pause();
    audioEl = null;
    pc = null;
    dc = null;
    localStream = null;
    callbacks.onDisconnected();
  }

  function mute(muted: boolean) {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }

  return { connect, disconnect, mute };
}

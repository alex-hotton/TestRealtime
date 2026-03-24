import type { Handler } from '@netlify/functions';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'OPENAI_API_KEY not configured' }) };
  }

  const body = JSON.parse(event.body || '{}');

  try {
    // Action 1: Create ephemeral token
    if (body.action === 'session' || !body.action) {
      const selectedModel = body.model || 'gpt-realtime-1.5';

      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          modalities: ['audio', 'text'],
          voice: 'verse',
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return { statusCode: response.status, headers, body: JSON.stringify({ error: err }) };
      }

      const data = await response.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token: data.client_secret.value,
          model: selectedModel,
        }),
      };
    }

    // Action 2: Proxy SDP exchange (avoids CORS issues in production)
    if (body.action === 'sdp') {
      const { sdp, token, model } = body;

      const response = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
        method: 'POST',
        body: sdp,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!response.ok) {
        const err = await response.text();
        return { statusCode: response.status, headers, body: JSON.stringify({ error: err }) };
      }

      const answerSdp = await response.text();
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/sdp' },
        body: answerSdp,
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

export { handler };

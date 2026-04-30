exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const API_KEY = process.env.ANTHROPIC_KEY || process.env.VITE_ANTHROPIC_KEY;

    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API Key nicht gefunden' }),
      };
    }

    const https = require('https');
    const postData = JSON.stringify(body);

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { resolve({ statusCode: res.statusCode, body: data }); });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    // Wenn Anthropic einen Fehler zurückgibt, zeige ihn direkt
    if (result.statusCode !== 200) {
      return {
        statusCode: result.statusCode,
        headers,
        body: JSON.stringify({ error: `Anthropic Fehler ${result.statusCode}: ${result.body}` }),
      };
    }

    return { statusCode: 200, headers, body: result.body };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
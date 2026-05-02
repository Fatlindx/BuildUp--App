export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt' });
  }

  try {
    const API_KEY = process.env.ANTHROPIC_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_KEY nicht gefunden' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Anthropic Fehler ${response.status}: ${text}`,
      });
    }

    return res.status(200).send(text);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
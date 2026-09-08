export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY is not configured in Vercel Environment Variables.'
    });
  }

  try {
    const { sourceType, source, goal, audience } = req.body || {};
    if (!source || !goal || !audience) {
      return res.status(400).json({ error: 'Source, goal, and audience are required.' });
    }

    const prompt = `You are WebinarPilot.AI, a commercial webinar strategist. Create a conversion-focused webinar campaign from the following input.\n\nSource type: ${sourceType || 'Offer'}\nSource/offer: ${source}\nPrimary goal: ${goal}\nAudience: ${audience}\n\nReturn ONLY valid JSON with this exact shape:\n{\n  \"title\": \"...\",\n  \"bigPromise\": \"...\",\n  \"hook\": \"...\",\n  \"durationMinutes\": 45,\n  \"cta\": \"...\",\n  \"offerAngle\": \"...\",\n  \"slides\": [\n    {\"title\":\"...\",\"speakerNote\":\"...\"}\n  ],\n  \"followUp\": [\"...\",\"...\",\"...\"]\n}\nCreate 8 concise slides. Avoid unsupported claims, guarantees, or fabricated proof.`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-terra',
        input: prompt,
        reasoning: { effort: 'low' },
        max_output_tokens: 3500
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'AI generation failed.' });
    }

    const text = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === 'output_text')
      .map(item => item.text)
      .join('\n')
      .trim();

    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    let campaign;
    try {
      campaign = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'AI returned an invalid campaign format.', raw: text.slice(0, 1200) });
    }

    return res.status(200).json({ campaign });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Unexpected server error.' });
  }
}

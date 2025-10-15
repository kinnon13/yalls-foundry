export async function generateSummary(
  messages: any[],
  openaiKey: string
): Promise<string | null> {
  try {
    const summaryPrompt = `Summarize this conversation in one brief sentence (max 100 chars): ${messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: summaryPrompt }],
        max_tokens: 50
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    return null;
  }
}

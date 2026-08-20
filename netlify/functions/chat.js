const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { prompt } = JSON.parse(event.body);

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ai-content-generator-noxolo.netlify.app',
                'X-Title': 'AI Content Generator'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.1-8b-instruct:free',
                messages: [
                    { role: 'system', content: 'You are a helpful AI content generator. You create high-quality text content based on user prompts. Be creative, detailed, and helpful.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1024
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'No response generated.';

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply: 'An error occurred while generating content.' })
        };
    }
};


const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

async function getFreeModels(apiKey) {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': 'Bearer ' + apiKey }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
        .filter(m => m.pricing && m.pricing.completion === '0' && m.pricing.prompt === '0')
        .map(m => m.id)
        .slice(0, 10);
}

async function tryModel(model, prompt, apiKey) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://noxolojali14.github.io/ai-content-generator',
            'X-Title': 'AI Content Generator'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: 'You are a helpful AI content generator. You create high-quality text content based on user prompts. Be creative, detailed, and helpful. Respond directly without any internal thinking or reasoning tags.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 1024
        })
    });

    const text = await res.text();
    var data;
    try { data = JSON.parse(text); } catch(e) { return null; }
    if (data.error) { console.log('Model error:', model, data.error.message); return null; }

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        var content = data.choices[0].message.content;
        content = content.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
        return content || null;
    }
    return null;
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: CORS_HEADERS, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.OPENROUTER_API_KEY;

        const models = await getFreeModels(apiKey);
        console.log('Free models found:', models.length, models);

        for (var i = 0; i < models.length; i++) {
            try {
                var result = await tryModel(models[i], prompt, apiKey);
                if (result) {
                    return {
                        statusCode: 200,
                        headers: CORS_HEADERS,
                        body: JSON.stringify({ reply: result })
                    };
                }
            } catch (e) {
                console.log('Model threw:', models[i], e.message);
            }
        }

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ reply: models.length === 0
                ? 'Could not load model list. Please try again.'
                : 'All AI models are currently busy. Please try again in a moment.'
            })
        };
    } catch (error) {
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ reply: 'Error: ' + error.message })
        };
    }
};

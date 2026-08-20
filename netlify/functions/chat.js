const FREE_MODELS = [
    'qwen/qwen3-8b:free',
    'google/gemma-3-1b-it:free',
    'google/gemma-3-4b-it:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'deepseek/deepseek-r1-0528:free',
    'microsoft/phi-4-reasoning:free',
    'google/gemini-2.0-flash-exp:free'
];

async function tryModel(model, prompt, apiKey) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-content-generator-noxolo-441.netlify.app',
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
    console.log('Model:', model, 'Status:', res.status);

    var data;
    try { data = JSON.parse(text); } catch(e) { return null; }

    if (data.error) {
        console.log('Model error:', model, data.error.message);
        return null;
    }

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        var content = data.choices[0].message.content;
        // Strip thinking tags if present
        content = content.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
        return content;
    }

    return null;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.OPENROUTER_API_KEY;

        // Try each free model until one works
        for (var i = 0; i < FREE_MODELS.length; i++) {
            try {
                var result = await tryModel(FREE_MODELS[i], prompt, apiKey);
                if (result) {
                    return {
                        statusCode: 200,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reply: result })
                    };
                }
            } catch (e) {
                console.log('Model threw:', FREE_MODELS[i], e.message);
                continue;
            }
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply: 'All AI models are currently busy. Please try again in a moment.' })
        };
    } catch (error) {
        console.log('Function error:', error.message);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply: 'Error: ' + error.message })
        };
    }
};

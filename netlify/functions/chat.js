exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);

        // First try to get available free models
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ai-content-generator-noxolo-441.netlify.app',
                'X-Title': 'AI Content Generator'
            },
            body: JSON.stringify({
                model: 'qwen/qwen3-8b:free',
                messages: [
                    { role: 'system', content: 'You are a helpful AI content generator. You create high-quality text content based on user prompts. Be creative, detailed, and helpful.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1024
            })
        });

        const text = await response.text();
        console.log('API status:', response.status);
        console.log('API body:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reply: 'AI service returned invalid response. Try again.' })
            };
        }

        if (data.error) {
            // If first model fails, try fallback
            console.log('First model failed, trying fallback...');
            const response2 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://ai-content-generator-noxolo-441.netlify.app',
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

            const text2 = await response2.text();
            console.log('Fallback status:', response2.status);
            console.log('Fallback body:', text2);

            let data2;
            try {
                data2 = JSON.parse(text2);
            } catch (e) {
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reply: 'AI service error. Please try again later.' })
                };
            }

            if (data2.error) {
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reply: 'Error: ' + (data2.error.message || 'All models unavailable') })
                };
            }

            var reply2 = null;
            if (data2.choices && data2.choices[0] && data2.choices[0].message) {
                reply2 = data2.choices[0].message.content;
            }
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reply: reply2 || 'No response. Try again.' })
            };
        }

        var reply = null;
        if (data.choices && data.choices[0] && data.choices[0].message) {
            reply = data.choices[0].message.content;
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply: reply || 'No response. Please try again.' })
        };
    } catch (error) {
        console.log('Error:', error.message);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply: 'Error: ' + error.message })
        };
    }
};

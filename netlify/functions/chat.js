exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ai-content-generator-noxolo-441.netlify.app',
                'X-Title': 'AI Content Generator'
            },
            body: JSON.stringify({
                model: 'mistralai/mistral-small-3.1-24b-instruct:free',
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
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reply: 'Error: ' + (data.error.message || 'Unknown error') })
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

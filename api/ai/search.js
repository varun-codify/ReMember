const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Website = require('../../server/models/Website');
const Task = require('../../server/models/Task');
const Video = require('../../server/models/Video');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function handler(req, res) {
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                if (req.method === 'POST') {
                    const { query } = req.body;

                    if (!query) {
                        res.status(400).json({
                            success: false,
                            message: 'Query string is required'
                        });
                        return resolve();
                    }

                    const userId = req.userId;
                    const [websites, tasks, videos] = await Promise.all([
                        Website.find({ userId }),
                        Task.find({ userId }),
                        Video.find({ userId })
                    ]);

                    const contextData = {
                        websites: websites.map(w => ({ id: w._id, name: w.name, url: w.url, description: w.description, category: w.category })),
                        tasks: tasks.map(t => ({ id: t._id, title: t.title, description: t.description, status: t.status })),
                        videos: videos.map(v => ({ id: v._id, title: v.title, url: v.videoUrl, notes: v.personalNotes }))
                    };

                    const apiKey = process.env.GEMINI_API_KEY;
                    if (!apiKey) {
                        res.json({
                            success: true,
                            message: 'AI Search simulated (no API key).',
                            data: []
                        });
                        return resolve();
                    }

                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });

                    const prompt = `
                    You are an AI assistant helping a user find information in their personal digital memory vault.
                    The vault contains websites, tasks, and videos.

                    User's query: "${query}"

                    Vault data:
                    ${JSON.stringify(contextData)}

                    Task: Analyze the user's query and find the most relevant items from the vault data.
                    Return a JSON object with a "results" array. Each item in the array should have:
                    - "type": the type of item ('website', 'task', or 'video')
                    - "id": the id of the item
                    - "name": the name/title of the item
                    - "reason": a short explanation of why it matches the query

                    Return ONLY valid JSON.
                    `;

                    const result = await model.generateContent(prompt);
                    const responseText = result.response.text();

                    let parsedResults = { results: [] };
                    try {
                        parsedResults = JSON.parse(responseText);
                    } catch (e) {
                        console.error('Failed to parse AI response:', responseText);
                    }

                    res.json({
                        success: true,
                        data: parsedResults.results || []
                    });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error performing AI search');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);

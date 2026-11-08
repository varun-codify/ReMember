const { GoogleGenerativeAI } = require('@google/generative-ai');
const Website = require('../models/Website');
const Task = require('../models/Task');
const Video = require('../models/Video');
const Password = require('../models/Password');

exports.search = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query string is required'
            });
        }

        // Fetch user data
        const userId = req.userId;
        const [websites, tasks, videos] = await Promise.all([
            Website.find({ userId }),
            Task.find({ userId }),
            Video.find({ userId })
        ]);

        // Prepare context for AI
        const contextData = {
            websites: websites.map(w => ({ id: w._id, name: w.name, url: w.url, description: w.description, category: w.category })),
            tasks: tasks.map(t => ({ id: t._id, title: t.title, description: t.description, status: t.status })),
            videos: videos.map(v => ({ id: v._id, title: v.title, url: v.videoUrl, notes: v.personalNotes }))
        };

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // Fallback for tests if key isn't provided yet
            return res.json({
                success: true,
                message: 'AI Search simulated (no API key).',
                data: []
            });
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

    } catch (error) {
        console.error('AI Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing AI search',
            error: error.message
        });
    }
};

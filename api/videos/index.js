const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Video = require('../../server/models/Video');

// Helper function to extract YouTube video ID
const extractYouTubeId = (url) => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
};

async function handler(req, res) {
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                if (req.method === 'GET') {
                    const { watchStatus } = req.query;

                    const filter = { userId: req.userId };
                    if (watchStatus) filter.watchStatus = watchStatus;

                    const videos = await Video.find(filter).sort({ createdAt: -1 });

                    res.json({
                        success: true,
                        count: videos.length,
                        data: videos
                    });
                } else if (req.method === 'POST') {
                    const { videoUrl, title, personalNotes, tags } = req.body;

                    if (!videoUrl) {
                        res.status(400).json({
                            success: false,
                            message: 'Video URL is required'
                        });
                        return resolve();
                    }

                    // Extract video ID
                    const videoId = extractYouTubeId(videoUrl);
                    if (!videoId) {
                        res.status(400).json({
                            success: false,
                            message: 'Invalid YouTube URL'
                        });
                        return resolve();
                    }

                    // Generate thumbnail URL
                    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

                    const video = new Video({
                        userId: req.userId,
                        videoUrl,
                        videoId,
                        title: title || 'YouTube Video',
                        thumbnail,
                        personalNotes,
                        tags
                    });

                    await video.save();

                    res.status(201).json({
                        success: true,
                        message: 'Video saved successfully',
                        data: video
                    });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with videos');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);

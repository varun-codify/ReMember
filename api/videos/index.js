const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Video = require('../../server/models/Video');
const captureService = require('../../server/services/captureService');
const { isSafeUrl, sanitizeText, sanitizeTags } = require('../../server/utils/security');

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
                    const { videoUrl } = req.body;
                    const title = sanitizeText(req.body.title, { maxLength: 200 });
                    const personalNotes = sanitizeText(req.body.personalNotes, { maxLength: 5000 });
                    const tags = sanitizeTags(req.body.tags);

                    if (!videoUrl) {
                        res.status(400).json({
                            success: false,
                            message: 'Video URL is required'
                        });
                        return resolve();
                    }

                    // Must be a real http(s) link AND a YouTube link (prevents
                    // "javascript:https://youtube.com/..." style bypasses)
                    if (typeof videoUrl !== 'string' || !isSafeUrl(videoUrl)) {
                        res.status(400).json({
                            success: false,
                            message: 'Invalid YouTube URL'
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
                        videoUrl: videoUrl.trim(),
                        videoId,
                        title: title || 'YouTube Video',
                        thumbnail,
                        personalNotes,
                        tags
                    });

                    await video.save();

                    // Enrich in the background (transcript + AI summary) — never blocks saving
                    (async () => {
                        try {
                            const transcript = await captureService.fetchYoutubeTranscript(videoId);
                            const enrichment = await captureService.enrichVideo({ title: video.title, personalNotes: video.personalNotes || '', transcript });
                            await Video.updateOne({ _id: video._id }, { $set: enrichment });
                        } catch (e) { /* best effort */ }
                    })();

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

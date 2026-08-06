const authMiddleware = require('../_middleware/auth');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const { extractYouTubeId, buildThumbnail, fetchVideoTitle } = require('../../server/utils/youtube');

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                const { url } = req.body;

                if (!url) {
                    res.status(400).json({
                        success: false,
                        message: 'YouTube URL is required'
                    });
                    return resolve();
                }

                const videoId = extractYouTubeId(url);

                if (!videoId) {
                    res.status(400).json({
                        success: false,
                        message: 'Invalid YouTube URL'
                    });
                    return resolve();
                }

                const thumbnail = buildThumbnail(videoId, 'mqdefault');
                const title = await fetchVideoTitle(videoId);

                if (title) {
                    res.json({
                        success: true,
                        data: { title, thumbnail }
                    });
                } else {
                    // Fallback if we couldn't extract the title
                    res.json({
                        success: true,
                        data: {
                            title: 'YouTube Video',
                            thumbnail,
                            message: 'Could not fetch video title automatically, please enter it manually.'
                        }
                    });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error fetching video information');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);

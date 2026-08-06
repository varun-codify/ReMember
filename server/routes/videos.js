const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/auth');
const { extractYouTubeId, buildThumbnail, fetchVideoTitle } = require('../utils/youtube');

// All routes require authentication
router.use(authMiddleware);

router.get('/', videoController.getAllVideos);
router.post('/', videoController.createVideo);
router.put('/:id', videoController.updateVideo);
router.delete('/:id', videoController.deleteVideo);

// Fetch YouTube video info
router.post('/fetch-info', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'YouTube URL is required'
            });
        }

        const videoId = extractYouTubeId(url);

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube URL'
            });
        }

        const thumbnail = buildThumbnail(videoId, 'mqdefault');

        const title = await fetchVideoTitle(videoId);

        if (title) {
            res.json({
                success: true,
                data: {
                    title,
                    thumbnail
                }
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
    } catch (error) {
        console.error('Fetch YouTube info error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching video information',
            error: error.message
        });
    }
});

module.exports = router;

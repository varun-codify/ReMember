const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

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

        // Extract video ID from URL
        const videoId = extractYouTubeId(url);

        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube URL'
            });
        }

        const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

        try {
            // Fetch the YouTube page HTML
            const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const html = response.data;

            // Extract title from HTML using regex
            // YouTube stores the title in multiple places, we'll try a few patterns
            let title = null;

            // Method 1: Look for og:title meta tag
            const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
            if (ogTitleMatch && ogTitleMatch[1]) {
                title = ogTitleMatch[1];
            }

            // Method 2: Look for title tag
            if (!title) {
                const titleMatch = html.match(/<title>([^<]+)<\/title>/);
                if (titleMatch && titleMatch[1]) {
                    title = titleMatch[1].replace(' - YouTube', '').trim();
                }
            }

            // Method 3: Look for name="title" in JSON data
            if (!title) {
                const jsonMatch = html.match(/"title":"([^"]+)"/);
                if (jsonMatch && jsonMatch[1]) {
                    title = jsonMatch[1];
                }
            }

            if (title) {
                res.json({
                    success: true,
                    data: {
                        title: title,
                        thumbnail: thumbnail
                    }
                });
            } else {
                // Fallback if we couldn't extract the title
                res.json({
                    success: true,
                    data: {
                        title: 'YouTube Video',
                        thumbnail: thumbnail,
                        message: 'Could not extract video title automatically, please enter it manually.'
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching YouTube page:', error.message);

            // Fallback response
            res.json({
                success: true,
                data: {
                    title: 'YouTube Video',
                    thumbnail: thumbnail,
                    message: 'Could not fetch video title, please enter it manually.'
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

// Helper function to extract YouTube video ID
function extractYouTubeId(url) {
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
}

module.exports = router;

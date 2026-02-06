const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Video = require('../../server/models/Video');

async function handler(req, res) {
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                const { id } = req.query;

                if (req.method === 'GET') {
                    const video = await Video.findOne({
                        _id: id,
                        userId: req.userId
                    });

                    if (!video) {
                        res.status(404).json({
                            success: false,
                            message: 'Video not found'
                        });
                        return resolve();
                    }

                    res.json({
                        success: true,
                        data: video
                    });
                } else if (req.method === 'PUT') {
                    const video = await Video.findOne({
                        _id: id,
                        userId: req.userId
                    });

                    if (!video) {
                        res.status(404).json({
                            success: false,
                            message: 'Video not found'
                        });
                        return resolve();
                    }

                    const { title, personalNotes, tags, watchStatus, clickCount, lastWatchedAt } = req.body;

                    if (title) video.title = title;
                    if (personalNotes !== undefined) video.personalNotes = personalNotes;
                    if (tags !== undefined) video.tags = tags;
                    if (watchStatus) video.watchStatus = watchStatus;
                    if (clickCount !== undefined) video.clickCount = clickCount;
                    if (lastWatchedAt) video.lastWatchedAt = lastWatchedAt;

                    await video.save();

                    res.json({
                        success: true,
                        message: 'Video updated successfully',
                        data: video
                    });
                } else if (req.method === 'DELETE') {
                    const video = await Video.findOneAndDelete({
                        _id: id,
                        userId: req.userId
                    });

                    if (!video) {
                        res.status(404).json({
                            success: false,
                            message: 'Video not found'
                        });
                        return resolve();
                    }

                    res.json({
                        success: true,
                        message: 'Video deleted successfully'
                    });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with video operation');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);

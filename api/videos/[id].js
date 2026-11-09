const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Video = require('../../server/models/Video');
const { sanitizeText, sanitizeTags } = require('../../server/utils/security');

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

                    const { watchStatus, clickCount, lastWatchedAt, positionSeconds } = req.body;
                    const has = (field) => req.body[field] !== undefined;
                    const title = sanitizeText(req.body.title, { maxLength: 200 });
                    const personalNotes = sanitizeText(req.body.personalNotes, { maxLength: 5000 });
                    const tags = sanitizeTags(req.body.tags);

                    if (title) video.title = title;
                    if (has('personalNotes')) video.personalNotes = personalNotes;
                    if (has('tags')) video.tags = tags;
                    if (watchStatus) video.watchStatus = watchStatus;
                    if (clickCount !== undefined) video.clickCount = clickCount;
                    if (lastWatchedAt) video.lastWatchedAt = lastWatchedAt;
                    if (positionSeconds !== undefined) video.positionSeconds = Math.max(0, Number(positionSeconds) || 0);

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

const Video = require('../models/Video');
const { extractYouTubeId, buildThumbnail } = require('../utils/youtube');
const captureService = require('../services/captureService');
const { isSafeUrl, sanitizeText, sanitizeTags } = require('../utils/security');

// @route   GET /api/videos
// @desc    Get all videos for user
// @access  Private
exports.getAllVideos = async (req, res) => {
  try {
    const { watchStatus } = req.query;

    const filter = { userId: req.userId };
    if (watchStatus) filter.watchStatus = watchStatus;

    const videos = await Video.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos'
    });
  }
};

// @route   GET /api/videos/:id
// @desc    Get single video
// @access  Private
exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video'
    });
  }
};

// @route   POST /api/videos
// @desc    Add new video
// @access  Private
exports.createVideo = async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const title = sanitizeText(req.body.title, { maxLength: 200 });
    const personalNotes = sanitizeText(req.body.personalNotes, { maxLength: 5000 });
    const tags = sanitizeTags(req.body.tags);

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Video URL is required'
      });
    }

    // The stored URL must be a real http(s) link AND a YouTube link. Without
    // the protocol check, a crafted value like "javascript:https://youtube.com/..."
    // would still extract a videoId while storing an executable URL.
    if (typeof videoUrl !== 'string' || !isSafeUrl(videoUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL'
      });
    }

    // Extract video ID
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL'
      });
    }

    // Generate thumbnail URL
    const thumbnail = buildThumbnail(videoId);

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

    // Enrich in the background: fetch the transcript (full-text search) and,
    // when AI is enabled, generate a summary + key points. Never blocks saving.
    (async () => {
      try {
        const transcript = await captureService.fetchYoutubeTranscript(videoId);
        const enrichment = await captureService.enrichVideo({
          title: video.title,
          personalNotes: video.personalNotes || '',
          transcript
        });
        await Video.updateOne({ _id: video._id }, { $set: enrichment });
      } catch (e) {
        /* best effort */
      }
    })();

    res.status(201).json({
      success: true,
      message: 'Video saved successfully',
      data: video
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving video'
    });
  }
};

// @route   PUT /api/videos/:id
// @desc    Update video
// @access  Private
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
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
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating video'
    });
  }
};

// @route   DELETE /api/videos/:id
// @desc    Delete video
// @access  Private
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting video'
    });
  }
};

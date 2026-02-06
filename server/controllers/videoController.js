const Video = require('../models/Video');

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
    const { videoUrl, title, personalNotes, tags } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Video URL is required'
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

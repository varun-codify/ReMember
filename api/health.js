module.exports = (req, res) => {
    res.json({
        status: 'ok',
        message: 'ReMember API is running',
        timestamp: new Date().toISOString()
    });
};

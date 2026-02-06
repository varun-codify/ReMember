function handleError(res, error, defaultMessage = 'Internal server error') {
    console.error('Error:', error);

    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || defaultMessage;

    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
}

module.exports = handleError;

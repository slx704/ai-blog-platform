class AppError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        Error.captureStackTrace(this, this.constructor)
    }
}

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    res.status(err.statusCode).json({
        success: false,
        code: err.statusCode,
        message: err.message,
        data: null
    })
}

module.exports = { AppError, errorHandler }
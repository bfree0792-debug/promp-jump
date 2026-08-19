class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorMiddleware = (err, req, res, next) => {
  err.message = err.message || 'Internal server error!';

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
  });
};

module.exports = { ErrorHandler, errorMiddleware };
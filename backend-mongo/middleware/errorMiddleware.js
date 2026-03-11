import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Internal logging (Server Side)
  // Log metadata but NOT sensitive request data like body.password
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    statusCode,
    userId: req.user?._id || req.admin?._id || "unauthenticated",
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "An internal server error occurred"
        : err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;

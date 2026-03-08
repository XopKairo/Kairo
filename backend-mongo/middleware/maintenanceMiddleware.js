import Settings from "../models/Settings.js";

export const checkMaintenance = async (req, res, next) => {
  // 1. Allow critical admin and auth paths to bypass maintenance
  const publicPaths = [
    "/api/admin",
    "/api/auth",
    "/api/settings",
    "/api/user/auth",
  ];
  const isPublic = publicPaths.some((path) => req.path.startsWith(publicPaths));

  // Explicitly check for admin prefix as it's the most common bypass
  if (
    req.path.startsWith("/api/admin") ||
    req.path.startsWith("/api/auth") ||
    req.path.startsWith("/api/settings")
  ) {
    return next();
  }

  try {
    const settings = await Settings.findOne();
    // Use strict boolean check
    if (settings && settings.maintenance === true) {
      return res.status(503).json({
        success: false,
        message: "System is under maintenance. Please try again later.",
        maintenance: true,
      });
    }
    next();
  } catch (error) {
    console.error("Maintenance check error:", error);
    next();
  }
};

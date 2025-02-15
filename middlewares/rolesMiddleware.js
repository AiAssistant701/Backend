export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next({ statusCode: 403, message: "Access Denied" });
    }
    next();
  };
};

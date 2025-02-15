import jwt from "jsonwebtoken";
import User from "../models/User.js";

const verifyToken = async (req, res, next) => {
  let token = req.cookies.jwt;

  if (!token) {
    return next({ message: "Token is required!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-password");
    next();
  } catch (error) {
    next(error);
  }
};

export default verifyToken;

// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authenticate(req, res, next) {
  // Optional chaining + split sûr
  const token = req.get("authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    // Gérer explicitement les erreurs attendues...
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err?.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    // ...et propager les inattendues au handler global (S2486)
    return next(err);
  }
}

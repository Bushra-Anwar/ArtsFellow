import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ status: "error", message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-DO-NOT-USE-IN-PROD",
    );

    if (!decoded || !decoded.userId) {
      res.status(401).json({ status: "error", message: "Invalid token" });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ status: "error", message: "Unauthorized" });
  }
};

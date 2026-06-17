import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-DO-NOT-USE-IN-PROD";

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

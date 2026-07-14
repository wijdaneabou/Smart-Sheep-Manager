import jwt from "jsonwebtoken";

export function generateToken(userId: number, roleId: number) {
  return jwt.sign(
    {
      userId,
      roleId,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1d",
    }
  );
}
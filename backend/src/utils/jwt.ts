import jwt from "jsonwebtoken";

// Access Token (15 minutes)
export function generateAccessToken(
  userId: number,
  roleId: number
) {
  return jwt.sign(
    {
      userId,
      roleId,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "15m",
    }
  );
}

// Refresh Token (7 jours)
export function generateRefreshToken(
  userId: number
) {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: "7d",
    }
  );
}
export function verifyRefreshToken(token: string) {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET!
  ) as {
    userId: number;
  };
}
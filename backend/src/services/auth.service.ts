import bcrypt from "bcrypt";
import { findUserByEmail } from "../repositories/auth.repository.js";

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return null;
  }

  return user;
}
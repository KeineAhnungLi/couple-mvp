import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

export const hashPassword = async (plain: string): Promise<string> => {
  return hash(plain, SALT_ROUNDS);
};

export const verifyPassword = async (
  plain: string,
  passwordHash: string,
): Promise<boolean> => {
  return compare(plain, passwordHash);
};

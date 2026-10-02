import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

// Hash of a random, discarded password at the same cost, compared against when there's
// no real hash so sign-in takes the same time whether or not the account exists
export const DUMMY_PASSWORD_HASH =
  "$2b$12$eEIQi5NtokwjVcALTup48u31jsoC8SRdJL7TvPoomdUY2Ab8QoMwa";

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

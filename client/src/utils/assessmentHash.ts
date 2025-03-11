import { randomBytes } from "crypto";

const createRandomUrlSafeHash = (): string => {
  return randomBytes(16).toString("hex");
};

export { createRandomUrlSafeHash };

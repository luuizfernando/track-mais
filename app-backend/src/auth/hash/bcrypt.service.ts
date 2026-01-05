import * as bcrypt from "bcryptjs";

export class BcryptService {
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async compare(password: string, passwordHash: string): Promise<boolean> {
    const compareHash = await bcrypt.compare(password, passwordHash);
    return compareHash;
  }
}

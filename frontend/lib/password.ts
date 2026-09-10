import bcrypt from "bcryptjs";

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, senhaHash: string): Promise<boolean> {
  return bcrypt.compare(senha, senhaHash);
}

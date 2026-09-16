// Redefine a senha de um usuário admin já existente, sem mexer no resto do banco.
// Uso: node scripts/reset-admin-password.js email@exemplo.com novaSenha
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const [email, newPassword] = process.argv.slice(2);

if (!email || !newPassword) {
  console.error("Uso: node scripts/reset-admin-password.js email@exemplo.com novaSenha");
  process.exit(1);
}

const hash = await bcrypt.hash(newPassword, 10);
const user = await prisma.user.update({ where: { email }, data: { password: hash } });
console.log(`Senha atualizada para ${user.email}.`);
await prisma.$disconnect();

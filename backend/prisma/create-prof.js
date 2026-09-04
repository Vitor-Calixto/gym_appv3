import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const h = await bcrypt.hash('123456', 10);
const u = await p.usuario.upsert({
  where: { email: 'prof@teste.com' },
  update: { senha: h, role: 'PROFESSOR', nome: 'Professor Teste' },
  create: { nome: 'Professor Teste', email: 'prof@teste.com', senha: h, role: 'PROFESSOR' }
});
console.log('Professor criado:', u.email, u.role, u.id);
await p.$disconnect();

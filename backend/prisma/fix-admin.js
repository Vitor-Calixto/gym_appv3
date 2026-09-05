import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const NOME = 'Vitor Calixto';
const NOVO_EMAIL = 'vitorpedrocalixto@gmail.com';
const NOVA_SENHA = 'Elisan01';
const hash = await bcrypt.hash(NOVA_SENHA, 10);

// 1. Se o admin antigo existe, migra para o novo e-mail
const antigo = await prisma.usuario.findUnique({ where: { email: 'vitor@calixto.com' } }).catch(() => null);
if (antigo) {
  const conflito = await prisma.usuario.findUnique({ where: { email: NOVO_EMAIL } }).catch(() => null);
  if (conflito && conflito.id !== antigo.id) {
    await prisma.usuario.delete({ where: { id: conflito.id } });
    console.log('Removido registro conflitante com o novo e-mail.');
  }
  await prisma.usuario.update({ where: { id: antigo.id }, data: { email: NOVO_EMAIL, nome: NOME, senha: hash, role: 'ADMIN' } });
  console.log('Admin antigo migrado para', NOVO_EMAIL);
} else {
  await prisma.usuario.upsert({
    where: { email: NOVO_EMAIL },
    update: { senha: hash, nome: NOME, role: 'ADMIN' },
    create: { nome: NOME, email: NOVO_EMAIL, senha: hash, role: 'ADMIN' },
  });
  console.log('Admin criado/atualizado:', NOVO_EMAIL);
}
await prisma.$disconnect();

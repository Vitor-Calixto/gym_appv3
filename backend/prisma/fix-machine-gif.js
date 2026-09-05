import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const ini = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leverage_Chest_Press/0.jpg';
let fim = ini;
try {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 12000);
  const r = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leverage_Chest_Press/1.jpg', { method: 'HEAD', signal: ctl.signal, redirect: 'follow' });
  clearTimeout(t);
  if (r.ok) fim = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leverage_Chest_Press/1.jpg';
} catch {}
const up = await prisma.exercicio.updateMany({ where: { nome: { in: ['Supino Reto na Máquina', 'Supino Inclinado na Máquina', 'Supino Declinado na Máquina'] } }, data: { gifUrl: ini, gifInicioUrl: ini, gifFimUrl: fim } });
console.log('Máquina atualizados:', up.count, 'fim:', fim);
await prisma.$disconnect();

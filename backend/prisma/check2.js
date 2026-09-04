import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const ex = await p.exercicio.findFirst({ where: { nome: '3/4 Sit-Up' } });
console.log('inicio', ex.gifInicioUrl);
console.log('fim', ex.gifFimUrl);
await p.$disconnect();

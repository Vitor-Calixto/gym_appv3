import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const c = await p.exercicio.count();
const v = await p.exercicio.count({ where: { nome: { contains: 'Variante' } } });
const sample = await p.exercicio.findMany({ take: 3, orderBy: { nome: 'asc' } });
console.log('total', c, 'variantes', v);
console.log(sample.map(s=>s.nome + ' -> ' + s.gifInicioUrl));
await p.$disconnect();

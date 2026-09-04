import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const total = await p.treino.count();
const templates = await p.treino.count({ where: { isTemplate: true } });
const comAluno = await p.treino.count({ where: { isTemplate: false } });
console.log('total', total, 'templates', templates, 'comAluno', comAluno);
const all = await p.treino.findMany({ take: 3, include: { itens: true } });
console.log(all.map(t=> ({ id: t.id.slice(0,8), nome: t.nome, isTemplate: t.isTemplate, alunoId: t.alunoId, itens: t.itens.length })));
await p.$disconnect();

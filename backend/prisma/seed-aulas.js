import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const prof = await p.usuario.findFirst({ where: { email: 'prof@teste.com' } });
if (!prof) { console.log('prof não encontrado'); process.exit(1); }
const aulas = [
  { titulo: 'Jiu-jítsu - Hytalo Vilarda - Guarda Fechada', descricao: 'Conteúdo exclusivo Hytalo', embedUrl: 'https://player.vimeo.com/video/123', preco: 97, categoria: 'LUTAS_JIU_JITSU', faixaMinima: 'BRANCA' },
  { titulo: 'Muay Thai - Clinch e Joelhadas', descricao: 'Muay Thai avançado', embedUrl: 'https://player.vimeo.com/video/124', preco: 87, categoria: 'LUTAS_MUAY_THAI' },
  { titulo: 'Taekwondo - Chutes Altos', descricao: 'Taekwondo', embedUrl: 'https://player.vimeo.com/video/125', preco: 77, categoria: 'LUTAS_TAEKWONDO' },
  { titulo: 'Boxe - Jab e Direto', descricao: 'Boxe fundamentos', embedUrl: 'https://player.vimeo.com/video/126', preco: 67, categoria: 'LUTAS_BOXE' },
];
for(const a of aulas){
  await p.aulaGravada.upsert({ where: { id: a.titulo }, update: {}, create: { ...a, id: undefined, professorId: prof.id } }).catch(async()=>{
    // upsert por titulo não tem unique, então cria direto
    await p.aulaGravada.create({ data: { ...a, professorId: prof.id } });
  });
}
console.log('Aulas seed OK', aulas.length);
await p.$disconnect();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
const MAP = {
  'Cadeira Extensora': 'Leg_Extensions',
  'Remada Baixa Neutra': 'Bent_Over_Two-Dumbbell_Row',
  'Abdução de Quadril na Polia Baixa': 'Side_Leg_Raises',
  'Abdução de Quadril no Cabo': 'Side_Leg_Raises',
  'Pilates Reformer': 'Exercise_Ball_Crunch',
};
async function headOk(url) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(url, { method: 'HEAD', signal: ctl.signal, redirect: 'follow' });
    clearTimeout(t);
    return r.ok;
  } catch { return false; }
}
for (const [nome, id] of Object.entries(MAP)) {
  const ini = `${BASE}/${id}/0.jpg`;
  const fim = (await headOk(`${BASE}/${id}/1.jpg`)) ? `${BASE}/${id}/1.jpg` : ini;
  const up = await prisma.exercicio.updateMany({ where: { nome }, data: { gifUrl: ini, gifInicioUrl: ini, gifFimUrl: fim } });
  console.log(`${up.count ? 'OK' : 'AUSENTE'} ${nome} <= ${id}`);
}
const total = await prisma.exercicio.count({ where: { ativo: true } });
console.log('TOTAL:', total);
await prisma.$disconnect();

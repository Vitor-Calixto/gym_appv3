import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// 1. Mescla duplicados no canônico (reaponta fichas antes de excluir)
const MERGES = [
  { de: 'Supino Declinado na Barra', para: 'Supino Declinado com Barra' },
  { de: 'Supino Reto', para: 'Supino Reto com Barra' },
  { de: 'Supino Inclinado', para: 'Supino Inclinado com Barra' },
];
for (const m of MERGES) {
  const de = await prisma.exercicio.findUnique({ where: { nome: m.de } });
  const para = await prisma.exercicio.findUnique({ where: { nome: m.para } });
  if (!de) { console.log(`já removido: ${m.de}`); continue; }
  if (!para) { console.log(`canônico ausente: ${m.para}`); continue; }
  const rep = await prisma.itemTreino.updateMany({ where: { exercicioId: de.id }, data: { exercicioId: para.id } });
  await prisma.exercicio.delete({ where: { id: de.id } });
  console.log(`MERGE ${m.de} -> ${m.para} (fichas reapontadas: ${rep.count})`);
}

// 2. Gifs de máquina: tenta IDs específicos antes do fallback
const MAQUINAS = {
  'Supino Reto na Máquina': ['Seated_Chest_Press', 'Machine_Chest_Press', 'Hammer_Strength_Chest_Press', 'Chest_Press_Machine', 'Cable_Chest_Press'],
  'Supino Inclinado na Máquina': ['Incline_Machine_Press', 'Hammer_Strength_Incline_Press', 'Seated_Chest_Press', 'Cable_Chest_Press'],
  'Supino Declinado na Máquina': ['Decline_Machine_Press', 'Decline_Chest_Press', 'Seated_Chest_Press', 'Cable_Chest_Press'],
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
for (const [nome, ids] of Object.entries(MAQUINAS)) {
  let escolhido = null;
  for (const id of ids) {
    if (await headOk(`${BASE}/${id}/0.jpg`)) { escolhido = id; break; }
  }
  if (!escolhido) { console.log(`SEM ID: ${nome}`); continue; }
  const ini = `${BASE}/${escolhido}/0.jpg`;
  const fim = (await headOk(`${BASE}/${escolhido}/1.jpg`)) ? `${BASE}/${escolhido}/1.jpg` : ini;
  await prisma.exercicio.updateMany({ where: { nome }, data: { gifUrl: ini, gifInicioUrl: ini, gifFimUrl: fim } });
  console.log(`GIF ${nome} <= ${escolhido}`);
}

const sup = await prisma.exercicio.findMany({ where: { nome: { contains: 'Supino', mode: 'insensitive' } }, select: { nome: true, gifInicioUrl: true }, orderBy: { nome: 'asc' } });
console.log('\nSUPINOS FINAIS:' + sup.length);
for (const s of sup) console.log(`- ${s.nome} => ${s.gifInicioUrl}`);
console.log('TOTAL: ' + await prisma.exercicio.count({ where: { ativo: true } }));
await prisma.$disconnect();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const RENOMEAR_BRACOS = [
  { de: 'Bottoms-Up Clean From The Hang Position', para: 'Desenvolvimento Bottoms-Up com Kettlebell', grupo: 'OMBROS' },
  { de: 'Polia Wrist Rosca', para: 'Rosca de Punho na Polia', grupo: 'BICEPS' },
  { de: 'Halter Deitado Pronation', para: 'Rotação de Punho Deitado (Pronada)', grupo: 'BICEPS' },
  { de: 'Halter Deitado Supination', para: 'Rotação de Punho Deitado (Supinada)', grupo: 'BICEPS' },
  { de: "FBraçoer's Walk", para: "Caminhada do Fazendeiro (Farmer's Walk)", grupo: 'COSTAS' },
  { de: 'Finger Roscas', para: 'Rosca de Dedos com Halter', grupo: 'BICEPS' },
];

const NOVOS = [
  // PERNAS +8 (15)
  { nome: 'Cadeira Adutora', grupo: 'PERNAS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Cadeira Abdutora', grupo: 'PERNAS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Adução de Quadril na Polia Baixa', grupo: 'PERNAS', equipamento: 'CABO', nivel: 'INICIANTE' },
  { nome: 'Abdução de Quadril na Polia Baixa', grupo: 'PERNAS', equipamento: 'CABO', nivel: 'INICIANTE' },
  { nome: 'Abdução com Caneleira em Pé', grupo: 'PERNAS', equipamento: 'CANELEIRA', nivel: 'INICIANTE' },
  { nome: 'Adução com Caneleira Deitado', grupo: 'PERNAS', equipamento: 'CANELEIRA', nivel: 'INICIANTE' },
  { nome: 'Mobilidade de Quadril no Solo', grupo: 'PERNAS', equipamento: 'SEM_EQUIPAMENTO', nivel: 'INICIANTE' },
  { nome: 'Alongamento de Adutores Sentado', grupo: 'PERNAS', equipamento: 'SEM_EQUIPAMENTO', nivel: 'INICIANTE' },
  // GLUTEO +6 (15)
  { nome: 'Glúteo na Máquina 4 Apoios', grupo: 'GLUTEO', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Coice de Glúteo no Cabo', grupo: 'GLUTEO', equipamento: 'CABO', nivel: 'INTERMEDIARIO' },
  { nome: 'Abdução de Quadril no Cabo', grupo: 'GLUTEO', equipamento: 'CABO', nivel: 'INICIANTE' },
  { nome: 'Hip Thrust na Máquina', grupo: 'GLUTEO', equipamento: 'MAQUINA', nivel: 'INTERMEDIARIO' },
  { nome: 'Glúteo com Caneleira', grupo: 'GLUTEO', equipamento: 'CANELEIRA', nivel: 'INICIANTE' },
  { nome: 'Elevação Pélvica com Barra', grupo: 'GLUTEO', equipamento: 'BARRA', nivel: 'INTERMEDIARIO' },
  // PEITO +2 (máquinas SmartFit)
  { nome: 'Supino Reto no Smith', grupo: 'PEITO', equipamento: 'MAQUINA', nivel: 'INTERMEDIARIO' },
  { nome: 'Peck Deck Voador', grupo: 'PEITO', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  // COSTAS +4
  { nome: 'Puxada Alta Frontal', grupo: 'COSTAS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Puxada Alta Triângulo', grupo: 'COSTAS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Remada Baixa Neutra', grupo: 'COSTAS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Barra Fixa no Graviton', grupo: 'COSTAS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  // QUADRICEPS +5
  { nome: 'Leg Press 45', grupo: 'QUADRICEPS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Leg Press Horizontal', grupo: 'QUADRICEPS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Cadeira Extensora', grupo: 'QUADRICEPS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Agachamento Hack na Máquina', grupo: 'QUADRICEPS', equipamento: 'MAQUINA', nivel: 'INTERMEDIARIO' },
  { nome: 'Agachamento no Smith', grupo: 'QUADRICEPS', equipamento: 'MAQUINA', nivel: 'INTERMEDIARIO' },
  // POSTERIOR +3
  { nome: 'Mesa Flexora', grupo: 'POSTERIOR', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Cadeira Flexora', grupo: 'POSTERIOR', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Stiff no Smith', grupo: 'POSTERIOR', equipamento: 'MAQUINA', nivel: 'INTERMEDIARIO' },
  // OMBROS +2
  { nome: 'Desenvolvimento na Máquina', grupo: 'OMBROS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Elevação Lateral na Máquina', grupo: 'OMBROS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  // BICEPS +2
  { nome: 'Rosca Scott na Máquina', grupo: 'BICEPS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Rosca Scott com Barra', grupo: 'BICEPS', equipamento: 'BARRA', nivel: 'INTERMEDIARIO' },
  // TRICEPS +2
  { nome: 'Tríceps na Máquina', grupo: 'TRICEPS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  { nome: 'Mergulho Assistido no Graviton', grupo: 'TRICEPS', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
  // PANTURRILHA +1 (15)
  { nome: 'Panturrilha Sentado na Máquina', grupo: 'PANTURRILHA', equipamento: 'MAQUINA', nivel: 'INICIANTE' },
];

async function main() {
  const pool = await prisma.exercicio.findMany({ where: { gifInicioUrl: { not: null } }, select: { gifInicioUrl: true, gifFimUrl: true, gifUrl: true }, take: 150 });
  const gif = (i) => {
    const g = pool[i % pool.length];
    return { ini: g.gifInicioUrl || g.gifUrl, fim: g.gifFimUrl || g.gifUrl };
  };

  let movidos = 0;
  for (const r of RENOMEAR_BRACOS) {
    const up = await prisma.exercicio.updateMany({ where: { nome: r.de }, data: { nome: r.para, grupoMuscular: r.grupo, categoria: r.grupo } });
    movidos += up.count;
  }
  console.log('BRACOS movidos:', movidos);

  let k = 0;
  for (const n of NOVOS) {
    const g = gif(k++);
    await prisma.exercicio.upsert({
      where: { nome: n.nome },
      update: { grupoMuscular: n.grupo, categoria: n.grupo, equipamento: n.equipamento, nivel: n.nivel, descricao: `${n.nome} — máquina SmartFit PT-BR`, gifUrl: g.ini, gifInicioUrl: g.ini, gifFimUrl: g.fim, ativo: true },
      create: { nome: n.nome, grupoMuscular: n.grupo, categoria: n.grupo, equipamento: n.equipamento, nivel: n.nivel, descricao: `${n.nome} — máquina SmartFit PT-BR`, gifUrl: g.ini, gifInicioUrl: g.ini, gifFimUrl: g.fim, ativo: true },
    });
  }
  console.log('Novos máquinas:', NOVOS.length);

  const grupos = await prisma.exercicio.groupBy({ by: ['grupoMuscular'], _count: true, where: { ativo: true } });
  console.log(JSON.stringify(grupos));
  const total = await prisma.exercicio.count({ where: { ativo: true } });
  console.log('TOTAL:', total);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());

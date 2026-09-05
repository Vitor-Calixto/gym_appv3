import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const SUPINOS = [
  { nome: 'Supino Reto com Barra', equipamento: 'BARRA' },
  { nome: 'Supino Inclinado com Barra', equipamento: 'BARRA' },
  { nome: 'Supino Declinado com Barra', equipamento: 'BARRA' },
  { nome: 'Supino Reto com Halteres', equipamento: 'HALTERES' },
  { nome: 'Supino Inclinado com Halteres', equipamento: 'HALTERES' },
  { nome: 'Supino Declinado com Halteres', equipamento: 'HALTERES' },
  { nome: 'Supino Reto na Máquina', equipamento: 'MAQUINA' },
  { nome: 'Supino Inclinado na Máquina', equipamento: 'MAQUINA' },
  { nome: 'Supino Declinado na Máquina', equipamento: 'MAQUINA' },
];

const NOVOS = [
  ...['Caminhada na Esteira', 'Corrida na Esteira', 'Bicicleta Ergométrica', 'Bike Spinning', 'Elíptico', 'Remo Ergométrico', 'Escada Climber', 'Pular Corda', 'Burpee', 'Mountain Climber', 'Polichinelo', 'Corrida Estacionária', 'Subida no Step Cardio', 'Remada Cardio', 'Sprint na Esteira'].map((nome) => ({ nome, grupo: 'CARDIO', equipamento: 'MAQUINA', nivel: 'INICIANTE' })),
  ...['Pilates Reformer Básico', 'Pilates Solo Hundred', 'Pilates Ponte', 'Pilates Prancha Lateral', 'Pilates Círculo Mágico', 'Pilates Bola Suíça', 'Pilates Alongamento de Coluna', 'Pilates Teaser', 'Pilates Swan', 'Pilates Side Kick'].map((nome) => ({ nome, grupo: 'PILATES', equipamento: 'SEM_EQUIPAMENTO', nivel: 'INICIANTE' })),
  ...['Agachamento Livre Gestante (Apoiada)', 'Caminhada Leve Gestante', 'Alongamento de Quadril Gestante', 'Ponte de Glúteo Gestante', 'Respiração Diafragmática', 'Mobilidade Pélvica', 'Elevação de Panturrilha Gestante', 'Rosca Leve com Halteres Gestante', 'Alongamento de Costas Gestante', 'Relaxamento com Bola'].map((nome) => ({ nome, grupo: 'GRAVIDEZ', equipamento: 'SEM_EQUIPAMENTO', nivel: 'INICIANTE' })),
  ...['Flexão de Braço em Casa', 'Agachamento Livre em Casa', 'Afundo em Casa', 'Prancha em Casa', 'Abdominal Crunch em Casa', 'Elevação de Panturrilha em Casa', 'Rosca com Garrafa', 'Tríceps Banco em Casa', 'Elevação Lateral com Garrafa', 'Remada com Mochila', 'Ponte de Glúteo em Casa', 'Polichinelo em Casa', 'Mountain Climber em Casa', 'Burpee em Casa', 'Alongamento Full Body em Casa', 'Prancha Lateral em Casa', 'Supervisão Lombar em Casa', 'Cadeira Isométrica na Parede', 'Pular Corda em Casa', 'Mobilidade de Quadril em Casa'].map((nome) => ({ nome, grupo: 'TREINO_EM_CASA', equipamento: 'SEM_EQUIPAMENTO', nivel: 'INICIANTE' })),
  ...['Barra Fixa Livre', 'Paralelas Mergulho', 'Flexão Diamante', 'Agachamento Pistol Assistido', 'Corrida no Parque', 'Subida na Barra', 'Prancha no Parque', 'Abdominal Infra na Barra', 'Pular Banco', 'Escada no Parque', 'Sprint 100m', 'Alongamento ao Ar Livre', 'Mobilidade de Tornozelo', 'Caminhada no Parque', 'Circuito Funcional Livre'].map((nome) => ({ nome, grupo: 'TREINO_LIVRE', equipamento: 'SEM_EQUIPAMENTO', nivel: 'INTERMEDIARIO' })),
];

async function main() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'exercicios-import-pt.json'), 'utf-8'));
  const poolGeral = raw.filter((r) => r.url_gif).map((r) => ({ ini: r.url_gif, fim: r.url_gif_fim || r.url_gif }));
  const poolPeito = raw.filter((r) => /peito|chest/i.test(r.grupo_muscular || '') && r.url_gif).map((r) => ({ ini: r.url_gif, fim: r.url_gif_fim || r.url_gif }));
  const pick = (pool, i) => pool.length ? pool[i % pool.length] : poolGeral[i % poolGeral.length];

  // 1. Remove resíduos de supino no chão (PT + EN)
  const del1 = await prisma.exercicio.deleteMany({ where: { nome: { contains: 'Floor Press', mode: 'insensitive' } } });
  const del2 = await prisma.exercicio.deleteMany({ where: { nome: { contains: 'Supino no Chão', mode: 'insensitive' } } });
  console.log(`Removidos chão: ${del1.count + del2.count}`);

  // 2. Upsert 9 supinos
  let i = 0;
  for (const s of SUPINOS) {
    const gif = pick(poolPeito.length ? poolPeito : poolGeral, i++);
    await prisma.exercicio.upsert({
      where: { nome: s.nome },
      update: { grupoMuscular: 'PEITO', categoria: 'PEITO', equipamento: s.equipamento, nivel: 'INTERMEDIARIO', descricao: 'Supino Smart Fit PT-BR', gifUrl: gif.ini, gifInicioUrl: gif.ini, gifFimUrl: gif.fim, ativo: true },
      create: { nome: s.nome, grupoMuscular: 'PEITO', categoria: 'PEITO', equipamento: s.equipamento, nivel: 'INTERMEDIARIO', descricao: 'Supino Smart Fit PT-BR', gifUrl: gif.ini, gifInicioUrl: gif.ini, gifFimUrl: gif.fim, ativo: true },
    });
  }
  console.log('9 supinos ok');

  // 3. Upsert 70 novos
  let j = 0;
  for (const n of NOVOS) {
    const gif = pick(poolGeral, j++);
    await prisma.exercicio.upsert({
      where: { nome: n.nome },
      update: { grupoMuscular: n.grupo, categoria: n.grupo, equipamento: n.equipamento, nivel: n.nivel, descricao: `${n.nome} — catálogo Smart Fit PT-BR`, gifUrl: gif.ini, gifInicioUrl: gif.ini, gifFimUrl: gif.fim, ativo: true },
      create: { nome: n.nome, grupoMuscular: n.grupo, categoria: n.grupo, equipamento: n.equipamento, nivel: n.nivel, descricao: `${n.nome} — catálogo Smart Fit PT-BR`, gifUrl: gif.ini, gifInicioUrl: gif.ini, gifFimUrl: gif.fim, ativo: true },
    });
  }
  console.log(`70 novos ok (${NOVOS.length})`);

  const total = await prisma.exercicio.count({ where: { ativo: true } });
  const porGrupo = await prisma.exercicio.groupBy({ by: ['grupoMuscular'], _count: true, where: { ativo: true } });
  console.log('TOTAL ATIVOS:', total);
  console.log(JSON.stringify(porGrupo));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());

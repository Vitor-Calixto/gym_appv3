import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Povoando banco de dados...');

  const senhaHash = await bcrypt.hash('Elisan01', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'vitorpedrocalixto@gmail.com' },
    update: { senha: senhaHash, nome: 'Vitor Calixto', role: 'ADMIN' },
    create: {
      nome: 'Vitor Calixto',
      email: 'vitorpedrocalixto@gmail.com',
      senha: senhaHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin criado:', admin.email);

  // Carrega exercícios no estilo free-exercise-db (url_gif raw.githubusercontent) - prioriza PT-BR
  const importPtPath = path.join(__dirname, 'exercicios-import-pt.json');
  const importPath = path.join(__dirname, 'exercicios-import.json');
  const jsonPath = path.join(__dirname, 'exercicios-300.json');
  let exercicios = [];
  if (fs.existsSync(importPtPath)) {
    const raw = JSON.parse(fs.readFileSync(importPtPath, 'utf-8'));
    exercicios = raw.map(r => ({
      nome: r.nome,
      grupoMuscular: (r.grupo_muscular || r.grupoMuscular || 'GERAL').toUpperCase(),
      descricao: r.descricao || null,
      equipamento: r.equipamento || null,
      nivel: r.nivel || 'INTERMEDIARIO',
      categoria: r.grupo_muscular || r.grupoMuscular || 'GERAL',
      gifUrl: r.url_gif || r.gifUrl,
      gifInicioUrl: r.url_gif || r.gifInicioUrl || r.gifUrl,
      gifFimUrl: r.url_gif_fim || r.url_gif || r.gifFimUrl || r.gifUrl,
    }));
    console.log(`📦 Carregados ${exercicios.length} do exercicios-import-pt.json PT-BR`);
  } else if (fs.existsSync(importPath)) {
    const raw = JSON.parse(fs.readFileSync(importPath, 'utf-8'));
    // Converte formato {id, nome, grupo_muscular, url_gif} -> schema prisma
    exercicios = raw.map(r => ({
      nome: r.nome,
      grupoMuscular: (r.grupo_muscular || r.grupoMuscular || 'GERAL').toUpperCase(),
      descricao: r.descricao || null,
      equipamento: r.equipamento || null,
      nivel: r.nivel || 'INTERMEDIARIO',
      categoria: r.grupo_muscular || r.grupoMuscular || 'GERAL',
      gifUrl: r.url_gif || r.gifUrl,
      gifInicioUrl: r.url_gif || r.gifInicioUrl || r.gifUrl,
      gifFimUrl: r.url_gif_fim || r.url_gif || r.gifFimUrl || r.gifUrl,
    }));
    console.log(`📦 Carregados ${exercicios.length} do exercicios-import.json (free-exercise-db)`);
  } else if (fs.existsSync(jsonPath)) {
    exercicios = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`📦 Carregados ${exercicios.length} do JSON`);
  } else {
    console.log('⚠️  nenhum JSON encontrado');
    exercicios = [
      { nome: 'Supino Reto com Barra', grupoMuscular: 'PEITO' },
      { nome: 'Agachamento Livre', grupoMuscular: 'QUADRICEPS' },
    ];
  }

  // SmartFit: nunca ressuscita supino no chão nem a categoria BRACOS (foi distribuída em BICEPS/TRICEPS/OMBROS/COSTAS)
  exercicios = exercicios.filter((ex) => !/floor press|supino no ch[ãa]o/i.test(ex.nome || ''));
  exercicios = exercicios.filter((ex) => String(ex.grupoMuscular || ex.grupo_muscular || '').toUpperCase() !== 'BRACOS');
  let criados = 0, atualizados = 0;
  for (const ex of exercicios) {
    const result = await prisma.exercicio.upsert({
      where: { nome: ex.nome },
      update: {
        grupoMuscular: ex.grupoMuscular,
        descricao: ex.descricao || null,
        equipamento: ex.equipamento || null,
        nivel: ex.nivel || null,
        categoria: ex.categoria || ex.grupoMuscular,
        gifUrl: ex.gifUrl || ex.gifInicioUrl,
        gifInicioUrl: ex.gifInicioUrl || ex.gifUrl,
        gifFimUrl: ex.gifFimUrl || ex.gifUrl,
        ativo: true,
      },
      create: {
        nome: ex.nome,
        grupoMuscular: ex.grupoMuscular,
        descricao: ex.descricao || null,
        equipamento: ex.equipamento || null,
        nivel: ex.nivel || null,
        categoria: ex.categoria || ex.grupoMuscular,
        gifUrl: ex.gifUrl || ex.gifInicioUrl,
        gifInicioUrl: ex.gifInicioUrl || ex.gifUrl,
        gifFimUrl: ex.gifFimUrl || ex.gifUrl,
        ativo: true,
      },
    });
    // upsert não distingue, conta como criado
    criados++;
  }
  console.log(`✅ ${criados} exercícios upsertados (11 grupos x 30)`);
  const porGrupo = {};
  for (const ex of exercicios) porGrupo[ex.grupoMuscular] = (porGrupo[ex.grupoMuscular]||0)+1;
  console.log('📊 Por grupo:', porGrupo);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

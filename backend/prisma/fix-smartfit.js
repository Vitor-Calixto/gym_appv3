// backend/prisma/fix-smartfit.js - rode: node prisma/fix-smartfit.js
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const remover = await p.exercicio.deleteMany({ where: { nome: { contains: 'Floor Press' } } });
console.log('Removidos Floor Press:', remover.count);
const novos = [
  { nome: 'Supino Reto com Barra', grupoMuscular: 'PEITO', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/1.jpg' },
  { nome: 'Supino Inclinado com Barra', grupoMuscular: 'PEITO', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/1.jpg' },
  { nome: 'Supino Declinado com Barra', grupoMuscular: 'PEITO', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Barbell_Bench_Press/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Barbell_Bench_Press/1.jpg' },
  { nome: 'Supino Reto com Halteres', grupoMuscular: 'PEITO', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/1.jpg' },
  { nome: 'Supino Inclinado com Halteres', grupoMuscular: 'PEITO', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/1.jpg' },
  { nome: 'Supino Declinado com Halteres', grupoMuscular: 'PEITO', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Dumbbell_Bench_Press/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Dumbbell_Bench_Press/1.jpg' },
  { nome: 'Supino Reto na Máquina', grupoMuscular: 'PEITO', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chest_Press/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chest_Press/1.jpg' },
  { nome: 'Supino Inclinado na Máquina', grupoMuscular: 'PEITO', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Chest_Press/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Chest_Press/1.jpg' },
  { nome: 'Supino Declinado na Máquina', grupoMuscular: 'PEITO', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Chest_Press/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Chest_Press/1.jpg' },
  { nome: 'Corrida na Esteira', grupoMuscular: 'CARDIO', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Running/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Running/1.jpg' },
  { nome: 'Pilates Reformer', grupoMuscular: 'PILATES', gifInicioUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pilates/0.jpg', gifFimUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pilates/1.jpg' },
];
for(const ex of novos){ await p.exercicio.upsert({ where:{nome:ex.nome}, update: ex, create:{...ex, descricao:'Smart Fit', equipamento: ex.nome.includes('Máquina')?'MAQUINA':ex.nome.includes('Halteres')?'HALTERES':'BARRA', nivel:'INTERMEDIARIO', categoria: ex.grupoMuscular, ativo:true}}); }
console.log('Smart Fit 9 Supino + Cardio/Pilates inseridos');
await p.$disconnect();
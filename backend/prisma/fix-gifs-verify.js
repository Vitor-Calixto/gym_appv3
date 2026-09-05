import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// nome no banco -> IDs candidatos no free-exercise-db (ordem de preferência)
const MAP = {
  'Supino Reto com Barra': ['Barbell_Bench_Press_-_Medium_Grip'],
  'Supino Inclinado com Barra': ['Barbell_Incline_Bench_Press_-_Medium_Grip'],
  'Supino Declinado com Barra': ['Decline_Barbell_Bench_Press', 'Barbell_Bench_Press_-_Medium_Grip'],
  'Supino Reto com Halteres': ['Dumbbell_Bench_Press', 'Barbell_Bench_Press_-_Medium_Grip'],
  'Supino Inclinado com Halteres': ['Incline_Dumbbell_Press', 'Alternate_Incline_Dumbbell_Press', 'Dumbbell_Bench_Press'],
  'Supino Declinado com Halteres': ['Decline_Dumbbell_Bench_Press', 'Decline_Dumbbell_Fly', 'Dumbbell_Bench_Press'],
  'Supino Reto na Máquina': ['Machine_Chest_Press', 'Chest_Press', 'Cable_Chest_Press'],
  'Supino Inclinado na Máquina': ['Incline_Chest_Press', 'Machine_Incline_Press', 'Cable_Chest_Press'],
  'Supino Declinado na Máquina': ['Decline_Chest_Press', 'Decline_Machine_Press', 'Cable_Chest_Press'],
  'Supino Reto no Smith': ['Smith_Bench_Press', 'Smith_Machine_Bench_Press', 'Barbell_Bench_Press_-_Medium_Grip'],
  'Supino Declinado na Barra': ['Decline_Barbell_Bench_Press'],
  'Supino Inclinado na Máquina2': [],
  'Peck Deck Voador': ['Butterfly', 'Pec_Deck_Fly', 'Machine_Fly', 'Cable_Crossover'],
  'Leg Press 45': ['Leg_Press', 'Machine_Leg_Press', 'Sled_Leg_Press', 'Barbell_Squat'],
  'Leg Press Horizontal': ['Horizontal_Leg_Press', 'Seated_Leg_Press', 'Leg_Press'],
  'Cadeira Extensora': ['Leg_Extension', 'Machine_Leg_Extension', 'Seated_Leg_Extension'],
  'Agachamento Hack na Máquina': ['Hack_Squat', 'Machine_Hack_Squat', 'Barbell_Hack_Squat'],
  'Agachamento no Smith': ['Smith_Squat', 'Smith_Machine_Squat', 'Barbell_Squat'],
  'Mesa Flexora': ['Lying_Leg_Curl', 'Machine_Leg_Curl', 'Ball_Leg_Curl'],
  'Cadeira Flexora': ['Seated_Leg_Curl', 'Leg_Curl', 'Machine_Seated_Leg_Curl'],
  'Stiff no Smith': ['Smith_Stiff_Leg_Deadlift', 'Stiff-Legged_Barbell_Deadlift', 'Barbell_Deadlift'],
  'Puxada Alta Frontal': ['Lat_Pulldown', 'Front_Lat_Pulldown', 'Wide-Grip_Lat_Pulldown'],
  'Puxada Alta Triângulo': ['Close-Grip_Lat_Pulldown', 'V-Bar_Pulldown', 'Lat_Pulldown'],
  'Remada Baixa Neutra': ['Seated_Cable_Row', 'Seated_Row', 'Cable_Seated_Row'],
  'Barra Fixa no Graviton': ['Assisted_Pull-Up', 'Machine_Assisted_Pull-Up', 'Band_Assisted_Pull-Up'],
  'Cadeira Adutora': ['Hip_Adduction', 'Machine_Hip_Adduction', 'Cable_Hip_Adduction'],
  'Cadeira Abdutora': ['Hip_Abduction', 'Machine_Hip_Abduction', 'Cable_Hip_Adduction'],
  'Adução de Quadril na Polia Baixa': ['Cable_Hip_Adduction', 'Hip_Adduction'],
  'Abdução de Quadril na Polia Baixa': ['Cable_Hip_Abduction', 'Hip_Abduction'],
  'Desenvolvimento na Máquina': ['Machine_Shoulder_Press', 'Shoulder_Press_Machine', 'Cable_Shoulder_Press'],
  'Elevação Lateral na Máquina': ['Machine_Lateral_Raise', 'Lateral_Raise_Machine', 'Cable_Seated_Lateral_Raise'],
  'Rosca Scott na Máquina': ['Preacher_Curl', 'Machine_Preacher_Curl', 'Cable_Preacher_Curl'],
  'Rosca Scott com Barra': ['Barbell_Preacher_Curl', 'Preacher_Curl', 'Barbell_Curl'],
  'Tríceps na Máquina': ['Triceps_Pushdown', 'Machine_Triceps_Extension', 'Cable_Incline_Pushdown'],
  'Mergulho Assistido no Graviton': ['Assisted_Dips', 'Machine_Dips', 'Bench_Dips'],
  'Panturrilha Sentado na Máquina': ['Seated_Calf_Raise', 'Machine_Seated_Calf_Raise', 'Barbell_Seated_Calf_Raise'],
  'Glúteo na Máquina 4 Apoios': ['Glute_Kickback_Machine', 'Machine_Glute_Kickback', 'Butt_Lift_Bridge'],
  'Coice de Glúteo no Cabo': ['Cable_Kickback', 'Cable_Glute_Kickback', 'Glute_Kickback'],
  'Abdução de Quadril no Cabo': ['Cable_Hip_Abduction', 'Hip_Abduction'],
  'Hip Thrust na Máquina': ['Machine_Hip_Thrust', 'Hip_Thrust_Machine', 'Barbell_Hip_Thrust'],
  'Elevação Pélvica com Barra': ['Barbell_Glute_Bridge', 'Barbell_Hip_Thrust'],
  'Glúteo com Caneleira': ['Cable_Kickback', 'Glute_Kickback', 'Butt_Lift_Bridge'],
};

async function headOk(url) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(url, { method: 'HEAD', signal: ctl.signal, redirect: 'follow' });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

let aplicados = 0;
const semMatch = [];
for (const [nome, ids] of Object.entries(MAP)) {
  if (!ids.length) continue;
  let escolhido = null;
  for (const id of ids) {
    if (await headOk(`${BASE}/${id}/0.jpg`)) { escolhido = id; break; }
  }
  if (!escolhido) { semMatch.push(nome); continue; }
  const ini = `${BASE}/${escolhido}/0.jpg`;
  const fim = (await headOk(`${BASE}/${escolhido}/1.jpg`)) ? `${BASE}/${escolhido}/1.jpg` : ini;
  const up = await prisma.exercicio.updateMany({ where: { nome }, data: { gifUrl: ini, gifInicioUrl: ini, gifFimUrl: fim } });
  if (up.count) { aplicados++; console.log(`OK ${nome} <= ${escolhido}`); }
  else console.log(`AUSENTE NO BANCO: ${nome}`);
}
console.log(`\nAplicados: ${aplicados} | Sem ID válido: ${semMatch.length ? semMatch.join(' | ') : 'nenhum'}`);

// Varredura geral: acha 404s no catálogo todo
const todos = await prisma.exercicio.findMany({ where: { ativo: true }, select: { nome: true, gifInicioUrl: true } });
const quebrados = [];
let i = 0;
for (const ex of todos) {
  i++;
  if (!ex.gifInicioUrl || !(await headOk(ex.gifInicioUrl))) quebrados.push(ex.nome);
  if (i % 50 === 0) console.log(`varredura ${i}/${todos.length}...`);
}
console.log(`\nTOTAL: ${todos.length} | GIFs quebrados: ${quebrados.length}`);
if (quebrados.length) console.log(quebrados.join(' | '));
await prisma.$disconnect();

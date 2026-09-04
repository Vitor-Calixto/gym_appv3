# Calixto OmniSystem - Fitness SaaS

> **Atualizado 2026-09-04** - Backend Express + Prisma + PostgreSQL | Frontend Vanilla + Tailwind | 330 exercícios PT-BR com 2 gifs + keyframe | PWA offline + voz

## Stack
- **Backend:** Node.js 20, Express 5, Prisma 6, PostgreSQL, JWT, bcrypt, multer, nodemailer
- **Frontend:** HTML5, Tailwind CDN, Vanilla JS ES6, PWA (sw.js + manifest.json), Web Speech API
- **Banco:** 330 exercícios `free-exercise-db` PT-BR (`gifInicioUrl` + `gifFimUrl` com crossfade 3s)

## Rodar
```bash
cd backend
npm install
npx prisma db push --force-reset
npx prisma generate
node prisma/seed.js # 330 PT-BR
node prisma/create-prof.js # prof@teste.com / 123456
npm run dev # 3001
# outro terminal
npx serve frontend -l 5501
# http://localhost:5501/index/index.html
```

## Funcionalidades
- Auth: cadastro (ALUNO/PROFESSOR), login, esqueci/redefinir/alterar senha (token 1h)
- Treinos: templates (sem aluno) + atribuição, clonar, 330 exercícios com filtro/grupo, gifs duplos
- Execução: circuito PRINCIPAL, cronômetro global, vídeo expandido, intervalo, voz offline queue
- Admin: painel 330 com edição visual + upload
- Outros: anamnese, agenda, alunos, financeiro (checkout mock), frequência, chat

## Contas
- Admin: vitor@calixto.com / admin123
- Professor: prof@teste.com / 123456

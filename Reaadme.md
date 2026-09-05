# Calixto OmniSystem: Manual Mestre Definitivo de Arquitetura, Governança e Especificação Técnica

> **vFinal 2026-09-05** - 440 exercícios PT-BR (2 gifs verificados + keyframe 3s) | SmartFit completo | PWA offline + voz | Auth + convites com link | Treinos templates | Circuito PRINCIPAL

> **Progresso:** `D 100% ✓` `A 100% ✓` `B 100% ✓` `C 0% (MP pausado por decisão)` `Smart Fit 100% ✓` `Cap.7 80% ▶` `Mega 0%` • Painel: `http://localhost:5501/progress.html`

---

## Sumário do Livro

* *Prefácio:* A Visão de Engenharia Client-Server e Nível Industrial
* *Capítulo 1:* Stack Tecnológica Definitiva (Frontend, Backend & Banco de Dados)
* *Capítulo 2:* Modelo de Dados Relacional, Hierarquia de IDs e Permissões
* *Capítulo 3:* Segurança Avançada, Rotas Ocultas e Módulo Financeiro
* *Capítulo 4:* Estrutura Completa de Pastas e Subpastas (Monorepo)
* *Capítulo 5:* O Dicionário Universal de Arquivos (Frontend e Backend)
* *Capítulo 6:* Automação, Governança via Terminal e Migração de Dados

---

## Prefácio: A Visão de Engenharia Client-Server e Nível Industrial

O *Calixto OmniSystem* é um ecossistema robusto, autônomo e de alta performance voltado para a gestão de treinamentos físicos, consultorias e controle financeiro de alunos. Este documento unifica toda a engenharia do projeto, estabelecendo a transição de uma aplicação local para uma plataforma *Fullstack*.

A arquitetura separa rigorosamente o "Rosto" (Frontend) do "Cérebro e Cofre" (Backend e Banco de Dados). O cliente foca exclusivamente na renderização instantânea e na experiência do usuário, enquanto o servidor assume o controle absoluto sobre regras de negócio, autenticação e integrações financeiras.

**Evolução vFinal:** 440 exercícios PT-BR com `gifInicioUrl` + `gifFimUrl` 100% verificados via HEAD, cobertura total de máquinas SmartFit, categoria `BRACOS` extinta e redistribuída, PWA offline-first, voz hands-free, convites por link copiável com afiliação automática, dashboard global do admin (usuários/planos/prazos/faturas), treinos em formato circuito PRINCIPAL com cronômetro, e E-learning de lutas (Cap.7).

---

## Capítulo 1: Stack Tecnológica Definitiva

O projeto adota uma arquitetura estrita e modular. Tecnologias alheias ao escopo central (como Python, Ruby, C ou frameworks complexos de SPA) são estritamente proibidas para manter a velocidade e a manutenibilidade.

### 1. Frontend (O Cliente)

* *Marcação:* HTML5 semântico estruturado por telas independentes (Multi-Page Application).
* *Estilização:* Tailwind CSS (via CDN) para design responsivo e Dark Mode nativo (zinc/slate), complementado por arquivos .css individuais e enxutos para regras específicas e animações + keyframes `crossfadeInicio/Fim` 3s para 2 gifs.
* *Lógica e Comportamento:* JavaScript Vanilla (ES6+). Nenhuma validação crítica ocorre aqui; o JS atua consumindo a API REST do servidor. `js/ui.js` provê `showModal/showPrompt` para substituir `alert/prompt` nativos. `js/nav.js` renderiza a navbar fixa `CALIXTO OMNI` em todas as telas (menos execução).

### 2. Backend (O Servidor)

* *Ambiente & Framework:* Node.js com Express 5 para orquestração da API REST (11 rotas `/api`).
* *Segurança:* jsonwebtoken (JWT) para emissão de tokens de sessão e bcrypt para criptografia de senhas. Nenhuma credencial trafega ou é armazenada em texto plano. `helmet`, `rate-limit` (10 tentativas/15min em login/cadastro/esqueci-senha), `cookie-parser`, `express.json` com limite de 10kb.
* *Upload:* multer 2.0 para gifs customizados (`/uploads` + `POST /api/exercicios/upload`) e fotos de perfil (`POST /api/usuarios/foto` 3MB, só imagens).
* *Email:* nodemailer 6.9 para recuperação de senha (token 1h + `resetToken`).
* *Crypto:* `AES-256-GCM` com IV aleatório (`src/config/crypto.js`) para `mpAccessToken` (formato `iv:tag:enc`, com leitura legada). SDK `mercadopago@3.6.0` instalado, integração real pausada por decisão — checkout segue mock backend-driven.

### 3. Banco de Dados (O Cofre)

* *Motor Relacional:* PostgreSQL 15+ (`calixto_omni`).
* *ORM (Mapeador):* Prisma ORM 6. `prisma db push --accept-data-loss` para sync rápido em dev + `prisma generate`.

---

## Capítulo 2: Modelo de Dados Relacional, Hierarquia de IDs e Permissões

Toda a persistência e cruzamento de dados são gerenciados pelo Prisma ORM no backend (schema.prisma). O sistema opera sob uma hierarquia rígida de papéis (roles):

1. *Master Admin (Vitor Calixto):* Controle global irrestrito, gestão de assinaturas, auditoria de todos os professores e alunos. Login: `vitorpedrocalixto@gmail.com / Elisan01` (migrado de `vitor@calixto.com` via `prisma/fix-admin.js`). Não aparece no cadastro público (`POST /cadastro` retorna 403 para `role: ADMIN` de anônimo).
2. *Professor:* Gerencia exclusivamente sua cartela de alunos vinculados (via chave estrangeira professorId). Pode criar templates (`isTemplate=true`) sem aluno, convidar por link e vender aulas (Cap.7).
3. *Aluno:* Consome treinos, executa sessões e interage via chat, vinculado a um Professor via convite aceito. Vê `isTemplate` + seus treinos.

### O Schema Master (Prisma) vFinal

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  PROFESSOR
  ALUNO
}

model Usuario {
  id                String    @id @default(uuid())
  nome              String
  email             String    @unique
  senha             String
  role              Role      @default(ALUNO)
  professorId       String?
  professor         Usuario?  @relation("ProfessorAluno", fields: [professorId], references: [id])
  alunos            Usuario[] @relation("ProfessorAluno")
  treinos           Treino[]
  anamnese          Anamnese?
  faturas           Fatura[]
  agendasProfessor  Agenda[]  @relation("AgendaProfessor")
  agendasAluno      Agenda[]  @relation("AgendaAluno")
  convitesEnviados  Convite[] @relation("ProfessorConvites")
  telefone          String?
  fotoUrl           String?
  whatsapp          String?
  resetToken        String?
  resetTokenExpires DateTime?
  faixa             String?
  mpAccessToken     String?   // criptografado AES-GCM, Write-Only
  aulasCriadas      AulaGravada[] @relation("ProfessorAula")
  aulasCompradas    AcessoAula[]  @relation("AlunoAcesso")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model Exercicio {
  id            String       @id @default(uuid())
  nome          String       @unique
  grupoMuscular String       // 16 grupos, sem BRACOS (ver distribuição abaixo)
  descricao     String?
  equipamento   String?
  nivel         String?
  categoria     String?
  gifUrl        String?
  gifInicioUrl  String? // raw.githubusercontent .../0.jpg (verificado HEAD 200)
  gifFimUrl     String? // raw.githubusercontent .../1.jpg
  ativo         Boolean      @default(true)
  itensTreino   ItemTreino[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Treino {
  id          String       @id @default(uuid())
  nome        String
  descricao   String?
  alunoId     String?      // null = template pré-montado
  aluno       Usuario?     @relation(fields: [alunoId], references: [id])
  professorId String?
  isTemplate  Boolean      @default(false)
  itens       ItemTreino[]
  createdAt   DateTime     @default(now())
}

model ItemTreino {
  id          String    @id @default(uuid())
  treinoId    String
  exercicioId String
  series      Int
  repeticoes  String
  descansoSeg Int
  observacoes String?
  treino      Treino    @relation(fields: [treinoId], references: [id])
  exercicio   Exercicio @relation(fields: [exercicioId], references: [id])
}

model Anamnese {
  id        String   @id @default(uuid())
  alunoId   String   @unique
  aluno     Usuario  @relation(fields: [alunoId], references: [id])
  respostas Json
  createdAt DateTime @default(now())
}

model Fatura {
  id            String   @id @default(uuid())
  alunoId       String
  aluno         Usuario  @relation(fields: [alunoId], references: [id])
  mercadoPagoId String?  @unique
  valor         Float
  plano         String
  status        String
  createdAt     DateTime @default(now())
}

model Agenda {
  id          String   @id @default(uuid())
  professorId String
  alunoId     String?
  titulo      String
  tipo        String
  data        DateTime
  duracaoMin  Int      @default(60)
  status      String   @default("AGENDADO")
  professor   Usuario  @relation("AgendaProfessor", fields: [professorId], references: [id])
  aluno       Usuario? @relation("AgendaAluno", fields: [alunoId], references: [id])
  createdAt   DateTime @default(now())
}

model Convite {
  id          String   @id @default(uuid())
  professorId String
  alunoEmail  String   // vazio = link genérico copiável
  alunoId     String?
  token       String   @unique
  status      String   @default("PENDENTE") // PENDENTE, ACEITO, RECUSADO
  expiresAt   DateTime // 7 dias (e-mail) ou 30 dias (link)
  professor   Usuario  @relation("ProfessorConvites", fields: [professorId], references: [id])
  createdAt   DateTime @default(now())
}

model AulaGravada {
  id          String       @id @default(uuid())
  titulo      String
  descricao   String?
  embedUrl    String       // Vimeo Premium (nunca exposto na vitrine)
  preco       Float
  faixaMinima String?
  categoria   String       @default("MUSCULACAO") // + LUTAS_JIU_JITSU, LUTAS_MUAY_THAI, LUTAS_TAEKWONDO, LUTAS_BOXE, CARDIO, PILATES
  professorId String
  professor   Usuario      @relation("ProfessorAula", fields: [professorId], references: [id])
  acessos     AcessoAula[]
  createdAt   DateTime     @default(now())
}

model AcessoAula {
  id        String      @id @default(uuid())
  alunoId   String
  aulaId    String
  aluno     Usuario     @relation("AlunoAcesso", fields: [alunoId], references: [id])
  aula      AulaGravada @relation(fields: [aulaId], references: [id])
  status    String      @default("PENDENTE") // PENDENTE, LIBERADO, REVOGADO
  expiresAt DateTime?   // 30 dias após a compra
  createdAt DateTime    @default(now())
  @@unique([alunoId, aulaId])
}
```

*Seed e catálogo:* `prisma/exercicios-import-pt.json` PT-BR + `fix-smartfit-400.js` (upsert 9 supinos + 70 novos) + `fix-smartfit-machines.js` (35 máquinas SmartFit + extinção de `BRACOS`). `seed.js` filtra `floor press`, `supino no chão` e `BRACOS` para nunca ressuscitar. **440 ativos:** QUADRICEPS 58, OMBROS 53, PEITO 49, COSTAS 45, ABDOMEN 40, POSTERIOR 27, BICEPS 26, TRICEPS 26, TREINO_EM_CASA 20, PERNAS 15, CARDIO 15, TREINO_LIVRE 15, GLUTEO 15, PANTURRILHA 15, PILATES 11, GRAVIDEZ 10. Todos os 440 gifs verificados via HEAD (`fix-gifs-verify.js` + `fix-gifs-final5.js`).

---

## Capítulo 3: Segurança Avançada, Rotas Ocultas e Módulo Financeiro

### 1. Rota Criptografada do Master Admin

O painel de administração não utiliza rotas previsíveis (como /admin). O acesso é feito por uma rota dinâmica gerada via hash nas variáveis de ambiente (.env). Apenas o Master Admin conhece `/[HASH_SECRETO].html`. Frontend `admin-painel` verifica `role === ADMIN/PROFESSOR` + `showModal` se negado; aba `Usuários/Faturas` só renderiza para `ADMIN`.

### 2. Autenticação Stateless e Mitigação de Falhas

* *Sem falsificação de Roles:* JWT assinado; frontend envia `Authorization: Bearer`. Cadastro público só `ALUNO/PROFESSOR` (`authController.js` bloqueia `ADMIN` de anônimo com 403).
* *Proteção IDOR e BFLA:* `authMiddleware` + `roleMiddleware`. Professor só acessa próprios alunos (`professorId` checado em `alunos`, `treinos/:id`, `foto`, `whatsapp`, `aulas`). `CORS` restrito a `CLIENT_URL` + `127.0.0.1:5500, localhost:5500, localhost:5501`.
* *Anti força-bruta:* `rate-limit` 10 tentativas/15min em login/cadastro/esqueci-senha.
* *Recuperação:* `POST /api/auth/esqueci-senha` gera `crypto token 1h` + `nodemailer` (ou log `[DEV]`), `POST /api/auth/redefinir-senha` e `PUT /api/auth/alterar-senha` (autenticado).
* *Convites:* token `crypto 16 bytes`, expiração, status `PENDENTE→ACEITO/RECUSADO`; link genérico (`alunoEmail` vazio) aceito por qualquer `ALUNO`, convite por e-mail só pelo dono do e-mail.

### 3. Módulo Financeiro (Mercado Pago PAUSADO por decisão)

Nenhum preço ou regra de negócio financeira é calculada no cliente (HTML/JS). A integração real do SDK está pausada — checkout segue mock backend-driven:

1. O aluno escolhe o plano (Mensal 120, Trimestral 300, Anual 1000).
2. O frontend avisa o backend (POST /api/financeiro/checkout só com `{plano}`).
3. O Node.js consulta o preço oficial (`PLANOS` no backend) e devolve o link.
4. Webhook (POST /api/financeiro/webhook) atualiza a `Fatura` para `PAGO`. Validação `x-signature` + `Payment.get` ficam para a retomada.
5. Admin controla tudo em `admin-painel` aba Faturas (`GET/PUT /api/admin/faturas` com `PAGO/PENDENTE/CANCELAR`).

---

## Capítulo 4: Estrutura Completa de Pastas e Subpastas (Monorepo)

```plaintext
/calixto-omnisystem/ (Gym_app_final)
│
├── README.md / Reaadme.md            # Manual Mestre (este arquivo)
├── .gitignore
│
├── /backend/                         # SERVIDOR (O Cérebro)
│   ├── package.json                  # express, prisma, bcrypt, jwt, multer, nodemailer, helmet, rate-limit, mercadopago (pausado)
│   ├── .env                          # DATABASE_URL, JWT_SECRET, ADMIN_ROUTE_HASH, CLIENT_URL, MP_ACCESS_TOKEN, CRYPTO_KEY, SMTP
│   ├── /prisma/
│   │   ├── schema.prisma             # Modelagem vFinal (11 models)
│   │   ├── exercicios-import.json    # 330 EN raw
│   │   ├── exercicios-import-pt.json # 330 PT-BR com 0.jpg/1.jpg
│   │   ├── exercicios-300.json       # legado 300 sintéticos
│   │   ├── seed.js                   # upsert PT-BR + admin (filtra chão/BRACOS)
│   │   ├── fix-smartfit-400.js       # 9 supinos + 70 novos (CARDIO/PILATES/GRAVIDEZ/CASA/LIVRE)
│   │   ├── fix-smartfit-machines.js  # 35 máquinas SmartFit + extinção BRACOS
│   │   ├── fix-gifs-verify.js        # remapeamento semântico + varredura HEAD 440
│   │   ├── fix-gifs-final5.js        # últimos 5 (Extensora, Remada Baixa, Abduções, Pilates)
│   │   ├── fix-admin.js              # migração vitor@ → vitorpedrocalixto@gmail.com
│   │   ├── seed-aulas.js             # 4 aulas lutas demo
│   │   └── create-prof.js            # prof@teste.com
│   └── /src/
│       ├── server.js                 # helmet, CORS, /uploads static, 11 rotas /api
│       ├── /config/prisma.js, crypto.js (AES-GCM iv:tag:enc + legado)
│       ├── /middlewares/authMiddleware.js, roleMiddleware.js
│       ├── /controllers/authController.js, exercicioController.js, treinoController.js, anamneseController.js, alunosController.js, agendaController.js, financeiroController.js (mock), conviteController.js, aulaController.js, usuariosController.js, adminController.js
│       └── /routes/authRoutes.js, exercicioRoutes.js (multer), treinoRoutes.js, anamneseRoutes.js, alunosRoutes.js, agendaRoutes.js, financeiroRoutes.js, conviteRoutes.js, aulaRoutes.js, usuariosRoutes.js, adminRoutes.js (só ADMIN)
│
└── /frontend/                        # CLIENTE (O Rosto)
    ├── /js/auth.js, storage.js, ui.js (showModal/showPrompt), nav.js (navbar fixa)
    ├── /css/global.css, nav.css
    ├── sw.js (v2) + manifest.json + progress.html/progress.json (painel de progresso)
    ├── index/ (login com links cadastro/esqueci)
    ├── cadastro/ (afiliação automática ?convite=)
    ├── esqueci-senha/, alterar-senha/ (token)
    ├── home/ (hero + navbar por role + convites pendentes Aceitar/Recusar)
    ├── admin-painel/ (Exercícios grid + Usuários/Planos + Faturas PAGO/PENDENTE/CANCELAR)
    ├── montar-treino/ (busca + modal 2 gifs, 16 grupos, template opcional)
    ├── executar-treino/ (circuito PRINCIPAL, cronômetro, voz, offline)
    ├── meus-treinos/ (Biblioteca + templates professor)
    ├── gerenciar-alunos/ (cards foto/whatsapp + botão Convidar → link clicável copiável)
    ├── alunos/ (perfil + upload foto + whatsapp professor)
    ├── anamnese/, agenda/, financeiro/, frequencia/ (heatmap localStorage), chat/ (localStorage por par)
    └── configuracoes/, gerenciar-aulas/, portal-lutas/ (Cap.7: lives Luiz Dorea + aulas PIX + marca d'água)
```

---

## Capítulo 5: O Dicionário Universal de Arquivos (Frontend e Backend)

### O Núcleo do Backend

* *server.js:* `helmet`, CORS multi-origin, `/uploads`, e 11 rotas `/api/auth, /exercicios, /treinos, /anamnese, /alunos, /agenda, /financeiro, /convites, /aulas, /usuarios, /admin`.
* *Middlewares:* `authMiddleware` (JWT) + `roleMiddleware` (ADMIN/PROFESSOR/ALUNO).
* *Convites:* `POST /api/convites/convidar` (e-mail), `POST /api/convites/link` (genérico, expira 30d, base via `CLIENT_URL`), `GET /`, `POST /aceitar/:token` (genérico aceito por qualquer ALUNO; por e-mail só o dono), `POST /recusar/:token`.
* *Treinos:* `POST /api/treinos` (`isTemplate` se sem `alunoId`); `GET /templates`; `GET /:id` direto; `POST /:id/clonar`.
* *Admin global:* `GET /api/admin/resumo`, `GET /api/admin/usuarios?search=&role=` (plano/prazo calculados 30/90/365d), `PUT /api/admin/usuarios/:id`, `GET/PUT /api/admin/faturas`.
* *Aulas (Cap.7):* `GET /api/aulas` (vitrine sem `embedUrl`), `GET /api/aulas/minhas` (só LIBERADO, auto-revoga expirado), `POST /` (professor, valida categoria/preço), `POST /:id/comprar` (trava faixa 403, split pelo token do professor em RAM, PIX mock + `expiresAt` 30d), `POST /:id/liberar` + `DELETE /:id` (dono/admin).
* *Usuários:* `GET /api/usuarios/me` (sem token cru), `PUT /api/usuarios/config` (MP criptografado + faixa/whatsapp/foto), `POST /api/usuarios/foto` (multer 3MB, dono ou professor do aluno), `PUT /api/usuarios/:id/whatsapp`.

### O Núcleo do Frontend (Telas Reativas)

* *index e cadastro:* login + cadastro com `?convite=` (salva token, afilia após `salvarSessao`).
* *home:* hero, navbar por role, `GET /treinos/templates` (professor) ou `/treinos/aluno`, cards de convites pendentes.
* *admin-painel:* 3 abas — Exercícios (grid + modal + upload), Usuários/Planos (busca, perfil, prazo), Faturas (filtro status + botões).
* *montar-treino:* busca + 16 grupos, modal 2 gifs verificados, `POST /api/treinos` com `alunoId` opcional.
* *executar-treino:* `GET /api/treinos/:id`, `PRINCIPAL`, cronômetro, voz, offline queue.
* *gerenciar-alunos:* cards + `+ Convidar` → `POST /convites/link` → modal com **link clicável** + cópia com fallback.
* *portal-lutas:* lives Luiz Dorea (`_8u1rX4bksM`, `CTXLq50wU0Q`) + aulas; LIBERADA mostra iframe + marca d'água `nome • email` animada; senão cadeado + PIX.
* *Outros:* `anamnese`, `agenda`, `financeiro`, `frequencia` (heatmap 35 dias), `chat` (par professor-aluno), sem `alert` nativo.

---

## Capítulo 6: Automação, Governança via Terminal e Migração de Dados

```bash
# Backend
cd backend
npm install
npx prisma db push --accept-data-loss
npx prisma generate
node prisma/seed.js              # PT-BR (filtra chão/BRACOS)
node prisma/fix-smartfit-400.js  # 9 supinos + 70 novos
node prisma/fix-smartfit-machines.js # 35 máquinas + fim de BRACOS
node prisma/fix-gifs-verify.js   # remapeia + varre 440 (HEAD)
node prisma/fix-gifs-final5.js   # últimos 5
node prisma/fix-admin.js         # admin vitorpedrocalixto@gmail.com
node prisma/seed-aulas.js        # 4 aulas lutas
node prisma/create-prof.js       # prof@teste.com / 123456
npm run dev # 3001

# Frontend
npx serve frontend -l 5501 # http://localhost:5501/index/index.html

# Git
git add .
git commit -m "feat: ..."
git push
```

*Contas:* Admin `vitorpedrocalixto@gmail.com / Elisan01` • Professor `prof@teste.com / 123456`.

---

# 📄 Documento Mestre Definitivo: Calixto OmniSystem (Atualizado vFinal)

## 1. Visão Geral da Plataforma

* *Pilha:* Node.js (Backend) | HTML & CSS (Frontend) — **440 PT-BR, 2 gifs verificados, SmartFit total, convites com link, dashboard global, Cap.7 lutas**
* *Modelo:* SaaS + circuito de treinos com cronômetro + E-learning com PIX split por professor
* *Status:* Operacional local — **440 exercícios, 16 grupos, 11 rotas API, 10+ telas**

## 2. Arquitetura do Frontend

### 2.1. Estruturação Semântica

* *Dashboard Central:* hero, navbar fixa por role (`nav.js`), 8 cards, bottom bar mobile
* *Painéis:* `montar-treino` (busca + modal), `admin-painel` (3 abas), `executar-treino` (circuito), `portal-lutas` (lives + PIX)
* *Relatórios:* `meus-treinos`, `frequencia` (heatmap), `financeiro` (tabela)

### 2.2. Design

* Grid 4 col admin, `gif-anim` crossfade 3s, modais `ui.js`, `zinc-950/emerald-500`, `sw.js v2`, marca d'água animada no player

## 3. Arquitetura do Backend

### 3.1. Servidor

* Express 5 com 11 rotas, `multer`, `nodemailer`, `helmet`, `rate-limit`, crypto `AES-GCM`

### 3.2. APIs e Endpoints

* `GET /api/health`
* `POST /api/auth/cadastro, /login, /esqueci-senha, /redefinir-senha` + `PUT /alterar-senha` + `GET /me`
* `GET /api/exercicios?grupo=&nivel=` + `POST /` + `PUT /:id` + `POST /upload`
* `POST /api/treinos` + `GET /templates` + `GET /:id` + `GET /aluno` + `POST /:id/clonar`
* `POST /api/anamnese` + `GET /me/dados` + `GET /`
* `GET /api/alunos` + `GET /:id`
* `GET /api/agenda` + `POST /` + `PUT /:id` + `DELETE /:id`
* `GET /api/financeiro` + `POST /checkout` (mock) + `POST /webhook` + `PUT /:id`
* `POST /api/convites/convidar` + `POST /api/convites/link` + `GET /` + `POST /aceitar/:token` + `POST /recusar/:token`
* `GET /api/aulas` + `GET /api/aulas/minhas` + `POST /` + `POST /:id/comprar` + `POST /:id/liberar` + `DELETE /:id`
* `GET /api/usuarios/me` + `PUT /api/usuarios/config` + `POST /api/usuarios/foto` + `PUT /api/usuarios/:id/whatsapp`
* `GET /api/admin/resumo` + `GET/PUT /api/admin/usuarios` + `GET/PUT /api/admin/faturas`

### 3.3. Automação

* `offline queue` + `online` sync, `globalTimer`, auto-revogação de acessos expirados na leitura

## 4. Integração: Fluxo Completo

1. Professor gera link em `gerenciar-alunos` → aluno cadastra com `?convite=` → afiliado ao professor.
2. Professor monta ficha (`POST /api/treinos`) ou vende aula (`gerenciar-aulas`); aluno executa (`GET /treinos/:id`) ou compra PIX (`portal-lutas`).
3. Admin audita tudo em `admin-painel` (usuários, prazos, faturas).

## 5. Diretrizes

* *Pureza:* `Node/HTML/CSS`, sem SPA
* *Mercado Pago real:* pausado por decisão — retomar por `financeiroController.js` (`Preference` + `x-signature`)
* *Monitoramento:* `nodemon` + logs

---📌 ADENDO: Resiliência, Voz, Gifs e Lutas

1. **Voz** — `speechSynthesis` PT-BR, `🔊 Voz ON/OFF`, descanso + `globalTimer`.
2. **PWA** — `sw.js v2` (`NetworkFirst` /api, `CacheFirst` assets), `localStorage` queue + `online` sync, `manifest.json`.
3. **Gifs** — `gifInicioUrl/0.jpg` + `gifFimUrl/1.jpg`, crossfade 3s, **440/440 verificados via HEAD**, remapeamento semântico em `fix-gifs-verify.js`.
4. **Circuito** — `isTemplate`, `PRINCIPAL`, `Vamos treinar agora?`, carga, intervalo.
5. **Lutas** — lives Luiz Dorea + `AulaGravada/AcessoAula` com faixa, expiração 30d, marca d'água rastreável.

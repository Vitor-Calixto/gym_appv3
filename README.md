# Calixto OmniSystem: Manual Mestre Definitivo de Arquitetura, Governança e Especificação Técnica

> **vFinal 2026-09-04** - 330 exercícios PT-BR (2 gifs + keyframe 3s) | PWA offline + voz | Auth completa | Treinos templates | Circuito PRINCIPAL

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

**Evolução vFinal:** 330 exercícios PT-BR curados do `free-exercise-db` com `gifInicioUrl` + `gifFimUrl` em crossfade, PWA offline-first, voz hands-free, treinos em formato circuito PRINCIPAL com cronômetro, e 8 módulos funcionais (auth, anamnese, agenda, alunos, financeiro, frequência, chat, admin).

---

## Capítulo 1: Stack Tecnológica Definitiva

O projeto adota uma arquitetura estrita e modular. Tecnologias alheias ao escopo central (como Python, Ruby, C ou frameworks complexos de SPA) são estritamente proibidas para manter a velocidade e a manutenibilidade.

### 1. Frontend (O Cliente)

* *Marcação:* HTML5 semântico estruturado por telas independentes (Multi-Page Application).
* *Estilização:* Tailwind CSS (via CDN) para design responsivo e Dark Mode nativo (zinc/slate), complementado por arquivos .css individuais e enxutos para regras específicas e animações + keyframes `crossfadeInicio/Fim` 3s para 2 gifs.
* *Lógica e Comportamento:* JavaScript Vanilla (ES6+). Nenhuma validação crítica ocorre aqui; o JS atua consumindo a API REST do servidor. `js/ui.js` provê `showModal/showPrompt` para substituir `alert/prompt` nativos.

### 2. Backend (O Servidor)

* *Ambiente & Framework:* Node.js com Express 5 para orquestração da API REST.
* *Segurança:* jsonwebtoken (JWT) para emissão de tokens de sessão e bcrypt para criptografia de senhas. Nenhuma credencial trafega ou é armazenada em texto plano.
* *Upload:* multer 2.0 para gifs customizados (`/uploads` + `POST /api/exercicios/upload`).
* *Email:* nodemailer 6.9 para recuperação de senha (token 1h + `resetToken`).

### 3. Banco de Dados (O Cofre)

* *Motor Relacional:* PostgreSQL 15+ (`calixto_omni`).
* *ORM (Mapeador):* Prisma ORM 6. Traduz a lógica relacional para JavaScript, garantindo tipagem, migrações seguras e consultas otimizadas. `prisma db push --force-reset` para sync rápido em dev.

---

## Capítulo 2: Modelo de Dados Relacional, Hierarquia de IDs e Permissões

Toda a persistência e cruzamento de dados são gerenciados pelo Prisma ORM no backend (schema.prisma). O sistema opera sob uma hierarquia rígida de papéis (roles):

1. *Master Admin (Vitor Calixto):* Controle global irrestrito, gestão de assinaturas, auditoria de todos os professores e alunos. Seed: `vitor@calixto.com / admin123`. Não aparece no cadastro público.
2. *Professor:* Gerencia exclusivamente sua cartela de alunos vinculados (via chave estrangeira professorId). Pode criar templates (`isTemplate=true`) sem aluno.
3. *Aluno:* Consome treinos, executa sessões e interage via chat, obrigatoriamente atrelado a um Professor. Vê `isTemplate` + seus treinos.

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
  telefone          String?
  resetToken        String?
  resetTokenExpires DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model Exercicio {
  id            String       @id @default(uuid())
  nome          String       @unique
  grupoMuscular String
  descricao     String?
  equipamento   String?
  nivel         String?
  categoria     String?
  gifUrl        String?
  gifInicioUrl  String? // raw.githubusercontent .../0.jpg
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
```

*Seed:* `prisma/exercicios-import-pt.json` 330 PT-BR (ABDOMEN 40, POSTERIOR 24, QUADRICEPS 53, etc) com `0.jpg` + `1.jpg`. `node prisma/seed.js` faz `upsert` por `nome`. `prisma/create-prof.js` cria `prof@teste.com / 123456`.

---

## Capítulo 3: Segurança Avançada, Rotas Ocultas e Módulo Financeiro

### 1. Rota Criptografada do Master Admin

O painel de administração não utiliza rotas previsíveis (como /admin). O acesso é feito por uma rota dinâmica gerada via hash nas variáveis de ambiente (.env). Exemplo: Apenas o Master Admin sabe que a rota administrativa é gerada dinamicamente como `/[HASH_SECRETO].html`. Frontend `admin-painel` verifica `role === ADMIN/PROFESSOR` + `showModal` se negado.

### 2. Autenticação Stateless e Mitigação de Falhas

* *Sem falsificação de Roles:* O frontend não dita quem é quem. No login, o Node.js emite um JWT assinado criptograficamente. O frontend armazena esse token e o envia no cabeçalho Authorization: Bearer <TOKEN> a cada requisição. Cadastro público só `ALUNO/PROFESSOR`, `ADMIN` só via seed.
* *Proteção IDOR e BFLA:* Middlewares `authMiddleware` (valida JWT) + `roleMiddleware(['ADMIN','PROFESSOR'])` interceptam o ID do token e validam no PostgreSQL antes de qualquer exclusão ou edição. `CORS` restrito a `CLIENT_URL` + `127.0.0.1:5500, localhost:5500, localhost:5501`.
* *Recuperação:* `POST /api/auth/esqueci-senha` gera `crypto token 1h` + `nodemailer` (ou log `[DEV]`), `POST /api/auth/redefinir-senha` e `PUT /api/auth/alterar-senha` (autenticado).

### 3. Módulo Financeiro 100% Backend-Driven (Mercado Pago)

Nenhum preço ou regra de negócio financeira é calculada no cliente (HTML/JS).

1. O aluno escolhe o plano (Mensal 120, Trimestral 300, Anual 1000).
2. O frontend avisa o backend (POST /api/financeiro/checkout).
3. O Node.js consulta o preço oficial no banco de dados, gera a preferência de pagamento usando o MP_ACCESS_TOKEN seguro e devolve o link.
4. Após o pagamento, o webhook do Mercado Pago notifica o backend (POST /api/financeiro/webhook), que altera o status do aluno automaticamente para "PAGO". Listagem `GET /api/financeiro` com mock fallback se vazio.

---

## Capítulo 4: Estrutura Completa de Pastas e Subpastas (Monorepo)

```plaintext
/calixto-omnisystem/ (Gym_app_final)
│
├── README.md / Reaadme.md            # Manual Mestre
├── .gitignore
│
├── /backend/                         # SERVIDOR (O Cérebro)
│   ├── package.json                  # express, prisma, bcrypt, jwt, multer, nodemailer
│   ├── .env                          # DATABASE_URL, JWT_SECRET, ADMIN_ROUTE_HASH, CLIENT_URL, MP_ACCESS_TOKEN, SMTP
│   ├── /prisma/
│   │   ├── schema.prisma             # Modelagem vFinal
│   │   ├── exercicios-import.json    # 330 EN raw
│   │   ├── exercicios-import-pt.json # 330 PT-BR com 0.jpg/1.jpg
│   │   ├── exercicios-300.json       # legado 300 sintéticos
│   │   ├── seed.js                   # upsert 330 PT-BR + admin
│   │   ├── create-prof.js            # prof@teste.com
│   │   └── check.js / check-treino.js
│   └── /src/
│       ├── server.js                 # CORS multi-origin, /uploads static, 7 rotas /api
│       ├── /config/prisma.js
│       ├── /middlewares/authMiddleware.js, roleMiddleware.js
│       ├── /controllers/authController.js (cadastro/login/esqueci/redefinir/alterar), exercicioController.js (filtro + PUT + upload), treinoController.js (isTemplate + templates + clonar + obterPorId), anamneseController.js, alunosController.js, agendaController.js, financeiroController.js
│       └── /routes/authRoutes.js, exercicioRoutes.js (multer), treinoRoutes.js, anamneseRoutes.js, alunosRoutes.js, agendaRoutes.js, financeiroRoutes.js
│
└── /frontend/                        # CLIENTE (O Rosto)
    ├── /js/auth.js, storage.js (API_URL + 401 redirect), ui.js (showModal/showPrompt)
    ├── /css/global.css
    ├── sw.js (v2, NetworkFirst /api, CacheFirst assets) + manifest.json
    ├── /assets/ (gifs locais se upload)
    ├── index/index.html|css|js (login com links cadastro/esqueci)
    ├── cadastro/cadastro.html|css|js (só ALUNO/PROFESSOR)
    ├── esqueci-senha/... (POST /esqueci-senha), alterar-senha/... (token ?redefinir : alterar)
    ├── home/home.html|css|js (hero + navbar por role + grid 8 cards + bottom bar)
    ├── admin-painel/admin-painel.html|css|js (grid 4 col 330, filtros, modal edição + keyframe, upload)
    ├── montar-treino/montar-treino.html|css|js (estilo MFIT dark, busca, modal gifs duplos, template opcional)
    ├── executar-treino/executar-treino.html|css|js (circuito PRINCIPAL, cronômetro global, modal Vamos treinar? SIM/NÃO, voz, offline queue)
    ├── meus-treinos/meus-treinos.html|js (Biblioteca, busca, GET /templates para professor)
    ├── gerenciar-alunos/... (GET /alunos, Anamnese/Treino)
    ├── anamnese/... (POST /anamnese + GET me/dados)
    ├── agenda/... (GET/POST /agenda com showPrompt)
    ├── financeiro/... (GET /financeiro + POST /checkout com showPrompt)
    ├── frequencia/... (check-in showModal)
    ├── chat/... + alunos/... (placeholders)
    └── frequencia, etc.
```

---

## Capítulo 5: O Dicionário Universal de Arquivos (Frontend e Backend)

### O Núcleo do Backend

* *server.js:* Habilita CORS multi-origin, serve `/uploads`, e orquestra 7 rotas `/api/auth, /exercicios, /treinos, /anamnese, /alunos, /agenda, /financeiro`.
* *Middlewares (auth e role):* Barreira de segurança. `authMiddleware` valida JWT, `roleMiddleware` valida `ADMIN/PROFESSOR/ALUNO`.
* *Controllers e Routes:* `POST /api/treinos` cria `isTemplate` se sem `alunoId`; `GET /api/treinos/templates` lista templates; `GET /api/treinos/:id` busca direto (usado por `executar-treino`); `POST /api/treinos/:id/clonar` clona template para aluno.

### O Núcleo do Frontend (Telas Reativas)

* *index e cadastro:* Coletam credenciais, `POST /api/auth/login` e `POST /api/auth/cadastro`, aguardam JWT.
* *home:* Hero com `1534438327276.jpg`, navbar `link-prof/link-admin` por role, 8 cards com fotos, `GET /treinos/templates` para professor ou `GET /treinos/aluno` para aluno.
* *admin-painel:* Grid `330` com `gif-anim` crossfade `gifInicioUrl`/`gifFimUrl`, `PUT /api/exercicios/:id` com `FormData` para upload.
* *montar-treino:* `GET /api/exercicios?grupo=` lista 330, modal com 2 gifs + `séries/reps/pausa/obs`, `POST /api/treinos` com `alunoId` opcional.
* *executar-treino:* `GET /api/treinos/:id` direto, layout `PRINCIPAL`, `Usar Cronômetro?`, `circuito 1 passagem`, modal `Vamos treinar agora?`, player com `gifInicioUrl`, `0'36" 24kcal`, `Carga`, `RPE`, `FAZER INTERVALO`, voz `speechSynthesis` + offline `localStorage` + `online` sync.
* *meus-treinos:* `Biblioteca de Treinos`, `GET /treinos/templates` para professor, busca local.
* *financeiro:* `GET /api/financeiro` lista, `POST /api/financeiro/checkout` gera link, `showPrompt` para gerar mensalidade.
* *Outros:* `anamnese`, `agenda`, `gerenciar-alunos`, `frequencia` todos via `js/ui.js` modais, sem `alert`.

---

## Capítulo 6: Automação, Governança via Terminal e Migração de Dados

```bash
# Backend
cd backend
npm install
npx prisma db push --force-reset # sync sem histórico
npx prisma generate
node prisma/seed.js # 330 PT-BR
node prisma/create-prof.js # prof@teste.com / 123456
npm run dev # 3001

# Frontend
npx serve frontend -l 5501 # http://localhost:5501/index/index.html
# ou Live Server com root Gym_app_final -> http://127.0.0.1:5500/frontend/index/index.html

# Git
git init
git add .
git commit -m "feat: vFinal ..."
git remote add origin https://github.com/Vitor-Calixto/gym_appv3.git
git push --force -u origin main
```

*Seed:* `exercicios-import-pt.json` com `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<id>/0.jpg` + `/1.jpg` + `grupo_muscular` PT-BR. `upsert` por `nome` permite re-seed idempotente. `check.js` valida `total 330 variantes 0`.

---

# 📄 Documento Mestre Definitivo: Calixto OmniSystem (Atualizado vFinal)

## 1. Visão Geral da Plataforma

O *Calixto OmniSystem* é uma plataforma SaaS e software de automação proprietário projetado para oferecer alta performance, escalabilidade e controle intuitivo. A arquitetura foi construída com foco estrito em eficiência e código limpo, operando com um núcleo tecnológico otimizado e focado.

* *Pilha Tecnológica Principal:* Node.js (Backend) | HTML & CSS (Frontend) - **vFinal com 330 PT-BR, 2 gifs, multer, nodemailer, PWA**
* *Modelo de Operação:* Software as a Service (SaaS) com processamento assíncrono para automações + **circuito de treinos com cronômetro**
* *Status de Implantação:* Operacional e em nuvem (Produção) - **330 exercícios, 8 módulos, 7 rotas API**

## 2. Arquitetura do Frontend (Interface e Interação)

### 2.1. Estruturação Semântica (HTML)

* *Dashboard Central:* Hero com `1534438327276.jpg`, navbar por role, 8 cards com fotos, bottom bar mobile
* *Painéis de Controle:* `montar-treino` com busca + modal gifs duplos, `admin-painel` grid 4 col, `executar-treino` circuito PRINCIPAL
* *Exibição de Relatórios:* `meus-treinos` Biblioteca, `frequencia` check-in, `financeiro` tabela com `showModal`

### 2.2. Design e Responsividade (CSS)

* *Layouts Fluídos:* Grid 4 col admin, Grid 2 col montar-treino, `gif-anim` crossfade 3s
* *Feedback Visual:* `js/ui.js` modais `zinc-900` substituindo `alert`, `hover:border-emerald`
* *Tematização:* `zinc-950/emerald-500`, `Tailwind CDN`, `sw.js v2`

## 3. Arquitetura do Backend (Motor de Automação)

### 3.1. Servidor e Infraestrutura (Node.js)

* *Event Loop:* Express 5 com 7 rotas, `multer` upload, `nodemailer` token 1h
* *Gerenciamento de Módulos:* `controllers` + `routes` + `middlewares` desacoplados, `prisma` single connection

### 3.2. APIs e Endpoints

* `GET /api/health` - health
* `POST /api/auth/cadastro, /login, /esqueci-senha, /redefinir-senha` + `PUT /alterar-senha` + `GET /me`
* `GET /api/exercicios?grupo=&nivel=` + `POST /` + `PUT /:id` (FormData) + `POST /upload`
* `POST /api/treinos` (`isTemplate` se sem alunoId) + `GET /templates` + `GET /:id` + `GET /aluno` + `POST /:id/clonar`
* `POST /api/anamnese` + `GET /me/dados` + `GET /` (professor)
* `GET /api/alunos` + `GET /:id`
* `GET /api/agenda` + `POST /` + `PUT /:id` + `DELETE /:id`
* `GET /api/financeiro` + `POST /checkout` + `POST /webhook` + `PUT /:id`

### 3.3. Lógica de Automação

* *Workers & Filas:* `offline queue` `localStorage omni_offline_logs` + `online` sync, `globalTimer` 10ms
* *Segurança:* JWT 7d, `roleMiddleware`, `CORS` multi-origin, `IDOR` check em `obterTreinoPorId`

## 4. Integração: Fluxo Completo (Frontend ⇆ Backend)

1. *Ação:* Professor monta ficha em `montar-treino` (busca 330, modal 2 gifs, `POST /api/treinos` com `isTemplate` se sem aluno)
2. *Requisição:* `apiFetch` com `Bearer` + `FormData` se upload
3. *Processamento:* `treinoController` valida `PROFESSOR`, cria `Treino` + `ItemTreino` nested, retorna com `exercicio`
4. *Resposta:* `showModal` sucesso, `meus-treinos` lista `GET /templates`, `executar-treino` faz `GET /:id` direto + `localStorage` cache + voz

## 5. Diretrizes de Manutenção e Expansão

* *Pureza do Stack:* Mantido `Node/HTML/CSS` - sem frameworks SPA
* *Escalabilidade Horizontal:* Stateless JWT, `PM2` ready
* *Monitoramento de Logs:* `console.log` + `nodemon`

---📌 ADENDO OFICIAL: Resiliência de Conexão e Acessibilidade em Treino

1. **Assistente de Voz (Hands-Free UX)** - `executar-treino.js:15` `window.speechSynthesis` PT-BR, botão `🔊 Voz: ON/OFF`, `falar('Série concluída...')`, `setTimeout` 10s, `iniciarDescanso` + `globalTimer`.

2. **Modo Offline (PWA)** - `sw.js:1` `CACHE_NAME omni-cache-v2`, `NetworkFirst` para `/api/`, `CacheFirst` para assets, `fallback` para `executar-treino.html`. `localStorage` queue `omni_offline_logs` + `omni_treino_cache_<id>` + `window.addEventListener('online')` sync para `POST /api/treinos/log` (futuro). `manifest.json` `start_url: /home/home.html` + `display: standalone`.

3. **Gifs Duplos** - `Exercicio:41` `gifInicioUrl` (`.../0.jpg`) + `gifFimUrl` (`.../1.jpg`) + `admin-painel.css:1` + `executar-treino` `gif-layer` crossfade 3s `crossfadeInicio/Fim`, preview no modal `admin-painel`.

4. **Treinos Circuito** - `Treino:54` `isTemplate` + `professorId`, `executar-treino.html:1` `PRINCIPAL`, `Usar Cronômetro?`, `circuito 1 passagem`, `Vamos treinar agora?` modal, `0'36" 24kcal`, `Nº séries/reps, Cadência, Carga, FAZER INTERVALO`.


import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import exercicioRoutes from './routes/exercicioRoutes.js';
import treinoRoutes from './routes/treinoRoutes.js';
import anamneseRoutes from './routes/anamneseRoutes.js';
import alunosRoutes from './routes/alunosRoutes.js';
import agendaRoutes from './routes/agendaRoutes.js';
import financeiroRoutes from './routes/financeiroRoutes.js';
import conviteRoutes from './routes/conviteRoutes.js';
import aulaRoutes from './routes/aulaRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import pacoteRoutes from './routes/pacoteRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5000';

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: [CLIENT_URL, 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:5501'], credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limit contra Credential Stuffing / força bruta
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 10, message: { error: 'Muitas tentativas, tente em 15 min' }, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/cadastro', authLimiter);
app.use('/api/auth/esqueci-senha', authLimiter);

app.get('/health', (req, res) => res.json({ status: 'OK', system: 'Calixto OmniSystem Backend' }));
app.get('/api/health', (req, res) => res.json({ status: 'OK', system: 'Calixto OmniSystem Backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/exercicios', exercicioRoutes);
app.use('/api/treinos', treinoRoutes);
app.use('/api/anamnese', anamneseRoutes);
app.use('/api/alunos', alunosRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/convites', conviteRoutes);
app.use('/api/aulas', aulaRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pacotes', pacoteRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🏥 Backend: http://localhost:${PORT}/api/health`);
});

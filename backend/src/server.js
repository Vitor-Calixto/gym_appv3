import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import exercicioRoutes from './routes/exercicioRoutes.js';
import treinoRoutes from './routes/treinoRoutes.js';
import anamneseRoutes from './routes/anamneseRoutes.js';
import alunosRoutes from './routes/alunosRoutes.js';
import agendaRoutes from './routes/agendaRoutes.js';
import financeiroRoutes from './routes/financeiroRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5000';

app.use(cors({ origin: [CLIENT_URL, 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:5501'], credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'OK', system: 'Calixto OmniSystem Backend' }));
app.get('/api/health', (req, res) => res.json({ status: 'OK', system: 'Calixto OmniSystem Backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/exercicios', exercicioRoutes);
app.use('/api/treinos', treinoRoutes);
app.use('/api/anamnese', anamneseRoutes);
app.use('/api/alunos', alunosRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/financeiro', financeiroRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🏥 Backend: http://localhost:${PORT}/api/health`);
});

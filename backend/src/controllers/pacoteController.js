// backend/src/controllers/pacoteController.js — pacotes do professor (ex.: "Boxe Fundamentos")
import { prisma } from '../config/prisma.js';
import { descriptografar } from '../config/crypto.js';

const CATEGORIAS = ['MUSCULACAO', 'LUTAS_JIU_JITSU', 'LUTAS_MUAY_THAI', 'LUTAS_TAEKWONDO', 'LUTAS_BOXE', 'CARDIO', 'PILATES'];

async function pacoteDoProfessor(id, user) {
  const pacote = await prisma.pacote.findUnique({ where: { id }, include: { itens: { include: { aula: true } } } });
  if (!pacote) return { erro: 'Pacote não encontrado.' };
  if (user.role !== 'ADMIN' && pacote.professorId !== user.id) return { erro: 'Acesso negado.' };
  return { pacote };
}

export const criarPacote = async (req, res) => {
  try {
    const { titulo, descricao, preco, categoria, aulaIds } = req.body;
    if (!titulo || preco === undefined) return res.status(400).json({ error: 'Título e preço obrigatórios.' });
    const valor = Number(preco);
    if (!Number.isFinite(valor) || valor <= 0) return res.status(400).json({ error: 'Preço inválido.' });
    const cat = (categoria || 'MUSCULACAO').toUpperCase();
    if (!CATEGORIAS.includes(cat)) return res.status(400).json({ error: 'Categoria inválida.' });
    // Todas as aulas precisam ser do próprio professor
    const ids = [...new Set((aulaIds || []).map(String))];
    if (ids.length) {
      const minhas = await prisma.aulaGravada.count({ where: { id: { in: ids }, professorId: req.user.id } });
      if (minhas !== ids.length) return res.status(400).json({ error: 'Use apenas aulas do seu catálogo.' });
    }
    const pacote = await prisma.pacote.create({
      data: {
        titulo: String(titulo).slice(0, 120),
        descricao: descricao ? String(descricao).slice(0, 500) : null,
        preco: valor, categoria: cat, professorId: req.user.id,
        itens: { create: ids.map((aulaId, i) => ({ aulaId, ordem: i })) },
      },
      include: { itens: { include: { aula: { select: { id: true, titulo: true } } } } },
    });
    return res.status(201).json(pacote);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar pacote.' });
  }
};

// Professor vê os próprios; aluno vê os do PRÓPRIO professor; admin filtra por professorId
export const listarPacotes = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'ADMIN' && req.query.professorId) {
      where.professorId = String(req.query.professorId);
    } else if (req.user.role === 'PROFESSOR') {
      where.professorId = req.user.id;
    } else {
      const eu = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: { professorId: true } });
      if (!eu?.professorId) return res.json([]);
      where.professorId = eu.professorId;
    }
    const pacotes = await prisma.pacote.findMany({
      where,
      include: { itens: { include: { aula: { select: { id: true, titulo: true, categoria: true } } }, orderBy: { ordem: 'asc' } }, professor: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(pacotes);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao listar pacotes.' });
  }
};

export const deletarPacote = async (req, res) => {
  try {
    const { pacote, erro } = await pacoteDoProfessor(req.params.id, req.user);
    if (erro) return res.status(erro === 'Pacote não encontrado.' ? 404 : 403).json({ error: erro });
    await prisma.pacote.delete({ where: { id: pacote.id } });
    return res.json({ sucesso: true });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao excluir pacote.' });
  }
};

export const comprarPacote = async (req, res) => {
  try {
    const pacote = await prisma.pacote.findUnique({ where: { id: req.params.id }, include: { itens: true, professor: true } });
    if (!pacote) return res.status(404).json({ error: 'Pacote não encontrado.' });
    // Aluno só compra do próprio professor (organização por professor)
    const eu = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: { professorId: true } });
    if (req.user.role === 'ALUNO' && eu?.professorId !== pacote.professorId) {
      return res.status(403).json({ error: 'Este pacote é de outro professor.' });
    }
    const existente = await prisma.acessoPacote.findUnique({ where: { alunoId_pacoteId: { alunoId: req.user.id, pacoteId: pacote.id } } }).catch(() => null);
    if (existente?.status === 'LIBERADO' && (!existente.expiresAt || new Date(existente.expiresAt) > new Date())) {
      return res.json({ jaLiberado: true, acesso: existente });
    }
    const professorToken = pacote.professor?.mpAccessToken ? descriptografar(pacote.professor.mpAccessToken) : process.env.MP_ACCESS_TOKEN;
    if (!professorToken) return res.status(400).json({ error: 'Professor sem chave MP configurada.' });
    const diasValidade = Math.min(Math.max(Number(req.body?.diasValidade) || 90, 1), 365);
    const expiresAt = new Date(Date.now() + diasValidade * 86400000);
    const acesso = await prisma.acessoPacote.upsert({
      where: { alunoId_pacoteId: { alunoId: req.user.id, pacoteId: pacote.id } },
      update: { status: 'PENDENTE', expiresAt },
      create: { alunoId: req.user.id, pacoteId: pacote.id, status: 'PENDENTE', expiresAt },
    });
    return res.json({ qrCode: Buffer.from('PIXPAC' + acesso.id).toString('base64'), copiaCola: '000201...' + acesso.id, acesso });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao comprar pacote.' });
  }
};

export const liberarPacote = async (req, res) => {
  try {
    const { alunoId } = req.body;
    if (!alunoId) return res.status(400).json({ error: 'Informe o alunoId.' });
    const { pacote, erro } = await pacoteDoProfessor(req.params.id, req.user);
    if (erro) return res.status(erro === 'Pacote não encontrado.' ? 404 : 403).json({ error: erro });
    const acesso = await prisma.acessoPacote.upsert({
      where: { alunoId_pacoteId: { alunoId, pacoteId: pacote.id } },
      update: { status: 'LIBERADO' },
      create: { alunoId, pacoteId: pacote.id, status: 'LIBERADO' },
    });
    return res.json(acesso);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao liberar pacote.' });
  }
};

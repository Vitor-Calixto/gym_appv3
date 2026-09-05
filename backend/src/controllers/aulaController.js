// backend/src/controllers/aulaController.js — Cap.7 final
import { prisma } from '../config/prisma.js';
import { descriptografar } from '../config/crypto.js';

const CATEGORIAS = ['MUSCULACAO', 'LUTAS_JIU_JITSU', 'LUTAS_MUAY_THAI', 'LUTAS_TAEKWONDO', 'LUTAS_BOXE', 'CARDIO', 'PILATES'];
const ORDEM_FAIXAS = ['BRANCA', 'CINZA', 'AMARELA', 'LARANJA', 'VERDE', 'AZUL', 'ROXA', 'MARROM', 'PRETA'];

function faixaSuficiente(userFaixa, minima) {
  if (!minima) return true;
  if (!userFaixa) return false;
  const u = ORDEM_FAIXAS.indexOf(String(userFaixa).toUpperCase());
  const m = ORDEM_FAIXAS.indexOf(String(minima).toUpperCase());
  if (m === -1) return true;
  if (u === -1) return false;
  return u >= m;
}

export const criarAula = async (req, res) => {
  try {
    const { titulo, descricao, embedUrl, preco, categoria, faixaMinima } = req.body;
    if (!titulo || !embedUrl || preco === undefined) return res.status(400).json({ error: 'Título, embedUrl e preço obrigatórios.' });
    const valor = Number(preco);
    if (!Number.isFinite(valor) || valor <= 0) return res.status(400).json({ error: 'Preço inválido.' });
    const cat = (categoria || 'MUSCULACAO').toUpperCase();
    if (!CATEGORIAS.includes(cat)) return res.status(400).json({ error: 'Categoria inválida.' });
    const aula = await prisma.aulaGravada.create({
      data: {
        titulo: String(titulo).slice(0, 120),
        descricao: descricao ? String(descricao).slice(0, 500) : null,
        embedUrl: String(embedUrl).slice(0, 500),
        preco: valor,
        categoria: cat,
        faixaMinima: faixaMinima ? String(faixaMinima).toUpperCase().slice(0, 20) : null,
        professorId: req.user.id,
      },
    });
    return res.status(201).json(aula);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar aula.' });
  }
};

// Vitrine: nunca expõe embedUrl aqui
export const listarAulas = async (req, res) => {
  try {
    const { categoria } = req.query;
    const aulas = await prisma.aulaGravada.findMany({
      where: categoria ? { categoria: String(categoria).toUpperCase() } : {},
      select: { id: true, titulo: true, descricao: true, preco: true, categoria: true, faixaMinima: true, createdAt: true, professor: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(aulas);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao listar aulas.' });
  }
};

// Só o que o aluno liberou (com embed) — expira automaticamente
export const minhasAulas = async (req, res) => {
  try {
    await prisma.acessoAula.updateMany({
      where: { alunoId: req.user.id, status: 'LIBERADO', expiresAt: { lt: new Date() } },
      data: { status: 'REVOGADO' },
    });
    const acessos = await prisma.acessoAula.findMany({
      where: { alunoId: req.user.id, status: 'LIBERADO' },
      include: { aula: true },
    });
    const validos = acessos.filter((a) => !a.expiresAt || new Date(a.expiresAt) > new Date());
    return res.json(validos);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao buscar acessos.' });
  }
};

export const comprarAula = async (req, res) => {
  try {
    const aula = await prisma.aulaGravada.findUnique({ where: { id: req.params.id }, include: { professor: true } });
    if (!aula) return res.status(404).json({ error: 'Aula não encontrada.' });
    const eu = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: { faixa: true } });
    if (!faixaSuficiente(eu?.faixa, aula.faixaMinima)) return res.status(403).json({ error: 'Faixa mínima não atingida para esta aula.' });

    const existente = await prisma.acessoAula.findUnique({ where: { alunoId_aulaId: { alunoId: req.user.id, aulaId: aula.id } } }).catch(() => null);
    if (existente?.status === 'LIBERADO' && (!existente.expiresAt || new Date(existente.expiresAt) > new Date())) {
      return res.json({ jaLiberado: true, acesso: existente });
    }

    // Split: confirma que o professor tem chave (descriptografa só em RAM, nunca expõe)
    const professorToken = aula.professor?.mpAccessToken ? descriptografar(aula.professor.mpAccessToken) : process.env.MP_ACCESS_TOKEN;
    if (!professorToken) return res.status(400).json({ error: 'Professor sem chave MP configurada.' });

    const diasValidade = Math.min(Math.max(Number(req.body?.diasValidade) || 30, 1), 365);
    const expiresAt = new Date(Date.now() + diasValidade * 86400000);
    const acesso = await prisma.acessoAula.upsert({
      where: { alunoId_aulaId: { alunoId: req.user.id, aulaId: aula.id } },
      update: { status: 'PENDENTE', expiresAt },
      create: { alunoId: req.user.id, aulaId: aula.id, status: 'PENDENTE', expiresAt },
    });
    // PIX mock — em produção chama MP com professorToken aqui
    return res.json({ qrCode: Buffer.from('PIX' + acesso.id).toString('base64'), copiaCola: '000201...' + acesso.id, acesso });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao comprar aula.' });
  }
};

// Liberação manual pelo professor dono ou admin (ex.: após confirmar PIX)
export const liberarAcesso = async (req, res) => {
  try {
    const { alunoId, acessoId } = req.body;
    const aula = await prisma.aulaGravada.findUnique({ where: { id: req.params.id } });
    if (!aula) return res.status(404).json({ error: 'Aula não encontrada.' });
    if (req.user.role !== 'ADMIN' && aula.professorId !== req.user.id) return res.status(403).json({ error: 'Acesso negado.' });
    let acesso;
    if (acessoId) {
      acesso = await prisma.acessoAula.update({ where: { id: acessoId }, data: { status: 'LIBERADO' } });
    } else if (alunoId) {
      acesso = await prisma.acessoAula.upsert({
        where: { alunoId_aulaId: { alunoId, aulaId: aula.id } },
        update: { status: 'LIBERADO' },
        create: { alunoId, aulaId: aula.id, status: 'LIBERADO' },
      });
    } else return res.status(400).json({ error: 'Informe alunoId ou acessoId.' });
    return res.json(acesso);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao liberar acesso.' });
  }
};

export const deletarAula = async (req, res) => {
  try {
    const aula = await prisma.aulaGravada.findUnique({ where: { id: req.params.id } });
    if (!aula) return res.status(404).json({ error: 'Aula não encontrada.' });
    if (req.user.role !== 'ADMIN' && aula.professorId !== req.user.id) return res.status(403).json({ error: 'Acesso negado.' });
    await prisma.aulaGravada.delete({ where: { id: req.params.id } });
    return res.json({ sucesso: true });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao excluir aula.' });
  }
};

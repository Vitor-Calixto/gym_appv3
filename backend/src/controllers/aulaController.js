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
    const { titulo, descricao, embedUrl, preco, categoria, faixaMinima, gratuita, secao, ordem } = req.body;
    if (!titulo || !embedUrl || preco === undefined) return res.status(400).json({ error: 'Título, embedUrl e preço obrigatórios.' });
    const valor = Number(preco);
    if (!Number.isFinite(valor) || valor < 0) return res.status(400).json({ error: 'Preço inválido.' });
    if (valor === 0 && !gratuita) return res.status(400).json({ error: 'Preço zero só para aula gratuita.' });
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
        gratuita: !!gratuita,
        secao: secao ? String(secao).slice(0, 60) : null,
        ordem: Number.isFinite(Number(ordem)) ? Number(ordem) : 0,
        professorId: req.user.id,
      },
    });
    return res.status(201).json(aula);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar aula.' });
  }
};

export const atualizarAula = async (req, res) => {
  try {
    const aula = await prisma.aulaGravada.findUnique({ where: { id: req.params.id } });
    if (!aula) return res.status(404).json({ error: 'Aula não encontrada.' });
    if (req.user.role !== 'ADMIN' && aula.professorId !== req.user.id) return res.status(403).json({ error: 'Acesso negado.' });
    const { titulo, descricao, embedUrl, preco, categoria, faixaMinima, gratuita, secao, ordem } = req.body;
    const data = {};
    if (titulo !== undefined) data.titulo = String(titulo).slice(0, 120);
    if (descricao !== undefined) data.descricao = descricao ? String(descricao).slice(0, 500) : null;
    if (embedUrl !== undefined) data.embedUrl = String(embedUrl).slice(0, 500);
    if (preco !== undefined) {
      const valor = Number(preco);
      if (!Number.isFinite(valor) || valor < 0) return res.status(400).json({ error: 'Preço inválido.' });
      data.preco = valor;
    }
    if (categoria !== undefined) {
      const cat = String(categoria).toUpperCase();
      if (!CATEGORIAS.includes(cat)) return res.status(400).json({ error: 'Categoria inválida.' });
      data.categoria = cat;
    }
    if (faixaMinima !== undefined) data.faixaMinima = faixaMinima ? String(faixaMinima).toUpperCase().slice(0, 20) : null;
    if (gratuita !== undefined) data.gratuita = !!gratuita;
    if (secao !== undefined) data.secao = secao ? String(secao).slice(0, 60) : null;
    if (ordem !== undefined) data.ordem = Number.isFinite(Number(ordem)) ? Number(ordem) : 0;
    const atualizada = await prisma.aulaGravada.update({ where: { id: req.params.id }, data });
    return res.json(atualizada);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao atualizar aula.' });
  }
};

// Vitrine: nunca expõe embedUrl aqui. Aluno vê catálogo do PRÓPRIO professor (+ gratuitas dele); professor vê o próprio; admin vê tudo
export const listarAulas = async (req, res) => {
  try {
    const { categoria, professorId } = req.query;
    const where = {};
    if (categoria) where.categoria = String(categoria).toUpperCase();
    if (req.user.role === 'ADMIN' && professorId) {
      where.professorId = String(professorId);
    } else if (req.user.role === 'PROFESSOR') {
      where.professorId = req.user.id;
    } else {
      // Aluno: catálogo do próprio professor (organização dele) + nada global pago
      const eu = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: { professorId: true } });
      if (!eu?.professorId) return res.json([]);
      where.professorId = eu.professorId;
    }
    const aulas = await prisma.aulaGravada.findMany({
      where,
      select: { id: true, titulo: true, descricao: true, preco: true, categoria: true, faixaMinima: true, gratuita: true, secao: true, ordem: true, createdAt: true, professor: { select: { id: true, nome: true } } },
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    });
    return res.json(aulas);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao listar aulas.' });
  }
};

// Só o que o aluno liberou (com embed) — expira automaticamente; inclui aulas de pacotes LIBERADOS
export const minhasAulas = async (req, res) => {
  try {
    const agora = new Date();
    await prisma.acessoAula.updateMany({
      where: { alunoId: req.user.id, status: 'LIBERADO', expiresAt: { lt: agora } },
      data: { status: 'REVOGADO' },
    });
    await prisma.acessoPacote.updateMany({
      where: { alunoId: req.user.id, status: 'LIBERADO', expiresAt: { lt: agora } },
      data: { status: 'REVOGADO' },
    });
    const acessos = await prisma.acessoAula.findMany({
      where: { alunoId: req.user.id, status: 'LIBERADO' },
      include: { aula: true },
    });
    const pacotes = await prisma.acessoPacote.findMany({
      where: { alunoId: req.user.id, status: 'LIBERADO' },
      include: { pacote: { include: { itens: { include: { aula: true }, orderBy: { ordem: 'asc' } } } } },
    });
    const validos = acessos.filter((a) => !a.expiresAt || new Date(a.expiresAt) > agora);
    const viaPacote = [];
    for (const ap of pacotes) {
      if (ap.expiresAt && new Date(ap.expiresAt) <= agora) continue;
      for (const item of ap.pacote.itens) {
        viaPacote.push({ id: `pac-${ap.id}-${item.aula.id}`, alunoId: req.user.id, aulaId: item.aula.id, status: 'LIBERADO', expiresAt: ap.expiresAt, viaPacote: ap.pacote.titulo, aula: item.aula });
      }
    }
    return res.json([...validos, ...viaPacote]);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao buscar acessos.' });
  }
};

// Acessos PENDENTES de um professor (para ele liberar após confirmar PIX)
export const acessosPendentes = async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? { status: 'PENDENTE' } : { status: 'PENDENTE', aula: { professorId: req.user.id } };
    const acessos = await prisma.acessoAula.findMany({
      where,
      include: { aula: { select: { id: true, titulo: true, preco: true } }, aluno: { select: { id: true, nome: true, email: true, whatsapp: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json(acessos);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao listar pendentes.' });
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

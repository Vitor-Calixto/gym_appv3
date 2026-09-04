import { prisma } from '../config/prisma.js';

export const criarTreino = async (req, res) => {
  try {
    const { nome, descricao, alunoId, itens } = req.body;
    if (!nome || !itens || !itens.length) return res.status(400).json({ error: 'Nome e itens obrigatórios.' });
    const isTemplate = !alunoId;
    const novoTreino = await prisma.treino.create({
      data: {
        nome,
        descricao: descricao || null,
        alunoId: alunoId || null,
        professorId: req.user.id,
        isTemplate,
        itens: {
          create: itens.map((item) => ({
            exercicioId: item.exercicioId,
            series: Number(item.series || item.qtd_series || 3),
            repeticoes: String(item.repeticoes || item.reps || '12'),
            descansoSeg: Number(item.descansoSeg || item.descanso_segundos || 60),
            observacoes: item.observacoes || null,
          })),
        },
      },
      include: { itens: { include: { exercicio: true } } },
    });
    return res.status(201).json(novoTreino);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao cadastrar a ficha de treino.' });
  }
};

export const listarTreinosAluno = async (req, res) => {
  try {
    const alunoId = req.params.alunoId || req.user.id;
    // Professor vê templates + treinos do aluno
    const where = req.user.role === 'PROFESSOR' && req.params.alunoId ? { alunoId } : { alunoId };
    // Se aluno logado, vê seus + templates disponíveis
    let treinos;
    if (req.user.role === 'ALUNO' && !req.params.alunoId) {
      treinos = await prisma.treino.findMany({
        where: { OR: [{ alunoId }, { isTemplate: true }] },
        include: { itens: { include: { exercicio: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      treinos = await prisma.treino.findMany({
        where,
        include: { itens: { include: { exercicio: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    return res.json(treinos);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar os treinos.' });
  }
};

export const listarTemplates = async (req, res) => {
  try {
    const templates = await prisma.treino.findMany({
      where: { isTemplate: true },
      include: { itens: { include: { exercicio: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(templates);
  } catch (e) { return res.status(500).json({ error: 'Erro.' }); }
};

export const clonarTreino = async (req, res) => {
  try {
    const { id } = req.params;
    const { alunoId } = req.body;
    if (!alunoId) return res.status(400).json({ error: 'alunoId obrigatório.' });
    const original = await prisma.treino.findUnique({ where: { id }, include: { itens: true } });
    if (!original) return res.status(404).json({ error: 'Template não encontrado.' });
    const clone = await prisma.treino.create({
      data: {
        nome: original.nome,
        descricao: original.descricao,
        alunoId,
        professorId: req.user.id,
        isTemplate: false,
        itens: { create: original.itens.map(i => ({ exercicioId: i.exercicioId, series: i.series, repeticoes: i.repeticoes, descansoSeg: i.descansoSeg, observacoes: i.observacoes })) }
      },
      include: { itens: { include: { exercicio: true } } }
    });
    return res.status(201).json(clone);
  } catch (e) { return res.status(500).json({ error: 'Erro ao clonar.' }); }
};

export const obterTreinoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const treino = await prisma.treino.findUnique({ where: { id }, include: { itens: { include: { exercicio: true } }, aluno: true } });
    if (!treino) return res.status(404).json({ error: 'Treino não encontrado.' });
    // Templates são públicos para qualquer logado; treinos com aluno só dono/professor/admin
    if (!treino.isTemplate && treino.alunoId !== req.user.id && !['PROFESSOR','ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    return res.json(treino);
  } catch (e) { return res.status(500).json({ error: 'Erro.' }); }
};

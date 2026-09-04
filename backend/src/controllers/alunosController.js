import { prisma } from '../config/prisma.js';

export const listarAlunos = async (req, res) => {
  try {
    if (!['PROFESSOR','ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Apenas professor/admin.' });
    const where = { role: 'ALUNO' };
    if (req.user.role === 'PROFESSOR') where.professorId = req.user.id;
    const alunos = await prisma.usuario.findMany({
      where,
      select: { id: true, nome: true, email: true, professorId: true, createdAt: true, anamnese: true },
      orderBy: { nome: 'asc' }
    });
    // Enriquece com status baseado em treinos
    const comTreinos = await prisma.treino.findMany({ where: { alunoId: { in: alunos.map(a=>a.id) } }, select: { alunoId: true } });
    const idsComTreino = new Set(comTreinos.map(t=>t.alunoId));
    const enriched = alunos.map(a => ({ ...a, status: idsComTreino.has(a.id) ? 'Ativo' : 'Sem treino', temAnamnese: !!a.anamnese }));
    return res.json(enriched);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao listar alunos.' });
  }
};

export const obterAluno = async (req, res) => {
  try {
    const { id } = req.params;
    const aluno = await prisma.usuario.findUnique({ where: { id }, include: { anamnese: true, treinos: { include: { itens: { include: { exercicio: true } } } } } });
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado.' });
    if (req.user.role === 'PROFESSOR' && aluno.professorId !== req.user.id) return res.status(403).json({ error: 'Acesso negado.' });
    return res.json(aluno);
  } catch (e) { return res.status(500).json({ error: 'Erro.' }); }
};

export const vincularAluno = async (req, res) => {
  try {
    const { alunoId } = req.body;
    if (!alunoId) return res.status(400).json({ error: 'alunoId obrigatório.' });
    const aluno = await prisma.usuario.update({ where: { id: alunoId }, data: { professorId: req.user.id } });
    return res.json({ sucesso: true, aluno });
  } catch (e) { return res.status(500).json({ error: 'Erro ao vincular.' }); }
};

export const desvincularAluno = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.usuario.update({ where: { id }, data: { professorId: null } });
    return res.json({ sucesso: true });
  } catch (e) { return res.status(500).json({ error: 'Erro.' }); }
};

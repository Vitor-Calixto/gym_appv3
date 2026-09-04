import { prisma } from '../config/prisma.js';

export const listarAgenda = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'PROFESSOR') where.professorId = req.user.id;
    if (req.user.role === 'ALUNO') where.alunoId = req.user.id;
    const agendas = await prisma.agenda.findMany({
      where,
      include: { aluno: { select: { nome: true, email: true } }, professor: { select: { nome: true } } },
      orderBy: { data: 'asc' }
    });
    return res.json(agendas);
  } catch (e) { return res.status(500).json({ error: 'Erro ao listar agenda.' }); }
};

export const criarAgenda = async (req, res) => {
  try {
    const { alunoId, titulo, tipo, data, duracaoMin } = req.body;
    if (!titulo || !data) return res.status(400).json({ error: 'Título e data obrigatórios.' });
    const agenda = await prisma.agenda.create({
      data: {
        professorId: req.user.id,
        alunoId: alunoId || null,
        titulo, tipo: tipo || 'AVALIACAO',
        data: new Date(data),
        duracaoMin: duracaoMin ? Number(duracaoMin) : 60
      }
    });
    return res.status(201).json(agenda);
  } catch (e) { console.error(e); return res.status(500).json({ error: 'Erro ao criar.' }); }
};

export const atualizarAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, titulo, data } = req.body;
    const agenda = await prisma.agenda.update({ where: { id }, data: { status, titulo, data: data ? new Date(data) : undefined } });
    return res.json(agenda);
  } catch (e) { return res.status(500).json({ error: 'Erro ao atualizar.' }); }
};

export const deletarAgenda = async (req, res) => {
  try {
    await prisma.agenda.delete({ where: { id: req.params.id } });
    return res.json({ sucesso: true });
  } catch (e) { return res.status(500).json({ error: 'Erro ao deletar.' }); }
};

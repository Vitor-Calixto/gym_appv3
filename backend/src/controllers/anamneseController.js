import { prisma } from '../config/prisma.js';

export const salvarAnamnese = async (req, res) => {
  try {
    const alunoId = req.user.id;
    const { peso, altura, objetivo, lesoes, respostas } = req.body;
    const payload = respostas || { peso, altura, objetivo, lesoes };
    if (!payload.peso && !payload.altura) return res.status(400).json({ error: 'Peso e altura obrigatórios.' });

    const anamnese = await prisma.anamnese.upsert({
      where: { alunoId },
      update: { respostas: payload },
      create: { alunoId, respostas: payload }
    });
    return res.json({ sucesso: true, anamnese });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao salvar anamnese.' });
  }
};

export const obterAnamnese = async (req, res) => {
  try {
    const alunoId = req.params.alunoId || req.user.id;
    // Professor pode ver anamnese de seu aluno
    if (alunoId !== req.user.id && req.user.role === 'ALUNO') return res.status(403).json({ error: 'Acesso negado.' });
    const anamnese = await prisma.anamnese.findUnique({ where: { alunoId } });
    return res.json(anamnese || null);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao buscar anamnese.' });
  }
};

export const listarAnamneses = async (req, res) => {
  try {
    if (!['PROFESSOR','ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Apenas professor.' });
    const anamneses = await prisma.anamnese.findMany({
      include: { aluno: { select: { id: true, nome: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    // Filtra apenas alunos do professor logado (se não admin)
    let filtradas = anamneses;
    if (req.user.role === 'PROFESSOR') {
      const alunos = await prisma.usuario.findMany({ where: { professorId: req.user.id }, select: { id: true } });
      const ids = new Set(alunos.map(a=>a.id));
      filtradas = anamneses.filter(a => ids.has(a.alunoId));
    }
    return res.json(filtradas);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao listar.' });
  }
};

import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';

// Professor/Admin cadastra aluno já vinculado (sem trocar a sessão de quem cadastrou)
export const cadastrarAluno = async (req, res) => {
  try {
    const { nome, email, senha, whatsapp } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) return res.status(409).json({ error: 'E-mail já cadastrado.' });
    // Professor vincula a si; ADMIN pode informar professorId ou deixar sem vínculo
    let professorId = null;
    if (req.user.role === 'PROFESSOR') professorId = req.user.id;
    else if (req.body.professorId) {
      const professor = await prisma.usuario.findUnique({ where: { id: req.body.professorId } });
      if (!professor || !['PROFESSOR', 'ADMIN'].includes(professor.role)) return res.status(400).json({ error: 'Professor inválido.' });
      professorId = req.body.professorId;
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    const aluno = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, role: 'ALUNO', professorId, whatsapp: whatsapp || null },
      select: { id: true, nome: true, email: true, role: true, professorId: true, whatsapp: true },
    });
    return res.status(201).json(aluno);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao cadastrar aluno.' });
  }
};

export const listarAlunos = async (req, res) => {
  try {
    if (!['PROFESSOR','ADMIN'].includes(req.user.role)) return res.status(403).json({ error: 'Apenas professor/admin.' });
    const where = { role: 'ALUNO' };
    if (req.user.role === 'PROFESSOR') where.professorId = req.user.id;
    const alunos = await prisma.usuario.findMany({
      where,
      select: { id: true, nome: true, email: true, professorId: true, telefone: true, whatsapp: true, fotoUrl: true, createdAt: true, anamnese: true },
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

import crypto from 'crypto';
import { prisma } from '../config/prisma.js';

export const convidar = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail obrigatório.' });
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7*24*60*60*1000);
    const convite = await prisma.convite.create({
      data: { professorId: req.user.id, alunoEmail: email, token, expiresAt }
    });
    // Em produção envia email com nodemailer
    console.log(`[Convite] ${req.user.id} -> ${email} token ${token}`);
    return res.status(201).json(convite);
  } catch (e) { console.error(e); return res.status(500).json({ error: 'Erro ao convidar.' }); }
};

export const listarConvites = async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : req.user.role === 'PROFESSOR' ? { professorId: req.user.id } : { alunoEmail: req.user.email };
    const convites = await prisma.convite.findMany({ where, orderBy: { createdAt: 'desc' }, include: { professor: { select: { nome: true, email: true } } } });
    return res.json(convites);
  } catch (e) { return res.status(500).json({ error: 'Erro.' }); }
};

export const aceitar = async (req, res) => {
  try {
    const { token } = req.params;
    const convite = await prisma.convite.findUnique({ where: { token } });
    if (!convite || convite.expiresAt < new Date()) return res.status(400).json({ error: 'Convite inválido ou expirado.' });
    if (convite.status !== 'PENDENTE') return res.status(400).json({ error: 'Convite já utilizado.' });
    // Convite por e-mail: só o dono do e-mail aceita. Link genérico (alunoEmail vazio): qualquer ALUNO.
    if (convite.alunoEmail) {
      if (convite.alunoEmail !== req.user.email) return res.status(403).json({ error: 'Convite não é para seu e-mail.' });
    } else if (req.user.role !== 'ALUNO') {
      return res.status(403).json({ error: 'Este link é para cadastro de alunos.' });
    }
    await prisma.usuario.update({ where: { id: req.user.id }, data: { professorId: convite.professorId } });
    await prisma.convite.update({ where: { id: convite.id }, data: { status: 'ACEITO', alunoId: req.user.id, alunoEmail: req.user.email } });
    return res.json({ sucesso: true });
  } catch (e) { return res.status(500).json({ error: 'Erro ao aceitar.' }); }
};

export const recusar = async (req, res) => {
  try {
    const { token } = req.params;
    await prisma.convite.update({ where: { token }, data: { status: 'RECUSADO' } });
    return res.json({ sucesso: true });
  } catch (e) { return res.status(500).json({ error: 'Erro.' }); }
};

export const gerarLink = async (req,res)=>{
  try {
    const token=crypto.randomBytes(16).toString('hex');
    const convite=await prisma.convite.create({data:{professorId:req.user.id, alunoEmail:'', token, expiresAt:new Date(Date.now()+30*24*60*60*1000)}});
    const base=(process.env.CLIENT_URL || '').replace(/\/$/,'') || `${req.protocol}://${req.get('host')}`;
    const link=`${base}/cadastro/cadastro.html?convite=${token}`;
    return res.json({link, token});
  } catch (e) { console.error(e); return res.status(500).json({ error: 'Erro ao gerar link.' }); }
};

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';

export const cadastro = async (req, res) => {
  try {
    const { nome, email, senha, role, professorId } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) return res.status(409).json({ error: 'E-mail já cadastrado.' });
    const roleValida = ['ADMIN', 'PROFESSOR', 'ALUNO'].includes(role) ? role : 'ALUNO';
    if (roleValida === 'ALUNO' && professorId) {
      const professor = await prisma.usuario.findUnique({ where: { id: professorId } });
      if (!professor || !['PROFESSOR', 'ADMIN'].includes(professor.role)) return res.status(400).json({ error: 'Professor vinculado não encontrado.' });
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, role: roleValida, professorId: roleValida === 'ALUNO' ? professorId || null : null },
      select: { id: true, nome: true, email: true, role: true, professorId: true },
    });
    const token = jwt.sign({ id: usuario.id, role: usuario.role, nome: usuario.nome }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });
    return res.status(201).json({ token, usuario });
  } catch (error) {
    console.error('Erro cadastro:', error);
    return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    const token = jwt.sign({ id: usuario.id, role: usuario.role, nome: usuario.nome }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });
    return res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno durante a autenticação.' });
  }
};

export const me = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: { id: true, nome: true, email: true, role: true, professorId: true } });
    return res.json(usuario);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar os dados do perfil.' });
  }
};

export const esqueciSenha = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail obrigatório.' });
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    // Sempre retorna sucesso para não vazar emails existentes
    if (!usuario) return res.json({ sucesso: true, mensagem: 'Se o e-mail existir, instruções foram enviadas.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60*60*1000); // 1h

    await prisma.usuario.update({ where: { id: usuario.id }, data: { resetToken: token, resetTokenExpires: expires } });

    // Tenta enviar email se SMTP configurado, senão apenas loga
    if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.example.com') {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        const link = `${process.env.CLIENT_URL || 'http://localhost:5000'}/alterar-senha/alterar-senha.html?token=${token}`;
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: 'Recuperação de senha - Calixto OmniSystem',
          html: `<p>Você solicitou recuperação de senha.</p><p><a href="${link}">Clique aqui para redefinir</a> (expira em 1h)</p>`
        });
      } catch (mailErr) { console.error('Erro envio email:', mailErr.message); }
    } else {
      console.log(`[DEV] Token recuperação para ${email}: ${token}`);
    }

    return res.json({ sucesso: true, mensagem: 'Instruções enviadas para o e-mail.', token_dev: process.env.NODE_ENV !== 'production' ? token : undefined });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao processar solicitação.' });
  }
};

export const redefinirSenha = async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) return res.status(400).json({ error: 'Token e nova senha obrigatórios.' });
    const usuario = await prisma.usuario.findFirst({ where: { resetToken: token } });
    if (!usuario || !usuario.resetTokenExpires || usuario.resetTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }
    const hash = await bcrypt.hash(novaSenha, 10);
    await prisma.usuario.update({ where: { id: usuario.id }, data: { senha: hash, resetToken: null, resetTokenExpires: null } });
    return res.json({ sucesso: true, mensagem: 'Senha redefinida com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
};

export const alterarSenha = async (req, res) => {
  try {
    const { novaSenha, senhaAtual } = req.body;
    if (!novaSenha) return res.status(400).json({ error: 'Nova senha obrigatória.' });
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    if (senhaAtual && !(await bcrypt.compare(senhaAtual, usuario.senha))) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }
    const hash = await bcrypt.hash(novaSenha, 10);
    await prisma.usuario.update({ where: { id: usuario.id }, data: { senha: hash } });
    return res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
};

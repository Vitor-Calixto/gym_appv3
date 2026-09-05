import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma.js';
import { meCompleto, salvarConfig, removerChave } from '../controllers/usuariosController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = Router();
router.get('/me', authMiddleware, meCompleto);
router.put('/config', authMiddleware, salvarConfig);
router.delete('/config/mp', authMiddleware, removerChave);

// Upload de foto de perfil (professor/admin pode enviar para um aluno via ?alunoId=)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `foto-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Apenas imagens.'))),
});

router.post('/foto', authMiddleware, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo.' });
    const url = `/uploads/${req.file.filename}`;
    // Professor/admin pode definir foto de um aluno; demais, só a própria
    let alvoId = req.user.id;
    if (req.query.alunoId && ['PROFESSOR', 'ADMIN'].includes(req.user.role)) alvoId = String(req.query.alunoId);
    if (alvoId !== req.user.id) {
      const alvo = await prisma.usuario.findUnique({ where: { id: alvoId }, select: { professorId: true } });
      if (!alvo) return res.status(404).json({ error: 'Aluno não encontrado.' });
      if (req.user.role === 'PROFESSOR' && alvo.professorId !== req.user.id) return res.status(403).json({ error: 'Acesso negado.' });
    }
    await prisma.usuario.update({ where: { id: alvoId }, data: { fotoUrl: url } });
    return res.json({ fotoUrl: url });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no upload.' });
  }
});

// Professor/admin atualiza whatsapp de um aluno
router.put('/:id/whatsapp', authMiddleware, roleMiddleware(['PROFESSOR', 'ADMIN']), async (req, res) => {
  try {
    const alvo = await prisma.usuario.findUnique({ where: { id: req.params.id }, select: { professorId: true } });
    if (!alvo) return res.status(404).json({ error: 'Não encontrado.' });
    if (req.user.role === 'PROFESSOR' && alvo.professorId !== req.user.id) return res.status(403).json({ error: 'Acesso negado.' });
    const whatsapp = String(req.body?.whatsapp || '').slice(0, 20) || null;
    await prisma.usuario.update({ where: { id: req.params.id }, data: { whatsapp } });
    return res.json({ sucesso: true, whatsapp });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao salvar whatsapp.' });
  }
});

export default router;

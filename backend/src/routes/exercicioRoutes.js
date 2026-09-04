import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { listarExercicios, criarExercicio, atualizarExercicio, deletarExercicio } from '../controllers/exercicioController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = Router();

// Multer para gifs
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 8*1024*1024 }, fileFilter: (req,file,cb) => {
  if (!file.mimetype.startsWith('image/')) return cb(new Error('Apenas imagens'), false);
  cb(null, true);
}});

router.get('/', authMiddleware, listarExercicios);
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'PROFESSOR']), criarExercicio);
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'PROFESSOR']), upload.fields([{ name: 'gifInicio', maxCount: 1 }, { name: 'gifFim', maxCount: 1 }]), atualizarExercicio);
router.patch('/:id', authMiddleware, roleMiddleware(['ADMIN', 'PROFESSOR']), upload.fields([{ name: 'gifInicio', maxCount: 1 }, { name: 'gifFim', maxCount: 1 }]), atualizarExercicio);
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), deletarExercicio);

// Upload genérico para admin-painel
router.post('/upload', authMiddleware, roleMiddleware(['ADMIN','PROFESSOR']), upload.single('arquivo'), (req,res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo.' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

export default router;

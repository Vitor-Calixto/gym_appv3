import { Router } from 'express';
import { salvarAnamnese, obterAnamnese, listarAnamneses } from '../controllers/anamneseController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
router.post('/', authMiddleware, salvarAnamnese);
router.get('/', authMiddleware, listarAnamneses);
router.get('/:alunoId', authMiddleware, obterAnamnese);
router.get('/me/dados', authMiddleware, obterAnamnese);

export default router;

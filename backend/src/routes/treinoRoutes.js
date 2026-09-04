import { Router } from 'express';
import { criarTreino, listarTreinosAluno, listarTemplates, clonarTreino, obterTreinoPorId } from '../controllers/treinoController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = Router();
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'PROFESSOR']), criarTreino);
router.get('/templates', authMiddleware, listarTemplates);
router.get('/aluno', authMiddleware, listarTreinosAluno);
router.get('/aluno/:alunoId', authMiddleware, listarTreinosAluno);
router.get('/:id', authMiddleware, obterTreinoPorId);
router.post('/:id/clonar', authMiddleware, roleMiddleware(['ADMIN','PROFESSOR']), clonarTreino);

export default router;

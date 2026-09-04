import { Router } from 'express';
import { listarAlunos, obterAluno, vincularAluno, desvincularAluno } from '../controllers/alunosController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = Router();
router.get('/', authMiddleware, roleMiddleware(['ADMIN','PROFESSOR']), listarAlunos);
router.get('/:id', authMiddleware, obterAluno);
router.post('/vincular', authMiddleware, roleMiddleware(['ADMIN','PROFESSOR']), vincularAluno);
router.delete('/:id/vinculo', authMiddleware, roleMiddleware(['ADMIN','PROFESSOR']), desvincularAluno);

export default router;

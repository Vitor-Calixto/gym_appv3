import { Router } from 'express';
import { listarAlunos, obterAluno, vincularAluno, desvincularAluno, cadastrarAluno } from '../controllers/alunosController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = Router();
router.post('/', authMiddleware, roleMiddleware(['ADMIN','PROFESSOR']), cadastrarAluno);
router.get('/', authMiddleware, roleMiddleware(['ADMIN','PROFESSOR']), listarAlunos);
router.get('/:id', authMiddleware, obterAluno);
router.post('/vincular', authMiddleware, roleMiddleware(['ADMIN','PROFESSOR']), vincularAluno);
router.delete('/:id/vinculo', authMiddleware, roleMiddleware(['ADMIN','PROFESSOR']), desvincularAluno);

export default router;

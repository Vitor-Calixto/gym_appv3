import { Router } from 'express';
import { listarAgenda, criarAgenda, atualizarAgenda, deletarAgenda } from '../controllers/agendaController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
router.get('/', authMiddleware, listarAgenda);
router.post('/', authMiddleware, criarAgenda);
router.put('/:id', authMiddleware, atualizarAgenda);
router.delete('/:id', authMiddleware, deletarAgenda);

export default router;

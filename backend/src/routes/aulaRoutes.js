import { Router } from 'express';
import { criarAula, listarAulas, comprarAula } from '../controllers/aulaController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
const router = Router();
router.get('/', authMiddleware, listarAulas);
router.post('/', authMiddleware, roleMiddleware(['PROFESSOR','ADMIN']), criarAula);
router.post('/:id/comprar', authMiddleware, comprarAula);
export default router;

import { Router } from 'express';
import { convidar, listarConvites, aceitar, recusar, gerarLink } from '../controllers/conviteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = Router();
router.post('/convidar', authMiddleware, roleMiddleware(['PROFESSOR','ADMIN']), convidar);
router.get('/', authMiddleware, listarConvites);
router.post('/aceitar/:token', authMiddleware, aceitar);
router.post('/recusar/:token', authMiddleware, recusar);
router.post('/link', authMiddleware, roleMiddleware(['PROFESSOR','ADMIN']), gerarLink);

export default router;
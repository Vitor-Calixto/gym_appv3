import { Router } from 'express';
import { convidar, listarConvites, aceitar, recusar } from '../controllers/conviteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = Router();
router.post('/convidar', authMiddleware, roleMiddleware(['PROFESSOR','ADMIN']), convidar);
router.get('/', authMiddleware, listarConvites);
router.post('/aceitar/:token', authMiddleware, aceitar);
router.post('/recusar/:token', authMiddleware, recusar);

export default router;

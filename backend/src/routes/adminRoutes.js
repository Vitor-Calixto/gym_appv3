import { Router } from 'express';
import { listarTodosUsuarios, atualizarUsuarioAdmin, listarTodasFaturas, atualizarFaturaAdmin, resumoAdmin } from '../controllers/adminController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = Router();
router.use(authMiddleware, roleMiddleware(['ADMIN']));
router.get('/usuarios', listarTodosUsuarios);
router.put('/usuarios/:id', atualizarUsuarioAdmin);
router.get('/faturas', listarTodasFaturas);
router.put('/faturas/:id', atualizarFaturaAdmin);
router.get('/resumo', resumoAdmin);

export default router;

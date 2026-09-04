import { Router } from 'express';
import { cadastro, login, me, esqueciSenha, redefinirSenha, alterarSenha } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
router.post('/cadastro', cadastro);
router.post('/login', login);
router.post('/esqueci-senha', esqueciSenha);
router.post('/redefinir-senha', redefinirSenha);
router.put('/alterar-senha', authMiddleware, alterarSenha);
router.get('/me', authMiddleware, me);

export default router;

import { Router } from 'express';
import { listarFaturas, criarCheckout, webhookMercadoPago, atualizarFatura } from '../controllers/financeiroController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';

const router = Router();
router.get('/', authMiddleware, listarFaturas);
router.post('/checkout', authMiddleware, criarCheckout);
router.post('/webhook', webhookMercadoPago); // público para Mercado Pago
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN','PROFESSOR']), atualizarFatura);

export default router;

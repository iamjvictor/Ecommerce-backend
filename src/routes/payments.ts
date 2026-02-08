import { Router } from 'express';
import { PaymentController } from '../controllers/payments';
import { validate } from '../middleware/validate';
import { createPaymentSchema } from '../schemas/payment';

const router = Router();
const controller = new PaymentController();

// POST /api/payments/create - Criar pagamento (PIX ou Cartão)
// Público: não requer autenticação (cliente faz checkout sem login)
router.post('/create', validate(createPaymentSchema), (req, res) => controller.create(req, res));

export default router;

import { Router } from 'express';
import { PaymentsController } from '../controllers/payments';
import { authMiddleware } from '../lib/authMiddleware';
import { validate } from '../middleware/validate';
import { createPaymentSchema, paymentIdSchema } from '../schemas/payments';

const router = Router();
const controller = new PaymentsController();

router.use(authMiddleware);

router.post('/', validate(createPaymentSchema), controller.create);
router.post('/:id/confirm', validate(paymentIdSchema), controller.confirm);
router.get('/:id', validate(paymentIdSchema), controller.getById);

export default router;

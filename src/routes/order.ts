import { Router } from 'express';
import { OrdersController } from '../controllers/orders';
import { authMiddleware } from '../lib/authMiddleware';
import { validate } from '../middleware/validate';
import { createOrderSchema, orderIdSchema } from '../schemas/orders';

const router = Router();
const controller = new OrdersController();

router.use(authMiddleware);

router.get('/', controller.list);
router.get('/:id', validate(orderIdSchema), controller.getById);
router.post('/', validate(createOrderSchema), controller.create);

export default router;

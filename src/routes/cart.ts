import { Router } from 'express';
import { CartController } from '../controllers/cart';
import { authMiddleware } from '../lib/authMiddleware';
import { validate } from '../middleware/validate';
import { addItemSchema, updateItemSchema, itemIdSchema } from '../schemas/cart';

const router = Router();
const controller = new CartController();

router.use(authMiddleware);

router.get('/', controller.get);
router.post('/items', validate(addItemSchema), controller.addItem);
router.put('/items/:id', validate(updateItemSchema), controller.updateItem);
router.delete('/items/:id', validate(itemIdSchema), controller.removeItem);

export default router;

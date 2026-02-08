import { Router } from 'express';
import { ProductsController } from '../controllers/products';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema, productIdSchema } from '../schemas/products';

const router = Router();
const controller = new ProductsController();

router.get('/', controller.list);
router.get('/:id', validate(productIdSchema), controller.getById);
router.post('/', validate(createProductSchema), controller.create);
router.put('/:id', validate(updateProductSchema), controller.update);
router.delete('/:id', validate(productIdSchema), controller.delete);

export default router;

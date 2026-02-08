import { Router } from 'express';
import authRoutes from './auth';
import productsRoutes from './products';
import cartRoutes from './cart';
import ordersRoutes from './order';
import paymentsRoutes from './payments';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);

export { router };

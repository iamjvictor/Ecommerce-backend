import { Router } from 'express';
import authRoutes from './auth';
import productsRoutes from './products';
import cartRoutes from './cart';
import ordersRoutes from './order';
import paymentsRoutes from './payments';
import checkoutRoutes from './checkout';
import webhooksRoutes from './webhooks';
import shippingRoutes from './shipping';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/shipping', shippingRoutes);

export { router };

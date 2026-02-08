import { Router } from 'express';
import { checkoutController } from '../controllers/checkout';

const router = Router();

/**
 * POST /api/checkout
 * Cria um novo checkout e retorna o link de pagamento InfinitePay
 * 
 * Body: CreateCheckoutRequest
 * - items: array de itens do carrinho
 * - customer: dados do cliente (email, nome, telefone)
 * - shippingAddress: endereço de entrega (opcional)
 * - paymentMethod: 'pix' | 'card'
 */
router.post('/', checkoutController.create.bind(checkoutController));

/**
 * GET /api/checkout/:orderId/status
 * Retorna o status atual do pedido e pagamento
 */
router.get('/:orderId/status', checkoutController.getStatus.bind(checkoutController));

/**
 * POST /api/checkout/:orderId/verify-payment
 * Verifica o status de pagamento diretamente na InfinitePay
 * Útil como fallback se o webhook não foi recebido
 */
router.post('/:orderId/verify-payment', checkoutController.verifyPayment.bind(checkoutController));

export default router;

import { Router, Request, Response } from 'express';
import { CheckoutService } from '../services/checkout';
import { infinitePayWebhookSchema } from '../schemas/checkout';
import { ZodError } from 'zod';

const router = Router();
const checkoutService = new CheckoutService();

/**
 * POST /api/webhooks/infinitepay
 * Endpoint para receber notificações de pagamento do InfinitePay
 * 
 * IMPORTANTE:
 * - Este endpoint é público (sem autenticação)
 * - Deve responder rapidamente com 200 OK
 * - A validação é feita pelo payload
 */
router.post('/infinitepay', async (req: Request, res: Response) => {
  console.log('[Webhook] Recebendo notificação InfinitePay:', JSON.stringify(req.body));

  try {
    // Validar payload
    const payload = infinitePayWebhookSchema.parse(req.body);

    // Processar webhook em background (responder imediatamente)
    // Em produção, considerar usar uma fila (Bull, SQS, etc.)
    setImmediate(async () => {
      try {
        await checkoutService.processWebhook(payload);
      } catch (error) {
        console.error('[Webhook] Erro ao processar:', error);
      }
    });

    // Responder imediatamente com 200 OK
    res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('[Webhook] Payload inválido:', error.issues);
      // Ainda retorna 200 para evitar retentativas do InfinitePay
      // mas loga o erro para investigação
      return res.status(200).json({ received: true, validation_error: true });
    }

    console.error('[Webhook] Erro desconhecido:', error);
    res.status(200).json({ received: true, error: true });
  }
});

export default router;

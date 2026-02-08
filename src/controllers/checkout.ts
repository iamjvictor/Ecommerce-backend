import { Request, Response, NextFunction } from 'express';
import { CheckoutService } from '../services/checkout';
import { createCheckoutSchema, checkPaymentStatusSchema } from '../schemas/checkout';
import { ZodError } from 'zod';

const checkoutService = new CheckoutService();

export class CheckoutController {
  /**
   * Cria um novo checkout e retorna o link de pagamento
   * POST /api/checkout
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar input
      const validatedData = createCheckoutSchema.parse(req.body);

      // Criar checkout
      const result = await checkoutService.createCheckout(validatedData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[Checkout] Erro de validação:', JSON.stringify(error.issues, null, 2));
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.issues,
        });
      }
      next(error);
    }
  }

  /**
   * Retorna o status de um pedido
   * GET /api/checkout/:orderId/status
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;

      // Validar orderId
      checkPaymentStatusSchema.parse({ orderId });

      const status = await checkoutService.getOrderStatus(orderId);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Pedido não encontrado',
        });
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'ID do pedido inválido',
          details: error.issues,
        });
      }
      next(error);
    }
  }

  /**
   * Verifica o status de pagamento diretamente na InfinitePay
   * Útil como fallback se o webhook não foi recebido
   * POST /api/checkout/:orderId/verify-payment
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;

      const result = await checkoutService.verifyAndUpdatePayment(orderId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const checkoutController = new CheckoutController();

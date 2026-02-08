import { Request, Response, NextFunction } from 'express';
import { shippingService } from '../services/entrega';
import { shippingQuoteSchema } from '../schemas/shipping';
import { ZodError } from 'zod';

export class ShippingController {
  /**
   * Retorna cotações de frete para os itens e destino fornecidos
   * POST /api/shipping/quote
   */
  async quote(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('[ShippingController] Recebendo requisição de cotação');
      
      // Validar input
      const validatedData = shippingQuoteSchema.parse(req.body);

      // Obter cotações
      const result = await shippingService.getQuotes(validatedData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[ShippingController] Erro de validação:', JSON.stringify(error.issues, null, 2));
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.issues,
        });
      }
      next(error);
    }
  }
}

export const shippingController = new ShippingController();

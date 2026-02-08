import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    order_id: z.string().uuid('ID do pedido inválido'),
    method: z.enum(['credit_card', 'pix', 'bank_slip'], {
      error: 'Método de pagamento inválido',
    }),
  }),
});

export const paymentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do pagamento inválido'),
  }),
});

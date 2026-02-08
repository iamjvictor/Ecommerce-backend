import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    shipping_address: z.string().min(10, 'Endereço de entrega deve ser mais detalhado'),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do pedido inválido'),
  }),
});

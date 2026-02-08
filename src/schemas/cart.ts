import { z } from 'zod';

export const addItemSchema = z.object({
  body: z.object({
    variant_id: z.string().uuid('ID da variante inválido'),
    quantity: z.number().int().positive('Quantidade deve ser pelo menos 1'),
    unit_price: z.number().positive('Preço deve ser positivo'),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do item inválido'),
  }),
  body: z.object({
    quantity: z.number().int().positive('Quantidade deve ser pelo menos 1'),
  }),
});

export const itemIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do item inválido'),
  }),
});

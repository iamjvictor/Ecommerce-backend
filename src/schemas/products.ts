import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    base_price: z.number().positive('Preço deve ser positivo'),
    image_url: z.string().url('URL da imagem inválida').optional().or(z.literal('')),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    base_price: z.number().positive().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

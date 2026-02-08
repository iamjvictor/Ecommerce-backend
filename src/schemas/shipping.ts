import { z } from 'zod';

// Schema para item do pacote
export const packageItemSchema = z.object({
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
  weightGrams: z.number().positive('Peso deve ser positivo'),
  heightCm: z.number().positive('Altura deve ser positiva'),
  widthCm: z.number().positive('Largura deve ser positiva'),
  lengthCm: z.number().positive('Comprimento deve ser positivo'),
  priceCents: z.number().int().positive('Preço deve ser positivo'),
  sku: z.string().optional(),
});

// Schema principal para cotação de frete
export const shippingQuoteSchema = z.object({
  originZip: z.string()
    .min(8, 'CEP de origem deve ter pelo menos 8 dígitos')
    .max(10, 'CEP de origem inválido')
    .regex(/^\d{5}-?\d{3}$/, 'CEP de origem deve estar no formato 12345-678 ou 12345678'),
  destinationZip: z.string()
    .min(8, 'CEP de destino deve ter pelo menos 8 dígitos')
    .max(10, 'CEP de destino inválido')
    .regex(/^\d{5}-?\d{3}$/, 'CEP de destino deve estar no formato 12345-678 ou 12345678'),
  items: z.array(packageItemSchema).min(1, 'Deve haver pelo menos 1 item para cotação'),
  declaredValueCents: z.number().int().positive().optional(),
});

// Types inferidos dos schemas
export type PackageItemInput = z.infer<typeof packageItemSchema>;
export type ShippingQuoteInput = z.infer<typeof shippingQuoteSchema>;

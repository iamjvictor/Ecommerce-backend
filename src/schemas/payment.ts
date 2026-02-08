import { z } from 'zod';

// Schema para dados do cliente
const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().min(11, 'CPF inválido').max(14),
});

// Schema para endereço
const addressSchema = z.object({
  zip: z.string().min(8, 'CEP inválido'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  country: z.string().default('BR'),
  complement: z.string().optional(),
});

// Schema para pagamento PIX
export const createPixPaymentSchema = z.object({
  payment_method: z.literal('pix'),
  order_id: z.string().uuid('order_id deve ser um UUID válido'),
  customer: customerSchema,
  address: addressSchema,
});

// Schema para pagamento com Cartão
export const createCardPaymentSchema = z.object({
  payment_method: z.literal('credit_card'),
  order_id: z.string().uuid('order_id deve ser um UUID válido'),
  card_token: z.string().min(1, 'Token do cartão é obrigatório'),
  installments: z.number().int().min(1).max(10, 'Máximo 10 parcelas'),
  customer: customerSchema,
  address: addressSchema,
});

// Schema unificado (union)
export const createPaymentSchema = z.discriminatedUnion('payment_method', [
  createPixPaymentSchema,
  createCardPaymentSchema,
]);

// Types inferidos
export type CreatePixPaymentInput = z.infer<typeof createPixPaymentSchema>;
export type CreateCardPaymentInput = z.infer<typeof createCardPaymentSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

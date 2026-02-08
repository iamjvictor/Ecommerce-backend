import { z } from 'zod';

// Schema para item do checkout
export const checkoutItemSchema = z.object({
  productId: z.string(),
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
  unitPrice: z.number().positive('Preço deve ser positivo'),
});

// Schema para dados do cliente
export const customerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone_number: z.string().optional(),
});

// Schema para endereço de entrega
export const addressSchema = z.object({
  street: z.string().min(1, 'Endereço é obrigatório'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  cep: z.string().min(8, 'CEP inválido'),
  country: z.string().default('Brasil'),
  complement: z.string().optional(),
});

// Schema principal do checkout
export const createCheckoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Carrinho não pode estar vazio'),
  customer: customerSchema,
  address: addressSchema.optional(),
  paymentMethod: z.enum(['pix', 'card']),
  handle: z.string().optional(),
});

// Schema para webhook do InfinitePay
export const infinitePayWebhookSchema = z.object({
  event: z.string(),
  order_nsu: z.string(),
  transaction_id: z.string(),
  payment_method: z.string(),
  status: z.string(),
  amount: z.number(),
  paid_at: z.string().optional(),
});

// Schema para verificar status de pagamento
export const checkPaymentStatusSchema = z.object({
  orderId: z.string().uuid('ID do pedido inválido'),
});

// Types inferidos dos schemas
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type InfinitePayWebhookInput = z.infer<typeof infinitePayWebhookSchema>;
export type CheckPaymentStatusInput = z.infer<typeof checkPaymentStatusSchema>;

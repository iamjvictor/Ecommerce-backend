// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  attributes: Record<string, unknown>;
  created_at: string;
}

// Cart types
export interface Cart {
  id: string;
  user_id: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

// Order types
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total: number;
  shipping_address: {
    street: string;
    number: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  } | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

// Payment types
export type PaymentMethod = 'credit_card' | 'pix' | 'boleto';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  external_id: string | null;
  checkout_url: string | null;
  transaction_id: string | null;
  payment_method_used: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  
  // Pagar.me fields
  provider?: string | null; // 'pagarme'
  pagarme_order_id?: string | null;
  pagarme_charge_id?: string | null;
  installments?: number | null;
  
  // PIX fields
  pix_qr_code?: string | null;
  pix_qr_code_url?: string | null;
  pix_expires_at?: string | null;
  
  created_at: string;
  updated_at: string;
}

// InfinitePay Types
export interface InfinitePayItem {
  description: string;
  quantity: number;
  price: number; // Em centavos
}

export interface InfinitePayCustomer {
  name: string;
  email: string;
  phone?: string;
  cpf_cnpj?: string;
}

export interface InfinitePayAddress {
  zip: string;
  street: string;
  number: string;
  city: string;
  state: string;
  country: string;
  complement?: string;
}

export interface InfinitePayCheckoutRequest {
  handle: string;
  items: InfinitePayItem[];
  order_nsu: string;
  redirect_url?: string;
  webhook_url?: string;
  customer?: InfinitePayCustomer;
  address?: InfinitePayAddress;
}

export interface InfinitePayCheckoutResponse {
  url: string;
  checkout_url?: string; // Mantendo para retrocompatibilidade
  order_nsu?: string;
}

export interface InfinitePayWebhookPayload {
  event: string;
  order_nsu: string;
  transaction_id: string;
  payment_method: string;
  status: string;
  amount: number;
  paid_at?: string;
}

export interface InfinitePayPaymentCheckRequest {
  order_nsu: string;
}

export interface InfinitePayPaymentCheckResponse {
  order_nsu: string;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  amount?: number;
  paid_at?: string;
}

// Checkout Request from Frontend
export interface CreateCheckoutRequest {
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  customer: {
    email: string;
    name: string;
    phone_number?: string;
  };
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
    country: string;
    complement?: string;
  };
  paymentMethod: 'pix' | 'card';
}

export interface CreateCheckoutResponse {
  orderId: string;
  checkoutUrl: string;
  total: number;
}

// Shipping types
export type ShippingProvider = 'correios';

export interface ShippingQuoteOption {
  provider: ShippingProvider;
  service: string;
  priceCents: number;
  deadlineDays: number;
  currency: 'BRL';
  best_price?: boolean;
  best_deadline?: boolean;
  raw?: any;
}

export interface ShippingQuoteResult {
  options: ShippingQuoteOption[];
  warnings: string[];
}


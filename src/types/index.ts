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
export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shipping_address: {
    street: string;
    number: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

// Payment types
export interface Payment {
  id: string;
  order_id: string;
  method: 'credit_card' | 'pix' | 'boleto';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  amount: number;
  external_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

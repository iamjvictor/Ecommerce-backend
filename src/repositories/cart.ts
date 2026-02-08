import { supabaseAdmin } from '../lib/supabase';
import { Cart, CartItem } from '../types';

export class CartRepository {
  private cartsTable = 'carts';
  private itemsTable = 'cart_items';

  async findActiveByUserId(userId: string): Promise<Cart | null> {
    const { data, error } = await supabaseAdmin
      .from(this.cartsTable)
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) return null;
    return data;
  }

  async findWithItems(cartId: string): Promise<(Cart & { items: CartItem[] }) | null> {
    const { data, error } = await supabaseAdmin
      .from(this.cartsTable)
      .select('*, items:cart_items(*)')
      .eq('id', cartId)
      .single();

    if (error) return null;
    return data;
  }

  async create(userId: string): Promise<Cart> {
    const { data, error } = await supabaseAdmin
      .from(this.cartsTable)
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addItem(cartId: string, item: Partial<CartItem>): Promise<CartItem> {
    const { data, error } = await supabaseAdmin
      .from(this.itemsTable)
      .insert({ ...item, cart_id: cartId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateItem(itemId: string, quantity: number): Promise<CartItem> {
    const { data, error } = await supabaseAdmin
      .from(this.itemsTable)
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeItem(itemId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.itemsTable)
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  async updateStatus(cartId: string, status: Cart['status']): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.cartsTable)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', cartId);

    if (error) throw error;
  }
}

import { supabaseAdmin } from '../lib/supabase';
import { Order, OrderItem } from '../types';

export class OrdersRepository {
  private ordersTable = 'orders';
  private itemsTable = 'order_items';

  async findByUserId(userId: string): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
      .from(this.ordersTable)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await supabaseAdmin
      .from(this.ordersTable)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async findWithItems(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
    const { data, error } = await supabaseAdmin
      .from(this.ordersTable)
      .select(`*, items:${this.itemsTable}(*)`)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async create(order: Partial<Order>, items: Partial<OrderItem>[]): Promise<Order> {
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from(this.ordersTable)
      .insert(order)
      .select()
      .single();

    if (orderError) throw orderError;

    const itemsWithOrderId = items.map(item => ({ ...item, order_id: orderData.id }));
    
    const { error: itemsError } = await supabaseAdmin
      .from(this.itemsTable)
      .insert(itemsWithOrderId);

    if (itemsError) throw itemsError;

    return orderData;
  }

  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    const { data, error } = await supabaseAdmin
      .from(this.ordersTable)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

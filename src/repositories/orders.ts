import { supabaseAdmin } from '../lib/supabase';
import { Order, OrderItem, OrderStatus } from '../types';

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
      .select('*, items:order_items(*)')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Cria um pedido com itens (versão original com user_id obrigatório)
   */
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

  /**
   * Cria um pedido com itens (checkout anônimo - user_id opcional)
   * Usado pelo fluxo de checkout com InfinitePay
   */
  async createWithItems(
    orderData: Partial<Order>, 
    items: { product_id: string; product_name: string; quantity: number; unit_price: number }[]
  ): Promise<Order> {
    const { data: order, error: orderError } = await supabaseAdmin
      .from(this.ordersTable)
      .insert({
        ...orderData,
        status: orderData.status || 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const itemsWithOrderId = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));
    
    const { error: itemsError } = await supabaseAdmin
      .from(this.itemsTable)
      .insert(itemsWithOrderId);

    if (itemsError) {
      // Rollback: deletar o pedido se os itens falharem
      await supabaseAdmin.from(this.ordersTable).delete().eq('id', order.id);
      throw itemsError;
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
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

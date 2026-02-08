import { supabaseAdmin } from '../lib/supabase';
import { Payment } from '../types';

export class PaymentsRepository {
  private table = 'payments';

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) return null;
    return data;
  }

  async findById(id: string): Promise<Payment | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async create(payment: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .insert(payment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: Payment['status'], metadata?: Record<string, unknown>): Promise<Payment> {
    const updateData: Partial<Payment> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

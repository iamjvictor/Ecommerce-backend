import { supabaseAdmin } from '../lib/supabase';
import { Payment, PaymentStatus } from '../types';

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

  /**
   * Atualiza campos específicos de um pagamento
   */
  async update(id: string, updates: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualiza apenas o status de um pagamento
   */
  async updateStatus(id: string, status: PaymentStatus, metadata?: Record<string, unknown>): Promise<Payment> {
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

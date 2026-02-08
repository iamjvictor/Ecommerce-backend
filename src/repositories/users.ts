import { supabaseAdmin } from '../lib/supabase';
import { User } from '../types';

export class UsersRepository {
  private table = 'users';

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async create(userData: Partial<User>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update({ ...userData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

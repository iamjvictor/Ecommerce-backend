import { supabaseAdmin } from '../lib/supabase';
import { Product, ProductVariant } from '../types';

export class ProductsRepository {
  private table = 'products';
  private variantsTable = 'product_variants';

  async findAll(): Promise<Product[]> {
    console.log('[ProductsRepository] Fetching all products from table:', this.table);
    
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('is_active', true);

    console.log('[ProductsRepository] Raw response:', JSON.stringify(data, null, 2));
    console.log('[ProductsRepository] Error:', error);

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async findWithVariants(id: string): Promise<(Product & { variants: ProductVariant[] }) | null> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select('*, variants:product_variants(*)')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async create(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update({ ...product, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.table)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }
}

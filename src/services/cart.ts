import { CartRepository } from '../repositories/cart';
import { CartItem } from '../types';

export class CartService {
  private repository: CartRepository;

  constructor() {
    this.repository = new CartRepository();
  }

  async getOrCreateCart(userId: string) {
    let cart = await this.repository.findActiveByUserId(userId);
    
    if (!cart) {
      cart = await this.repository.create(userId);
    }

    return this.repository.findWithItems(cart.id);
  }

  async addItem(userId: string, variantId: string, quantity: number, unitPrice: number) {
    const cart = await this.getOrCreateCart(userId);
    if (!cart) throw new Error('Erro ao criar carrinho');

    return this.repository.addItem(cart.id, {
      variant_id: variantId,
      quantity,
      unit_price: unitPrice,
    });
  }

  async updateItem(itemId: string, quantity: number) {
    return this.repository.updateItem(itemId, quantity);
  }

  async removeItem(itemId: string) {
    return this.repository.removeItem(itemId);
  }
}

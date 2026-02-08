import { OrdersRepository } from '../repositories/orders';
import { CartRepository } from '../repositories/cart';
import { Order, OrderItem } from '../types';

export class OrdersService {
  private ordersRepository: OrdersRepository;
  private cartRepository: CartRepository;

  constructor() {
    this.ordersRepository = new OrdersRepository();
    this.cartRepository = new CartRepository();
  }

  async list(userId: string) {
    return this.ordersRepository.findByUserId(userId);
  }

  async getById(id: string) {
    return this.ordersRepository.findWithItems(id);
  }

  async createFromCart(userId: string, shippingAddress: Order['shipping_address']) {
    const cart = await this.cartRepository.findActiveByUserId(userId);
    if (!cart) throw new Error('Carrinho não encontrado');

    const cartWithItems = await this.cartRepository.findWithItems(cart.id);
    if (!cartWithItems || !cartWithItems.items.length) {
      throw new Error('Carrinho vazio');
    }

    const total = cartWithItems.items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const orderItems: Partial<OrderItem>[] = cartWithItems.items.map(item => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const order = await this.ordersRepository.create(
      { user_id: userId, total, shipping_address: shippingAddress },
      orderItems
    );

    await this.cartRepository.updateStatus(cart.id, 'completed');

    return order;
  }
}

import { PaymentsRepository } from '../repositories/payments';
import { OrdersRepository } from '../repositories/orders';
import { Payment } from '../types';

export class PaymentsService {
  private paymentsRepository: PaymentsRepository;
  private ordersRepository: OrdersRepository;

  constructor() {
    this.paymentsRepository = new PaymentsRepository();
    this.ordersRepository = new OrdersRepository();
  }

  async create(orderId: string, method: Payment['method']) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) throw new Error('Pedido não encontrado');

    const existingPayment = await this.paymentsRepository.findByOrderId(orderId);
    if (existingPayment) throw new Error('Pagamento já existe para este pedido');

    return this.paymentsRepository.create({
      order_id: orderId,
      method,
      amount: order.total,
      status: 'pending',
    });
  }

  async confirm(paymentId: string) {
    const payment = await this.paymentsRepository.findById(paymentId);
    if (!payment) throw new Error('Pagamento não encontrado');

    const updatedPayment = await this.paymentsRepository.updateStatus(paymentId, 'completed');

    await this.ordersRepository.updateStatus(payment.order_id, 'confirmed');

    return updatedPayment;
  }

  async getById(id: string) {
    return this.paymentsRepository.findById(id);
  }
}

import { OrdersRepository } from '../repositories/orders';
import { PaymentsRepository } from '../repositories/payments';
import { infinitePayService } from './infinitepay';
import { CreateCheckoutInput } from '../schemas/checkout';
import { CreateCheckoutResponse, Order, Payment } from '../types';

export class CheckoutService {
  private ordersRepository: OrdersRepository;
  private paymentsRepository: PaymentsRepository;

  constructor() {
    this.ordersRepository = new OrdersRepository();
    this.paymentsRepository = new PaymentsRepository();
  }

  /**
   * Cria um pedido e gera o link de checkout InfinitePay
   * Este é o fluxo principal de checkout do ecommerce
   */
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResponse> {
    const { items, customer, address, paymentMethod, handle } = input;
    
    // Normalizar itens e pagamento
    const normalizedPaymentMethod = paymentMethod || 'card'; // Default para card se não informado
    
    // Mapear itens para formato interno
    const normalizedItems = items.map(item => {
      const unitPrice = item.unitPrice;
      
      return {
        productId: item.productId,
        productName: item.productName || 'Produto sem nome',
        description: item.productName || 'Produto sem descrição',
        quantity: item.quantity,
        unitPrice: unitPrice, // Preço base em reais
      };
    });

    // 1. Calcular total
    // Se o preço já veio em centavos (do front), assumimos que é o preço final ou base?
    // Se não veio paymentMethod, assumimos que o preço enviado já é o correto?
    // Vamos manter a lógica: se paymentMethod for card, aplica +12.5% sobre o preço base.
    // Se o user mandou o preço já com taxa, isso pode duplicar. 
    // Mas assumindo que "price" do front é o valor do produto base.
    
    const baseTotal = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = normalizedPaymentMethod === 'card' ? Math.ceil(baseTotal * 1.125) : baseTotal;

    console.log('[Checkout] Criando pedido:', {
      itemsCount: items.length,
      paymentMethod: normalizedPaymentMethod,
      baseTotal,
      total,
      handle: handle || process.env.INFINITEPAY_HANDLE
    });

    // 2. Criar pedido no banco
    const orderData: Partial<Order> = {
      status: 'pending',
      total,
      customer_email: customer.email,
      customer_name: customer.name,
      customer_phone: customer.phone_number || null,
      shipping_address: address ? {
        street: address.street,
        number: address.number,
        city: address.city || 'Desconhecida',
        state: address.state || 'UF',
        zip_code: address.cep,
        country: address.country || 'BR',
      } : null,
    };

    const orderItems = normalizedItems.map(item => ({
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: normalizedPaymentMethod === 'card' 
        ? Math.ceil(item.unitPrice * 1.125) 
        : item.unitPrice,
    }));

    const order = await this.ordersRepository.createWithItems(orderData, orderItems);

    console.log('[Checkout] Pedido criado:', order.id);

    // 3. Criar registro de pagamento
    const payment = await this.paymentsRepository.create({
      order_id: order.id,
      method: normalizedPaymentMethod === 'pix' ? 'pix' : 'credit_card',
      status: 'pending',
      amount: total,
    });

    console.log('[Checkout] Pagamento criado:', payment.id);

    // 4. Chamar InfinitePay para gerar link de checkout
    const infinitePayItems = normalizedItems.map(item => ({
      description: item.productName || item.description || 'Produto',
      quantity: item.quantity,
      price: Math.round((normalizedPaymentMethod === 'card' 
        ? Math.ceil(item.unitPrice * 1.125) 
        : item.unitPrice) * 100), // Converter para centavos
    }));

    const infinitePayCustomer = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone_number,
    };

    const infinitePayAddress = address ? {
      zip: address.cep.replace(/\D/g, ''),
      street: address.street,
      number: address.number,
      city: address.city || '',
      state: address.state || '',
      country: address.country || 'BR',
      complement: address.complement,
    } : undefined;

    try {
      const checkoutResponse = await infinitePayService.createCheckoutLink(
        order.id,
        infinitePayItems,
        infinitePayCustomer,
        infinitePayAddress
      );

      // 5. Atualizar pagamento com URL do checkout
      const checkoutUrl = checkoutResponse.url || checkoutResponse.checkout_url || '';
      
      if (!checkoutUrl) {
        throw new Error('URL de checkout não retornada pela InfinitePay');
      }

      await this.paymentsRepository.update(payment.id, {
        checkout_url: checkoutUrl,
        status: 'processing',
      });
      

      return {
        orderId: order.id,
        checkoutUrl: checkoutUrl,
        total,
      };
    } catch (error) {
      // Se falhar ao criar o link, marcar pagamento como falho
      await this.paymentsRepository.update(payment.id, {
        status: 'failed',
        metadata: { error: (error as Error).message },
      });

      // Atualizar pedido para cancelado
      await this.ordersRepository.updateStatus(order.id, 'cancelled');

      throw error;
    }
  }

  /**
   * Retorna o status atual do pedido
   */
  async getOrderStatus(orderId: string) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) return null;

    const payment = await this.paymentsRepository.findByOrderId(orderId);

    return {
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: payment?.status || 'pending',
      total: order.total,
      paidAt: payment?.paid_at,
    };
  }

  /**
   * Verifica o status de pagamento diretamente na InfinitePay
   * e atualiza o banco se necessário
   */
  async verifyAndUpdatePayment(orderId: string) {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) throw new Error('Pedido não encontrado');

    const payment = await this.paymentsRepository.findByOrderId(orderId);
    if (!payment) throw new Error('Pagamento não encontrado');

    // Se já está completo, retornar
    if (payment.status === 'completed') {
      return { status: 'completed', alreadyProcessed: true };
    }

    // Consultar InfinitePay
    const infinitePayStatus = await infinitePayService.checkPaymentStatus(orderId);

    if (infinitePayStatus.status === 'paid' || infinitePayStatus.status === 'approved') {
      // Atualizar pagamento
      await this.paymentsRepository.update(payment.id, {
        status: 'completed',
        transaction_id: infinitePayStatus.transaction_id,
        payment_method_used: infinitePayStatus.payment_method,
        paid_at: infinitePayStatus.paid_at || new Date().toISOString(),
      });

      // Atualizar pedido
      await this.ordersRepository.updateStatus(orderId, 'confirmed');

      return { status: 'completed', alreadyProcessed: false };
    }

    return { 
      status: infinitePayStatus.status, 
      alreadyProcessed: false 
    };
  }

  /**
   * Processa o webhook de confirmação de pagamento do InfinitePay
   */
  async processWebhook(payload: {
    order_nsu: string;
    transaction_id: string;
    payment_method: string;
    status: string;
    amount: number;
    paid_at?: string;
  }) {
    const { order_nsu: orderId, transaction_id, payment_method, status, paid_at } = payload;

    console.log('[Webhook] Processando:', { orderId, status });

    const payment = await this.paymentsRepository.findByOrderId(orderId);
    if (!payment) {
      console.error('[Webhook] Pagamento não encontrado para order_nsu:', orderId);
      return { processed: false, reason: 'payment_not_found' };
    }

    // Verificar idempotência - se já processado, ignorar
    if (payment.status === 'completed' && payment.transaction_id === transaction_id) {
      console.log('[Webhook] Pagamento já processado, ignorando');
      return { processed: true, alreadyProcessed: true };
    }

    if (status === 'paid' || status === 'approved') {
      // Atualizar pagamento
      await this.paymentsRepository.update(payment.id, {
        status: 'completed',
        transaction_id,
        payment_method_used: payment_method,
        paid_at: paid_at || new Date().toISOString(),
      });

      // Atualizar pedido
      await this.ordersRepository.updateStatus(orderId, 'confirmed');

      console.log('[Webhook] Pagamento confirmado:', orderId);
      return { processed: true, alreadyProcessed: false };
    }

    if (status === 'failed' || status === 'rejected') {
      await this.paymentsRepository.update(payment.id, {
        status: 'failed',
        metadata: { failure_reason: status },
      });

      console.log('[Webhook] Pagamento falhou:', orderId);
      return { processed: true, failed: true };
    }

    return { processed: false, reason: 'unknown_status', status };
  }
}

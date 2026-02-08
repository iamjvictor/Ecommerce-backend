import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { createPaymentSchema } from '../schemas/payment';
import { pagarmeService, PRICE_PIX, PRICE_CARD } from '../services/pagarme';
import { OrdersRepository } from '../repositories/orders';
import { PaymentsRepository } from '../repositories/payments';

export class PaymentController {
  private ordersRepository: OrdersRepository;
  private paymentsRepository: PaymentsRepository;

  constructor() {
    this.ordersRepository = new OrdersRepository();
    this.paymentsRepository = new PaymentsRepository();
  }

  /**
   * POST /api/payments/create
   * 
   * Cria um pagamento (PIX ou Cartão) via Pagar.me
   */
  async create(req: Request, res: Response) {
    try {
      // 1. Validar entrada
      const input = createPaymentSchema.parse(req.body);

      console.log('[Payment] Criando pagamento:', {
        order_id: input.order_id,
        method: input.payment_method,
      });

      // 2. Verificar se o pedido existe e está pendente
      const order = await this.ordersRepository.findById(input.order_id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Pedido não encontrado',
        });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Pedido já foi processado ou não está aguardando pagamento',
          current_status: order.status,
        });
      }

      // 3. Verificar idempotência (evitar duplicação)
      const existingPayment = await this.paymentsRepository.findByOrderId(input.order_id);

      if (existingPayment && existingPayment.status !== 'failed') {
        console.log('[Payment] Pagamento já existe:', existingPayment.id);
        
        // Retornar dados do pagamento existentes
        if (input.payment_method === 'pix' && existingPayment.pix_qr_code) {
          return res.status(200).json({
            success: true,
            type: 'pix',
            amount: PRICE_PIX,
            qr_code: existingPayment.pix_qr_code,
            qr_code_url: existingPayment.pix_qr_code_url,
            expires_at: existingPayment.pix_expires_at,
            provider_id: existingPayment.pagarme_order_id,
          });
        }

        return res.status(200).json({
          success: true,
          type: 'credit_card',
          amount: PRICE_CARD,
          installments: existingPayment.installments,
          provider_id: existingPayment.pagarme_order_id,
          status: existingPayment.status,
        });
      }

      // 4. Processar pagamento conforme o método
      if (input.payment_method === 'pix') {
        const pixResult = await pagarmeService.createPixPayment(
          input.order_id,
          {
            name: input.customer.name,
            email: input.customer.email,
            phone: input.customer.phone,
            cpf: input.customer.cpf,
          },
          {
            zip: input.address.zip,
            street: input.address.street,
            number: input.address.number,
            neighborhood: input.address.neighborhood,
            city: input.address.city,
            state: input.address.state,
            country: input.address.country,
          }
        );

        // 5. Salvar no banco
        const payment = await this.paymentsRepository.create({
          order_id: input.order_id,
          method: 'pix',
          status: 'pending',
          amount: PRICE_PIX,
          provider: 'pagarme',
          pagarme_order_id: pixResult.pagarme_order_id,
          pagarme_charge_id: pixResult.pagarme_charge_id,
          pix_qr_code: pixResult.qr_code,
          pix_qr_code_url: pixResult.qr_code_url,
          pix_expires_at: pixResult.expires_at,
        });

        console.log('[Payment] PIX criado:', payment.id);

        return res.status(201).json({
          success: true,
          type: 'pix',
          amount: PRICE_PIX,
          qr_code: pixResult.qr_code,
          qr_code_url: pixResult.qr_code_url,
          expires_at: pixResult.expires_at,
          provider_id: pixResult.pagarme_order_id,
        });
      }

      // Cartão de crédito
      if (input.payment_method === 'credit_card') {
        const cardResult = await pagarmeService.createCardPayment(
          input.order_id,
          input.card_token,
          input.installments,
          {
            name: input.customer.name,
            email: input.customer.email,
            phone: input.customer.phone,
            cpf: input.customer.cpf,
          },
          {
            zip: input.address.zip,
            street: input.address.street,
            number: input.address.number,
            neighborhood: input.address.neighborhood,
            city: input.address.city,
            state: input.address.state,
            country: input.address.country,
          }
        );

        // 5. Salvar no banco
        const payment = await this.paymentsRepository.create({
          order_id: input.order_id,
          method: 'credit_card',
          status: cardResult.status === 'paid' ? 'completed' : 'pending',
          amount: PRICE_CARD,
          provider: 'pagarme',
          pagarme_order_id: cardResult.pagarme_order_id,
          pagarme_charge_id: cardResult.pagarme_charge_id,
          installments: cardResult.installments,
        });

        console.log('[Payment] Cartão processado:', payment.id);

        // Atualizar status do pedido se aprovado imediatamente
        if (cardResult.status === 'paid') {
          await this.ordersRepository.updateStatus(input.order_id, 'confirmed');
        }

        return res.status(201).json({
          success: true,
          type: 'credit_card',
          amount: PRICE_CARD,
          installments: cardResult.installments,
          installments_max: 10,
          provider_id: cardResult.pagarme_order_id,
          status: cardResult.status,
        });
      }

      // Nunca deve chegar aqui (discriminated union garante)
      return res.status(400).json({
        success: false,
        error: 'Método de pagamento inválido',
      });

    } catch (error) {
      // Erros de validação Zod
      if (error instanceof ZodError) {
        console.error('[Payment] Erro de validação:', error.issues);
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.issues,
        });
      }

      // Outros erros
      console.error('[Payment] Erro ao criar pagamento:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      });
    }
  }
}

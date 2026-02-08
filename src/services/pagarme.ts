import axios, { AxiosInstance, AxiosError } from 'axios';

const PAGARME_API_URL = process.env.PAGARME_API_URL || 'https://api.pagar.me/core/v5';
const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY || '';

// Business rules
const PRICE_PIX = 15990; // R$ 159,90 em centavos
const PRICE_CARD = 18000; // R$ 180,00 em centavos
const MAX_INSTALLMENTS = 10;

interface PagarmeCustomer {
  name: string;
  email: string;
  type: 'individual';
  document: string; // CPF
  phones: {
    mobile_phone: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
}

interface PagarmeAddress {
  line_1: string; // "numero, rua, bairro"
  zip_code: string;
  city: string;
  state: string;
  country: string;
}

interface PagarmePixPaymentResponse {
  id: string; // order_id
  charges: Array<{
    id: string; // charge_id
    amount: number;
    status: string;
    last_transaction: {
      qr_code: string;
      qr_code_url: string;
      expires_at: string;
    };
  }>;
}

interface PagarmeCardPaymentResponse {
  id: string; // order_id
  charges: Array<{
    id: string; // charge_id
    amount: number;
    status: string;
    installments: number;
  }>;
}

/**
 * Serviço de integração com Pagar.me v5 Orders API
 * 
 * Documentação: https://docs.pagar.me/reference/criar-pedido
 */
export class PagarmeService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: PAGARME_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: PAGARME_SECRET_KEY,
        password: '', // Pagar.me usa apenas secret key no username
      },
    });
  }

  /**
   * Formata telefone brasileiro para formato Pagar.me
   * Exemplo: "+5522997893098" -> { country_code: "55", area_code: "22", number: "997893098" }
   */
  private parsePhone(phone: string) {
    const cleaned = phone.replace(/\D/g, '');
    
    // Formato esperado: 5522997893098 (país + DDD + número)
    if (cleaned.length >= 12) {
      return {
        country_code: cleaned.substring(0, 2),
        area_code: cleaned.substring(2, 4),
        number: cleaned.substring(4),
      };
    }
    
    // Fallback: assume Brasil
    return {
      country_code: '55',
      area_code: cleaned.substring(0, 2),
      number: cleaned.substring(2),
    };
  }

  /**
   * Cria pagamento via PIX
   * Valor fixo: R$ 159,90
   * 
   * @param orderId - ID do pedido no sistema
   * @param customer - Dados do cliente
   * @param address - Endereço do cliente
   * @returns QR Code e dados do pagamento
   */
  async createPixPayment(
    orderId: string,
    customer: { name: string; email: string; phone: string; cpf: string },
    address: { zip: string; street: string; number: string; neighborhood: string; city: string; state: string; country: string }
  ): Promise<{
    pagarme_order_id: string;
    pagarme_charge_id: string;
    amount: number;
    qr_code: string;
    qr_code_url: string;
    expires_at: string;
    status: string;
  }> {
    console.log('[Pagar.me] Criando pagamento PIX:', { orderId, amount: PRICE_PIX });

    const phone = this.parsePhone(customer.phone);

    const payload = {
      code: orderId, // Código único para idempotência
      items: [
        {
          amount: PRICE_PIX,
          description: 'Pedido #' + orderId,
          quantity: 1,
        },
      ],
      customer: {
        name: customer.name,
        email: customer.email,
        type: 'individual',
        document: customer.cpf.replace(/\D/g, ''),
        phones: {
          mobile_phone: phone,
        },
      } as PagarmeCustomer,
      payments: [
        {
          payment_method: 'pix',
          pix: {
            expires_in: 1800, // 30 minutos
          },
        },
      ],
      shipping: {
        address: {
          line_1: `${address.number}, ${address.street}, ${address.neighborhood}`,
          zip_code: address.zip.replace(/\D/g, ''),
          city: address.city,
          state: address.state,
          country: address.country,
        } as PagarmeAddress,
      },
    };

    try {
      const response = await this.client.post<PagarmePixPaymentResponse>('/orders', payload);
      
      const order = response.data;
      const charge = order.charges[0];
      const transaction = charge.last_transaction;

      console.log('[Pagar.me] PIX criado com sucesso:', {
        order_id: order.id,
        charge_id: charge.id,
        status: charge.status,
      });

      return {
        pagarme_order_id: order.id,
        pagarme_charge_id: charge.id,
        amount: charge.amount,
        qr_code: transaction.qr_code,
        qr_code_url: transaction.qr_code_url,
        expires_at: transaction.expires_at,
        status: charge.status,
      };
    } catch (error) {
      this.handleError(error, 'PIX');
      throw error;
    }
  }

  /**
   * Cria pagamento via Cartão de Crédito
   * Valor fixo: R$ 180,00
   * Parcelamento: até 10x
   * 
   * @param orderId - ID do pedido no sistema
   * @param cardToken - Token do cartão gerado no frontend (pagarme.js)
   * @param installments - Número de parcelas (1-10)
   * @param customer - Dados do cliente
   * @param address - Endereço de cobrança
   * @returns Dados do pagamento
   */
  async createCardPayment(
    orderId: string,
    cardToken: string,
    installments: number,
    customer: { name: string; email: string; phone: string; cpf: string },
    address: { zip: string; street: string; number: string; neighborhood: string; city: string; state: string; country: string }
  ): Promise<{
    pagarme_order_id: string;
    pagarme_charge_id: string;
    amount: number;
    installments: number;
    status: string;
  }> {
    // Validar parcelas
    if (installments < 1 || installments > MAX_INSTALLMENTS) {
      throw new Error(`Número de parcelas inválido. Permitido: 1-${MAX_INSTALLMENTS}`);
    }

    console.log('[Pagar.me] Criando pagamento Cartão:', {
      orderId,
      amount: PRICE_CARD,
      installments,
    });

    const phone = this.parsePhone(customer.phone);

    const payload = {
      code: orderId, // Código único para idempotência
      items: [
        {
          amount: PRICE_CARD,
          description: 'Pedido #' + orderId,
          quantity: 1,
        },
      ],
      customer: {
        name: customer.name,
        email: customer.email,
        type: 'individual',
        document: customer.cpf.replace(/\D/g, ''),
        phones: {
          mobile_phone: phone,
        },
      } as PagarmeCustomer,
      payments: [
        {
          payment_method: 'credit_card',
          credit_card: {
            installments: installments,
            statement_descriptor: 'ECOMMERCE', // Aparece na fatura
            card_token: cardToken, // Token gerado no frontend
            billing_address: {
              line_1: `${address.number}, ${address.street}, ${address.neighborhood}`,
              zip_code: address.zip.replace(/\D/g, ''),
              city: address.city,
              state: address.state,
              country: address.country,
            } as PagarmeAddress,
          },
        },
      ],
    };

    try {
      const response = await this.client.post<PagarmeCardPaymentResponse>('/orders', payload);
      
      const order = response.data;
      const charge = order.charges[0];

      console.log('[Pagar.me] Cartão processado:', {
        order_id: order.id,
        charge_id: charge.id,
        status: charge.status,
        installments: charge.installments,
      });

      return {
        pagarme_order_id: order.id,
        pagarme_charge_id: charge.id,
        amount: charge.amount,
        installments: charge.installments,
        status: charge.status,
      };
    } catch (error) {
      this.handleError(error, 'Cartão');
      throw error;
    }
  }

  /**
   * Trata erros da API Pagar.me
   */
  private handleError(error: unknown, paymentType: string): never {
    const axiosError = error as AxiosError;

    console.error(`[Pagar.me] Erro no pagamento ${paymentType}:`, {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      message: axiosError.message,
    });

    if (axiosError.response?.data) {
      const errorData = axiosError.response.data as any;
      const errorMessage = errorData.message || errorData.errors?.[0]?.message || 'Erro desconhecido';
      throw new Error(`Erro Pagar.me: ${errorMessage}`);
    }

    throw new Error(`Erro ao processar pagamento: ${axiosError.message}`);
  }
}

// Singleton
export const pagarmeService = new PagarmeService();

// Exportar constantes para uso em outros módulos
export { PRICE_PIX, PRICE_CARD, MAX_INSTALLMENTS };

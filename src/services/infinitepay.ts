import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  InfinitePayCheckoutRequest,
  InfinitePayCheckoutResponse,
  InfinitePayPaymentCheckRequest,
  InfinitePayPaymentCheckResponse,
} from '../types';

const INFINITEPAY_API_URL = process.env.INFINITEPAY_API_URL || 'https://api.infinitepay.io';
const INFINITEPAY_HANDLE = process.env.INFINITEPAY_HANDLE || '';
const WEBHOOK_URL = process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/webhooks/infinitepay` : '';
const REDIRECT_URL = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/checkout/success` : '';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Serviço para integração com a API InfinitePay
 * Responsável por criar links de checkout e verificar status de pagamentos
 */
export class InfinitePayService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: INFINITEPAY_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Cria um link de checkout no InfinitePay
   * 
   * @param orderId - ID do pedido (usado como order_nsu para idempotência)
   * @param items - Lista de itens do pedido
   * @param customer - Dados do cliente (opcional)
   * @param address - Endereço de entrega (opcional)
   * @returns URL do checkout e order_nsu
   */
  async createCheckoutLink(
    orderId: string,
    items: { description: string; quantity: number; price: number }[],
    customer?: { name: string; email: string; phone?: string },
    address?: { zip: string; street: string; number: string; city: string; state: string; country: string }
  ): Promise<InfinitePayCheckoutResponse> {
    if (!INFINITEPAY_HANDLE) {
      throw new Error('INFINITEPAY_HANDLE não configurado');
    }

    const sanitizedHandle = INFINITEPAY_HANDLE.replace(/^\$/, '');

    const payload: InfinitePayCheckoutRequest = {
      handle: sanitizedHandle,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price, // Já deve estar em centavos
      })),
      order_nsu: orderId, // Usa o ID do pedido para garantir idempotência
      redirect_url: REDIRECT_URL || undefined,
      webhook_url: WEBHOOK_URL || undefined,
      customer: customer ? {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      } : undefined,
      address: address ? {
        zip: address.zip,
        street: address.street,
        number: address.number,
        city: address.city,
        state: address.state,
        country: address.country,
      } : undefined,
    };

    console.log('[InfinitePay] Criando link de checkout:', {
      order_nsu: orderId,
      itemsCount: items.length,
      hasCustomer: !!customer,
      hasAddress: !!address,
    });

    return this.executeWithRetry(async () => {
      const response = await this.client.post<InfinitePayCheckoutResponse>(
        '/invoices/public/checkout/links',
        payload
      );
      
      console.log('[InfinitePay] Link criado com sucesso:', {
        order_nsu: response.data.order_nsu,
        checkout_url: response.data.url,
      });

      return response.data;
    });
  }

  /**
   * Verifica o status de um pagamento no InfinitePay
   * Útil como fallback caso o webhook não seja recebido
   * 
   * @param orderId - ID do pedido (order_nsu)
   * @returns Status do pagamento
   */
  async checkPaymentStatus(orderId: string): Promise<InfinitePayPaymentCheckResponse> {
    const payload: InfinitePayPaymentCheckRequest = {
      order_nsu: orderId,
    };

    console.log('[InfinitePay] Verificando status do pagamento:', orderId);

    return this.executeWithRetry(async () => {
      const response = await this.client.post<InfinitePayPaymentCheckResponse>(
        '/invoices/public/checkout/payment_check',
        payload
      );

      console.log('[InfinitePay] Status do pagamento:', {
        order_nsu: orderId,
        status: response.data.status,
      });

      return response.data;
    });
  }

  /**
   * Executa uma operação com retry automático em caso de falha de rede
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries = MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Se for erro de rede ou timeout, tenta novamente
      const isRetryable = 
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ETIMEDOUT' ||
        axiosError.code === 'ENOTFOUND' ||
        axiosError.code === 'ECONNREFUSED' ||
        (axiosError.response?.status && axiosError.response.status >= 500);

      if (isRetryable && retries > 0) {
        console.log(`[InfinitePay] Erro de rede, tentando novamente (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
        await this.delay(RETRY_DELAY_MS * (MAX_RETRIES - retries + 1)); // Backoff exponencial
        return this.executeWithRetry(operation, retries - 1);
      }

      // Log do erro para debugging
      console.error('[InfinitePay] Erro na requisição:', {
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      throw new Error(
        `Erro ao comunicar com InfinitePay: ${(axiosError.response?.data as { message?: string })?.message || axiosError.message}`
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton para uso em toda a aplicação
export const infinitePayService = new InfinitePayService();

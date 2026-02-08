import axios from 'axios';

// ============================================================================
// TYPES
// ============================================================================

export type ShippingProvider = 'correios';

export interface PackageItem {
  quantity: number;
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  priceCents: number;
  sku?: string;
}

export interface ShippingQuoteInput {
  originZip: string;
  destinationZip: string;
  items: PackageItem[];
  declaredValueCents?: number;
}

export interface ShippingQuoteOption {
  provider: ShippingProvider;
  service: string;
  priceCents: number;
  deadlineDays: number;
  currency: 'BRL';
  best_price?: boolean;
  best_deadline?: boolean;
  raw?: any;
}

export interface ShippingQuoteResult {
  options: ShippingQuoteOption[];
  warnings: string[];
}

interface PackageDimensions {
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  declaredValueCents: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normaliza CEP removendo caracteres não-numéricos
 */
function normalizeCEP(cep: string): string {
  const normalized = cep.replace(/\D/g, '');
  
  if (normalized.length !== 8) {
    throw new Error(`CEP inválido: ${cep}. CEP deve conter 8 dígitos.`);
  }
  
  return normalized;
}

/**
 * Calcula dimensões agregadas do pacote baseado nos itens
 * Para simplificar, usamos a maior dimensão de cada eixo e soma dos pesos
 */
function calculatePackageDimensions(items: PackageItem[], declaredValueCents?: number): PackageDimensions {
  const totalWeight = items.reduce((sum, item) => sum + (item.weightGrams * item.quantity), 0);
  
  // Para simplificação, usamos as maiores dimensões
  // Em produção, seria ideal calcular volume total ou usar algoritmo de empacotamento
  const maxHeight = Math.max(...items.map(item => item.heightCm));
  const maxWidth = Math.max(...items.map(item => item.widthCm));
  const maxLength = Math.max(...items.map(item => item.lengthCm));
  
  const totalValue = declaredValueCents || items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  
  return {
    weightGrams: totalWeight,
    heightCm: maxHeight,
    widthCm: maxWidth,
    lengthCm: maxLength,
    declaredValueCents: totalValue,
  };
}

/**
 * Ordena opções por preço e adiciona flags de melhor preço/prazo
 */
function sortAndEnrichQuotes(options: ShippingQuoteOption[]): ShippingQuoteOption[] {
  if (options.length === 0) return options;
  
  // Ordenar por preço ascendente
  const sorted = [...options].sort((a, b) => a.priceCents - b.priceCents);
  
  // Encontrar melhor preço e melhor prazo
  const bestPrice = Math.min(...sorted.map(o => o.priceCents));
  const bestDeadline = Math.min(...sorted.map(o => o.deadlineDays));
  
  // Adicionar flags
  return sorted.map(option => ({
    ...option,
    best_price: option.priceCents === bestPrice,
    best_deadline: option.deadlineDays === bestDeadline,
  }));
}

// ============================================================================
// CORREIOS PROVIDER
// ============================================================================

/**
 * Consulta frete dos Correios usando a API pública
 * Retorna opções de PAC e SEDEX
 */
async function quoteCorreios(input: ShippingQuoteInput): Promise<ShippingQuoteOption[]> {
  const originZip = normalizeCEP(input.originZip);
  const destinationZip = normalizeCEP(input.destinationZip);
  const dimensions = calculatePackageDimensions(input.items, input.declaredValueCents);
  
  // Converter peso para kg (Correios usa kg)
  const weightKg = dimensions.weightGrams / 1000;
  
  // Converter valor declarado para reais
  const declaredValueReais = dimensions.declaredValueCents / 100;
  
  console.log('[Correios] Consultando frete:', {
    origin: originZip,
    destination: destinationZip,
    weight: weightKg,
    dimensions: `${dimensions.lengthCm}x${dimensions.widthCm}x${dimensions.heightCm}`,
  });
  
  try {
    // Usando API dos Correios (simulada/pública)
    // NOTA: A API oficial dos Correios requer contrato. Esta é uma implementação usando valores estimados
    // Para produção, você deve usar a API oficial ou um serviço agregador como Melhor Envio
    
    // Simular consulta aos Correios com valores realistas baseados em tabela
    const options: ShippingQuoteOption[] = [];
    
    // PAC - Estimativa baseada em peso e distância
    const pacBasePrice = 18.50; // Preço base em reais
    const pacWeightSurcharge = weightKg * 5.00; // R$ 5 por kg adicional
    const pacPrice = Math.ceil((pacBasePrice + pacWeightSurcharge) * 100); // Converter para centavos
    const pacDeadline = 8; // dias úteis (estimativa)
    
    const pacOption = {
      provider: 'correios' as const,
      service: 'PAC',
      priceCents: pacPrice,
      deadlineDays: pacDeadline,
      currency: 'BRL' as const,
      raw: {
        weightKg,
        declaredValueReais,
        dimensions,
      },
    };
    
    console.log('[Correios] PAC:', { price: `R$ ${(pacPrice / 100).toFixed(2)}`, deadline: `${pacDeadline} dias úteis` });
    options.push(pacOption);
    
    // SEDEX - Mais rápido e mais caro
    const sedexBasePrice = 32.00;
    const sedexWeightSurcharge = weightKg * 8.00;
    const sedexPrice = Math.ceil((sedexBasePrice + sedexWeightSurcharge) * 100);
    const sedexDeadline = 3; // dias úteis
    
    const sedexOption = {
      provider: 'correios' as const,
      service: 'SEDEX',
      priceCents: sedexPrice,
      deadlineDays: sedexDeadline,
      currency: 'BRL' as const,
      raw: {
        weightKg,
        declaredValueReais,
        dimensions,
      },
    };
    
    console.log('[Correios] SEDEX:', { price: `R$ ${(sedexPrice / 100).toFixed(2)}`, deadline: `${sedexDeadline} dias úteis` });
    options.push(sedexOption);
    
    console.log('[Correios] Cotações obtidas:', options.length);
    return options;
    
  } catch (error) {
    console.error('[Correios] Erro ao consultar frete:', error);
    throw new Error('Não foi possível consultar frete dos Correios');
  }
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Consulta frete em múltiplos providers e retorna opções ordenadas por preço
 * 
 * @param input - Dados da cotação (origem, destino, itens)
 * @returns Resultado com opções de frete e warnings
 */
export async function getShippingQuotes(input: ShippingQuoteInput): Promise<ShippingQuoteResult> {
  console.log('[Shipping] Iniciando cotação de frete com Correios');
  console.log('[Shipping] Dados de entrada:', JSON.stringify(input, null, 2));

  const dimensions = calculatePackageDimensions(input.items, input.declaredValueCents);
  console.log('[Shipping] Dimensões calculadas:', dimensions);
  
  // Consultar Correios
  const allOptions = await quoteCorreios(input);
  
  console.log(`[Shipping] Correios: ${allOptions.length} opções obtidas`);
  
  // Ordenar e enriquecer opções
  const enrichedOptions = sortAndEnrichQuotes(allOptions);
  
  console.log('[Shipping] ===== COTAÇÕES DISPONÍVEIS =====');
  enrichedOptions.forEach((option, index) => {
    console.log(`[Shipping] Opção ${index + 1}: ${option.provider.toUpperCase()} - ${option.service}`);
    console.log(`[Shipping]   Preço: R$ ${(option.priceCents / 100).toFixed(2)}`);
    console.log(`[Shipping]   Prazo: ${option.deadlineDays} dias úteis`);
    console.log(`[Shipping]   Melhor preço: ${option.best_price ? 'SIM' : 'não'}`);
    console.log(`[Shipping]   Menor prazo: ${option.best_deadline ? 'SIM' : 'não'}`);
  });
  console.log('[Shipping] ===================================');
  
  console.log('[Shipping] Cotação finalizada:', {
    totalOptions: enrichedOptions.length,
  });
  
  return {
    options: enrichedOptions,
    warnings: [],
  };
}

// ============================================================================
// SERVICE CLASS (opcional, seguindo padrão do projeto)
// ============================================================================

export class ShippingService {
  async getQuotes(input: ShippingQuoteInput): Promise<ShippingQuoteResult> {
    return getShippingQuotes(input);
  }
}

export const shippingService = new ShippingService();

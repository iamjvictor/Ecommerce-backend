import { ProductsRepository } from '../repositories/products';
import { Product } from '../types';
import { storageService } from '../lib/storage';

export class ProductsService {
  private repository: ProductsRepository;

  constructor() {
    this.repository = new ProductsRepository();
  }

  async list() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    return this.repository.findWithVariants(id);
  }

  /**
   * Busca todas as imagens de um produto baseado no image_url (pasta)
   */
  async getImages(id: string): Promise<string[]> {
    const product = await this.repository.findById(id);
    if (!product || !product.image_url) {
      return [];
    }
    
    // image_url contém o caminho da pasta (ex: "Camisa2")
    return storageService.listImages(product.image_url);
  }

  async create(product: Partial<Product>) {
    return this.repository.create(product);
  }

  async update(id: string, product: Partial<Product>) {
    return this.repository.update(id, product);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }
}

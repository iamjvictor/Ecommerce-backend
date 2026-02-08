import { ProductsRepository } from '../repositories/products';
import { Product } from '../types';

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

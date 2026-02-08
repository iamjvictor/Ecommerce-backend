import { Request, Response } from 'express';
import { ProductsService } from '../services/products';

export class ProductsController {
  private service: ProductsService;

  constructor() {
    this.service = new ProductsService();
  }

  list = async (req: Request, res: Response) => {
    const products = await this.service.list();
    return res.json(products);
  };

  getById = async (req: Request, res: Response) => {
    const product = await this.service.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    return res.json(product);
  };

  create = async (req: Request, res: Response) => {
    const product = await this.service.create(req.body);
    return res.status(201).json(product);
  };

  update = async (req: Request, res: Response) => {
    const product = await this.service.update(req.params.id, req.body);
    return res.json(product);
  };

  delete = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    return res.status(204).send();
  };
}

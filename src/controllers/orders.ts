import { Response } from 'express';
import { OrdersService } from '../services/orders';
import { AuthRequest } from '../lib/authMiddleware';

export class OrdersController {
  private service: OrdersService;

  constructor() {
    this.service = new OrdersService();
  }

  list = async (req: AuthRequest, res: Response) => {
    const orders = await this.service.list(req.user!.id);
    return res.json(orders);
  };

  getById = async (req: AuthRequest, res: Response) => {
    const order = await this.service.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    return res.json(order);
  };

  create = async (req: AuthRequest, res: Response) => {
    const { shipping_address } = req.body;
    const order = await this.service.createFromCart(req.user!.id, shipping_address);
    return res.status(201).json(order);
  };
}

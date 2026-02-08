import { Response } from 'express';
import { CartService } from '../services/cart';
import { AuthRequest } from '../lib/authMiddleware';

export class CartController {
  private service: CartService;

  constructor() {
    this.service = new CartService();
  }

  get = async (req: AuthRequest, res: Response) => {
    const cart = await this.service.getOrCreateCart(req.user!.id);
    return res.json(cart);
  };

  addItem = async (req: AuthRequest, res: Response) => {
    const { variant_id, quantity, unit_price } = req.body;
    const item = await this.service.addItem(
      req.user!.id,
      variant_id,
      quantity,
      unit_price
    );
    return res.status(201).json(item);
  };

  updateItem = async (req: AuthRequest, res: Response) => {
    const { quantity } = req.body;
    const item = await this.service.updateItem(req.params.id, quantity);
    return res.json(item);
  };

  removeItem = async (req: AuthRequest, res: Response) => {
    await this.service.removeItem(req.params.id);
    return res.status(204).send();
  };
}

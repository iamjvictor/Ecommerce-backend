import { Response } from 'express';
import { PaymentsService } from '../services/payments';
import { AuthRequest } from '../lib/authMiddleware';

export class PaymentsController {
  private service: PaymentsService;

  constructor() {
    this.service = new PaymentsService();
  }

  create = async (req: AuthRequest, res: Response) => {
    const { order_id, method } = req.body;
    const payment = await this.service.create(order_id, method);
    return res.status(201).json(payment);
  };

  confirm = async (req: AuthRequest, res: Response) => {
    const payment = await this.service.confirm(req.params.id);
    return res.json(payment);
  };

  getById = async (req: AuthRequest, res: Response) => {
    const payment = await this.service.getById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }
    return res.json(payment);
  };
}

import { Request, Response } from 'express';
import { AuthService } from '../services/auth';
import { AuthRequest } from '../lib/authMiddleware';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  signup = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    const data = await this.service.signup(email, password, name);
    return res.status(201).json(data);
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const data = await this.service.login(email, password);
    return res.json(data);
  };

  logout = async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    await this.service.logout(token);
    return res.json({ message: 'Logout realizado com sucesso' });
  };

  me = async (req: AuthRequest, res: Response) => {
    const user = await this.service.getCurrentUser(req.user!.id);
    return res.json(user);
  };
}

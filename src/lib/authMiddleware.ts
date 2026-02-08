import { Request, Response, NextFunction } from 'express';
import { supabase } from './supabase';
import { AppError } from '../errors/AppError';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Token não fornecido', 401);
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AppError('Token inválido ou expirado', 401);
  }

  req.user = {
    id: user.id,
    email: user.email!,
  };

  next();
};

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ZodError } from 'zod';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação',
      errors: error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  console.error('Unexpected error:', error);

  return res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor',
  });
};

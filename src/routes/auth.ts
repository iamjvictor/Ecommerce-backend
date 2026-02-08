import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { authMiddleware } from '../lib/authMiddleware';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema } from '../schemas/auth';

const router = Router();
const controller = new AuthController();

router.post('/signup', validate(signupSchema), controller.signup);
router.post('/login', validate(loginSchema), controller.login);
router.post('/logout', controller.logout);
router.get('/me', authMiddleware, controller.me);

export default router;

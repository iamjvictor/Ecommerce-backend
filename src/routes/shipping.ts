import { Router } from 'express';
import { shippingController } from '../controllers/shipping';

const router = Router();

/**
 * POST /api/shipping/quote
 * Retorna cotações de frete para os itens e destino fornecidos
 * 
 * Body:
 * {
 *   "originZip": "01310-100",
 *   "destinationZip": "20040-020",
 *   "items": [{
 *     "quantity": 1,
 *     "weightGrams": 300,
 *     "heightCm": 10,
 *     "widthCm": 20,
 *     "lengthCm": 15,
 *     "priceCents": 5000
 *   }],
 *   "declaredValueCents": 5000 // opcional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "options": [
 *       {
 *         "provider": "correios",
 *         "service": "PAC",
 *         "priceCents": 1850,
 *         "deadlineDays": 8,
 *         "currency": "BRL",
 *         "best_price": true,
 *         "best_deadline": false
 *       }
 *     ],
 *     "warnings": []
 *   }
 * }
 */
router.post('/quote', shippingController.quote.bind(shippingController));

export default router;

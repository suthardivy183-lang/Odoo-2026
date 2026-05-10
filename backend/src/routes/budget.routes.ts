import { Router } from 'express';
import { getBudget, updateBudget } from '../controllers/budget.controller';
import { authMiddleware } from '../middleware/auth';

// Nested under /api/trips/:tripId/budget  (mergeParams)
const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/',  getBudget);
router.put('/',  updateBudget);

export default router;

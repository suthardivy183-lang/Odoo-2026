import { Router } from 'express';
import { list, create, remove } from '../controllers/expense.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/', list);
router.post('/', create);
router.delete('/:expenseId', remove);

export default router;

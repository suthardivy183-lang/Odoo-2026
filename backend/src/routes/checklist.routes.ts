import { Router } from 'express';
import { list, add, update, toggle, remove, reset } from '../controllers/checklist.controller';
import { authMiddleware } from '../middleware/auth';

// Nested under /api/trips/:tripId/checklist  (mergeParams)
const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/',                    list);
router.post('/',                   add);
router.put('/:itemId',             update);
router.patch('/:itemId/toggle',    toggle);
router.patch('/reset',             reset);
router.delete('/:itemId',          remove);

export default router;

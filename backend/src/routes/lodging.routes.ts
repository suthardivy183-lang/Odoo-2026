import { Router } from 'express';
import { create, list, remove, update } from '../controllers/lodging.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/', list);
router.post('/', create);
router.put('/:lodgingId', update);
router.delete('/:lodgingId', remove);

export default router;

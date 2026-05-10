import { Router } from 'express';
import { list, invite, remove } from '../controllers/member.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/', list);
router.post('/', invite);
router.delete('/:userId', remove);

export default router;

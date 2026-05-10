import { Router } from 'express';
import { add, list, update, remove, reorder, optimize } from '../controllers/stop.controller';
import { authMiddleware } from '../middleware/auth';

// mergeParams lets us access :tripId from the parent router
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/',            list);
router.post('/',           add);
router.patch('/reorder',   reorder);
router.post('/optimize',   optimize);
router.put('/:stopId',     update);
router.delete('/:stopId',  remove);

export default router;

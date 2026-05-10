import { Router } from 'express';
import { list, create, update, remove } from '../controllers/reservation.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/',                       list);
router.post('/',                      create);
router.put('/:reservationId',         update);
router.delete('/:reservationId',      remove);

export default router;

import { Router } from 'express';
import { list, create, update, remove } from '../controllers/notes.controller';
import { authMiddleware } from '../middleware/auth';

// Nested under /api/trips/:tripId/notes  (mergeParams)
const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/',          list);
router.post('/',         create);
router.put('/:noteId',   update);
router.delete('/:noteId', remove);

export default router;

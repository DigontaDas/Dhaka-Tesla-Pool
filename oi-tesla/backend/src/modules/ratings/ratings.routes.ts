import { Router, Response } from 'express';
import { store } from '../../services/store.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ride_request_id, to_user_id, score, comment } = req.body;
    const from_user_id = req.user!.id;

    if (!ride_request_id || !to_user_id || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'ride_request_id, to_user_id, and score (1-5) are required',
      });
    }

    const rating = store.addRating({
      ride_request_id,
      from_user_id,
      to_user_id,
      score: parseInt(score, 10),
      comment,
    });

    return res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: rating,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

export default router;

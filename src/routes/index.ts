import { Router } from 'express';
import categoryRoutes from './category.routes';
import reportRoutes from './report.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// API Routes
router.use('/categories', categoryRoutes);
router.use('/reports', reportRoutes);

export default router;

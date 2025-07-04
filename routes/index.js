import express from 'express';
import chatRoutes from './chat.routes.js';

const router = express.Router();
router.use('/chat', chatRoutes);
export default router;

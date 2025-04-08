import express from 'express';
import authRoutes from './auth/auth.js'
import salleRoutes from './salle/salle.js'

const router = express.Router();

router.use("/", [authRoutes, salleRoutes]);

export default router;

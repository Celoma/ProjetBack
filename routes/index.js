import express from 'express';
import authRoutes from './auth/auth.js'
import salleRoutes from './salle/salle.js'
import bookingRoutes from './booking/booking.js'

const router = express.Router();

router.use("/", [authRoutes, salleRoutes, bookingRoutes]);

export default router;

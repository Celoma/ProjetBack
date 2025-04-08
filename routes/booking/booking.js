import { PrismaClient } from '@prisma/client';
import express from 'express';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/rooms', async (req, res) => {
    const bookings = await prisma.reservation.findMany();
    res.json(bookings);
});

export default router;
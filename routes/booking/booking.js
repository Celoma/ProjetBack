import { PrismaClient } from '@prisma/client';
import express from 'express';
const router = express.Router();
const prisma = new PrismaClient();
import checkaccess from '../../authMiddleware.js';
import jwt from 'jsonwebtoken';


router.get('/booking', async (req, res) => {
    const jwtToken = req.cookies["jwtToken"];
    jwt.verify(jwtToken, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Non autorisé ici" });
        }
        const idUser = decoded.userId;
        const user = await prisma.user.findFirst({
            where: {
                id: idUser,
            }
        });
        if (user.roles === "admin") {
            const bookings = await prisma.reservation.findMany();
            return res.json(bookings);
        } else {
            const bookings = await prisma.reservation.findMany(
                {
                    where: {
                        userId: idUser,
                    },
                    include: {
                        salle: true,
                        user: true,
                    },
                }
            );
            return res.json(bookings);
        }
    });

});

export default router;
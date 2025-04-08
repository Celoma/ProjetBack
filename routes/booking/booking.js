import { PrismaClient } from '@prisma/client';
import express from 'express';
const router = express.Router();
const prisma = new PrismaClient();
import checkaccess from '../../authMiddleware.js';
import jwt from 'jsonwebtoken';

async function checkRules(startTime, endTime, salleId){
   const room = await prisma.salle.findUnique({
    where: { id: salleId },
   });

    if ("maxDurationMinutes" in room.rules) {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const duration = (endDate - startDate) / (1000 * 60); // Duration in minutes
        if (duration > room.rules.maxDurationMinutes) {
            return false;
        }
    } else if ("allowWeekends" in room.rules) {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const startDay = startDate.getDay();
        const endDay = endDate.getDay();
        if (startDay === 0 || endDay === 0 || startDay === 6 || endDay === 6) {
            return false;
        }
    } else if ("minAdvanceHours" in room.rules) {
        const now = new Date();
        const advanceTime = new Date(startTime);
        advanceTime.setHours(advanceTime.getHours() - room.rules.minAdvanceHours);
        if (now > advanceTime) {
            return false;
        }
    }
    return true;
}

router.get('/bookings', checkaccess("employee"), async (req, res) => {
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
            const bookings = await prisma.reservation.findMany(
                {
                    include: {
                        salle: true,
                        user: true,
                    },
                }
            );
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

router.post('/bookings', checkaccess("employee"), async (req, res) => {
        const {startTime, endTime, salleId} = req.body;
        if (!checkRules(startTime, endTime, salleId)) {
            return res.status(403).json({ message: "Cette réservation ne respecte pas les règles de la salle." });
        }

        const jwtToken = req.cookies["jwtToken"];
        jwt.verify(jwtToken, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Non autorisé ici" });
            }
            const idUser = decoded.userId;
            const booking = await prisma.reservation.create({
                data: {
                    startTime,
                    endTime,
                    salleId,
                    userId: idUser,
                },
            });
            res.status(201).json(booking);
        });
    }
);

export default router;
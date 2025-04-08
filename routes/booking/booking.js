import { PrismaClient } from '@prisma/client';
import express from 'express';
const router = express.Router();
const prisma = new PrismaClient();
import checkaccess from '../../authMiddleware.js';
import jwt from 'jsonwebtoken';
import { z } from "zod"
import zodValidator from '../../middleware/zodValdidator.js';

const schema = z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    salleId: z.number().int().positive() 
});

async function checkRules(startTime, endTime, salleId){
   const room = await prisma.salle.findUnique({
    where: { id: salleId}
   });

   const existingBooking = await prisma.reservation.findFirst({
        where: {
            salleId: salleId,
            OR: [
                { startTime: { lt: new Date(endTime) }, endTime: { gt: new Date(startTime) } }
            ]
        }
    });

    if (existingBooking) {
        return "La salle est déjà occupéee"; // Room is already booked
    }

    if ("maxDurationMinutes" in room.rules) {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const duration = (endDate - startDate) / (1000 * 60); // Duration in minutes
        if (duration > room.rules.maxDurationMinutes) {
            return "La durée de réservation est trop longue"; // Room is already booked
        }
    } 
    if ("allowWeekends" in room.rules) {
        if (!room.rules.allowWeekends) {
            const startDate = new Date(startTime);
            const endDate = new Date(endTime);
            const startDay = startDate.getDay();
            const endDay = endDate.getDay();
            if (startDay === 0 || endDay === 0 || startDay === 6 || endDay === 6) {
                return "Impossible de réservé un weekend"; // Room is already booked
            }
        }
    } 
    if ("minAdvanceHours" in room.rules) {
        const now = new Date();
        const advanceTime = new Date(startTime);
        advanceTime.setHours(advanceTime.getHours() - room.rules.minAdvanceHours);
        if (now > advanceTime) {
            return "Vous ne pouvez pas réservé moins de 3h avant le début de la réservation"; // Room is already booked
        }
    }
    return "Ok"; // Room is available
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

router.post('/bookings', checkaccess("employee"), zodValidator(schema), async (req, res) => {
        const {startTime, endTime, salleId} = req.body;
        await checkRules(startTime, endTime, salleId);
        const rulesCorrect = await (checkRules(startTime, endTime, salleId))
        if (rulesCorrect !== "Ok") {
            return res.status(400).json({ message: rulesCorrect });
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
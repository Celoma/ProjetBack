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


router.get('/rooms/:id/availability', async (req, res) => {
    const { id } = req.params; // Récupérer l'ID de la salle
    const { date } = req.query; // Récupérer la date à partir des paramètres de la requête

    try {
        // Vérifier que la date est valide
        if (!date) {
            return res.status(400).json({ message: "Veuillez fournir une date valide (YYYY-MM-DD)." });
        }

        const startOfDay = new Date(`${date}T00:00:00.000Z`); // Début de la journée
        const endOfDay = new Date(`${date}T23:59:59.999Z`); // Fin de la journée

        // Récupérer les réservations existantes pour la salle et la journée spécifiée
        const existingBookings = await prisma.reservation.findMany({
            where: {
                salleId: parseInt(id),
                startTime: { lte: endOfDay },
                endTime: { gte: startOfDay },
            },
            select: { startTime: true, endTime: true }, // Sélectionner uniquement les créneaux
        });

        // Définir les heures d'ouverture par défaut (par exemple 08h00 - 18h00)
        const openingTime = new Date(`${date}T08:00:00.000Z`);
        const closingTime = new Date(`${date}T18:00:00.000Z`);

        // Générer les créneaux disponibles
        const availableSlots = [];
        let currentTime = openingTime;

        // Boucle pour analyser les créneaux disponibles entre les réservations
        while (currentTime < closingTime) {
            const nextBooking = existingBookings.find(
                (booking) => new Date(booking.startTime) > currentTime
            );

            const nextTime = nextBooking ? new Date(nextBooking.startTime) : closingTime;

            if (currentTime < nextTime) {
                availableSlots.push({
                    start: currentTime,
                    end: nextTime,
                });
            }

            currentTime = nextBooking ? new Date(nextBooking.endTime) : closingTime;
        }

        res.json({ date, availableSlots });
    } catch (error) {
        console.error("Erreur lors de la récupération des créneaux disponibles :", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
});

export default router;
import { PrismaClient } from '@prisma/client';
import express from 'express';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/rooms', async (req, res) => {
    const rooms = await prisma.salle.findMany();
    res.json(rooms);
});

router.get('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const salle = await prisma.salle.findUnique({
        where: { id: parseInt(id) },
    });
    if (salle) {
        res.json(salle);
    } else {
        res.status(404).send(`Pas de salle avec l'id ${id}`);
    }
});

router.post('/rooms', async (req, res) => {
    const { name, capacity, equipments } = req.body;
    const newRoom = await prisma.salle.create({
        data: {
            name,
            capacity,
            equipments,
        },
    });
    res.status(201).json(newRoom);
});
export default router;
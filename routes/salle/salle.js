import { PrismaClient } from '@prisma/client';
import express from 'express';
import checkaccess from '../../authMiddleware.js';
import { z } from "zod";
import zodValidator from '../../middleware/zodValdidator.js';

const router = express.Router();
const prisma = new PrismaClient();

const schema = z.object({
    name: z.string().nonempty(), 
    capacity: z.number().int().positive(), 
    equipments: z.array(z.string().nonempty()) 
});

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

router.post('/rooms', checkaccess("admin"), zodValidator(schema), async (req, res) => {
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

router 
export default router;
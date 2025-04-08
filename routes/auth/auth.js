import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';


const router = express.Router();
const prisma = new PrismaClient();
router.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email: email },
    });

    const verifyPassword = async (password, hash) => {
        return await bcrypt.compare(password, hash);
    }

    const verifiedPassword = await verifyPassword(password, user.password)

    if (user && verifiedPassword) {
        const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        res.cookie("jwtToken", jwtToken, { httpOnly: true, secure: true });
        res.json(jwtToken);
    } else {
        res.status(401).json({ message: "Authentification échouée." });
    }
});


router.post("/auth/register", async (req, res) => {
    const { email, password, firstname, lastname, birthdate } = req.body;

    const hashPassword = async (password) => {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds)
    }

    const hashedPassword = await hashPassword(password)
    const birthdateISO = new Date(birthdate).toISOString();

    const newUser = await prisma.user.create ({
        data : {
            email,
            firstname,
            lastname,
            password: hashedPassword,
            birthdate: birthdateISO,
            profiles: {
                create: {
                  profile: { connect: { id:  2} },
                },
            },
        }
    })
    res.status(201).json(newUser);
});

export default router;

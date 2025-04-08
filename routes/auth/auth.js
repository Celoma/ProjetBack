import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const router = express.Router();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { z } from "zod"
import zodValidator from "../../middleware/zodValdidator.js";


const schemaRegister = z.object({
    email: z.string().nonempty(),    
    name: z.string().nonempty(),
    password: z.string().nonempty()
});

const schemaLogin = z.object({
    email: z.string().nonempty(),    
    password: z.string().nonempty()
});


router.post("/auth/login", zodValidator(schemaLogin) , async (req, res) => {
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


router.post("/auth/register", zodValidator(schemaRegister) ,async (req, res) => {
    try {
        //Créer un nouvel utilisateur
        const { email, password, name } = req.body;
    
        const hashPassword = async (password) => {
            const saltRounds = 10;
            return await bcrypt.hash(password, saltRounds)
        }
        const hashedPassword = await hashPassword(password)

        const newUser = await prisma.user.create ({
            data : {
                email,
                name,
                roles : "employee",
                password: hashedPassword,
            }
        })
    } catch (error) {
        console.error("Erreur lors de l'inscription", error);
        res.status(401).json({ message: "Erreur lors de l'inscription" });
    }
});

export default router;

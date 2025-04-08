import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Vérifie le profil de l'utilisateur et les profils autorisés
function checkaccess(roles) {
    return async (req, res, next) => {
        // Récupérer l'ID de l'utilisateur à partir du token
        const jwtToken = req.cookies["jwtToken"];
        jwt.verify(jwtToken, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Non autorisé ici" });
            }
            if (roles === "employee") {
                next();
            } else if (roles == "admin") {
            const idUser = decoded.userId;
            const user = await prisma.user.findFirst({
                where: {
                    id: idUser,
                }
            });
            if (!user.roles || user.roles != "admin") {
                return res.status(403).json({ message: "Accès refusé" });
                }
            next();
            }
        });
    };
}

export default checkaccess;
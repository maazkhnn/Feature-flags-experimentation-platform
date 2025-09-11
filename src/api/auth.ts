import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../db';
export const auth = Router();

auth.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'missing email/password'});

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) 
        return res.status(401).json({ error: 'invalid user' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) 
        return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET as string, { //because TS doesnt know if this var will be a string and jwt.sign requires only a string here
        expiresIn: '1d'
    });
    res.json({ token });
});

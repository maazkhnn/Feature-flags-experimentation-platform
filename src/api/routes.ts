import { Router } from 'express';
export const router = Router();

router.get('/', (req, res) => {
    res.send("we up");
});

router.post('/test', (req, res) => {
    res.status(200).json({ input: req.body });
});
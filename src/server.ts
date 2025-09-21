import express from 'express';
import { api } from './api/index';
import dotenv from 'dotenv'; // >node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
import cors from 'cors';

dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET","POST","PATCH","PUT","DELETE","OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));

//middleware
app.use(express.json())


//routes
app.use('/api', api);

//server
app.listen(port, () => {
    console.log(`Server working on http://localhost:${port}`);
});

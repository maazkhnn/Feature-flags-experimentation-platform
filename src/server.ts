import express from 'express';
import { api } from './api/index';
import dotenv from 'dotenv'; // >node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

//middleware
app.use(express.json())


//routes
app.use('/api', api);

//server
app.listen(port, () => {
    console.log(`Server working on http://localhost:${port}`);
});

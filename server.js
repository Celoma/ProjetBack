import cookieParser from 'cookie-parser'
import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';

dotenv.config();

const PORT = 3000

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use(routes)


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})


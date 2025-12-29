import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db/connection';
import router from './router';

dotenv.config();

const app = express();

app.use(cors({
  credentials: true,
}));

app.use(compression());
app.use(cookieParser());
app.use(express.json());

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`);
});

connectDB();

app.use('/', router());

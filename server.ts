import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

import { productRoutes, categoryRoutes } from './api';

dotenv.config({ path: './.env.sample' });

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(
  cors({
    origin: [process.env.PRODUCTION_URL ?? 'http://localhost:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

app.use(express.static('public'))

const httpServer = http.createServer(app);
httpServer.listen(process.env.HTTP_PORT, () => {
  console.log(`HTTP server started on port ${process.env.HTTP_PORT}`);
});

if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH && process.env.SSL_CA_PATH) {
  const key = readFileSync(process.env.SSL_KEY_PATH, 'utf8');
  const cert = readFileSync(process.env.SSL_CERT_PATH, 'utf8');
  const ca = readFileSync(process.env.SSL_CA_PATH, 'utf8');

  const credentials = { key, cert, ca };
  const httpsServer = https.createServer(credentials, app);

  httpsServer.listen(process.env.HTTPS_PORT, () => {
    console.log(`HTTPS server started on port ${process.env.HTTPS_PORT}`);
  });
}

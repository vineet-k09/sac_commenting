import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(helmet());

app.disable('x-powered-by');

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Compression
app.use(compression());

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/',(req,res) => {
    res.json({message: "The backend is running."})
})

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`${signal} received. Shutting down server gracefully...`);

  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
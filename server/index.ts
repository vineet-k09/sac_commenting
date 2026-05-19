import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import commentingRoutes from './src/modules/commenting/commenting.routes';
import path from 'path';
dotenv.config();

const app = express(); // returns express app instance - like returning a new instance of a class

app.use(helmet()); // Security headers

app.disable('x-powered-by'); // Hide Express signature

// CORS -> Cross Origin Resource Sharing zyx.com/api/
app.use(
  cors({
    origin: true, // Allow only these origins    
    credentials: true,
  })
);

// Compression
app.use(compression()); 

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true })); // %20 

const apiRouter = express.Router();
apiRouter.use('/', commentingRoutes); // /api/comment/add , /api/comment/getAll, etc.
// apiRouter.use('/', commentingRoutes); // /api/user/add , /api/comment/fetch, etc. 404, 405
app.use('/api', apiRouter);

// Serve static client files from dist/
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// API fallback handled above. For any other GET request, serve index.html (SPA)
app.get('/', (req, res) => {
  const indexFile = path.join(distPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    console.error('Error sending index.html:', err);
    if (err) {
      res.status(500).json({ message: 'The backend is running.' });
    }
  });
});

const PORT = process.env.PORT || 3000;
export var PROJECT_ID = process.env.PROJECT_ID;

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
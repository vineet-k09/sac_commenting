import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import path from 'path';

const PORT = process.env.PORT || 3000;
export var PROJECT_ID = process.env.PROJECT_ID;
export var DB_NAME = process.env.DB_NAME;
console.log("Project ID:", PROJECT_ID);
console.log("Dataset Name:", DB_NAME);

import commentingRoutes from './src/modules/commenting/commenting.routes';
import generationRoutes from './src/modules/generation/generation.routes';
import authRoutes from './src/modules/auth/auth.routes';

const app = express(); // returns express app instance - like returning a new instance of a class

app.use(
  helmet({
    frameguard: false, // Disables X-Frame-Options: SAMEORIGIN
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // Allow the app to be embedded. Replace "*" with your specific SAP domain for better security.
        "frame-ancestors": ["'self'", "*"],
      },
    },
  })
); // Security headers

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
app.use(express.urlencoded({ extended: true }));

const apiRouter = express.Router();
apiRouter.use('/', commentingRoutes); // /api/comment/add , /api/comment/getAll, etc.
apiRouter.use('/', generationRoutes);
apiRouter.use('/', authRoutes);
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

/*
<iframe 
  src="https://sac-commenting-..." 
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
*/
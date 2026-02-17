import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import uiRoutes from './routes/ui';
import agentRoutes from './routes/agent';
import './db/index'; // Initialize database connection

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/ui', uiRoutes);
app.use('/api/agent', agentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
  
  console.log(`Frontend static files served from ${frontendDistPath}`);
} else {
  console.warn(`Frontend dist folder not found at ${frontendDistPath}`);
  console.warn('Make sure to run: npm run build in the frontend directory');
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`UI endpoints: http://localhost:${PORT}/api/ui/*`);
  console.log(`Agent endpoints: http://localhost:${PORT}/api/agent/*`);
});

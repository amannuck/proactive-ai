import express from 'express';
import cors from 'cors';
import uiRoutes from './routes/ui';
import agentRoutes from './routes/agent';
import './db/index'; // Initialize database connection

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/ui', uiRoutes);
app.use('/api/agent', agentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`UI endpoints: http://localhost:${PORT}/api/ui/*`);
  console.log(`Agent endpoints: http://localhost:${PORT}/api/agent/*`);
});

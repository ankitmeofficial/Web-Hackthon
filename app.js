import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import reportRoutes from './routes/reportRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import patientRoutes from './routes/patientRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/patients', patientRoutes); // Patient list and details
app.use('/reports', reportRoutes); // Report viewing
app.use('/', chatRoutes); // Main chat interface - this should be last

// Make sure this comes AFTER other middleware but BEFORE error handlers
// app.use('/patients', patientRoutes);  
// app.use('/reports', reportRoutes);    

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
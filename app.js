import express from 'express';
import cors from 'cors';
import path from 'path';
import connectDB from './config/connectdb.js';
import userRoutes from './routes/userRoutes.js';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS Policy
app.use(cors());

// app.use(cors()
// Database Connection
connectDB(DATABASE_URL);

// JSON
app.use(express.json());

// Load Routes
app.use('/api/user', userRoutes);

// Manually set the path for static files
const customUploadsPath = 'C:\\Users\\91990\\OneDrive\\Desktop\\develope\\1ST_PROJECT\\uploads';
app.use('/uploads', express.static(customUploadsPath));

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

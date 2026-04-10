import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import itineraryRoutes from './routes/itinerary.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api', itineraryRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: "OK", message: "Roamly Backend Running" });
});

app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});

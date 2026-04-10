import { Router } from 'express';
import { generateItinerary, replanEvent, generateSurprise, generateNearMe, getPlanById } from '../controllers/itinerary.controller';

const router = Router();

router.post('/generate-itinerary', generateItinerary);
router.post('/replan-event', replanEvent);
router.get('/surprise', generateSurprise);
router.post('/near-me', generateNearMe);
router.get('/plan/:planId', getPlanById);

export default router;

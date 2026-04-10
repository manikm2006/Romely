import { Request, Response } from 'express';
import { z } from 'zod';
import { savePlan, getPlan, updatePlan, generateId } from '../services/storage.service';
import { generateItineraryFromAI, generateAlternativeEvent, generateSurpriseDestination, generateNearMeLocation } from '../services/ai.service';
import { getCoordinates } from '../services/places.service';
import { getWeatherForecast } from '../services/weather.service';

const generateSchema = z.object({
    origin: z.string().min(2),
    destination: z.string().min(2),
    transportMode: z.enum(['train', 'bus', 'cab', 'plane']),
    startDate: z.string(),
    endDate: z.string(),
    budget: z.union([z.string(), z.number()]),
    vibe: z.enum(["balanced", "foodie", "adventure", "culture", "chill"])
});

export const generateItinerary = async (req: Request, res: Response) => {
    try {
        const validated = generateSchema.parse(req.body);
        const { origin, destination, transportMode, startDate, endDate, budget, vibe } = validated;

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'AIzaSyAC6glPhz_4JcM5KGFFa2s1qysG4scjqe4_dummy') {
             return res.status(500).json({ error: "Missing valid GEMINI_API_KEY environment variable. Cannot call LLM." });
        }

        const coords = await getCoordinates(destination);
        
        let weatherContext = "";
        if (coords) {
            weatherContext = await getWeatherForecast(coords.lat, coords.lng, startDate, endDate);
        }

        const generatedData = await generateItineraryFromAI(
            origin,
            destination, 
            startDate, 
            endDate, 
            budget, 
            vibe, 
            transportMode,
            weatherContext
        );
        
        const planId = generateId();
        const fullPlan = { ...generatedData, planId, origin, transportMode }; // explicitly tag origin/mode into storage wrapper
        
        savePlan(fullPlan);

        return res.status(200).json(fullPlan);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: error.message });
    }
};

const replanSchema = z.object({
    planId: z.string(),
    eventIdToReplace: z.string(),
    rejectionReason: z.string().optional()
});

export const replanEvent = async (req: Request, res: Response) => {
    try {
        const validated = replanSchema.parse(req.body);
        const { planId, eventIdToReplace, rejectionReason } = validated;

        const plan = getPlan(planId);
        if (!plan) return res.status(404).json({ error: "Plan not found" });

        let targetEvent = null;
        let dayContext = null;

        for (const day of plan.days) {
            const evIndex = day.events.findIndex(e => e.id === eventIdToReplace);
            if (evIndex !== -1) {
                targetEvent = day.events[evIndex];
                dayContext = day;
                break;
            }
        }

        if (!targetEvent || !dayContext) {
            return res.status(404).json({ error: "Event not found inside plan" });
        }

        if (!process.env.GEMINI_API_KEY) {
             return res.status(500).json({ error: "Missing valid GEMINI_API_KEY environment variable. Cannot call LLM." });
        }

        const newEvent = await generateAlternativeEvent(targetEvent, dayContext, rejectionReason);
        
        const eventIndex = dayContext.events.findIndex(e => e.id === eventIdToReplace);
        dayContext.events[eventIndex] = newEvent;
        
        updatePlan(planId, plan);

        return res.status(200).json({ newEvent, fullPlan: plan });
    } catch (error: any) {
         if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: error.message });
    }
};

export const generateSurprise = async (req: Request, res: Response) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
             return res.status(500).json({ error: "Missing valid GEMINI_API_KEY environment variable." });
        }

        const surpriseData = await generateSurpriseDestination();
        return res.status(200).json(surpriseData);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

const nearMeSchemaValidation = z.object({
    lat: z.number(),
    lng: z.number()
});

export const generateNearMe = async (req: Request, res: Response) => {
    try {
        const validated = nearMeSchemaValidation.parse(req.body);
        const { lat, lng } = validated;

        if (!process.env.GEMINI_API_KEY) {
             return res.status(500).json({ error: "Missing valid GEMINI_API_KEY environment variable." });
        }

        const nearMeData = await generateNearMeLocation(lat, lng);
        return res.status(200).json(nearMeData);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: error.message });
    }
};

export const getPlanById = async (req: Request, res: Response) => {
    try {
        const { planId } = req.params;
        if (!planId) return res.status(400).json({ error: "Missing planId parameter" });

        const plan = getPlan(planId);
        if (!plan) return res.status(404).json({ error: "Plan not found or expired" });

        return res.status(200).json(plan);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

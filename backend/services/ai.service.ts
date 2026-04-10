import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Plan, Event, Day } from './storage.service';
import dotenv from 'dotenv';
dotenv.config();

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }); // Backend nodemon trigger

const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        totalEstimatedCost: { type: Type.NUMBER },
        destination: { type: Type.STRING },
        transportLogistics: {
            type: Type.OBJECT,
            properties: {
                estimatedTime: { type: Type.STRING },
                estimatedPrice: { type: Type.NUMBER },
                availabilityStatus: { type: Type.STRING }
            },
            required: ["estimatedTime", "estimatedPrice", "availabilityStatus"]
        },
        days: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    dayNumber: { type: Type.NUMBER },
                    date: { type: Type.STRING },
                    weatherInfo: { type: Type.STRING },
                    events: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING, description: "Generate a unique uuid format" },
                                time: { type: Type.STRING, description: "HH:MM AM/PM" },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                durationMinutes: { type: Type.NUMBER },
                                estimatedCost: { type: Type.NUMBER },
                                type: { type: Type.STRING },
                                lat: { type: Type.NUMBER, description: "Exact geographic latitude for this location" },
                                lon: { type: Type.NUMBER, description: "Exact geographic longitude for this location" }
                            },
                            required: ["id", "time", "title", "description", "durationMinutes", "estimatedCost", "type", "lat", "lon"]
                        }
                    }
                },
                required: ["dayNumber", "date", "weatherInfo", "events"]
            }
        }
    },
    required: ["totalEstimatedCost", "destination", "transportLogistics", "days"]
};

// Alternate event schema
const eventSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        time: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        durationMinutes: { type: Type.NUMBER },
        estimatedCost: { type: Type.NUMBER },
        type: { type: Type.STRING },
        lat: { type: Type.NUMBER, description: "Exact geographic latitude" },
        lon: { type: Type.NUMBER, description: "Exact geographic longitude" }
    },
    required: ["id", "time", "title", "description", "durationMinutes", "estimatedCost", "type", "lat", "lon"]
};

// Wrapper with exponential backoff for 503 high demand errors and auto-fallback for 404 model errors
const validModels = ['gemini-2.0-flash-lite-preview-02-05', 'gemini-2.0-flash-exp', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];

const callGeminiWithRetry = async (requestedModel: string, contents: string, schema: Schema, maxRetries = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await genai.models.generateContent({
                model: requestedModel,
                contents: contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                }
            });
            return response;
        } catch (error: any) {
            console.log(`[AI Service] Engine ${requestedModel} failed: ${error.message}`);
            
            // Check Quotas
            if (error.status === 429 || error.message?.includes('EXHAUSTED')) {
                console.log(`[AI Service] Quota exhausted on ${requestedModel}! Check your API limits.`);
                // If it's a hard 0 limit on experimental models, throwing immediately is sometimes better than looping for 10 minutes on an empty array.
                // However, we will try to wait out strict RPM limits here.
            }
            
            attempt++;
            if (attempt >= maxRetries) {
                throw new Error(`Failed to generate content: rate limits hit max retries on ${requestedModel}.`);
            }
            const waitTime = Math.pow(2, attempt) * 2000;
            console.log(`[AI Service] Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    throw new Error("Failed to generate content after max retries.");
};

export const generateItineraryFromAI = async (
    origin: string,
    destination: string, 
    startDate: string, 
    endDate: string, 
    budget: number | string, 
    vibe: string,
    transportMode: string,
    weatherContext: string
): Promise<Omit<Plan, 'planId' | 'origin' | 'transportMode'>> => {
    const prompt = `You are an expert travel agent specializing in India route logistics.
Create an itinerary from ${origin} to ${destination} spanning ${startDate} to ${endDate}. 
CRITICAL RULE: The destination MUST be located within India. If ${destination} is an international location outside India, you MUST gracefully pivot and create an itinerary for a similar cultural or thematic destination INSIDE India instead.

Traveler Logistics Constraints:
- Mode of Transport: ${transportMode}
- Total Budget limit: ₹${budget} INR.
- Desired Vibe: ${vibe}

${weatherContext ? weatherContext : ""}

AI TASK:
1. Estimate the transport logistics based on ${transportMode} from ${origin} to ${destination}. Provide the estimated Time (e.g. "4h 30m"), estimated Price per person in INR natively natively formatted as number, and Availability (e.g. "Frequent", "Sparse", "Requires early booking").
2. Account for weather. If it rains, schedule indoor activities. 
3. Return securely filling the schema. Type must be 'activity' or 'transport'.
4. VERY IMPORTANT: You MUST generate strict real-world 'lat' (latitude) and 'lon' (longitude) values for EVERY SINGLE EVENT. Do NOT leave them missing.`;

    const response = await callGeminiWithRetry('gemini-flash-latest', prompt, responseSchema);

    const output = response.text;
    if (!output) throw new Error("Null response from Gemini API");
    return JSON.parse(output);
};

export const generateAlternativeEvent = async (
    originalEvent: Event, 
    contextDay: Day, 
    rejectionReason?: string
): Promise<Event> => {
    const prompt = `You are a travel agent. Generate a single alternative event.
A user rejected this event on Day ${contextDay.dayNumber} avoiding weather: ${contextDay.weatherInfo}.
Rejected Event: ${JSON.stringify(originalEvent)}
Rejection Reason: ${rejectionReason || "Wants something different."}
Current Day Outline: ${JSON.stringify(contextDay.events.map(e => e.title))}

Provide a SINGLE new replacement event matching the same time slot, similar budget, and geographical bounds but distinct from rejected.
Make sure type is exactly "activity" or "transport". Provide accurate 'lat' and 'lon' coordinates!`;
    
    const response = await callGeminiWithRetry('gemini-flash-latest', prompt, eventSchema);

    const output = response.text;
    if (!output) throw new Error("Null response from Gemini API");
    return JSON.parse(output);
};

const surpriseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        destination: { type: Type.STRING, description: "City or location name" },
        description: { type: Type.STRING, description: "Why it's amazing to visit right now based on season/weather/uniqueness" },
        placesToVisit: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3 top distinct views, spots, or hidden gems there"
        },
        vibe: { type: Type.STRING, description: "One of: balanced, foodie, adventure, culture, chill" }
    },
    required: ["destination", "description", "placesToVisit", "vibe"]
};

export const generateSurpriseDestination = async () => {
    const prompt = `You are an expert Indian travel guru specializing in hidden gems.
Right now, randomly select exactly ONE highly unique or off-the-beaten-path destination in India that is particularly phenomenal to visit during the current season. Focus on hidden places, unbelievable views, or unique cultural festivals.
Return a structured JSON with:
1. 'destination': The location string.
2. 'description': Tell me WHY it's amazing to visit right now (mention weather, festivals, or hidden views).
3. 'placesToVisit': Array of 3 must-see spots there.
4. 'vibe': Assign the closest matching vibe (balanced, foodie, adventure, culture, chill).`;

    const response = await callGeminiWithRetry('gemini-flash-latest', prompt, surpriseSchema);
    
    const output = response.text;
    if (!output) throw new Error("Null response from Gemini API");
    return JSON.parse(output);
};
const nearMeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        detectedLocation: { type: Type.STRING, description: "Name of the neighborhood, city, or area based on the coordinates" },
        cafes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "Why it's highly rated or worth visiting" }
                },
                required: ["name", "description"]
            },
            description: "3 highly-rated or best local cafes exactly nearby"
        },
        funPlaces: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "Why it's fun or a hidden gem" }
                },
                required: ["name", "description"]
            },
            description: "3 absolutely fun activities, hidden places, or sightseeing spots exactly nearby"
        }
    },
    required: ["detectedLocation", "cafes", "funPlaces"]
};

export const generateNearMeLocation = async (lat: number, lng: number) => {
    const prompt = `You are a hyper-local tour guide and expert city explorer.
The user is physically currently standing at exact GPS coordinates: Latitude ${lat}, Longitude ${lng}.
First, accurately identify what specific city, district, or neighborhood this corresponds to.
Second, based ONLY on that exact real-world location area, immediately provide:
1. 3 of the BEST, highly-rated cafes nearby.
2. 3 FUN places, hidden gems, or cool activities to do right now exclusively in that exact region.

Return strictly as structured JSON following the schema.`;

    const response = await callGeminiWithRetry('gemini-flash-latest', prompt, nearMeSchema);
    
    const output = response.text;
    if (!output) throw new Error("Null response from Gemini API");
    return JSON.parse(output);
};

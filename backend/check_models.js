const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await genai.models.list();
        for await (const model of response) {
            console.log(model.name);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
check();

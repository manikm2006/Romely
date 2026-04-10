import axios from 'axios';

export const getCoordinates = async (destination: string) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return null;
    
    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(destination + ' India')}&key=${apiKey}`;
        const res = await axios.get(url);
        if (res.data && res.data.results && res.data.results.length > 0) {
            const loc = res.data.results[0].geometry.location;
            return { lat: loc.lat, lng: loc.lng };
        }
    } catch (err: any) {
        console.error("Places API Error: ", err.message);
    }
    return null;
};

import axios from 'axios';

export const getWeatherForecast = async (lat: number, lon: number, startDate: string, endDate: string) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return "";

    try {
        const url = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
        const res = await axios.get(url);
        
        let forecastString = "Live Forecast Context:\n";
        
        const list = res.data.list;
        if (!list || list.length === 0) return "";
        
        const dailyWeather = new Map<string, any>();
        list.forEach((item: any) => {
            const dateStr = item.dt_txt.split(' ')[0]; // Extract YYYY-MM-DD
            if (dateStr >= startDate && dateStr <= endDate) {
                // we prefer retaining mid-day temps, mapping sequentially
                if (!dailyWeather.has(dateStr)) {
                     dailyWeather.set(dateStr, { temp: item.main.temp, desc: item.weather[0].description });
                }
            }
        });
        
        if (dailyWeather.size === 0) return "Forecast outside current API 5-day horizon. Assume seasonal weather.";

        dailyWeather.forEach((val, key) => {
             forecastString += `- ${key}: ${val.desc}, ${val.temp}°F\n`;
        });
        
        return forecastString;
    } catch (err: any) {
        console.error("OpenWeather API Error: ", err.message);
        return "";
    }
};

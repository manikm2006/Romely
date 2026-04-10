import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface POI {
    id: number | string;
    lat: number;
    lon: number;
    name: string;
}

const getIcon = (color: string) => {
    return new L.DivIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

const FitBounds = ({ bounds }: { bounds: L.LatLngBoundsExpression | null }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
}

const InteractiveJourneyMap = ({ origin, destination, days }: { origin: string, destination: string, days: any[] }) => {
    const [bounds, setBounds] = useState<L.LatLngBoundsExpression | null>(null);
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    
    // Core Points
    const [originPoint, setOriginPoint] = useState<POI | null>(null);
    const [destPoint, setDestPoint] = useState<POI | null>(null);
    
    // AI Computed Activities
    const [activities, setActivities] = useState<POI[]>([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!destination || !origin) return;

        const populateMap = async () => {
            setLoading(true);
            try {
                // 1. Geocode Origin and Destination structurally via Nominatim
                const [origRes, destRes] = await Promise.all([
                    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin)}&format=json&limit=1`),
                    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`)
                ]);
                
                const origData = await origRes.json();
                const destData = await destRes.json();

                let oLat, oLon, dLat, dLon;

                if (origData && origData.length > 0) {
                    oLat = parseFloat(origData[0].lat);
                    oLon = parseFloat(origData[0].lon);
                    setOriginPoint({ id: 'origin', lat: oLat, lon: oLon, name: origData[0].display_name });
                }

                if (destData && destData.length > 0) {
                    dLat = parseFloat(destData[0].lat);
                    dLon = parseFloat(destData[0].lon);
                    setDestPoint({ id: 'dest', lat: dLat, lon: dLon, name: destData[0].display_name });
                }

                if (oLat && oLon && dLat && dLon) {
                    // 2. Extract all explicitly generated Lat/Lons from AI Plan
                    const extractedActivities: POI[] = [];
                    if (days && days.length > 0) {
                        days.forEach(day => {
                            if (day.events) {
                                day.events.forEach((ev: any) => {
                                    if (ev.lat && ev.lon) {
                                        extractedActivities.push({
                                            id: ev.id,
                                            lat: parseFloat(ev.lat),
                                            lon: parseFloat(ev.lon),
                                            name: ev.title
                                        });
                                    }
                                });
                            }
                        });
                        setActivities(extractedActivities);
                    }

                    // 3. Construct chronological Polyline: Origin -> Activities -> Destination
                    const chronologicalPath: [number, number][] = [
                        [oLat, oLon]
                    ];
                    
                    extractedActivities.forEach(act => {
                        chronologicalPath.push([act.lat, act.lon]);
                    });
                    
                    chronologicalPath.push([dLat, dLon]);
                    setRoutePath(chronologicalPath);
                    
                    // Set map bounds natively bounding the full journey block exactly
                    setBounds(chronologicalPath);
                }

            } catch (err) {
                console.error("Map Data Pipeline Failed", err);
            } finally {
                setLoading(false);
            }
        };

        populateMap();
    }, [origin, destination, days]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {loading && (
                <div style={{ position: 'absolute', top:0, left:0, right:0, bottom:0, background: 'rgba(255,255,255,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p className="font-bold text-slate-800 text-lg">Drawing Route Vectors & Activity Coordinates...</p>
                </div>
            )}
            
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap &copy; CARTO"
                />
                
                <FitBounds bounds={bounds} />

                {/* Draw Chronological Journey Line */}
                {routePath.length > 0 && (
                    <Polyline positions={routePath} color="#6366f1" weight={4} dashArray="5, 10" opacity={0.8} />
                )}

                {/* Primary Hubs */}
                {originPoint && (
                    <Marker position={[originPoint.lat, originPoint.lon]} icon={getIcon('#e11d48')}>
                        <Popup><strong>Start Hub</strong><br/>{originPoint.name}</Popup>
                    </Marker>
                )}
                
                {destPoint && (
                    <Marker position={[destPoint.lat, destPoint.lon]} icon={getIcon('#e11d48')}>
                        <Popup><strong>Destination Hub</strong><br/>{destPoint.name}</Popup>
                    </Marker>
                )}

                {/* All Destinations (Itinerary Activities) -> Indigo Fill */}
                {activities.map(act => (
                    <Marker key={act.id} position={[act.lat, act.lon]} icon={getIcon('#a855f7')}>
                        <Popup><strong>Itinerary Point</strong><br/>{act.name}</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default InteractiveJourneyMap;

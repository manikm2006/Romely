import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import InteractiveJourneyMap from '../components/InteractiveJourneyMap';
import NearMeModal from '../components/NearMeModal';

// Insert the provided Google Maps key here
const GOOGLE_MAPS_KEY = "AIzaSyDrp-u4hFCBBrvzCYaNuVFurg8btkvYEwM";

const Planner: React.FC = () => {
    const location = useLocation();
    const [step, setStep] = useState<'form' | 'loading' | 'itinerary'>('form');
    const [isNearMeOpen, setIsNearMeOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        origin: '',
        destination: location.state?.destination || '',
        transportMode: 'train',
        startDate: '',
        endDate: '',
        budget: '',
        vibe: location.state?.vibe || 'balanced'
    });

    useEffect(() => {
        if (location.state?.destination || location.state?.vibe) {
            setFormData(prev => ({
                ...prev,
                destination: location.state.destination || prev.destination,
                vibe: location.state.vibe || prev.vibe
            }));
        }
    }, [location.state]);

    const [planData, setPlanData] = useState<any>(null);
    const [loadingMessage, setLoadingMessage] = useState("Analyzing weather patterns...");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('loading');
        setLoadingMessage("Generating AI trip itinerary & mapping logistics... (Ensure API keys are set)");
        
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/generate-itinerary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (res.ok) {
                setPlanData(data);
                setStep('itinerary');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert("Generation Error: " + (data.error || "Unknown"));
                setStep('form');
            }
        } catch (err) {
            alert("Network Error: Could not connect to backend");
            setStep('form');
        }
    };

    const handleReplan = async (eventIdToReplace: string) => {
        if (!planData || !planData.planId) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/replan-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: planData.planId, eventIdToReplace })
            });
            const data = await res.json();
            
            if (res.ok) {
                setPlanData(data.fullPlan);
            } else {
                alert("Replan Error: " + JSON.stringify(data.error));
            }
        } catch (err) {
            alert("Network Error: Could not connect to backend");
        }
    };

    const getMapMode = (mode: string) => {
        if (mode === 'cab') return 'driving';
        if (mode === 'plane') return 'flying'; // default to driving if directions fail
        return 'transit'; // bus, train
    };

    return (
        <React.Fragment>
            <NearMeModal isOpen={isNearMeOpen} onClose={() => setIsNearMeOpen(false)} />
            
            {/* State 1: Input Form */}
            <section className={`planner-input-section ${step === 'form' ? 'active' : ''}`} style={{ display: step === 'form' ? 'block' : 'none' }}>
                <div className="container">
                    <div className="planner-header mt-[100px] flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h1>Design Your Journey</h1>
                            <p>Tell us what you want. Our AI will handle the logistics.</p>
                        </div>
                        <button onClick={() => setIsNearMeOpen(true)} className="mt-4 md:mt-0 px-6 py-2 bg-indigo-50 border border-indigo-200 hover:border-indigo-400 text-indigo-700 font-bold rounded-lg shadow-sm transition-all flex items-center gap-2">
                            📍 Near Me Right Now
                        </button>
                    </div>
                    
                    <form className="planner-form mt-8" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            
                            <div className="input-group">
                                <label htmlFor="origin">Starting Point</label>
                                <input type="text" id="origin" placeholder="e.g. Delhi, India" required value={formData.origin} onChange={handleInputChange} />
                            </div>

                            <div className="input-group">
                                <label htmlFor="destination">Where to?</label>
                                <input type="text" id="destination" placeholder="e.g. Goa, India" required value={formData.destination} onChange={handleInputChange} />
                            </div>
                            
                            <div className="input-group">
                                <label htmlFor="transportMode">Preferred Mode of Transport</label>
                                <select id="transportMode" required value={formData.transportMode} onChange={handleInputChange}>
                                    <option value="train">Train</option>
                                    <option value="bus">Bus</option>
                                    <option value="cab">Cab / Driving</option>
                                    <option value="plane">Plane / Flight</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Dates</label>
                                <div className="date-inputs">
                                    <input type="date" id="startDate" required value={formData.startDate} onChange={handleInputChange} />
                                    <span>to</span>
                                    <input type="date" id="endDate" required value={formData.endDate} onChange={handleInputChange} />
                                </div>
                            </div>
                            
                            <div className="input-group">
                                <label htmlFor="budget">Total Budget (INR)</label>
                                <input type="number" id="budget" placeholder="e.g. 50000" required value={formData.budget} onChange={handleInputChange} />
                            </div>
                            
                            <div className="input-group">
                                <label>Travel Vibe</label>
                                <select id="vibe" required value={formData.vibe} onChange={handleInputChange}>
                                    <option value="balanced">Balanced (A bit of everything)</option>
                                    <option value="foodie">Foodie (Culinary focus)</option>
                                    <option value="adventure">Adventure (Outdoors &amp; Thrills)</option>
                                    <option value="culture">Culture (History &amp; Arts)</option>
                                    <option value="chill">Chill (Relaxation &amp; Slow Pace)</option>
                                </select>
                            </div>
                        </div>
                        
                        <button type="submit" className="btn-primary planner-submit">Generate Itinerary</button>
                    </form>
                </div>
            </section>

            {/* State 2: AI Loading Overlay */}
            <div className={`ai-loading-overlay ${step === 'loading' ? 'active' : ''}`}>
                <div className="loading-content">
                    <div className="spinner"></div>
                    <h2>{loadingMessage}</h2>
                    <p>Creating your perfect, dynamic itinerary.</p>
                </div>
            </div>

            {/* State 3: Generated Itinerary */}
            <section className={`itinerary-section ${step === 'itinerary' ? 'active' : ''}`} style={{ display: step === 'itinerary' ? 'block' : 'none' }}>
                <div className="container mt-[100px]">
                    
                    {planData && (
                        <>
                            <div className="itinerary-header flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div>
                                    <h2>Your Trip to {planData.destination}</h2>
                                    <p>{formData.startDate} - {formData.endDate} &bull; <span className="vibe-badge">{formData.vibe}</span></p>
                                </div>
                                <div className="flex flex-col items-end gap-3 mt-4 md:mt-0">
                                    <div className="budget-tracker m-0">
                                        <span className="budget-label">Est. Cost</span>
                                        <span className="budget-amount">₹{planData.totalEstimatedCost} <span className="budget-total">/ ₹{formData.budget}</span></span>
                                    </div>
                                    <button 
                                        className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-bold rounded-lg border border-indigo-200 transition-colors flex items-center gap-2"
                                        onClick={() => {
                                            const url = `${window.location.origin}/shared/${planData.planId}`;
                                            navigator.clipboard.writeText(url);
                                            alert("Link fully copied directly to your clipboard! Paste it anywhere.");
                                        }}
                                    >
                                        🔗 Share This Journey
                                    </button>
                                </div>
                            </div>

                            {/* Logistics Overview & Map Block */}
                            <div className="logistics-overview bg-white shadow-xl rounded-2xl p-6 mb-8 mt-5 border border-gray-100 relative overflow-hidden">
                                <h3 className="text-xl font-bold text-[#141b4d] mb-4 flex items-center gap-2">
                                    <span>📍</span> Native POI Journey Map
                                </h3>
                                
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Native Map Engine */}
                                    <div className="flex-1 min-h-[400px] bg-slate-100 rounded-xl overflow-hidden shadow-inner border border-gray-200 relative z-0">
                                        <InteractiveJourneyMap 
                                            origin={formData.origin} 
                                            destination={planData.destination} 
                                            days={planData.days} 
                                        />
                                    </div>
                                    
                                    {/* Data Estimates */}
                                    {planData.transportLogistics && (
                                        <div className="lg:w-1/3 flex flex-col justify-center gap-4">
                                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Route Path</p>
                                                <p className="text-lg font-bold text-slate-800">{formData.origin} <span className="text-blue-500 mx-2">→</span> {planData.destination}</p>
                                            </div>

                                            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Mode &amp; Time</p>
                                                    <p className="text-lg font-bold text-slate-800 capitalize">{formData.transportMode}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-black text-orange-600">{planData.transportLogistics.estimatedTime}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Transport Estimate</p>
                                                <p className="text-2xl font-black text-slate-800">₹{planData.transportLogistics.estimatedPrice}</p>
                                                <p className="text-sm text-slate-500 mt-1 font-medium">{planData.transportLogistics.availabilityStatus}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* --- End Logistics Block --- */}

                            {planData.days?.map((day: any, dIndex: number) => (
                                <div className="itinerary-day" key={dIndex}>
                                    <div className="day-header">
                                        <h3>Day {day.dayNumber}</h3>
                                        <span className="weather-pill">{day.weatherInfo || "Clear Sky"}</span>
                                    </div>
                                    
                                    <div className="timeline">
                                        {day.events?.map((ev: any, eIndex: number) => {
                                            if (ev.type === 'transport') {
                                                return (
                                                    <div className="timeline-transport" key={ev.id || eIndex}>
                                                        <span>{ev.description || "Transport"} - ₹{ev.estimatedCost}</span>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="timeline-event" key={ev.id || eIndex}>
                                                        <div className="event-time">{ev.time}</div>
                                                        <div className="event-card">
                                                            <div className="event-details">
                                                                <h4>{ev.title}</h4>
                                                                <p>{ev.description}</p>
                                                                <div className="event-meta">
                                                                    <span>🕒 {ev.durationMinutes} mins</span>
                                                                    <span>💵 ₹{ev.estimatedCost}</span>
                                                                </div>
                                                            </div>
                                                            <div className="event-actions">
                                                                <button type="button" className="btn-replan" onClick={() => handleReplan(ev.id)}>
                                                                    <span className="icon">🔁</span> Re-plan
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <button className="btn-secondary" onClick={() => {
                            setStep('form');
                            setPlanData(null);
                        }}>Start Over</button>
                    </div>

                </div>
            </section>
        </React.Fragment>
    );
};

export default Planner;

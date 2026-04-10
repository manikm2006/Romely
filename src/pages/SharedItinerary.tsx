import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import InteractiveJourneyMap from '../components/InteractiveJourneyMap';

const SharedItinerary: React.FC = () => {
    const { planId } = useParams<{ planId: string }>();
    const [planData, setPlanData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/plan/${planId}`);
                const data = await res.json();
                
                if (res.ok) {
                    setPlanData(data);
                } else {
                    setErrorMsg(data.error || "Failed to load itinerary");
                }
            } catch (err) {
                setErrorMsg("Network Error: Could not connect to backend at http://localhost:8080");
            } finally {
                setLoading(false);
            }
        };

        if (planId) fetchPlan();
    }, [planId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className="text-2xl font-bold text-slate-800">Loading Journey...</h2>
                </div>
            </div>
        );
    }

    if (errorMsg || !planData) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-center max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl">
                    <span className="text-5xl block mb-4">⚠️</span>
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Journey Unavailable</h2>
                    <p className="text-slate-600 mb-6">{errorMsg || "This itinerary doesn't exist or has expired."}</p>
                    <Link to="/planner" className="btn-primary inline-block">Design Your Own Trip</Link>
                </div>
            </div>
        );
    }

    return (
        <section className="itinerary-section active" style={{ display: 'block', minHeight: '100vh', paddingBottom: '4rem' }}>
            <div className="container mt-[100px]">
                
                {/* Banner indicating this is a shared read-only view */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 mb-4 sm:mb-0">
                        <span className="text-2xl">👀</span>
                        <div>
                            <h4 className="font-bold text-indigo-900 leading-tight">Shared Read-Only View</h4>
                            <p className="text-sm text-indigo-600">You are viewing someone else's planned itinerary.</p>
                        </div>
                    </div>
                    <Link to="/" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all text-sm">
                        Create Yours Now
                    </Link>
                </div>

                <div className="itinerary-header">
                    <div>
                        <h2>Your Trip to {planData.destination}</h2>
                        <p>{/* We don't save literal raw Start/End dates in plan payload currently, but we can display the origin */}
                            From <span className="font-bold">{planData.origin}</span> &bull; <span className="vibe-badge capitalize">{planData.transportMode}</span>
                        </p>
                    </div>
                    <div className="budget-tracker">
                        <span className="budget-label">Est. Cost</span>
                        <span className="budget-amount">₹{planData.totalEstimatedCost}</span>
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
                                origin={planData.origin} 
                                destination={planData.destination} 
                                days={planData.days} 
                            />
                        </div>
                        
                        {/* Data Estimates */}
                        {planData.transportLogistics && (
                            <div className="lg:w-1/3 flex flex-col justify-center gap-4">
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Route Path</p>
                                    <p className="text-lg font-bold text-slate-800">{planData.origin} <span className="text-blue-500 mx-2">→</span> {planData.destination}</p>
                                </div>

                                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Mode &amp; Time</p>
                                        <p className="text-lg font-bold text-slate-800 capitalize">{planData.transportMode}</p>
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
                        
                        <div className="timeline bg-slate-50 p-6 rounded-b-xl border border-x-gray-200 border-b-gray-200">
                            {day.events?.map((ev: any, eIndex: number) => {
                                if (ev.type === 'transport') {
                                    return (
                                        <div className="timeline-transport border border-gray-300" key={ev.id || eIndex}>
                                            <span>{ev.description || "Transport"} - ₹{ev.estimatedCost}</span>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="timeline-event" key={ev.id || eIndex}>
                                            <div className="event-time bg-slate-800 text-white">{ev.time}</div>
                                            <div className="event-card border border-gray-200 shadow-md">
                                                <div className="event-details w-full">
                                                    <h4 className="text-indigo-900">{ev.title}</h4>
                                                    <p className="text-slate-600">{ev.description}</p>
                                                    <div className="event-meta mt-3">
                                                        <span className="bg-slate-100 text-slate-700">🕒 {ev.durationMinutes} mins</span>
                                                        <span className="bg-slate-100 text-green-700 font-bold">💵 ₹{ev.estimatedCost}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>
                ))}

                <div className="text-center mt-16 pb-8">
                    <h3 className="text-2xl font-black text-[#141b4d] mb-4">Inspired by this journey?</h3>
                    <p className="text-slate-500 mb-6 max-w-lg mx-auto">Build your own highly personalized travel itinerary natively optimized for weather, budget, and vibe using our generative AI engine.</p>
                    <Link to="/planner" className="btn-primary shadow-xl hover:-translate-y-1 transition-all">Start Your Own Plan Now 🚀</Link>
                </div>

            </div>
        </section>
    );
};

export default SharedItinerary;

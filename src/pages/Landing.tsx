import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NearMeModal from '../components/NearMeModal';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [milestonesVisible, setMilestonesVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('rajasthan');
    
    // Surprise Me State
    const [isSurprising, setIsSurprising] = useState(false);
    const [surpriseData, setSurpriseData] = useState<any>(null);

    // Near Me State
    const [isNearMeOpen, setIsNearMeOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            const heroBackgrounds = document.querySelector('.hero-backgrounds') as HTMLElement;
            if (heroBackgrounds) {
                heroBackgrounds.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const milestonesSection = document.querySelector('.milestones');
        if (milestonesSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setMilestonesVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });
            observer.observe(milestonesSection);
        }
    }, []);

    const renderMilestone = (target: number, label: string) => {
        return (
            <div className="milestone-item">
                <h3 className="milestone-number">
                    {milestonesVisible ? target.toLocaleString() : '0'}
                </h3>
                <span className="milestone-label">{label}</span>
            </div>
        );
    };

    const handleSurpriseClick = async () => {
        setIsSurprising(true);
        setSurpriseData(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/surprise`);
            const data = await res.json();
            if (res.ok) {
                setSurpriseData(data);
            } else {
                alert("Surprise AI Error: " + (data.error || "Failed to fetch destination"));
            }
        } catch (err) {
            alert("Network Error: Could not connect to backend");
        } finally {
            setIsSurprising(false);
        }
    };

    return (
        <div id="top" style={{ position: 'relative' }}>
            
            {/* SURPRISE ME MODAL */}
            {(isSurprising || surpriseData) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
                    <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative shadow-2xl overflow-hidden">
                        
                        <button 
                            onClick={() => { setIsSurprising(false); setSurpriseData(null); }} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl"
                        >
                            &times;
                        </button>
                        
                        {isSurprising ? (
                            <div className="text-center py-10">
                                <span className="text-6xl animate-bounce block mb-4">🌍</span>
                                <h3 className="text-2xl font-bold text-[#141b4d]">AI is scanning the globe...</h3>
                                <p className="text-slate-500 mt-2">Analyzing current weather, festivals, and hidden gems.</p>
                            </div>
                        ) : surpriseData ? (
                            <div className="text-center">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-4 uppercase tracking-widest">{surpriseData.vibe}</span>
                                <h2 className="text-4xl font-black text-[#141b4d] mb-4">{surpriseData.destination}</h2>
                                <p className="text-lg text-slate-700 font-medium mb-6 leading-relaxed italic border-l-4 border-indigo-500 pl-4 text-left">"{surpriseData.description}"</p>
                                
                                <div className="bg-slate-50 rounded-xl p-5 mb-8 text-left border border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Top Highlights To See</h4>
                                    <ul className="space-y-3">
                                        {surpriseData.placesToVisit?.map((place: string, i: number) => (
                                            <li key={i} className="flex items-start text-slate-800 font-medium whitespace-pre-wrap"><span className="text-indigo-500 mr-2 mt-1">✦</span> {place}</li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <button 
                                    className="btn-primary w-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                                    onClick={() => navigate('/planner', { state: { destination: surpriseData.destination, vibe: surpriseData.vibe } })}
                                >
                                    Plan This Trip 🚀
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
            
            {/* NEAR ME MODAL */}
            <NearMeModal isOpen={isNearMeOpen} onClose={() => setIsNearMeOpen(false)} />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-backgrounds">
                    <div className="hero-bg"></div>
                    <div className="hero-bg"></div>
                    <div className="hero-bg"></div>
                </div>
                <div className="container">
                    <div className="hero-content">
                        <h1>Plan Less.<br /><span>Roam More.</span></h1>
                        <p className="hero-subtitle">
                            AI-powered itineraries that adapt to your budget, weather, vibe, and real-time disruptions. Your personal travel concierge.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/planner" className="btn-primary">Start Planning</Link>
                            <button onClick={handleSurpriseClick} className="btn-secondary flex items-center justify-center gap-2">Surprise Me 🎲</button>
                            <button onClick={() => setIsNearMeOpen(true)} className="btn-secondary flex items-center justify-center gap-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 bg-indigo-50">📍 Near Me Right Now</button>
                        </div>
                        <div className="hero-stats">
                            <div className="hero-stat">
                                <span className="hero-stat-number">30s</span>
                                <span className="hero-stat-label">To Generate</span>
                            </div>
                            <div className="hero-stat">
                                <span className="hero-stat-number">17+</span>
                                <span className="hero-stat-label">Smart Features</span>
                            </div>
                            <div className="hero-stat">
                                <span className="hero-stat-number">∞</span>
                                <span className="hero-stat-label">Destinations</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features Section */}
            <section className="features" id="features">
                <div className="container">
                    <div className="section-header">
                        <h2>Core Intelligence</h2>
                        <p>AI that thinks about your trip the way you do — but faster, smarter, and 24/7.</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🎨</div>
                            <h3>Vibe-Based Planning</h3>
                            <p>Pick your mood — Foodie, Adventure, Cultural, Romantic, Backpacker — and the AI shapes every recommendation around it.</p>
                            <div className="feature-stats">
                                <div className="stat-item">
                                    <span className="stat-number">6+</span>
                                    <span className="stat-label">Vibes</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">0</span>
                                    <span className="stat-label">Forms</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">100%</span>
                                    <span className="stat-label">Personal</span>
                                </div>
                            </div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔁</div>
                            <h3>Dynamic Re-Planning</h3>
                            <p>Place closed? Raining? Skip any activity and the AI regenerates only the rest of your day — not the whole trip.</p>
                            <div className="feature-stats">
                                <div className="stat-item">
                                    <span className="stat-number">3s</span>
                                    <span className="stat-label">Re-plan</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">1</span>
                                    <span className="stat-label">Tap</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">∞</span>
                                    <span className="stat-label">Adapts</span>
                                </div>
                            </div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">⛅</div>
                            <h3>Weather-Aware</h3>
                            <p>7-day forecast baked in. Outdoor activities auto-shift to clear days. Rainy day? Museums and cafes take over.</p>
                            <div className="feature-stats">
                                <div className="stat-item">
                                    <span className="stat-number">7</span>
                                    <span className="stat-label">Day Forecast</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">Auto</span>
                                    <span className="stat-label">Adjust</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">0</span>
                                    <span className="stat-label">Ruined Days</span>
                                </div>
                            </div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">💰</div>
                            <h3>Budget Tracker</h3>
                            <p>Set your total budget. Every activity, meal, and ride shows estimated cost. Real-time running total with over-budget warnings.</p>
                            <div className="feature-stats">
                                <div className="stat-item">
                                    <span className="stat-number">Live</span>
                                    <span className="stat-label">Tracking</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">₹/$</span>
                                    <span className="stat-label">Multi-Currency</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">⚠️</span>
                                    <span className="stat-label">Alerts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works" id="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <h2>How Roamly Works</h2>
                        <p>From idea to itinerary in four simple steps.</p>
                    </div>
                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">01</div>
                            <div className="step-content">
                                <h3>Tell Us Your Vibe</h3>
                                <p>Enter your destination, dates, budget, and pick your travel mood. Or just hit "Surprise Me" and let the AI take the wheel.</p>
                            </div>
                        </div>
                        <div className="step-card">
                            <div className="step-number">02</div>
                            <div className="step-content">
                                <h3>AI Builds Your Trip</h3>
                                <p>Our AI engine cross-references weather forecasts, Google Places, and your preferences to generate a day-by-day itinerary with costs, timings, and transport options.</p>
                            </div>
                        </div>
                        <div className="step-card">
                            <div className="step-number">03</div>
                            <div className="step-content">
                                <h3>Explore & Customize</h3>
                                <p>View your plan on an interactive map. Switch transport modes, check budget breakdowns, and explore nearby recommendations — all in real time.</p>
                            </div>
                        </div>
                        <div className="step-card">
                            <div className="step-number">04</div>
                            <div className="step-content">
                                <h3>Adapt & Share</h3>
                                <p>Re-plan on the fly if things change. Share via WhatsApp, export as PDF, or send a public link — no login needed to view.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Milestones Section */}
            <section className="milestones">
                <div className="container">
                    <div className="milestones-grid">
                        {renderMilestone(10000, 'Trips Planned')}
                        {renderMilestone(500, 'Destinations Covered')}
                        {renderMilestone(25000, 'Happy Travelers')}
                        {renderMilestone(98, 'Satisfaction Rate %')}
                    </div>
                </div>
            </section>
            
            {/* Explore India Section */}
            <section className="explore-india" id="explore">
                <div className="container">
                    <div className="section-header">
                        <h2>Explore India</h2>
                        <p>Pick a state. Discover the best places. Let Roamly plan your trip.</p>
                    </div>

                    <div className="state-tabs">
                        <button className={`state-tab ${activeTab === 'rajasthan' ? 'active' : ''}`} onClick={() => setActiveTab('rajasthan')}>Rajasthan</button>
                        <button className={`state-tab ${activeTab === 'goa' ? 'active' : ''}`} onClick={() => setActiveTab('goa')}>Goa</button>
                        <button className={`state-tab ${activeTab === 'kerala' ? 'active' : ''}`} onClick={() => setActiveTab('kerala')}>Kerala</button>
                        <button className={`state-tab ${activeTab === 'himachal' ? 'active' : ''}`} onClick={() => setActiveTab('himachal')}>Himachal Pradesh</button>
                    </div>

                    <div className="state-content">
                        <div className={`state-pane ${activeTab === 'rajasthan' ? 'active' : ''}`}>
                            <div className="places-grid">
                                <div className="place-card">
                                    <div className="place-image" style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.3), rgba(10,10,10,0.8))' }}></div>
                                    <div className="place-info">
                                        <h3>Jaipur</h3>
                                        <p className="place-highlight">The Pink City</p>
                                        <p className="place-desc">Amber Fort, Hawa Mahal, City Palace, Nahargarh Fort, and vibrant bazaars filled with handicrafts and street food.</p>
                                    </div>
                                    <a href="#" className="place-cta" onClick={(e) => { e.preventDefault(); navigate('/planner', { state: { destination: 'Jaipur, Rajasthan', vibe: 'culture' } }); }}>
                                        <span className="place-price">3 Days</span>
                                        <span className="place-link">Plan This Trip &rarr;</span>
                                    </a>
                                </div>
                                <div className="place-card">
                                    <div className="place-image" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.3), rgba(10,10,10,0.8))' }}></div>
                                    <div className="place-info">
                                        <h3>Udaipur</h3>
                                        <p className="place-highlight">City of Lakes</p>
                                        <p className="place-desc">Lake Pichola, City Palace, Jag Mandir, and romantic sunset boat rides surrounded by Aravalli hills.</p>
                                    </div>
                                    <a href="#" className="place-cta" onClick={(e) => { e.preventDefault(); navigate('/planner', { state: { destination: 'Udaipur, Rajasthan', vibe: 'chill' } }); }}>
                                        <span className="place-price">2 Days</span>
                                        <span className="place-link">Plan This Trip &rarr;</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className={`state-pane ${activeTab === 'goa' ? 'active' : ''}`}>
                            <div className="places-grid">
                                <div className="place-card">
                                    <div className="place-image" style={{ background: 'linear-gradient(135deg, rgba(46,204,113,0.3), rgba(10,10,10,0.8))' }}></div>
                                    <div className="place-info">
                                        <h3>North Goa</h3>
                                        <p className="place-highlight">Party &amp; Beaches</p>
                                        <p className="place-desc">Baga Beach, Anjuna Flea Market, Aguada Fort, Calangute, nightlife at Tito's Lane, and beach shacks.</p>
                                    </div>
                                    <a href="#" className="place-cta" onClick={(e) => { e.preventDefault(); navigate('/planner', { state: { destination: 'Goa', vibe: 'chill' } }); }}>
                                        <span className="place-price">3 Days</span>
                                        <span className="place-link">Plan This Trip &rarr;</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Roam?</h2>
                        <p>Let AI plan your perfect trip in under 30 seconds. Weather-smart. Budget-aware. Endlessly adaptable.</p>
                        <div className="cta-buttons">
                            <Link to="/planner" className="btn-primary">Start Planning Now</Link>
                            <a href="#features" className="btn-secondary">Learn More</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;

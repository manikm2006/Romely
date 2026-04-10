import React, { useState } from 'react';

interface NearMeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NearMeModal: React.FC<NearMeModalProps> = ({ isOpen, onClose }) => {
    const [isLocating, setIsLocating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [nearMeData, setNearMeData] = useState<any>(null);

    // If modal is unmounted or closed early, we reset states underneath
    React.useEffect(() => {
        if (isOpen && !nearMeData && !isLocating && !errorMsg) {
            startLocationSearch();
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsLocating(false);
        setErrorMsg('');
        setNearMeData(null);
        onClose();
    };

    const startLocationSearch = () => {
        setIsLocating(true);
        setErrorMsg('');

        if (!navigator.geolocation) {
            setErrorMsg("Geolocation is completely disabled or unsupported in this browser.");
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const res = await fetch('http://localhost:8080/api/near-me', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lat: latitude, lng: longitude })
                    });

                    const data = await res.json();

                    if (res.ok) {
                        setNearMeData(data);
                    } else {
                        setErrorMsg("AI Generation Error: " + (data.error || "Failed to parse boundary."));
                    }
                } catch (err) {
                    setErrorMsg("Network Error: Could not reach Roamly Cloud at http://localhost:8080.");
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => {
                let msg = "";
                switch(err.code) {
                    case err.PERMISSION_DENIED: msg = "You denied the request for Geolocation."; break;
                    case err.POSITION_UNAVAILABLE: msg = "Location information is completely unavailable."; break;
                    case err.TIMEOUT: msg = "The request to get user location timed out."; break;
                    default: msg = "An unknown tracking error occurred."; break;
                }
                setErrorMsg(msg);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
            <div className="max-w-5xl w-full relative" style={{ backgroundColor: 'var(--concrete)', border: '1px solid var(--border)', clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}>
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-6 text-gray-400 hover:text-white font-bold text-2xl transition-colors z-10 bg-transparent border-none"
                >
                    &times;
                </button>
                <div className="p-8 max-h-[90vh] overflow-y-auto">

                {errorMsg && (
                    <div className="text-center py-10">
                        <span className="text-5xl block mb-4">⚠️</span>
                        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--industrial-red)', fontFamily: "'Bebas Neue', sans-serif" }}>Location Rejected</h3>
                        <p style={{ color: 'var(--light-gray)' }}>{errorMsg}</p>
                        <button onClick={startLocationSearch} className="mt-6 btn-primary">Try Again</button>
                    </div>
                )}

                {isLocating && !errorMsg && (
                    <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 border-4 rounded-full animate-spin mb-6" style={{ borderColor: 'var(--steel)', borderTopColor: 'var(--industrial-orange)' }}></div>
                        <h3 className="text-2xl font-bold" style={{ color: 'var(--white)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>GPS Lock Acquired...</h3>
                        <p className="mt-2" style={{ color: 'var(--light-gray)' }}>Gemini AI is analyzing your exact neighborhood radius.</p>
                    </div>
                )}

                {nearMeData && !isLocating && !errorMsg && (
                    <div>
                        <div className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
                            <span className="inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 uppercase tracking-widest" style={{ backgroundColor: 'var(--black)', color: 'var(--industrial-orange)', border: '1px solid var(--industrial-red)' }}>
                                📍 Live Local Guide
                            </span>
                            <h2 className="text-3xl font-black" style={{ color: 'var(--white)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                                Surrounding <span style={{ color: 'var(--industrial-red)' }}>{nearMeData.detectedLocation}</span>
                            </h2>
                            <p className="mt-2" style={{ color: 'var(--light-gray)' }}>We mapped your exact coordinates. Here is what is explicitly around you right now.</p>
                        </div>

                        <div className="space-y-8">
                            {/* Cafes */}
                            <div>
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--white)' }}>
                                    ☕ Best Rated Cafes
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {nearMeData.cafes?.map((cafe: any, i: number) => (
                                        <div key={i} className="p-4 transition" style={{ backgroundColor: 'var(--black)', border: '1px solid var(--border)', clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}>
                                            <h4 className="font-bold text-lg mb-1" style={{ color: 'var(--industrial-orange)' }}>{cafe.name}</h4>
                                            <p className="text-sm leading-relaxed" style={{ color: 'var(--light-gray)' }}>{cafe.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Fun Places */}
                            <div>
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--white)' }}>
                                    🗺️ Hidden Gems &amp; Fun Spots
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {nearMeData.funPlaces?.map((spot: any, i: number) => (
                                        <div key={i} className="p-4 transition" style={{ backgroundColor: 'var(--black)', border: '1px solid var(--border)', clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}>
                                            <h4 className="font-bold text-lg mb-1" style={{ color: 'var(--industrial-orange)' }}>{spot.name}</h4>
                                            <p className="text-sm leading-relaxed" style={{ color: 'var(--light-gray)' }}>{spot.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default NearMeModal;

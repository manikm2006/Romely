import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuActive, setMenuActive] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => {
        setMenuActive(!menuActive);
    };

    const isPlanner = location.pathname === '/planner';
    const navStyle = (scrolled || isPlanner) 
        ? { background: 'rgba(10, 10, 10, 0.98)' } 
        : { background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.8) 100%)' };

    return (
        <nav style={navStyle}>
            <div className="nav-container">
                <Link to="/" className="logo">
                    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="#E63946" strokeWidth="2.5"/>
                        <path d="M12 20 Q16 10 20 14 Q24 18 28 8" fill="none" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round"/>
                        <circle cx="12" cy="20" r="2.5" fill="#E63946"/>
                        <circle cx="20" cy="14" r="2.5" fill="#E63946"/>
                        <circle cx="28" cy="8" r="2.5" fill="#FF6B35"/>
                    </svg>
                    ROAMLY
                </Link>
                <ul className={`nav-links ${menuActive ? 'active' : ''}`}>
                    <li><Link to="/#features" className="nav-link" onClick={() => setMenuActive(false)}>Features</Link></li>
                    <li><Link to="/#how-it-works" className="nav-link" onClick={() => setMenuActive(false)}>How It Works</Link></li>
                    <li><Link to="/#explore" className="nav-link" onClick={() => setMenuActive(false)}>Explore</Link></li>
                </ul>
                <button className="login-btn">Login</button>
                <div className={`menu-toggle ${menuActive ? 'active' : ''}`} onClick={toggleMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;

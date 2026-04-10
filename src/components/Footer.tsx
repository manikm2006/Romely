import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer>
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>Product</h4>
                        <ul>
                            <li><a href="#features">Features</a></li>
                            <li><a href="#how-it-works">How It Works</a></li>
                            <li><a href="#explore">Explore India</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Company</h4>
                        <ul>
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Press</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Support</h4>
                        <ul>
                            <li><a href="#">Help Center</a></li>
                            <li><a href="#">Safety</a></li>
                            <li><a href="#">Cancellation Options</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <div className="footer-credits">
                        <p>&copy; 2026 Roamly. Plan Less. Roam More.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Planner from './pages/Planner';
import SharedItinerary from './pages/SharedItinerary';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
        <div className="loading-bar"></div>
        <Navigation />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/shared/:planId" element={<SharedItinerary />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

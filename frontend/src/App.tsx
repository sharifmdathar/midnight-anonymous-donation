import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import CreateCampaign from './pages/CreateCampaign';
import Campaign from './pages/Campaign';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/campaign/create" element={<CreateCampaign />} />
        <Route path="/campaign/:address" element={<Campaign />} />
      </Routes>
    </BrowserRouter>
  );
}

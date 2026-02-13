import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { WalletButton } from './components/WalletButton';
import Home from './pages/Home';
import CreateCampaign from './pages/CreateCampaign';
import Campaign from './pages/Campaign';

function NavBar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="url(#grad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="24" y2="24">
                <stop stopColor="#a855f7" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          AnonDonate
        </Link>
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link
            to="/campaign/create"
            className={`nav-link ${isActive('/campaign/create') ? 'active' : ''}`}
          >
            Campaigns
          </Link>
        </div>
        <WalletButton />
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <NavBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/campaign/create" element={<CreateCampaign />} />
            <Route path="/campaign/:address" element={<Campaign />} />
          </Routes>
        </main>
      </WalletProvider>
    </BrowserRouter>
  );
}

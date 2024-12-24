// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import TransactionForm from './pages/CreateTokens';
import MainPage from './pages/MainPage';
import { NetworkProvider } from './contexts/NetworkContext'; // Import NetworkProvider

function App() {
  return (
    <NetworkProvider>
      <div className='font-[inter]'>
        <Router>
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/transaction-form" element={<TransactionForm />} />
            <Route path="/app" element={<MainPage />} />          
          </Routes>
        </Router>
      </div>
    </NetworkProvider>
  );
}

export default App;

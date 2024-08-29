// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import TransactionForm from './components/TransactionForm';
import MainPage from './pages/MainPage';
import { NetworkProvider } from './contexts/NetworkContext'; // Import NetworkProvider

function App() {
  return (
    <NetworkProvider>
      <div className='font-Poppins'>
        <Router>
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/transaction-form" element={<TransactionForm />} />
            <Route path="/main-page" element={<MainPage />} />          
          </Routes>
        </Router>
      </div>
    </NetworkProvider>
  );
}

export default App;

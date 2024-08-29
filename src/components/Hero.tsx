// src/components/Hero.tsx

import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const handleLaunchApp = () => {
    navigate('/main-page');
  };

  return (
    <div className="h-screen relative flex overflow-hidden bg-hero-image bg-cover">
      <div className="absolute bottom-0 left-0 mb-12 ml-12 flex flex-col items-start space-y-4">
        <p className="text-white text-6xl mb-6 leading-tight">
          Secure,<br />transparent,<br />and capable of<br />multiple transactions.
        </p>
        <div className="">
          <button
            onClick={handleLaunchApp}
            className="relative px-6 py-3 text-lg font-medium text-white bg-transparent border border-white shadow-md transition duration-300 hover:bg-white hover:text-blue-950"
          >
            Launch app
          </button>
        </div>
      </div>

      <h1 className="absolute top-0 left-0 m-12 text-3xl font-medium text-white">
        Injective Multisender
      </h1>

      <div className="absolute top-0 right-0 mt-10 mr-12 flex items-center space-x-16">
        <a href="/docs" className="text-white text-xl">
          Docs
        </a>
        <div className="">
          <button
            onClick={handleLaunchApp}
            className="relative px-6 py-3 text-lg font-medium text-white bg-transparent border border-white shadow-md transition duration-300 hover:bg-white hover:text-blue-950"
          >
            About Us
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 mb-14 mr-12 flex space-x-12 align-top">
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <img src="src/assets/twitter.png" alt="Twitter" className="w-9" />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
          <img src="src/assets/github.png" alt="Instagram" className="w-9" />
        </a>
        <a href="https://medium.com" target="_blank" rel="noopener noreferrer">
          <img src="src/assets/medium.png" alt="Medium" className="w-9" />
        </a>
      </div>
    </div>
  );
};

export default Hero;

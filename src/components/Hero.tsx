import twitter from '../images/twitter.png';
import medium from '../images/medium.png';
import github from '../images/github.png';
import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.png'

const Hero = () => {
  const navigate = useNavigate();

  const handleLaunchApp = () => {
    navigate('/app');
  };

  return (
    <div className='h-[100vh] bg-gradient-to-b from-[#192DAD] to-custom-blue p-8 text-[#F3F6F1]'>
      <header className='flex justify-center'>
        <nav className='max-w-[1200px] w-full bg-navbar-bg rounded-full flex justify-between items-center  px-10 py-3 shadow-md'>
            <img src={logo} alt="logo image" className='w-8'/>
            <div className='flex justify-between min-w-[200px]'>
              <a href="/docs">Docs</a>            
              <a href='/about'>About Us</a>            
            </div>
            <button onClick={handleLaunchApp} className='border rounded-full py-2 px-4'>
                Get Started
            </button>
        </nav>
      </header>

      <main className='flex justify-center my-14'>
        <section className='text-center flex flex-col justify-center items-center'>
          <h1 className='text-6xl'>Secure, transparent and <br />capable of multiple transactions</h1>
          <p className='font-light py-10 tracking-[.01rem] leading-6 max-w-[800px]'>The all-in-one dApp for the Injective ecosystem! Easily send tokens to multiple recipients, create custom tokens, track your portfolio, and explore detailed stats on Injective holders—all in one seamless platform. Simplify your blockchain journey with us today!</p>
          <button onClick={handleLaunchApp} className='border rounded-full py-2 px-4'>
                Get Started
            </button>
        </section>
      </main>

      <div className="flex gap-8 justify-center items-center absolute bottom-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <img src={twitter} alt="Twitter" className="w-6" />
        </a>
        <a href="https://medium.com" target="_blank" rel="noopener noreferrer">
          <img src={medium} alt="medium" className="w-6" />
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
          <img src={github} alt="github" className="w-6" />
        </a>
      </div>
    </div>
  );
};

export default Hero;

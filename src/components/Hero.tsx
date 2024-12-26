import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.png'
import Footer from './Footer';

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

      <Footer />
    </div>
  );
};

export default Hero;

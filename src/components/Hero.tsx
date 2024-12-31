import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.png'
import Footer from './Footer';

const Hero = () => {
  const navigate = useNavigate();

  const handleLaunchApp = () => {
    navigate('/app');
  };

  return (
    <div className='bg-gradient-to-b from-[#192DAD] to-custom-blue p-8 text-[#F3F6F1] flex flex-col justify-between tablet:h-[100vh]'>
      <div>
      <header className=''>
        <nav className='w-full bg-navbar-bg rounded-full flex justify-between items-center shadow-md py-2 px-8'>
          <img src={logo} alt="logo image" className='w-8' />
          <div className='flex gap-6'>
            <a href="/docs">Docs</a>
            <a href='/about'>About Us</a>
          </div>
          <button onClick={handleLaunchApp} className='bg-[#F3F6F1] text-custom-blue border rounded-full py-2 px-6 font-medium tablet:hidden'>
            Get Started
          </button>
        </nav>
      </header>

      <main className='my-10 flex flex-col items-center'>
        <section className='text-center flex flex-col justify-center items-center'>
          <h1 className='tablet:text-3xl font-medium w-full text-5xl max-w-[900px]'>Secure, transparent and <br />capable of multiple transactions</h1>
          <button onClick={handleLaunchApp} className='bg-[#F3F6F1] text-custom-blue border rounded-full py-2 px-6 font-medium my-10'>
            Get Started
          </button>
          <p className='max-w-[900px]'>The all-in-one dApp for the Injective ecosystem! Easily send tokens to multiple recipients, create custom tokens, track your portfolio, and explore detailed stats on Injective holders—all in one seamless platform. Simplify your blockchain journey with us today!</p>
        </section>
        <section className='mt-8'>
          <video
            className="rounded-lg shadow-lg border-4"
            width="800"
            controls
            autoPlay
          >
            <source src="./src/images/Video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          </section>
      </main>
      </div>

      <Footer />
    </div>
  );
};

export default Hero;

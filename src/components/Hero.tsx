import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.png'
import Footer from './Footer';

const Hero = () => {
  const navigate = useNavigate();

  const handleLaunchApp = () => {
    navigate('/app');
  };

  return (
    <div className='h-full bg-gradient-to-b from-[#192DAD] to-custom-blue p-8 text-[#F3F6F1]'>
      <header className='flex justify-center'>
        <nav className='max-w-[1200px] w-full bg-navbar-bg rounded-full flex justify-between items-center  px-10 py-3 shadow-md'>
          <img src={logo} alt="logo image" className='w-8' />
          <div className='flex justify-between min-w-[200px]'>
            <a href="/docs">Docs</a>
            <a href='/about'>About Us</a>
          </div>
          <button onClick={handleLaunchApp} className='bg-[#F3F6F1] text-custom-blue border rounded-full py-2 px-6 font-medium'>
            Get Started
          </button>
        </nav>
      </header>

      <main className='grid justify-center my-20'>
        <section className='text-center flex flex-col justify-center items-center'>
          <h1 className='text-2xl font-medium sm:text-6xl min-w-[500px] sm:max-w-[1024px]'>Secure, transparent and <br />capable of multiple transactions</h1>
          <p className='font-light py-10 tracking-[.01rem] leading-6 max-w-[800px]'>The all-in-one dApp for the Injective ecosystem! Easily send tokens to multiple recipients, create custom tokens, track your portfolio, and explore detailed stats on Injective holders—all in one seamless platform. Simplify your blockchain journey with us today!</p>
          <button onClick={handleLaunchApp} className='bg-[#F3F6F1] text-custom-blue border rounded-full py-2 px-6 font-medium'>
            Get Started
          </button>
        </section>
        <section className='pt-10'>
          <video
            className="rounded-lg shadow-lg border-8"
            width="800"
            controls
            autoPlay
          >
            <source src="./src/images/Video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          </section>
      </main>

      <Footer />
    </div>
  );
};

export default Hero;

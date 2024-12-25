import React from 'react';
import { TbLayoutSidebarFilled, TbLayoutSidebarRightFilled } from "react-icons/tb";
import { GoStack } from "react-icons/go";
import { IoWalletOutline } from "react-icons/io5";
// import { GrTransaction } from "react-icons/gr";
import { FaCalculator } from "react-icons/fa6";
import { IoMdSettings } from "react-icons/io"; // Import icon for the new button

interface SidebarProps {
  setActiveOption: (option: string) => void;
  isWalletConnected: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveOption, isWalletConnected }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: string) => {
    if (isWalletConnected) {
      setActiveOption(option);
    } else {
      alert("Please connect your wallet to access this feature.");
    }
  };

  return (
    <div className={`relative  ${isOpen ? 'w-64' : 'w-16'} bg-[#F1F1F2] text-[#8E8F87] flex justify-center transition-all duration-300 font-[inter] font-medium border-[##8E8F87] border-r-2 `}>
      <button
        onClick={handleToggle}
        className="absolute top-4 right-4  text-white"
      >
        {isOpen ? <TbLayoutSidebarFilled className="text-3xl text-custom-blue" /> : <TbLayoutSidebarRightFilled className="text-3xl text-custom-blue" />}
      </button>
      <div className="flex flex-col mt-24 space-y-5">
        <button
          onClick={() => handleOptionClick('Multisender')}

          className={`flex items-center px-4 py-2 hover:bg-[#F0F0EF] m-2 rounded-md  ${!isWalletConnected && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isWalletConnected}
        >
          <GoStack className="text-2xl text-custom-blue" style={{ marginBottom: isOpen ? 0 : '0.5rem' }} />
          {isOpen && <span className="ml-6">Multisender</span>}
        </button>
        <button
          onClick={() => handleOptionClick('Token Holders')}
          className={`flex items-center px-4 py-2 hover:bg-[#F0F0EF] m-2 rounded-md ${!isWalletConnected && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isWalletConnected}
        >
          <IoWalletOutline className="text-2xl text-custom-blue" style={{ marginBottom: isOpen ? 0 : '0.5rem' }} />
          {isOpen && <span className="ml-6">Token Holders</span>}
        </button>
        <button
          onClick={() => handleOptionClick('Create Tokens')}
          className={`flex items-center px-4 py-2 hover:bg-[#F0F0EF] m-2 rounded-md ${!isWalletConnected && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isWalletConnected}
        >
          <IoWalletOutline className="text-2xl text-custom-blue" style={{ marginBottom: isOpen ? 0 : '0.5rem' }} />
          {isOpen && <span className="ml-6">Create Tokens</span>}
        </button>
        <button
          onClick={() => handleOptionClick('Gas Calculator')}
          className={`flex items-center px-4 py-2 hover:bg-[#F0F0EF] m-2 rounded-md ${!isWalletConnected && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isWalletConnected}
        >
          <FaCalculator className="text-2xl text-custom-blue" style={{ marginBottom: isOpen ? 0 : '0.5rem' }} />
          {isOpen && <span className="ml-6">Gas Calculator</span>}
        </button>
        {/* Settings Button Styled Like Other Buttons */}
        <button
          onClick={() => handleOptionClick('Injective Address')}
          className={`flex items-center px-4 py-2 hover:bg-[#F0F0EF] m-2 rounded-md ${!isWalletConnected && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isWalletConnected}
        >
          <IoMdSettings className="text-2xl text-custom-blue" style={{ marginBottom: isOpen ? 0 : '0.5rem' }} />
          {isOpen && <span className="ml-6">Injective Address</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

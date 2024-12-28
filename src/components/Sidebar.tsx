import React from 'react';
import { GoStack } from "react-icons/go";
import { IoWalletOutline } from "react-icons/io5";
import { IoMdSettings } from "react-icons/io";
import { FaArrowCircleRight, FaArrowCircleLeft } from "react-icons/fa";
import { PiCoinsFill } from "react-icons/pi";
import { FaGasPump } from "react-icons/fa";


interface SidebarProps {
  setActiveOption: (option: string) => void;
  isWalletConnected: boolean;
  activeoption: string;
}

const Sidebar: React.FC<SidebarProps> = ({ setActiveOption, isWalletConnected, activeoption }) => {
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
    <div className={`${isOpen ? 'w-72' : 'w-16'} bg-gradient-to-b from-[#192DAD] to-custom-blue text-[#fffffc]`}>
      <div className="flex flex-col w-full">
        <button
          onClick={handleToggle}
          className="flex items-center text-3xl px-4 py-3 hover:duration-500"
        >
          {isOpen ? <FaArrowCircleLeft/> : <FaArrowCircleRight />}
        </button>
        <button
          onClick={() => handleOptionClick('Multisender')}
          className={`flex items-center mt-12 px-4 py-5 hover:bg-[#fffffc] hover:duration-500  hover:text-custom-blue ${activeoption === "Multisender" ? "bg-[#fffffc] text-custom-blue": ""} ${!isWalletConnected && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isWalletConnected}
        >
          <GoStack className="text-2xl" />
          {isOpen && <span className="ml-6">Multisender</span>}
        </button>
        <button
          onClick={() => handleOptionClick('Token Holders')}
          className={`flex items-center px-4 py-5 hover:bg-[#fffffc] hover:duration-200 hover:text-custom-blue ${activeoption === "Token Holders" ? "bg-[#fffffc] text-custom-blue": ""} ${!isWalletConnected && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isWalletConnected}
        >
          <IoWalletOutline className="text-2xl"/>
          {isOpen && <span className="ml-6">Token Holders</span>}
        </button>
        <button
          onClick={() => handleOptionClick('Create Tokens')}
          className={`flex items-center px-4 py-5 hover:bg-[#fffffc] hover:duration-200 hover:text-custom-blue ${activeoption === "Create Tokens" ? "bg-[#fffffc] text-custom-blue": ""} ${!isWalletConnected && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isWalletConnected}
        >
          <PiCoinsFill  className="text-2xl"/>
          {isOpen && <span className="ml-6">Create Tokens</span>}
        </button>
        <button
          onClick={() => handleOptionClick('Gas Calculator')}
          className={`flex items-center px-4 py-5 hover:bg-[#fffffc] hover:duration-200 hover:text-custom-blue ${activeoption === "Gas Calculator" ? "bg-[#fffffc] text-custom-blue": ""} ${!isWalletConnected && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isWalletConnected}
        >
          <FaGasPump  className="text-2xl"/>
          {isOpen && <span className="ml-6">Gas Calculator</span>}
        </button>
        {/* Settings Button Styled Like Other Buttons */}
        <button
          onClick={() => handleOptionClick('Injective Address')}
          className={`flex items-center px-4 py-5 hover:bg-[#fffffc] hover:duration-200 hover:text-custom-blue ${activeoption === "Injective Address" ? "bg-[#fffffc] text-custom-blue": ""} ${!isWalletConnected && 'opacity-50 cursor-not-allowed'}`}
          disabled={!isWalletConnected}
        >
          <IoMdSettings className="text-2xl"/>
          {isOpen && <span className="ml-6">Injective Address</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

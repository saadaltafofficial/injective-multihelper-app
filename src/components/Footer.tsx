import { BsTwitterX } from "react-icons/bs";
import { FaMediumM } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="flex gap-8 justify-center items-center absolute bottom-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <BsTwitterX className="text-2xl"/>
            </a>
            <a href="https://medium.com" target="_blank" rel="noopener noreferrer">
            <FaMediumM className="text-2xl"/>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <FaGithub className="text-2xl"/>
            </a>
        </footer>
    )
}
export default Footer
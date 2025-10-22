import { Link } from "react-router-dom";
import HMlogo from "../assets/HMlogo.png";

export default function MainIcon({ size = 16 }) {


  return (
    <Link to="/" className={`border-primary/60 bg-surface flex h-${size} w-${size} overflow-hidden items-center justify-center rounded-full border shadow-sm`}>
      <img
        src={HMlogo}
        alt="HM Logo"
        className={`h-${size} w-${size} object-contain`}
      />
    </Link>
  )
}

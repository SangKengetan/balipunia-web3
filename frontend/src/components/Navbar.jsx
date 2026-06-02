import ConnectWallet from "./ConnectWallet";
import { Link, useNavigate } from "react-router-dom";
import useDonorAuth from "../hooks/useDonorAuth";

export default function Navbar({ address, onConnect }) {
  const { isDonorAuthenticated, donorName, logoutDonor } = useDonorAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutDonor();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black text-slate-800 tracking-wider hover:text-amber-500 transition-colors">
          BaliPunia
        </Link>

        <div className="flex items-center gap-8">
          <ul className="hidden md:flex gap-6 text-sm font-bold text-slate-700 items-center">
            <li>
              <Link to="/" className="hover:text-amber-500 transition-colors">Beranda</Link>
            </li>
            <li>
              <Link to="/pura" className="hover:text-amber-500 transition-colors">Daftar Pura</Link>
            </li>
            {isDonorAuthenticated ? (
              <>
                <li>
                  <Link to="/donor/dashboard" className="text-amber-600 hover:text-amber-700 transition-colors">Dashboard Donatur</Link>
                </li>
                <li>
                  <button 
                    onClick={handleLogout}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-xl transition-all"
                  >
                    Keluar ({donorName?.split(" ")[0]})
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/donor/login" className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-amber-100">
                  Masuk Donatur
                </Link>
              </li>
            )}
          </ul>

          <ConnectWallet address={address} onConnect={onConnect} />
        </div>
      </div>
    </nav>
  );
}

import { useState } from "react";
import ConnectWallet from "./ConnectWallet";
import { Link, useNavigate } from "react-router-dom";
import useDonorAuth from "../hooks/useDonorAuth";

export default function Navbar({ address, onConnect }) {
  const { isDonorAuthenticated, donorName, logoutDonor } = useDonorAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutDonor();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 flex items-center justify-between">
        <Link to="/" onClick={closeMenu} className="text-2xl font-black text-slate-800 tracking-wider hover:text-amber-500 transition-colors">
          BaliPunia
        </Link>

        {/* Hamburger Icon (Mobile) */}
        <button 
          className="md:hidden text-slate-800 focus:outline-none" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex gap-6 text-sm font-bold text-slate-700 items-center">
            <li><Link to="/" className="hover:text-amber-500 transition-colors">Beranda</Link></li>
            <li><Link to="/pura" className="hover:text-amber-500 transition-colors">Daftar Pura</Link></li>
            <li><Link to="/faq" className="hover:text-amber-500 transition-colors">FAQ</Link></li>
            
            {isDonorAuthenticated ? (
              <li className="relative group">
                <button className="text-gray-900 font-bold hover:text-amber-500 transition-colors flex items-center gap-1">
                  {donorName?.split(" ")[0]}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden">
                  <Link to="/donor/dashboard" className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600 font-semibold border-b border-gray-50">
                    Dashboard Donatur
                  </Link>
                  <button onClick={handleLogout} className="px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold text-left">
                    Keluar
                  </button>
                </div>
              </li>
            ) : (
              <li>
                <Link to="/donor/login" className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-4 py-2.5 rounded-xl transition-colors">
                  Masuk Donatur
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 top-full flex flex-col">
          <ul className="flex flex-col text-sm font-bold text-slate-700">
            <li>
              <Link to="/" onClick={closeMenu} className="block px-6 py-4 border-b border-gray-50 hover:bg-amber-50 hover:text-amber-600">Beranda</Link>
            </li>
            <li>
              <Link to="/pura" onClick={closeMenu} className="block px-6 py-4 border-b border-gray-50 hover:bg-amber-50 hover:text-amber-600">Daftar Pura</Link>
            </li>
            <li>
              <Link to="/faq" onClick={closeMenu} className="block px-6 py-4 border-b border-gray-50 hover:bg-amber-50 hover:text-amber-600">FAQ</Link>
            </li>

            {isDonorAuthenticated ? (
              <>
                <li>
                  <Link to="/donor/dashboard" onClick={closeMenu} className="block px-6 py-4 border-b border-gray-50 hover:bg-amber-50 hover:text-amber-600">Dashboard Donatur</Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="w-full text-left block px-6 py-4 text-red-600 hover:bg-red-50">Keluar</button>
                </li>
              </>
            ) : (
              <li className="p-4 bg-gray-50">
                <Link to="/donor/login" onClick={closeMenu} className="block w-full text-center bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-4 py-3 rounded-xl transition-colors shadow-sm">
                  Masuk Donatur
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

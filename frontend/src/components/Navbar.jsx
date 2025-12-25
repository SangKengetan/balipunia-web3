import ConnectWallet from "./ConnectWallet";

export default function Navbar({ address, onConnect }) {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          BaliPunia
        </h1>

        <div className="flex items-center gap-8">
          <ul className="hidden md:flex gap-6 text-sm font-medium text-slate-700">
            <li className="cursor-pointer">Beranda</li>
            <li className="cursor-pointer">Tata Cara</li>
            <li className="cursor-pointer">Daftar Pura</li>
          </ul>

          <ConnectWallet address={address} onConnect={onConnect} />
        </div>
      </div>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Bali<span className="text-yellow-400">Punia</span>
          </h2>
          <p className="text-sm leading-relaxed mb-6">
            Platform donasi transparan untuk pura dan kegiatan keagamaan Hindu di Bali, menggunakan teknologi Blockchain, Web3, IPFS, dan Payment Gateaway untuk akuntabilitas.
          </p>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4">Tautan Cepat</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-yellow-400 transition-colors">Beranda</a></li>
            <li><a href="/pura" className="hover:text-yellow-400 transition-colors">Daftar Pura</a></li>
            <li><a href="/faq" className="hover:text-yellow-400 transition-colors">Bantuan & FAQ</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4">Hubungi Kami</h3>
          <ul className="space-y-2 text-sm">
            <li>Email: support@balipunia.com</li>
            <li>Alamat: Denpasar, Bali, Indonesia</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm">
        &copy; {new Date().getFullYear()} BaliPunia. Seluruh Hak Cipta Dilindungi.
      </div>
    </footer>
  );
}

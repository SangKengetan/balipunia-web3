import useWallet from "../hooks/useWallet";
import Navbar from "../components/Navbar";
import bgHero from "../assets/BG-Hero.png";
import { useNavigate } from "react-router-dom";
import { showError } from "../utils/notification";


export default function Home() {
  const { address, connectWallet } = useWallet();
  const navigate = useNavigate();
  /**
   * Donasi:
   * - Tidak wajib wallet
   * - Wallet diminta nanti jika pilih on-chain
   */
  const handlePublic = () => {
    // contoh: nanti redirect ke /donate
    
    navigate("/pura");
  };

  /**
   * Daftarkan Pura:
   * - Wajib wallet
   * - Wallet = identitas admin
   */
  const handleRegisterPura = async () => {
    if (!address) {
      await connectWallet();
    }

    // address sekarang tersedia (atau user cancel)
    if (!address) {
      showError("Akses Ditolak", "Dompet Digital (Wallet) diperlukan untuk mendaftar.", "Silakan pastikan ekstensi MetaMask terinstal dan berikan izin saat diminta.");
      return;
    }

    // Simpan address sementara (nanti bisa ke context / session)
    sessionStorage.setItem("admin_wallet", address);

    // alert(`Wallet ${address} terhubung. Lanjut ke pendaftaran pura`);
    navigate("/register");
  };

  return (
    <div className="w-full min-h-screen">
      <Navbar address={address} onConnect={connectWallet} />

      {/* HERO */}
      <section
        className="relative w-full min-h-screen bg-cover bg-center flex items-center"
        style={{ backgroundImage: `url(${bgHero})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/35" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl px-8 pt-32 pb-24">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              <span className="text-(--punia-yellow)">
                Mepunia dengan Cara Baru,
              </span>
              <br />
              <span className="text-white">
                Tanpa Mengubah Makna
              </span>
            </h1>

            <p className="text-white/90 max-w-2xl mb-10 leading-relaxed">
              Platform digital pertama di Bali yang memastikan setiap rupiah dana
              punia Anda tercatat, dapat dilacak, dan sampai ke tujuan dengan
              penuh akuntabilitas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* DONASI: TANPA WALLET */}
              <button
                onClick={handlePublic}
                className="
                  bg-(--punia-yellow)
                  text-black
                  font-semibold
                  px-6
                  py-3
                  rounded-full
                  w-fit
                "
              >
                Salurkan Punia Sekarang
              </button>

              {/* DAFTAR PURA: WAJIB WALLET */}
              <button
                onClick={handleRegisterPura}
                className="
                  border-2
                  border-(--punia-yellow)
                  text-(--punia-yellow)
                  font-semibold
                  px-6
                  py-3
                  rounded-full
                  bg-transparent
                  w-fit
                "
              >
                Daftarkan Pura / Yayasan Anda
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLANATION SECTION */}
      <section className="w-full bg-white py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Mengapa Berdonasi Melalui Bali Punia?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Platform transparansi donasi pura di Bali yang memanfaatkan teknologi modern 
              untuk memastikan dana punia Anda tercatat secara aman dan dapat dipertanggungjawabkan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#FBBF24] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Transparan & Aman</h3>
              <p className="text-gray-600 text-sm">
                Setiap transaksi dicatat dan dilaporkan secara terbuka. Admin pura diwajibkan untuk 
                membuat laporan penggunaan dana yang bisa Anda pantau.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#FBBF24] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Mudah & Cepat</h3>
              <p className="text-gray-600 text-sm">
                Berdonasi hanya dengan beberapa klik. Mendukung berbagai metode pembayaran yang fleksibel sesuai kebutuhan Anda.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#FBBF24] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Pilihan Pembayaran</h3>
              <p className="text-gray-600 text-sm">
                Anda dapat memilih untuk mepunia menggunakan metode transfer bank atau 
                menggunakan teknologi blockchain (Kripto) untuk transparansi ekstra.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-2/3">
              <h3 className="text-2xl font-bold mb-6 text-[#FBBF24]">Bagaimana Mekanisme Mepunia?</h3>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <span className="bg-[#FBBF24] text-black font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4">1</span>
                  <div className="pt-1">
                    <strong className="block text-lg mb-1">Pilih Pura atau Program</strong>
                    <span className="text-gray-300">Telusuri daftar pura atau program pembangunan/upacara yang sedang membutuhkan dana.</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-[#FBBF24] text-black font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4">2</span>
                  <div className="pt-1">
                    <strong className="block text-lg mb-1">Tentukan Nominal & Metode</strong>
                    <span className="text-gray-300">Masukkan jumlah punia dan pilih metode yang Anda inginkan (Kripto atau Transfer Bank).</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-[#FBBF24] text-black font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4">3</span>
                  <div className="pt-1">
                    <strong className="block text-lg mb-1">Pantau Penyaluran Dana</strong>
                    <span className="text-gray-300">Lihat progres program dan laporan penggunaan dana yang diunggah oleh pengurus Pura secara berkala.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="md:w-1/3 flex justify-center">
               <button
                onClick={handlePublic}
                className="bg-[#FBBF24] text-black font-bold px-8 py-4 rounded-full hover:bg-yellow-400 transition transform hover:scale-105"
              >
                Mulai Mepunia
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

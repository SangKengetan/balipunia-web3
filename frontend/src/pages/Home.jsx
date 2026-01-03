import useWallet from "../hooks/useWallet";
import Navbar from "../components/Navbar";
import bgHero from "../assets/BG-Hero.png";
import { useNavigate } from "react-router-dom";


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
    
    navigate("/public/campaigns");
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
      alert("Wallet diperlukan untuk mendaftarkan pura");
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
    </div>
  );
}

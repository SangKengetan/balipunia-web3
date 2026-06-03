import { useState, useEffect } from "react";
import { createBankTransferPayment } from "../services/paymentApi";
import { showError, showInfo, showSuccess } from "../utils/notification";
import useDonorAuth from "../hooks/useDonorAuth";

// Daftar bank VA yang didukung
const BANKS = [
  { id: "bca", name: "BCA Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
  { id: "bri", name: "BRI Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg" },
  { id: "bni", name: "BNI Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg" },
  { id: "permata", name: "Permata Virtual Account", logo: "https://upload.wikimedia.org/wikipedia/id/f/f6/Bank_Permata.svg" },
  { id: "cimb", name: "CIMB Niaga VA", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/CIMB_Niaga_logo.svg" }
];

export default function OffchainDonateBox({ campaignId }) {
  const { donorName: loggedInName, donorToken } = useDonorAuth();
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("bca");

  // Identitas opsional
  const [donorName, setDonorName] = useState(loggedInName || "");
  const [donorMessage, setDonorMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [vaInfo, setVaInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  
  // Status Checking
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Helper: Format tampilan Rupiah
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Helper: Copy VA to clipboard
  const handleCopyVA = () => {
    if (vaInfo?.va_number) {
      navigator.clipboard.writeText(vaInfo.va_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval;
    if (vaInfo && !paymentSuccess && !isExpired) {
      // Setup expiry time (either from API or 30 mins from now)
      let expiryTime = vaInfo.expires_at ? new Date(vaInfo.expires_at.replace(" ", "T")).getTime() : new Date().getTime() + 30 * 60000;
      
      interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expiryTime - now;

        if (distance < 0) {
          clearInterval(interval);
          setTimeLeft("00:00");
          setIsExpired(true);
        } else {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [vaInfo, paymentSuccess, isExpired]);

  async function handleDonate() {
    const numAmount = parseInt(amount);
    if (!amount || numAmount < 10000) {
      showInfo("Minimal Donasi", "Mohon maaf, minimal donasi adalah Rp10.000");
      return;
    }

    setLoading(true);
    setIsExpired(false);
    setPaymentSuccess(false);
    
    try {
      const res = await createBankTransferPayment({
        campaign_id: campaignId,
        amount: Number(amount),
        bank,
        donor_name: donorName || null,
        donor_message: donorMessage || null,
        donor_wallet: null,
      });

      setVaInfo(res.data);
    } catch (error) {
      console.error(error);
      showError("Gagal Membayar", "Gagal membuat pembayaran. Silakan coba sesaat lagi.", "Periksa koneksi internet Anda atau hubungi dukungan jika masalah berlanjut.");
    } finally {
      setLoading(false);
    }
  }

  async function checkPaymentStatus() {
    if (!vaInfo?.order_id) return;
    
    setCheckingStatus(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/status/${vaInfo.order_id}`, {
        headers: {
          Authorization: `Bearer ${donorToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "SETTLED" || data.status === "PAID_LOCKED") {
          setPaymentSuccess(true);
          showSuccess("Pembayaran Berhasil!", "Terima kasih atas donasi Anda. Dana telah kami terima.");
        } else if (data.status === "EXPIRED" || data.status === "FAILED") {
          setIsExpired(true);
          showInfo("Pembayaran Gagal", "Waktu pembayaran telah kedaluwarsa atau dibatalkan.");
        } else {
          showInfo("Menunggu Pembayaran", "Kami belum menerima pembayaran Anda. Silakan selesaikan transfer lalu cek kembali.");
        }
      }
    } catch (err) {
      console.error(err);
      showError("Gagal Mengecek Status", "Silakan coba beberapa saat lagi.");
    } finally {
      setCheckingStatus(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
      {/* Header Visual Bar */}
      <div className="h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
      
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" /><path d="M5 21V7" /><path d="M19 21V7" /><path d="M4 7h16" /><path d="M10 21V7" /><path d="M14 21V7" /><path d="m12 2-8 5h16l-8-5Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-xl tracking-tight">
              Transfer Bank
            </h3>
            <p className="text-sm text-gray-400 font-medium">
              Otomatis & Praktis
            </p>
          </div>
        </div>

        {/* FORM INPUT SECTION (Disembunyikan jika VA sudah muncul) */}
        {!vaInfo ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* Nominal Input with RP Prefix */}
            <div className="space-y-2">
              <div className="flex justify-between px-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nominal Donasi</label>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Min Rp10.000</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-bold text-xl">Rp</span>
                </div>
                <input
                  type="number"
                  className="w-full bg-gray-50 border-2 border-transparent group-focus-within:border-blue-400 group-focus-within:bg-white pl-14 pr-4 py-4 text-2xl font-black text-gray-900 rounded-2xl transition-all outline-none placeholder-gray-300"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Bank Selection - Grid Layout with Logos */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Pilih Bank</label>
              <div className="grid grid-cols-2 gap-3">
                {BANKS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBank(b.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      bank === b.id 
                        ? "border-blue-500 bg-blue-50 shadow-sm" 
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-10 h-6 bg-white rounded flex items-center justify-center p-1 border border-gray-100 shadow-sm flex-shrink-0">
                       <img src={b.logo} alt={b.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <span className={`text-xs font-bold ${bank === b.id ? "text-blue-700" : "text-gray-600"}`}>
                      {b.id.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Optional Identity */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Pesan & Identitas (Opsional)</label>
              <input
                type="text"
                className="w-full px-4 py-3 text-sm font-medium bg-gray-50 border-2 border-transparent focus:border-blue-400 focus:bg-white rounded-xl transition-all outline-none placeholder-gray-400"
                placeholder="Nama Donatur"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
              <textarea
                className="w-full px-4 py-3 text-sm font-medium bg-gray-50 border-2 border-transparent focus:border-blue-400 focus:bg-white rounded-xl transition-all outline-none placeholder-gray-400 resize-none h-24"
                placeholder="Tulis doa atau pesan untuk kampanye ini..."
                value={donorMessage}
                onChange={(e) => setDonorMessage(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleDonate}
              disabled={loading || !amount}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:shadow-none flex justify-center items-center gap-3"
            >
              {loading ? (
                 <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                 </>
              ) : (
                 <>
                  <span>Lanjutkan Pembayaran</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                 </>
              )}
            </button>
          </div>
        ) : paymentSuccess ? (
          /* SUCCESS SECTION */
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-8 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-emerald-800 mb-2">Pembayaran Berhasil!</h3>
            <p className="text-sm text-emerald-600 mb-6 leading-relaxed">Terima kasih atas donasi Anda. Dana telah kami terima dan akan disalurkan.</p>
            <button
              onClick={() => { setVaInfo(null); setAmount(""); }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-sm"
            >
              Kembali
            </button>
          </div>
        ) : (
          /* RESULT / VA DISPLAY SECTION */
          <div className="bg-white rounded-2xl animate-in fade-in slide-in-from-right-4 duration-500">
            
            {/* Timer Banner */}
            <div className={`p-4 rounded-xl flex items-center justify-between mb-6 border ${isExpired ? 'bg-red-50 border-red-100 text-red-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
               <div className="flex items-center gap-2 font-bold">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                 <span className="text-sm">{isExpired ? "Waktu Habis" : "Selesaikan dalam"}</span>
               </div>
               <div className="text-xl font-black font-mono tracking-widest">{timeLeft || "00:00"}</div>
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 mb-6">
              <div className="flex justify-between items-start border-b border-dashed border-gray-300 pb-5 mb-5">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Donasi</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">
                    {formatRupiah(vaInfo.amount)}
                  </p>
                </div>
                <div className="w-14 h-10 bg-white rounded border border-gray-100 flex items-center justify-center p-1 shadow-sm">
                   <img src={BANKS.find(b => b.id === vaInfo.bank)?.logo} alt={vaInfo.bank} className="max-w-full max-h-full object-contain" />
                </div>
              </div>

              <div className="space-y-2 mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kode Pembayaran</p>
                <div className="flex items-center justify-between bg-white border border-blue-100 rounded-xl p-1 shadow-sm">
                  <code className="text-xl md:text-2xl font-mono font-black text-blue-700 tracking-widest pl-4">
                    {vaInfo.va_number}
                  </code>
                  <button 
                    onClick={handleCopyVA}
                    disabled={isExpired}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors font-bold text-xs disabled:opacity-50"
                  >
                    {copied ? "Tersalin!" : "Salin"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Cek Status Button */}
              <button
                onClick={checkPaymentStatus}
                disabled={checkingStatus}
                className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkingStatus ? "Mengecek..." : "Cek Status Pembayaran"}
              </button>

              {/* Midtrans Sandbox Button */}
              <a
                href="https://simulator.sandbox.midtrans.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all text-sm group"
              >
                <span>Panduan / Simulasi Pembayaran</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-gray-600"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>

              <button
                onClick={() => setVaInfo(null)}
                className="w-full py-3 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Batalkan dan Buat Baru
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
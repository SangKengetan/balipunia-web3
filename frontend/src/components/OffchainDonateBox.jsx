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
      showInfo("Minimal Punia", "Mohon maaf, minimal punia adalah Rp 10.000");
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
          showSuccess("Pembayaran Berhasil!", "Terima kasih atas punia Anda. Dana telah kami terima.");
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
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-5 md:p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3">Transfer Bank / Tunai</h3>

        {!vaInfo ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nominal Punia <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-lg font-medium"
                  placeholder="Minimal 10.000"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setAmount(val);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pilih Bank <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BANKS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBank(b.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                      bank === b.id 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="w-10 h-6 bg-white flex items-center justify-center p-0.5 rounded border border-gray-100 flex-shrink-0">
                       <img src={b.logo} alt={b.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {b.id.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Donatur (Opsional)</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                placeholder="Hamba Allah"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pesan / Doa (Opsional)</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors resize-none h-20"
                placeholder="Tulis pesan atau doa..."
                value={donorMessage}
                onChange={(e) => setDonorMessage(e.target.value)}
              />
            </div>

            <button
              onClick={handleDonate}
              disabled={loading || !amount || parseInt(amount) < 10000}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? "Memproses..." : "Lanjutkan Pembayaran"}
            </button>
          </div>
        ) : paymentSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h3>
            <p className="text-gray-600 mb-6 text-sm">Terima kasih atas punia Anda.</p>
            <button
              onClick={() => { setVaInfo(null); setAmount(""); }}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>
        ) : (
          <div>
            <div className={`p-3 rounded-lg flex items-center justify-between mb-5 border ${isExpired ? 'bg-red-50 border-red-200 text-red-600' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
               <span className="text-sm font-medium">{isExpired ? "Waktu Habis" : "Selesaikan dalam"}</span>
               <span className="font-mono font-bold text-lg">{timeLeft || "00:00"}</span>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">Total Tagihan</p>
                  <p className="text-xl font-bold text-gray-800">{formatRupiah(vaInfo.amount)}</p>
                </div>
                <div className="w-12 h-8 bg-white border border-gray-200 rounded p-1 flex items-center justify-center">
                  <img src={BANKS.find(b => b.id === vaInfo.bank)?.logo} alt={vaInfo.bank} className="max-h-full" />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Nomor Virtual Account</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white border border-gray-300 rounded-lg p-2 gap-2 overflow-hidden">
                  <code className="text-lg font-mono font-bold text-blue-700 px-2 break-all text-center sm:text-left w-full">
                    {vaInfo.va_number}
                  </code>
                  <button 
                    onClick={handleCopyVA}
                    disabled={isExpired}
                    className="flex-shrink-0 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-bold text-sm transition-colors disabled:opacity-50 border border-blue-200 w-full sm:w-auto"
                  >
                    {copied ? "Tersalin!" : "Salin VA"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={checkPaymentStatus}
                disabled={checkingStatus}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {checkingStatus ? "Mengecek..." : "Cek Status Pembayaran"}
              </button>
              
              <a
                href="https://simulator.sandbox.midtrans.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
              >
                Panduan / Simulasi
              </a>

              <button
                onClick={() => setVaInfo(null)}
                className="w-full py-2 mt-2 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
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
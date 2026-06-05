import { useState, useEffect } from "react";
import { createBankTransferPayment, createEwalletPayment } from "../services/paymentApi";
import { showError, showInfo, showSuccess } from "../utils/notification";
import useDonorAuth from "../hooks/useDonorAuth";

const BANKS = [
  { id: "bca", name: "BCA Virtual Account", logo: "/bca.png" },
  { id: "mandiri", name: "Mandiri Virtual Account", logo: "/mandiri.png" },
  { id: "bri", name: "BRI Virtual Account", logo: "/bri.png" },
  { id: "bni", name: "BNI Virtual Account", logo: "/bni.png" },
  { id: "permata", name: "Permata Virtual Account", logo: "/permata.png" },
  { id: "cimb", name: "CIMB Niaga VA", logo: "/cimb.png" },
  { id: "danamon", name: "Danamon Virtual Account", logo: "/danamon.png" },
  { id: "seabank", name: "SeaBank Virtual Account", logo: "/seabank.png" }
];

const PAYMENT_CATEGORIES = [
  { id: "qris", name: "QRIS", type: "ewallet", logo: "/qris.png" },
  { id: "gopay", name: "GoPay", type: "ewallet", logo: "/gopay.png" },
  { id: "bank_transfer", name: "Virtual Account", type: "bank", icon: "🏦" }
];

export default function OffchainDonateBox({ campaignId }) {
  const { donorName: loggedInName, donorToken } = useDonorAuth();
  const [amount, setAmount] = useState("");
  
  const [paymentMethod, setPaymentMethod] = useState("qris");
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
      // Setup expiry time (either from API or 15 mins from now)
      let expiryTime = vaInfo.expires_at ? new Date(vaInfo.expires_at.replace(" ", "T")).getTime() : new Date().getTime() + 15 * 60000;
      
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
      let res;
      if (paymentMethod === "bank_transfer") {
        res = await createBankTransferPayment({
          campaign_id: campaignId,
          amount: Number(amount),
          bank,
          donor_name: donorName || null,
          donor_message: donorMessage || null,
        });
      } else {
        res = await createEwalletPayment({
          campaign_id: campaignId,
          amount: Number(amount),
          payment_type: paymentMethod,
          donor_name: donorName || null,
          donor_message: donorMessage || null,
        });
      }

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
          showInfo("Menunggu Pembayaran", "Kami belum menerima pembayaran Anda. Silakan selesaikan pembayaran lalu cek kembali.");
        }
      }
    } catch (err) {
      console.error(err);
      showError("Gagal Mengecek Status", "Silakan coba beberapa saat lagi.");
    } finally {
      setCheckingStatus(false);
    }
  }

  // Get current actions if ewallet
  const qrAction = vaInfo?.actions?.find(a => a.name === 'generate-qr-code');
  const deeplinkAction = vaInfo?.actions?.find(a => a.name === 'deeplink-redirect');

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-5 md:p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-5 border-b border-gray-100 pb-3">Punia Tunai/Transfer</h3>

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
                Pilih Metode Pembayaran <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setPaymentMethod(cat.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      paymentMethod === cat.id 
                        ? "border-blue-500 bg-blue-50 text-blue-700" 
                        : "border-gray-100 hover:border-gray-300 bg-white text-gray-600"
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center">
                      {cat.logo ? (
                         <img src={cat.logo} alt={cat.name} className="max-w-[60px] max-h-full object-contain" referrerPolicy="no-referrer" onError={(e) => e.target.style.display='none'} />
                      ) : (
                         <span className="text-2xl">{cat.icon}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-center leading-tight">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "bank_transfer" && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                  Pilih Bank
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BANKS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBank(b.id)}
                      className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                        bank === b.id 
                          ? "border-blue-500 bg-blue-100" 
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="w-8 h-5 bg-white flex items-center justify-center rounded flex-shrink-0">
                         <img src={b.logo} alt={b.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" onError={(e) => e.target.style.display='none'} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {b.id.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            <button
              onClick={handleDonate}
              disabled={loading || !amount || parseInt(amount) < 10000}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
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

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">Total Tagihan</p>
                  <p className="text-xl font-bold text-gray-800">{formatRupiah(vaInfo.amount)}</p>
                </div>
                {vaInfo.payment_type === "bank_transfer" || !vaInfo.payment_type ? (
                   <div className="w-12 h-8 bg-white border border-gray-200 rounded p-1 flex items-center justify-center">
                     <img src={BANKS.find(b => b.id === vaInfo.bank)?.logo} alt={vaInfo.bank} className="max-h-full" referrerPolicy="no-referrer" onError={(e) => e.target.style.display='none'} />
                   </div>
                ) : (
                   <div className="w-16 h-8 bg-white border border-gray-200 rounded p-1 flex items-center justify-center">
                     <img src={PAYMENT_CATEGORIES.find(c => c.id === vaInfo.payment_type)?.logo} alt={vaInfo.payment_type} className="max-h-full object-contain" referrerPolicy="no-referrer" onError={(e) => e.target.style.display='none'} />
                   </div>
                )}
              </div>

              {vaInfo.va_number && (
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
              )}

              {vaInfo.payment_type !== "bank_transfer" && (
                <div className="flex flex-col items-center justify-center py-2">
                  {qrAction && (
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm inline-block mb-4">
                      <img src={qrAction.url} alt="QR Code" className="w-48 h-48 object-contain" />
                    </div>
                  )}
                  {deeplinkAction && (
                    <a 
                      href={deeplinkAction.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-[#00AED6] hover:bg-[#009bc0] text-white font-bold rounded-lg transition-colors text-center shadow-md mb-2"
                    >
                      Buka Aplikasi Gojek
                    </a>
                  )}
                  <p className="text-xs text-gray-500 text-center mt-2 px-4">
                    {vaInfo.payment_type === "qris" 
                      ? "Scan QR Code menggunakan aplikasi e-wallet atau mobile banking Anda."
                      : "Scan QR Code atau klik tombol di atas jika Anda membuka lewat HP."}
                  </p>
                </div>
              )}
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
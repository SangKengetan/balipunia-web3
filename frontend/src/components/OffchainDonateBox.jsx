import { useState } from "react";
import { createBankTransferPayment } from "../services/paymentApi";
import { showError, showInfo } from "../utils/notification";
import useDonorAuth from "../hooks/useDonorAuth";

export default function OffchainDonateBox({ campaignId }) {
  const { donorName: loggedInName } = useDonorAuth();
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("bni");

  // Identitas opsional
  const [donorName, setDonorName] = useState(loggedInName || "");
  const [donorMessage, setDonorMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [vaInfo, setVaInfo] = useState(null);
  const [copied, setCopied] = useState(false);

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

  async function handleDonate() {
    const numAmount = parseInt(amount);
    if (!amount || numAmount < 10000) {
      showInfo("Minimal Donasi", "Mohon maaf, minimal donasi adalah Rp10.000");
      return;
    }

    setLoading(true);
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

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          {/* Icon Bank / Building */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V7" />
            <path d="M19 21V7" />
            <path d="M4 7h16" />
            <path d="M10 21V7" />
            <path d="M14 21V7" />
            <path d="m12 2-8 5h16l-8-5Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-gray-900 font-bold text-lg leading-tight">
            Transfer Bank
          </h3>
          <p className="text-xs text-gray-500">
            Metode konvensional (Virtual Account)
          </p>
        </div>
      </div>

      {/* FORM INPUT SECTION (Disembunyikan jika VA sudah muncul) */}
      {!vaInfo ? (
        <div className="space-y-4">
          
          {/* Nominal Input with RP Prefix */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">Nominal Donasi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-bold">Rp</span>
              </div>
              <input
                type="number"
                className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-100 focus:border-yellow-400 outline-none transition-all font-semibold text-gray-900"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 ml-1">Minimal Rp10.000</p>
          </div>

          {/* Bank Selection */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">Pilih Bank</label>
            <div className="relative">
              <select
                className="appearance-none w-full bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:bg-white focus:border-yellow-400 cursor-pointer"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
              >
                <option value="bni">BNI Virtual Account</option>
                {/* Tambahkan opsi bank lain di sini nanti */}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          {/* Optional Identity */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Informasi Tambahan (Opsional)
            </p>
            <input
              type="text"
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Nama Donatur"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
            />
            <textarea
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-400 resize-none h-20"
              placeholder="Pesan atau Doa..."
              value={donorMessage}
              onChange={(e) => setDonorMessage(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleDonate}
            disabled={loading}
            className="w-full py-3 px-4 bg-[#FBBF24] hover:bg-yellow-500 text-gray-900 font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Memproses VA..." : "Lanjutkan Pembayaran"}
          </button>
        </div>
      ) : (
        /* RESULT / VA DISPLAY SECTION */
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-start border-b border-dashed border-gray-300 pb-4 mb-4">
            <div>
              <p className="text-xs text-gray-500">Total Pembayaran</p>
              <p className="text-xl font-bold text-gray-900">
                {formatRupiah(vaInfo.amount)}
              </p>
            </div>
            <div className="text-right">
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">
                {vaInfo.bank}
              </span>
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <p className="text-xs text-gray-500">Nomor Virtual Account</p>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-mono font-bold text-gray-800 tracking-wider">
                {vaInfo.va_number}
              </code>
              <button 
                onClick={handleCopyVA}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="Salin Nomor VA"
              >
                {copied ? (
                   <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                   <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                )}
              </button>
            </div>
             {copied && <p className="text-[10px] text-green-600 font-medium">Nomor berhasil disalin!</p>}
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
             <p className="text-xs text-yellow-800 leading-relaxed">
               <strong>Instruksi:</strong> Silakan transfer ke nomor VA di atas melalui ATM, Mobile Banking, atau Internet Banking {vaInfo.bank.toUpperCase()}. Pesanan: <strong>#{vaInfo.order_id}</strong>
             </p>
          </div>

          <button
            onClick={() => setVaInfo(null)}
            className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-800 underline decoration-gray-300 underline-offset-4"
          >
            Buat donasi baru
          </button>
        </div>
      )}
    </div>
  );
}
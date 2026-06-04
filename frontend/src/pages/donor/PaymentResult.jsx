import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "unknown";
  const orderId = searchParams.get("order_id") || null;

  const config = {
    finish: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Pembayaran Berhasil!",
      subtitle: "Terima kasih atas punia Anda. Dana telah diterima dan akan disalurkan ke kampanye yang Anda pilih.",
      bgGradient: "from-emerald-50 to-green-50",
      borderColor: "border-emerald-200",
      titleColor: "text-emerald-800",
    },
    unfinish: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Pembayaran Belum Selesai",
      subtitle: "Silakan selesaikan pembayaran Anda melalui ATM, Mobile Banking, atau Internet Banking menggunakan nomor Virtual Account yang telah diberikan.",
      bgGradient: "from-amber-50 to-yellow-50",
      borderColor: "border-amber-200",
      titleColor: "text-amber-800",
    },
    error: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      title: "Pembayaran Gagal",
      subtitle: "Terjadi kesalahan saat memproses pembayaran Anda. Silakan coba kembali atau hubungi kami jika masalah berlanjut.",
      bgGradient: "from-red-50 to-pink-50",
      borderColor: "border-red-200",
      titleColor: "text-red-800",
    },
  };

  const currentConfig = config[status] || config.error;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto pt-28 px-4 pb-12">
        <div className={`bg-gradient-to-br ${currentConfig.bgGradient} rounded-3xl border ${currentConfig.borderColor} p-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.04)]`}>
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-full shadow-sm">
              {currentConfig.icon}
            </div>
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-black ${currentConfig.titleColor} mb-3`}>
            {currentConfig.title}
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            {currentConfig.subtitle}
          </p>

          {/* Order ID (if available) */}
          {orderId && (
            <div className="bg-white/70 rounded-2xl border border-gray-100 px-4 py-3 mb-6 inline-block">
              <p className="text-xs text-gray-400 mb-1">Order ID</p>
              <p className="text-sm font-mono font-bold text-gray-800">{orderId}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-4">
            <Link
              to="/donor/dashboard"
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] text-sm"
            >
              Lihat Riwayat Punia
            </Link>

            <Link
              to="/pura"
              className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl border border-gray-200 transition-all text-sm"
            >
              Jelajahi Kampanye Lainnya
            </Link>
          </div>
        </div>

        {/* Tips */}
        {status === "unfinish" && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-amber-500">💡</span> Cara Menyelesaikan Pembayaran
            </h3>
            <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Buka aplikasi Mobile Banking atau kunjungi ATM bank Anda</li>
              <li>Pilih menu <strong>Transfer → Virtual Account</strong></li>
              <li>Masukkan nomor Virtual Account yang telah diberikan sebelumnya</li>
              <li>Konfirmasi jumlah pembayaran dan selesaikan transaksi</li>
              <li>Status punia Anda akan otomatis diperbarui setelah pembayaran dikonfirmasi</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

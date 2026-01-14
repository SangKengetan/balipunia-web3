import React from "react";

export default function Toast({ toast, onClose }) {
  // Konfigurasi visual berdasarkan tipe toast
  const variants = {
    success: {
      icon: <CheckCircleIcon />,
      colorClass: "text-green-600",
      bgIcon: "bg-green-100",
      border: "border-l-4 border-green-500",
      title: "Berhasil",
    },
    error: {
      icon: <XCircleIcon />,
      colorClass: "text-red-600",
      bgIcon: "bg-red-100",
      border: "border-l-4 border-red-500",
      title: "Gagal",
    },
    info: {
      icon: <InfoIcon />,
      colorClass: "text-blue-600",
      bgIcon: "bg-blue-100",
      border: "border-l-4 border-blue-500",
      title: "Informasi",
    },
    confirm: {
      icon: <QuestionIcon />,
      colorClass: "text-amber-600", // Warna Brand BaliPunia
      bgIcon: "bg-amber-100",
      border: "border-l-4 border-amber-500",
      title: "Konfirmasi",
    },
  };

  const style = variants[toast.type] || variants.info;

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:shadow-xl ${style.border} mb-3`}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          
          {/* Icon Section */}
          <div className="flex-shrink-0">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${style.bgIcon} ${style.colorClass}`}>
               {style.icon}
            </div>
          </div>

          {/* Content Section */}
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-bold text-slate-800">
              {style.title}
            </p>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              {toast.message}
            </p>

            {/* Confirm Actions (Khusus tipe 'confirm') */}
            {toast.confirm && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    toast.onConfirm();
                    onClose();
                  }}
                  className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                >
                  Ya, Lanjutkan
                </button>
                <button
                  onClick={onClose}
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            )}
          </div>

          {/* Close Button (X) - Hanya muncul jika BUKAN confirm */}
          {!toast.confirm && (
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <CloseIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Icons Collection (Inline SVG) ---

const CheckCircleIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

const QuestionIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
  </svg>
);
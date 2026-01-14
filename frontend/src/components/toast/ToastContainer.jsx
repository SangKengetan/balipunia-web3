import Toast from "./Toast";

export default function ToastContainer({ toasts, removeToast }) {
  return (
    // PERBAIKAN:
    // 1. w-full max-w-sm : Memberikan lebar pasti agar toast tidak gepeng.
    // 2. pointer-events-none : Agar area kosong di container tidak menghalangi klik tombol di belakangnya.
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          toast={t}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </div>
  );
}
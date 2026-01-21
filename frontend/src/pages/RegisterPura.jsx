import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitPengajuanPura } from "../services/pengajuanApi";

export default function RegisterPura() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nama_pura: "",
    deskripsi: "",
    kontak_telepon: "",
    file: null,
    saldo_operasional: "",
  });

  useEffect(() => {
    const storedWallet = sessionStorage.getItem("admin_wallet");
    if (!storedWallet) {
      alert("Wallet belum terhubung");
      navigate("/");
      return;
    }
    setWallet(storedWallet);
  }, [navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({
      ...prev,
      file: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.file) {
      alert("File pendukung wajib diunggah");
      return;
    }

    const formData = new FormData();
    formData.append("nama_pura", form.nama_pura);
    formData.append("deskripsi", form.deskripsi);
    formData.append("kontak_telepon", form.kontak_telepon);
    formData.append("wallet_address", wallet);
    formData.append("saldo_operasional", form.saldo_operasional);
    formData.append("file", form.file);

    try {
      setLoading(true);
      await submitPengajuanPura(formData);

      alert("Pengajuan berhasil dikirim. Menunggu verifikasi Super Admin.");
      sessionStorage.removeItem("admin_wallet");
      navigate("/");
    } catch (err) {
      alert(err.message || "Gagal mengirim pengajuan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

          {/* Header */}
          <h2 className="text-2xl font-semibold text-slate-800">
            Pengajuan Admin Pura
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Silakan lengkapi data berikut untuk mengajukan pengelolaan pura atau
            yayasan pada platform BaliPunia. Setiap pengajuan akan diverifikasi
            oleh Super Admin.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            {/* Wallet */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Wallet Address
              </label>
              <input
                value={wallet}
                disabled
                className="
                  w-full bg-slate-100 border border-slate-300
                  rounded-lg px-4 py-2 text-sm text-slate-600
                  cursor-not-allowed
                "
              />
            </div>

            {/* Nama Pura */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Pura / Yayasan
              </label>
              <input
                name="nama_pura"
                value={form.nama_pura}
                onChange={handleChange}
                required
                className="
                  w-full border border-slate-300 rounded-lg
                  px-4 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-300
                  focus:border-amber-300
                "
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Deskripsi
              </label>
              <textarea
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
                rows={4}
                className="
                  w-full border border-slate-300 rounded-lg
                  px-4 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-300
                "
              />
            </div>

            {/* Kontak */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kontak Telepon
              </label>
              <input
                name="kontak_telepon"
                value={form.kontak_telepon}
                onChange={handleChange}
                required
                className="
                  w-full border border-slate-300 rounded-lg
                  px-4 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-300
                  focus:border-amber-300
                "
              />
            </div>

            {/* Saldo Operasional */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Saldo Operasional Awal (IDR)
              </label>
              <input
                name="saldo_operasional"
                type="number" // Gunakan type number
                min="0"
                value={form.saldo_operasional}
                onChange={handleChange}
                required // Wajib diisi sesuai request Anda
                placeholder="Rp 0"
                className="
                  w-full border border-slate-300 rounded-lg
                  px-4 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-300
                  focus:border-amber-300
                "
              />
            </div>

            {/* File */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                File Pendukung
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                required
                className="
                  w-full text-sm text-slate-600
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-medium
                  file:bg-amber-100 file:text-amber-800
                  hover:file:bg-amber-200
                "
              />
              <p className="mt-1 text-xs text-slate-500">
                Unggah dokumen pendukung (PDF/JPG) sebagai bukti legalitas atau
                pengelolaan.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                mt-6 w-full
                bg-amber-400 text-slate-900
                py-3 rounded-full font-semibold
                hover:bg-amber-300 transition
                disabled:opacity-60
              "
            >
              {loading ? "Mengirim..." : "Kirim Pengajuan"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

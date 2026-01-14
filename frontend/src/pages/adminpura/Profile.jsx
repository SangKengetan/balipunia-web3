import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../api/adminPura.api";

export default function Profile() {
  // 1. Inisialisasi state dengan key yang SAMA PERSIS dengan database
  const [form, setForm] = useState({
    nama_pura: "",
    alamat_pura: "", // Saya tambahkan karena backend mengirim ini
    kontak_pura: "", // Saya tambahkan karena backend mengirim ini
    bank_name: "",   // Saya tambahkan karena backend mengirim ini
    bank_account: "",
    wallet_address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getProfile();
        
        // 2. PERBAIKAN UTAMA:
        // Struktur response axios biasanya: res.data (body) -> .data (properti dari controller)
        if (res.data && res.data.data) {
          setForm(res.data.data);
        } else if (res.data) {
          // Fallback jika backend tidak membungkus dalam properti 'data'
          setForm(res.data);
        }
      } catch (err) {
        console.error("Gagal mengambil data profil:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      alert("Profil berhasil diperbarui!");
    } catch (error) {
      console.error(error);
      alert("Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading data profil...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Profil Admin Pura</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        
        {/* Nama Pura */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Nama Pura</label>
          <input
            type="text"
            name="nama_pura" // Harus sama dengan DB
            value={form.nama_pura || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Masukkan nama pura"
          />
        </div>

        {/* Alamat Pura */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Alamat Pura</label>
          <textarea
            name="alamat_pura"
            value={form.alamat_pura || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Alamat lengkap pura"
            rows="3"
          />
        </div>

        {/* Kontak Pura */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Kontak Pura (HP/Telp)</label>
          <input
            type="text"
            name="kontak_pura"
            value={form.kontak_pura || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Nama Bank */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Nama Bank</label>
          <input
            type="text"
            name="bank_name"
            value={form.bank_name || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Contoh: BPD Bali / BCA"
          />
        </div>

        {/* Nomor Rekening */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Nomor Rekening</label>
          <input
            type="text" // Gunakan text agar aman jika ada format angka panjang
            name="bank_account"
            value={form.bank_account || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Wallet Address */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700">Wallet Address (Blockchain)</label>
          <input
            type="text"
            name="wallet_address"
            value={form.wallet_address || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
            placeholder="0x..."
          />
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className={`mt-4 px-6 py-2 rounded-md text-white font-medium transition-colors ${
            saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>

      </form>
    </div>
  );
}
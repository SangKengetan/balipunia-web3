import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../api/adminPura.api";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Landmark, 
  CreditCard, 
  Wallet, 
  Save, 
  Loader2,
  AlertCircle
} from "lucide-react";

export default function Profile() {
  const [form, setForm] = useState({
    nama_pura: "",
    alamat_pura: "",
    kontak_pura: "",
    bank_name: "",
    bank_account: "",
    wallet_address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setError] = useState(null);

  // Fetch Data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getProfile();
        // Handler flexible untuk response structure
        const data = res.data?.data || res.data || {};
        setForm(data);
      } catch (err) {
        console.error("Gagal mengambil data profil:", err);
        setError("Gagal memuat data profil. Silakan coba lagi.");
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
      // Optional: Tambahkan toast notification disini
      alert("Profil berhasil diperbarui!"); 
    } catch (error) {
      console.error(error);
      alert("Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  // Generate Initials untuk Avatar
  const getInitials = (name) => {
    if (!name) return "P";
    return name.substring(0, 1).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 font-sans">
      
      {/* 1. Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Profil Pura</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola informasi publik dan rekening pencairan dana pura Anda.
          </p>
        </div>
        
        {/* Tombol Save Sticky di Header untuk UX lebih baik */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white shadow-sm transition-all ${
            saving 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-amber-500 hover:bg-amber-600 hover:shadow-md active:scale-95"
          }`}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === KOLOM KIRI: Identitas Visual & Publik === */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Card Avatar / Branding */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-amber-200 mb-4">
                    {getInitials(form.nama_pura)}
                </div>
                <h2 className="text-lg font-bold text-gray-800 truncate">
                    {form.nama_pura || "Nama Pura"}
                </h2>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1">
                    Administrator
                </p>
                <div className="mt-6 pt-6 border-t border-gray-50 text-left">
                     <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <AlertCircle size={12}/> Tips:
                     </p>
                     <p className="text-xs text-gray-400 leading-relaxed">
                        Pastikan data kontak dan alamat valid agar donatur dapat memverifikasi keaslian pura/yayasan.
                     </p>
                </div>
            </div>
        </div>

        {/* === KOLOM KANAN: Form Inputs === */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* SECTION 1: Informasi Umum */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Building2 size={18} className="text-gray-500" />
                    <h3 className="font-semibold text-gray-700">Identitas Pura</h3>
                </div>
                
                <div className="p-6 space-y-5">
                    {/* Nama Pura */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pura / Yayasan</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <Building2 size={16} />
                            </span>
                            <input
                                type="text"
                                name="nama_pura"
                                value={form.nama_pura || ""}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                                placeholder="Cth: Pura Besakih"
                            />
                        </div>
                    </div>

                    {/* Kontak */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon / WA</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <Phone size={16} />
                            </span>
                            <input
                                type="text"
                                name="kontak_pura"
                                value={form.kontak_pura || ""}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                                placeholder="0812..."
                            />
                        </div>
                    </div>

                    {/* Alamat */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                        <div className="relative">
                            <span className="absolute top-3 left-3 text-gray-400">
                                <MapPin size={16} />
                            </span>
                            <textarea
                                name="alamat_pura"
                                value={form.alamat_pura || ""}
                                onChange={handleChange}
                                rows="3"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none resize-none"
                                placeholder="Jalan..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: Informasi Keuangan (Fiat & Crypto) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Wallet size={18} className="text-gray-500" />
                    <h3 className="font-semibold text-gray-700">Rekening & Wallet</h3>
                </div>

                <div className="p-6 space-y-6">
                    {/* Bank & Rekening (Grid 2 Kolom) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <Landmark size={16} />
                                </span>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={form.bank_name || ""}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    placeholder="BCA / BPD Bali"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <CreditCard size={16} />
                                </span>
                                <input
                                    type="text"
                                    name="bank_account"
                                    value={form.bank_account || ""}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    placeholder="1234567890"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100"></div>

                    {/* Wallet Address (Web3 Special Styling) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1 flex justify-between">
                             <span>Wallet Address (EVM)</span>
                             <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Web3 Connected</span>
                        </label>
                        <div className="relative">
                             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <Wallet size={16} />
                            </span>
                            <input
                                type="text"
                                name="wallet_address"
                                value={form.wallet_address || ""}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 font-mono text-sm focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                                placeholder="0x..."
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Alamat wallet ini akan digunakan sebagai penerima dana donasi crypto (USDT/USDC).
                        </p>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
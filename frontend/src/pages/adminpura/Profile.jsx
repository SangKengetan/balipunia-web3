import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../api/adminPura.api";
import { registerTrustees } from "../../services/blockchain/onchainTrustee";
import { showError, showSuccess, showInfo } from "../../utils/notification";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Landmark, 
  CreditCard, 
  Wallet, 
  Save, 
  Loader2,
  AlertCircle,
  Camera,
  CheckCircle2,
  Users,
  ShieldCheck
} from "lucide-react";

export default function Profile() {
  const [form, setForm] = useState({
    nama_pura: "",
    alamat_pura: "",
    kontak_pura: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    wallet_address: "",
    profile_completion_percentage: 0,
    is_trustees_registered: false,
    profile_picture: null,
  });

  const [trusteeAddresses, setTrusteeAddresses] = useState(["", "", ""]);
  const [registeringTrustee, setRegisteringTrustee] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadProfile() {
    try {
      const res = await getProfile();
      const data = res.data?.data || res.data || {};
      setForm(data);
      if (data.profile_picture) {
        setPreview(`https://gateway.pinata.cloud/ipfs/${data.profile_picture}`);
      }
    } catch (err) {
      console.error("Gagal mengambil data profil:", err);
      showError("Gagal Memuat", "Gagal memuat data profil. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // Fetch Data
  useEffect(() => {
    loadProfile();
  }, []);

  const handleTrusteeChange = (index, value) => {
    const newTrustees = [...trusteeAddresses];
    newTrustees[index] = value;
    setTrusteeAddresses(newTrustees);
  };

  const handleRegisterTrustee = async () => {
    if (!trusteeAddresses[0] || !trusteeAddresses[1] || !trusteeAddresses[2]) {
      showInfo("Data Tidak Lengkap", "Harap isi ketiga alamat Trustee (Wali Amanat).");
      return;
    }
    setRegisteringTrustee(true);
    try {
      await registerTrustees(trusteeAddresses);
      showSuccess("Berhasil", "Trustee (Wali Amanat) berhasil didaftarkan di Blockchain!");
      loadProfile();
    } catch (err) {
      console.error("Gagal setup trustee:", err);
      showError("Gagal Mendaftar", "Gagal mendaftarkan trustee: " + (err.reason || err.message), "Pastikan alamat valid dan dompet Anda memiliki saldo untuk transaksi Blockchain.");
    } finally {
      setRegisteringTrustee(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      const allowedFields = [
        "nama_pura", "alamat_pura", "kontak_pura", 
        "bank_name", "bank_account_number", "bank_account_name", "wallet_address"
      ];
      
      allowedFields.forEach(key => {
        if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });

      if (file) {
        formData.append("profile_picture", file);
      }
      await updateProfile(formData);
      showSuccess("Berhasil", "Profil berhasil diperbarui!"); 
      loadProfile();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message;
      showError("Gagal Memperbarui", errMsg, "Silakan periksa kembali data yang dimasukkan.");
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
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-amber-200 mb-4 overflow-hidden group relative">
                    {preview ? (
                      <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(form.nama_pura)
                    )}
                    <label className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera size={24} className="text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
                <h2 className="text-lg font-bold text-gray-800 truncate">
                    {form.nama_pura || "Nama Pura"}
                </h2>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-1">
                    Administrator
                </p>

                {/* Progress Bar Kelengkapan Profil */}
                <div className="mt-5 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-600">Kelengkapan Profil</span>
                    <span className="text-xs font-bold text-amber-600">{form.profile_completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${form.profile_completion_percentage}%` }}></div>
                  </div>
                  {form.profile_completion_percentage < 100 && (
                    <p className="text-[10px] text-red-500 mt-2">
                      Lengkapi profil 100% untuk dapat membuat kampanye donasi.
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 text-left">
                     <p className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-2">
                        <Users size={14} className={form.is_trustees_registered ? "text-emerald-500" : "text-gray-400"}/> 
                        Status Trustee
                     </p>
                     {form.is_trustees_registered ? (
                       <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded border border-emerald-100">
                         <CheckCircle2 size={12}/> Sudah Terdaftar
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">
                         <AlertCircle size={12}/> Belum Terdaftar
                       </span>
                     )}
                     <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                        Anda harus mendaftarkan 3 trustee di smart contract untuk memenuhi syarat 100%.
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
                                    name="bank_account_number"
                                    value={form.bank_account_number || ""}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    placeholder="1234567890"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <Users size={16} />
                            </span>
                            <input
                                type="text"
                                name="bank_account_name"
                                value={form.bank_account_name || ""}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                placeholder="A.n Pura..."
                            />
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

            {/* SECTION 3: Pendaftaran Trustee */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-gray-500" />
                    <h3 className="font-semibold text-gray-700">Pendaftaran Trustee (Web3)</h3>
                </div>

                <div className="p-6 space-y-5">
                    {form.is_trustees_registered ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                        <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                        <h4 className="text-emerald-800 font-bold">Trustee Sudah Terdaftar</h4>
                        <p className="text-emerald-600 text-sm mt-1">Anda telah mendaftarkan 3 Trustee di smart contract.</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                          <p className="text-amber-800 text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>
                              Anda diwajibkan mendaftarkan tepat 3 alamat wallet Trustee. Trustee ini akan bertugas memverifikasi dan menyetujui setiap pencairan dana donasi kripto (USDT/USDC). <b>Pastikan Anda menggunakan Metamask dan berada di jaringan yang tepat.</b>
                            </span>
                          </p>
                        </div>
                        
                        {[0, 1, 2].map((index) => (
                          <div key={index}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address Trustee {index + 1}</label>
                              <div className="relative">
                                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                      <Wallet size={16} />
                                  </span>
                                  <input
                                      type="text"
                                      value={trusteeAddresses[index]}
                                      onChange={(e) => handleTrusteeChange(index, e.target.value)}
                                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none font-mono text-sm"
                                      placeholder="0x..."
                                  />
                              </div>
                          </div>
                        ))}

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleRegisterTrustee}
                            disabled={registeringTrustee || !form.wallet_address}
                            className={`w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-sm ${
                              registeringTrustee || !form.wallet_address
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"
                            }`}
                          >
                            {registeringTrustee ? (
                              <><Loader2 size={18} className="animate-spin" /> Memproses Transaksi...</>
                            ) : (
                              <><ShieldCheck size={18} /> Daftarkan Trustee di Blockchain</>
                            )}
                          </button>
                          {!form.wallet_address && (
                            <p className="text-xs text-red-500 text-center mt-2">
                              Simpan Wallet Address Anda di form Keuangan terlebih dahulu sebelum mendaftar.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
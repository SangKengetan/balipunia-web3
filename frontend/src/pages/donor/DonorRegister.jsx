import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import useDonorAuth from "../../hooks/useDonorAuth";

export default function DonorRegister() {
  const navigate = useNavigate();
  const { loginDonor } = useDonorAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
    confirmPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+]*$/;

    if (!form.name.trim()) {
      errors.name = "Nama lengkap wajib diisi";
    }

    if (!form.email) {
      errors.email = "Email wajib diisi";
    } else if (!emailRegex.test(form.email)) {
      errors.email = "Format email tidak valid";
    }

    if (form.contact && !phoneRegex.test(form.contact)) {
      errors.contact = "Nomor telepon hanya boleh angka";
    }

    if (!form.password) {
      errors.password = "Password wajib diisi";
    } else if (form.password.length < 6) {
      errors.password = "Password minimal 6 karakter";
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Konfirmasi password tidak cocok";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/donor/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.message || "Gagal melakukan pendaftaran dengan Google");
      
      loginDonor({
        token: res.token,
        email: res.donor.email,
        name: res.donor.name,
        wallets: res.donor.wallets,
      });
      navigate("/donor/dashboard");
    } catch (err) {
      setError(err.message || "Pendaftaran Google gagal.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Pendaftaran Google dibatalkan atau gagal.");
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors({...fieldErrors, [e.target.name]: null});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { name, email, contact, password } = form;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/donor/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, contact }),
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.message || "Gagal melakukan registrasi");
      }

      loginDonor({
        token: res.token,
        email: res.donor.email,
        name: res.donor.name,
        wallets: res.donor.wallets,
      });

      navigate("/donor/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat registrasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full space-y-6 bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white relative z-10 my-4">
        
        {/* Logo/Header */}
        <div className="text-center">
          <Link to="/" className="inline-block">
            <span className="text-amber-500 font-black text-3xl tracking-tight drop-shadow-sm">BaliPunia</span>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">
            Daftar Akun Donatur
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Bergabunglah untuk mulai mepunia secara transparan dan akuntabel
          </p>
        </div>

        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {/* Name Field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className={`h-5 w-5 ${fieldErrors.name ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ketut Wirawan"
                className={`w-full bg-gray-50/50 border ${fieldErrors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-amber-400'} focus:bg-white pl-11 pr-4 py-3 text-sm rounded-2xl transition-all outline-none focus:ring-4 ${fieldErrors.name ? 'focus:ring-red-100' : 'focus:ring-amber-100'}`}
              />
            </div>
            {fieldErrors.name && <p className="text-red-500 text-xs font-medium mt-1 ml-1">{fieldErrors.name}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">Alamat Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 ${fieldErrors.email ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ketut@email.com"
                className={`w-full bg-gray-50/50 border ${fieldErrors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-amber-400'} focus:bg-white pl-11 pr-4 py-3 text-sm rounded-2xl transition-all outline-none focus:ring-4 ${fieldErrors.email ? 'focus:ring-red-100' : 'focus:ring-amber-100'}`}
              />
            </div>
            {fieldErrors.email && <p className="text-red-500 text-xs font-medium mt-1 ml-1">{fieldErrors.email}</p>}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">No. Telepon (Opsional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className={`h-5 w-5 ${fieldErrors.contact ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="081234567890"
                className={`w-full bg-gray-50/50 border ${fieldErrors.contact ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-amber-400'} focus:bg-white pl-11 pr-4 py-3 text-sm rounded-2xl transition-all outline-none focus:ring-4 ${fieldErrors.contact ? 'focus:ring-red-100' : 'focus:ring-amber-100'}`}
              />
            </div>
            {fieldErrors.contact && <p className="text-red-500 text-xs font-medium mt-1 ml-1">{fieldErrors.contact}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-4 w-4 ${fieldErrors.password ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full bg-gray-50/50 border ${fieldErrors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-amber-400'} focus:bg-white pl-9 pr-10 py-3 text-sm rounded-2xl transition-all outline-none focus:ring-4 ${fieldErrors.password ? 'focus:ring-red-100' : 'focus:ring-amber-100'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs font-medium mt-1 ml-1 leading-tight">{fieldErrors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">Ulangi Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-4 w-4 ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full bg-gray-50/50 border ${fieldErrors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-amber-400'} focus:bg-white pl-9 pr-10 py-3 text-sm rounded-2xl transition-all outline-none focus:ring-4 ${fieldErrors.confirmPassword ? 'focus:ring-red-100' : 'focus:ring-amber-100'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-red-500 text-xs font-medium mt-1 ml-1 leading-tight">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
            <div className="text-gray-500 font-medium">
              Sudah memiliki akun?{" "}
              <Link to="/donor/login" className="font-bold text-amber-600 hover:text-amber-700 transition-colors">
                Masuk di sini
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-black rounded-2xl shadow-lg shadow-amber-200 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/80 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">Atau daftar dengan</span>
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <div className="hover:scale-[1.02] transition-transform active:scale-95">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                shape="circle"
                theme="outline"
                size="large"
                text="signup_with"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

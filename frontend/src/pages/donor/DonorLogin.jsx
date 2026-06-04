import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import useDonorAuth from "../../hooks/useDonorAuth";

export default function DonorLogin() {
  const navigate = useNavigate();
  const { loginDonor } = useDonorAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      errors.email = "Email wajib diisi";
    } else if (!emailRegex.test(email)) {
      errors.email = "Format email tidak valid";
    }
    
    if (!password) {
      errors.password = "Password wajib diisi";
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
      if (!response.ok) throw new Error(res.message || "Gagal melakukan login Google");
      
      loginDonor({
        token: res.token,
        email: res.donor.email,
        name: res.donor.name,
        wallets: res.donor.wallets,
      });
      navigate("/donor/dashboard");
    } catch (err) {
      setError(err.message || "Login Google gagal.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Login Google dibatalkan atau gagal.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setError("");
      setFieldErrors({});

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/donor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.message || "Gagal melakukan login");
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
      setError(err.message || "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white relative z-10">
        
        {/* Logo/Header */}
        <div className="text-center">
          <Link to="/" className="inline-block">
            <span className="text-amber-500 font-black text-3xl tracking-tight drop-shadow-sm">BaliPunia</span>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 tracking-tight">
            Selamat Datang Kembali! 👋
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Masuk untuk memantau punia dan portofolio donasi Anda
          </p>
        </div>

        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-2">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 ${fieldErrors.email ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({...fieldErrors, email: null});
                }}
                placeholder="nama@email.com"
                className={`w-full bg-gray-50/50 border ${fieldErrors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-amber-400'} focus:bg-white pl-11 pr-4 py-3.5 text-sm rounded-2xl transition-all outline-none focus:ring-4 ${fieldErrors.email ? 'focus:ring-red-100' : 'focus:ring-amber-100'}`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{fieldErrors.email}</p>
            )}
          </div>
          
          {/* Password Field */}
          <div>
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 ${fieldErrors.password ? 'text-red-400' : 'text-gray-400'}`} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({...fieldErrors, password: null});
                }}
                placeholder="••••••••"
                className={`w-full bg-gray-50/50 border ${fieldErrors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-amber-400'} focus:bg-white pl-11 pr-12 py-3.5 text-sm rounded-2xl transition-all outline-none focus:ring-4 ${fieldErrors.password ? 'focus:ring-red-100' : 'focus:ring-amber-100'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">{fieldErrors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
            <div className="text-gray-500 font-medium">
              Belum punya akun?{" "}
              <Link to="/donor/register" className="font-bold text-amber-600 hover:text-amber-700 transition-colors">
                Daftar sekarang
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
                "Masuk Sekarang"
              )}
            </button>
          </div>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/80 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">Atau lanjutkan dengan</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="hover:scale-[1.02] transition-transform active:scale-95">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                shape="circle"
                theme="outline"
                size="large"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 mt-8 text-center text-xs text-gray-400 font-medium">
          <Link to="/login" className="hover:text-gray-600 transition-colors">
            Login sebagai Pengelola Pura / Admin
          </Link>
        </div>
      </div>
    </div>
  );
}

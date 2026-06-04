import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import useDonorAuth from "../../hooks/useDonorAuth";

export default function DonorLogin() {
  const navigate = useNavigate();
  const { loginDonor } = useDonorAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (!email || !password) {
      setError("Email dan Password wajib diisi");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/donor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const res = await response.json();

      if (!response.ok) {
        throw new Error(res.message || "Gagal melakukan login");
      }

      // Save token and profile details
      loginDonor({
        token: res.token,
        email: res.donor.email,
        name: res.donor.name,
        wallets: res.donor.wallets,
      });

      // Redirect to home or donor dashboard
      navigate("/donor/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100">
        
        {/* Logo/Header */}
        <div className="text-center">
          <Link to="/" className="text-amber-500 font-extrabold text-2xl tracking-wider">
            BaliPunia
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
            Masuk sebagai Donatur
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Salurkan punia secara akuntabel dan pantau perkembangan program
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 ml-1 mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-gray-50 border border-gray-200 focus:border-amber-400 focus:bg-white p-4 text-sm rounded-2xl transition-all outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 ml-1 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 focus:border-amber-400 focus:bg-white p-4 text-sm rounded-2xl transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="text-gray-500">
              Belum punya akun?{" "}
              <Link to="/donor/register" className="font-bold text-amber-600 hover:text-amber-500 transition-colors">
                Daftar sekarang
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-gray-900 font-black rounded-2xl shadow-lg shadow-amber-200 transition-all active:scale-[0.98] disabled:opacity-60 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                "Masuk Sekarang"
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
              <span className="bg-white px-2 text-gray-500 font-medium">Atau lanjutkan dengan</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="pill"
              theme="outline"
              size="large"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 mt-6 text-center text-xs text-gray-400">
          <Link to="/login" className="hover:text-gray-600">
            Login sebagai Pengelola Pura / Admin
          </Link>
        </div>
      </div>
    </div>
  );
}

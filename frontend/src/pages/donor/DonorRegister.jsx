import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, contact, password, confirmPassword } = form;

    if (!name || !email || !password) {
      setError("Nama, email, dan password wajib diisi");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

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

      // Save token and profile details
      loginDonor({
        token: res.token,
        email: res.donor.email,
        name: res.donor.name,
        wallets: res.donor.wallets,
      });

      // Redirect to donor dashboard
      navigate("/donor/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat registrasi.");
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
            Daftar Akun Donatur
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Bergabunglah untuk mulai mepunia secara transparan dan akuntabel
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Ketut Wirawan"
              className="w-full bg-gray-50 border border-gray-200 focus:border-amber-400 focus:bg-white p-4 text-sm rounded-2xl transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">
              Alamat Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="ketut@email.com"
              className="w-full bg-gray-50 border border-gray-200 focus:border-amber-400 focus:bg-white p-4 text-sm rounded-2xl transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">
              No. Telepon / WhatsApp (Opsional)
            </label>
            <input
              type="text"
              name="contact"
              value={form.contact}
              onChange={handleChange}
              placeholder="081234567890"
              className="w-full bg-gray-50 border border-gray-200 focus:border-amber-400 focus:bg-white p-4 text-sm rounded-2xl transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 focus:border-amber-400 focus:bg-white p-4 text-sm rounded-2xl transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 ml-1 mb-1">
                Ulangi Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 focus:border-amber-400 focus:bg-white p-4 text-sm rounded-2xl transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm pt-2">
            <div className="text-gray-500">
              Sudah memiliki akun?{" "}
              <Link to="/donor/login" className="font-bold text-amber-600 hover:text-amber-500 transition-colors">
                Masuk di sini
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-gray-900 font-black rounded-2xl shadow-lg shadow-amber-200 transition-all active:scale-[0.98] disabled:opacity-60 flex justify-center items-center"
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
              <span className="bg-white px-2 text-gray-500 font-medium">Atau daftar dengan</span>
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
              text="signup_with"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

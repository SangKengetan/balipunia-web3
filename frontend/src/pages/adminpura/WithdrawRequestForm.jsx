import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { requestWithdraw } from "../../api/adminPura.api";

export default function WithdrawRequestForm() {
  const navigate = useNavigate();
  const { campaignId } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);

  const submitWithdraw = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount) {
      setError("Jumlah withdraw wajib diisi");
      return;
    }

    if (!file) {
      setError("Dokumen pendukung wajib diunggah");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("campaign_id", campaignId);
      formData.append("amount", amount);
      formData.append("reason", reason);
      formData.append("document", file); // ← HARUS SAMA DENGAN multer.single("document")

      await requestWithdraw(formData);

      alert("Permintaan withdraw berhasil diajukan");
      navigate("/admin/pura/withdraws");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Gagal mengajukan withdraw"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">
        Request Withdraw Campaign
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={submitWithdraw} className="space-y-4">
        {/* AMOUNT */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Jumlah Withdraw
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded px-3 py-2"
            min="1"
            required
          />
        </div>

        {/* REASON */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Alasan Withdraw
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Contoh: Renovasi pura"
          />
        </div>

        {/* FILE UPLOAD */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Dokumen Pendukung (PDF / Gambar)
          </label>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            File akan diunggah ke IPFS
          </p>
        </div>

        {/* ACTION */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Mengajukan..." : "Ajukan Withdraw"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}

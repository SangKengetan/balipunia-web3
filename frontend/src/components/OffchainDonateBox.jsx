import { useState } from "react";
import { createBankTransferPayment} from "../services/paymentApi";

export default function OffchainDonateBox({ campaignId }) {
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("bni");

  // identitas opsional
  const [donorName, setDonorName] = useState("");
  const [donorMessage, setDonorMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [vaInfo, setVaInfo] = useState(null);

  async function handleDonate() {
    if (!amount || amount < 10000) {
      alert("Minimal donasi Rp10.000");
      return;
    }

    setLoading(true);
    try {
      const res = await createBankTransferPayment({
        campaign_id: campaignId,
        amount: Number(amount),
        bank,
        donor_name: donorName || null,
        donor_message: donorMessage || null,
        donor_wallet: null
      });

      setVaInfo(res.data);
    } catch {
      alert("Gagal membuat pembayaran");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 p-4 border rounded-xl bg-gray-50 space-y-4">
      <h3 className="font-semibold text-lg">
        Donasi Non-Crypto (Transfer Bank)
      </h3>

      {/* NOMINAL */}
      <div>
        <label className="text-sm text-gray-600">Nominal Donasi</label>
        <input
          type="number"
          className="w-full mt-1 p-2 border rounded"
          placeholder="Contoh: 100000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* BANK */}
      <div>
        <label className="text-sm text-gray-600">Metode Pembayaran</label>
        <select
          className="w-full mt-1 p-2 border rounded"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
        >
          <option value="bni">BNI Virtual Account</option>
        </select>
      </div>

      {/* IDENTITAS OPSIONAL */}
      <div className="pt-2 border-t">
        <p className="text-sm text-gray-500 mb-2">
          Identitas Donatur (Opsional)
        </p>

        <input
          type="text"
          className="w-full p-2 border rounded mb-2"
          placeholder="Nama Donatur"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
        />

        <textarea
          className="w-full p-2 border rounded"
          placeholder="Pesan / Doa (opsional)"
          value={donorMessage}
          onChange={(e) => setDonorMessage(e.target.value)}
        />
      </div>

      {!vaInfo && (
        <button
          onClick={handleDonate}
          disabled={loading}
          className="w-full py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Lanjutkan Pembayaran"}
        </button>
      )}

      {/* HASIL VA */}
      {vaInfo && (
        <div className="bg-white border rounded-lg p-4 space-y-2">
          <div className="text-sm text-gray-600">
            Order ID: <strong>{vaInfo.order_id}</strong>
          </div>

          <div className="text-lg font-bold">
            Rp{Number(vaInfo.amount).toLocaleString("id-ID")}
          </div>

          <div className="text-sm">
            Bank: <strong>{vaInfo.bank.toUpperCase()}</strong>
          </div>

          <div className="mt-1 p-2 bg-gray-100 rounded font-mono">
            {vaInfo.va_number}
          </div>

          <p className="text-xs text-gray-500">
            Silakan transfer sesuai nominal ke VA di atas.
            Status donasi akan diperbarui otomatis.
          </p>
        </div>
      )}
    </div>
  );
}

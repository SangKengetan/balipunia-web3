// src/components/PuraCard.jsx
import { useNavigate } from "react-router-dom";

export default function PuraCard({ pura }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/pura/${pura.id}`)}
      className="cursor-pointer rounded-xl border p-4 shadow-sm hover:shadow-md transition"
    >
      <h2 className="text-lg font-semibold">{pura.nama_pura}</h2>

      <p className="text-sm text-gray-600 mt-1">
        {pura.alamat_pura || "Alamat tidak tersedia"}
      </p>

      <p className="text-xs text-gray-500 mt-2">
        Wallet: {pura.wallet_address?.slice(0, 8)}...
      </p>
    </div>
  );
}

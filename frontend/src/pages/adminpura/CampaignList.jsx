import { useEffect, useState } from "react";
import { getMyCampaigns } from "../../api/adminPura.api";
import { Link } from "react-router-dom";

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCampaigns()
      .then((res) => setCampaigns(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Campaign Saya</h1>

        <Link to="create" className="btn-primary">
          + Buat Campaign
        </Link>
      </div>

      {campaigns.map((c) => {
        const deadline = c.deadline ? new Date(c.deadline) : null;

        // UX HINT SAJA — backend tetap final
        const canShowWithdrawButton =
          c.is_onchain_enabled &&
          c.is_sc_registered &&
          deadline &&
          now > deadline &&
          c.status !== "REQUEST_WD";

        return (
          <div
            key={c.id}
            className="border p-4 rounded hover:bg-gray-50"
          >
            <Link
              to={`/admin/pura/campaigns/${c.id}`}
              className="block"
            >
              <h2 className="font-semibold">{c.title}</h2>
              <p className="text-sm text-gray-600">{c.purpose}</p>

              {c.onchain_info?.balance_usdt !== undefined && (
                <p className="text-sm mt-2">
                  USDT: {c.onchain_info.balance_usdt} |{" "}
                  USDC: {c.onchain_info.balance_usdc}
                </p>
              )}
            </Link>

            {/* WITHDRAW SECTION */}
            <div className="mt-3">
              {canShowWithdrawButton ? (
                <Link
                  to={`/admin/pura/withdraw/request/${c.id}`}
                  className="inline-block text-sm text-blue-600 hover:underline"
                >
                  Ajukan Withdraw
                </Link>
              ) : (
                <p className="text-xs text-gray-500">
                  {c.status === "REQUEST_WD"
                    ? "Withdraw sedang diproses"
                    : deadline && now <= deadline
                    ? "Withdraw tersedia setelah campaign selesai"
                    : !c.is_onchain_enabled
                    ? "Withdraw on-chain tidak aktif"
                    : !c.is_sc_registered
                    ? "Campaign belum terdaftar di smart contract"
                    : ""}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicCampaignDetail } from "../../api/public.api";
import OnchainDonateBox from "../../components/OnchainDonateBox";
import OffchainDonateBox from "../../components/OffchainDonateBox";
import OffchainDonationHistory from "../../components/OffchainDonationHistory";
import CampaignTimeline from "../../components/public/CampaignTimeline";



export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [onchain, setOnchain] = useState(null);
  const [offchain, setOffchain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnchainDonate, setShowOnchainDonate] = useState(false);
  const [showOffchainDonate, setShowOffchainDonate] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetchPublicCampaignDetail(id);
        const data = res?.data || res;

        setCampaign(data.campaign);
        setOnchain(data.onchain || null);
        setOffchain(data.offchain || null);
      } catch (err) {
        console.error("Failed fetch campaign detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!campaign) return <p className="p-4">Campaign tidak ditemukan.</p>;



  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* ===== CAMPAIGN INFO ===== */}
      <h1 className="text-2xl font-bold">{campaign.title}</h1>

      <p className="text-sm text-gray-600 mt-1">
        Status: {campaign.status} · Tipe: {campaign.campaign_type}
      </p>

      <p className="text-sm text-gray-600 mt-1">
        Deadline: {new Date(campaign.deadline).toLocaleDateString()}
      </p>

      {/* ===== ACTION BUTTONS ===== */}
        <div className="flex gap-3 mt-4">
        {campaign.campaign_type !== "SC-ONLY" && (
            <button 
            onClick={() => setShowOffchainDonate((prev) => !prev)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            {showOffchainDonate ? "Tutup Donasi Offchain" : "Donasi Offchain"}
            </button>
        )}
        

        {campaign.is_onchain_enabled && (
            <button
            onClick={() => setShowOnchainDonate((prev) => !prev)}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
            {showOnchainDonate ? "Tutup Donasi Onchain" : "Donasi Onchain"}
            </button>
        )}
        </div>
        {showOffchainDonate && campaign.is_offchain_enabled && (
        <OffchainDonateBox campaignId={campaign.id} />
        )}
        {showOnchainDonate && campaign.is_onchain_enabled && (
            <OnchainDonateBox
                onchainCampaignId={campaign.id_campaign_onchain}
                campaignType={campaign.campaign_type}
            />
        )}

      {/* ===== ONCHAIN SECTION ===== */}
      {onchain && (
        <Section title="Donasi Onchain">
          {/* Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="USDT" value={onchain.balances?.USDT} />
            <StatCard label="USDC" value={onchain.balances?.USDC} />
          </div>

          {/* Transactions */}
          <TransactionTable
            headers={["Donor", "Token", "Amount", "Timestamp"]}
            rows={onchain.transactions || []}
            renderRow={(tx, i) => (
              <tr key={i} className="border-t">
                <td>{short(tx.donor)}</td>
                <td>{tx.token}</td>
                <td>{tx.amount}</td>
                <td>{new Date(tx.timestamp * 1000).toLocaleString()}</td>
              </tr>
            )}
          />
        </Section>
      )}

        {/* ===== OFFCHAIN DONATION SECTION ===== */}
        {campaign.is_offchain_enabled && (
        <Section title="Donasi Non-Crypto (Off-Chain)">
            <OffchainDonationHistory campaignId={campaign.id} />
        </Section>
        )}


        <Section title="Timeline Campaign">
          <CampaignTimeline campaignId={campaign.id} />
        </Section>
    </div>
  );
}

/* ================== */
/* HELPER COMPONENTS */
/* ================== */

function Section({ title, children }) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value || "0"}</p>
    </div>
  );
}

function TransactionTable({ headers, rows, renderRow }) {
  if (rows.length === 0)
    return <p className="text-sm text-gray-500">Belum ada transaksi.</p>;

  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {headers.map((h) => (
              <th key={h} className="text-left py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}

function short(addr = "") {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

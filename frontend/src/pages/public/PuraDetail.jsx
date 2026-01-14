// src/pages/public/PuraDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicPuraDetail } from "../../api/public.api";
import CampaignCardDB from "../../components/public/CampaignCardDB";
import CampaignCardSC from "../../components/public/CampaignCardSC";
import { Link } from "react-router-dom";

export default function PuraDetail() {
  const { id } = useParams();
  const [pura, setPura] = useState(null);
  const [campaignDB, setCampaignDB] = useState([]);
  const [campaignSC, setCampaignSC] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetchPublicPuraDetail(id);
        const data = res?.data || res;

        setPura(data.pura);
        setCampaignDB(Array.isArray(data.campaigns?.db) ? data.campaigns.db : []);
        setCampaignSC(
          Array.isArray(data.campaigns?.sc_only) ? data.campaigns.sc_only : []
        );
      } catch (err) {
        console.error("Failed fetch pura detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleDonateOnchain = (campaignId) => {
    // NANTI: connect wallet + call SC
    console.log("Donate onchain to campaign:", campaignId);
  };

  if (loading) return <p className="p-4">Loading...</p>;
  if (!pura) return <p className="p-4">Pura tidak ditemukan.</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Info Pura */}
      <h1 className="text-2xl font-bold">{pura.nama_pura}</h1>
      <p className="text-sm text-gray-600 mt-1">{pura.alamat_pura}</p>
      <Link
        to={`/pura/${pura.id}/financial-reports`}
        className="text-blue-600 text-sm hover:underline"
      >
        Lihat Laporan Keuangan
      </Link>

      {/* Saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <SaldoCard title="Saldo Operasional" value={pura.saldo_operasional} />
        <SaldoCard
          title="Pending Onchain"
          value={pura.saldo_pending_onchain}
        />
        <SaldoCard
          title="Pending Offchain"
          value={pura.saldo_pending_offchain}
        />
      </div>

      {/* Campaign DB */}
      <Section title="Campaign (Database)">
        {campaignDB.length === 0 ? (
          <Empty text="Belum ada campaign." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignDB.map((c) => (
              <CampaignCardDB key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </Section>

      {/* Campaign SC-only */}
      <Section title="Campaign Onchain">
        {campaignSC.length === 0 ? (
          <Empty text="Belum ada campaign onchain." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignSC.map((c) => (
              <CampaignCardSC
                key={c.id_campaign_onchain}
                campaign={c}
                onDonate={handleDonateOnchain}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ===== Helper Components ===== */

function Section({ title, children }) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function SaldoCard({ title, value }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-gray-500">{text}</p>;
}

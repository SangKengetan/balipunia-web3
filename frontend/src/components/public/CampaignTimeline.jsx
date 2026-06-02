import { useEffect, useState } from "react";
import { fetchCampaignTimeline } from "../../api/public.api";

export default function CampaignTimeline({ campaignId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchCampaignTimeline(campaignId);
        setItems(res.data || []);
      } catch (err) {
        console.error("Failed fetch timeline", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [campaignId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Memuat timeline...</p>;
  }

  if (!items.length) {
    return <p className="text-sm text-gray-500">Belum ada aktivitas.</p>;
  }

  return (
    <div className="relative border-l border-gray-200 ml-3 space-y-6 pb-2 pt-2">
      {items.map((item, i) => (
        <div key={i} className="relative pl-6">
          {/* DOT */}
          <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-white" />

          {/* CONTENT */}
          <div className="flex flex-col">
            <div className="font-bold text-gray-900">{item.title}</div>

            <div className="text-xs text-gray-500 font-medium">
              {new Date(item.timestamp).toLocaleDateString('id-ID', {
                 weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </div>

            {item.details && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 space-y-1 font-mono">
                {item.details.txHash && (
                  <div>Tx: <a href={`https://testnet.bscscan.com/tx/${item.details.txHash}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{short(item.details.txHash)}</a></div>
                )}
                {item.details.ipfsCid && (
                  <div>CID: <a href={`https://gateway.pinata.cloud/ipfs/${item.details.ipfsCid}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{short(item.details.ipfsCid)}</a></div>
                )}
                {item.details.fileName && (
                  <div>File: {item.details.fileName}</div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function short(v = "") {
  return v.slice(0, 8) + "..." + v.slice(-6);
}

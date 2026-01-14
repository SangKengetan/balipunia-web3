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
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4">
          {/* DOT */}
          <div className="mt-1 h-3 w-3 rounded-full bg-blue-600" />

          {/* CONTENT */}
          <div className="flex-1">
            <div className="font-medium">{item.title}</div>

            <div className="text-xs text-gray-500">
              {new Date(item.timestamp).toLocaleString()}
            </div>

            {item.details && (
              <div className="mt-1 text-xs text-gray-600 space-y-1">
                {item.details.txHash && (
                  <div>Tx: {short(item.details.txHash)}</div>
                )}
                {item.details.ipfsCid && (
                  <div>CID: {item.details.ipfsCid}</div>
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

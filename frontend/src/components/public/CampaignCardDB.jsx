import React from "react";
import { useNavigate } from "react-router-dom";

// Helper sederhana untuk tanggal
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    timeZone: "Asia/Makassar",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) + " WITA";
};

const getStatusDisplay = (campaign) => {
  const { status, deadline } = campaign;
  
  if (status === 'REPORTED') {
    return { label: 'Telah Dilaporkan', style: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  if (status === 'WITHDRAWN') {
    return { label: 'Telah Dicairkan', style: 'bg-blue-100 text-blue-800 border-blue-200' };
  }
    if (status === 'ACTIVE') {
      if (deadline && new Date(deadline) < new Date()) {
        return { label: 'Belum Dicairkan', style: 'bg-gray-100 text-gray-800 border-gray-200' };
      }
      return { label: 'Sedang Berjalan', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (status === 'REQUEST WITHDRAW') {
      return { label: 'Pengajuan Tarik Dana', style: 'bg-orange-100 text-orange-800 border-orange-200' };
    }
    
    return { label: status || 'Unknown', style: 'bg-gray-100 text-gray-800 border-gray-200' };
};

export default function CampaignCardDB({ campaign }) {
  const navigate = useNavigate();

  const { id, id_campaign_onchain, title, purpose, deadline, status } = campaign;
  const statusInfo = getStatusDisplay(campaign);

  // Jika campaign SC-only, id_campaign_onchain yang ada. Kita navigasi ke id database kalau ada, atau id onchain.
  // Tapi route /campaign/:id biasanya mengharapkan id database (UUID).
  const targetId = id || id_campaign_onchain;

  return (
    <div
      onClick={() => navigate(`/campaign/${targetId}`)}
      className="group relative flex flex-col w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer p-5"
    >
      {/* Campaign Image / PDF Preview */}
      {campaign.image_url && (() => {
        const fullUrl = campaign.image_url.startsWith('http') ? campaign.image_url : `${import.meta.env.VITE_API_BASE_URL}${campaign.image_url}`;
        const isPdf = campaign.image_url.toLowerCase().endsWith('.pdf');
        
        return (
          <div className="w-full h-32 mb-4 rounded-lg overflow-hidden shrink-0 relative bg-gray-50">
            {isPdf ? (
              <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 group-hover:scale-105 transition-transform duration-500">
                <svg className="w-12 h-12 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-slate-500">Dokumen PDF</span>
              </div>
            ) : (
              <img 
                src={fullUrl} 
                alt={title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
          </div>
        );
      })()}

      <div className="flex justify-between items-start mb-4 px-2">
         <div className="flex flex-col gap-2">
           <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${statusInfo.style} self-start`}>
             {statusInfo.label}
           </span>
           {purpose && (
             <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md border bg-amber-50 text-amber-700 border-amber-200 self-start capitalize">
               {purpose.toLowerCase().replace(/_/g, " ")}
             </span>
           )}
         </div>
      </div>

      <div className="flex flex-col flex-1 px-2">
        <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
          {title}
        </h3>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-4 h-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                <span className="text-xs font-medium leading-tight">
                    {deadline ? "Kegiatan Berakhir:" : "Batas Waktu:"} <br/> 
                    <span className="text-gray-700">{deadline ? formatDate(deadline) : "Selalu Terbuka"}</span>
                </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-amber-400 flex items-center justify-center transition-colors duration-300">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
        </div>
      </div>
    </div>
  );
}
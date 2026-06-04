import { useNavigate } from "react-router-dom";

export default function PuraCard({ pura }) {
  const navigate = useNavigate();


  return (
    <div
      onClick={() => {
        const slug = pura.nama_pura.toLowerCase().replace(/ /g, '-');
        navigate(`/pura/${slug}`);
      }}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full"
    >
      {/* 1. IMAGE SECTION */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {/* Jika ada pura.profile_picture */}
        {pura.profile_picture ? (
          <img 
            src={`https://gateway.pinata.cloud/ipfs/${pura.profile_picture}`} 
            alt={pura.nama_pura} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          // Placeholder jika tidak ada gambar (Pattern Background)
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
             <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 21V19H15V21H13V19H11V21H9V19H5V21H3V19H2V17H22V19H21V21H19ZM11 11V13H13V11H11ZM8 11V13H10V11H8ZM14 11V13H16V11H14ZM5 11V13H7V11H5ZM17 11V13H19V11H17ZM5 8H19L22 15H2L5 8ZM12 2L17 7H7L12 2Z" />
             </svg>
          </div>
        )}
        
        {/* Overlay Gradient (supaya teks di atas gambar terbaca jika ada label) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* 2. CONTENT SECTION */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Label Kategori (Optional, misal 'Pura Umum') */}
        <div className="flex justify-between items-start mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Terverifikasi
            </span>
        </div>

        {/* Judul Pura */}
        <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-yellow-600 transition-colors">
          {pura.nama_pura}
        </h2>

        {/* Alamat dengan Icon */}
        <div className="flex items-start mt-1 mb-4">
          <svg className="h-4 w-4 text-gray-400 mt-0.5 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {pura.alamat_pura || "Lokasi belum ditambahkan"}
          </p>
        </div>

        {/* Divider Halus */}
        <div className="border-t border-gray-100 my-auto"></div>

        {/* Footer: Lihat Detail & Arrow */}
        <div className="flex items-center justify-between pt-4 mt-2">
          <span className="text-sm font-semibold text-yellow-600 group-hover:text-yellow-700 transition-colors">
            Lihat Detail
          </span>

          {/* Action Arrow (Muncul warna saat hover) */}
          <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
const { PinataSDK } = require("pinata");
const fs = require("fs");
const { Blob } = require("buffer"); // Diperlukan untuk Node.js v18/v20

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY
});

async function uploadToIPFS(file) {
  try {
    // 1. Baca file dari path Multer ke dalam Buffer
    const buffer = fs.readFileSync(file.path);
    
    // 2. Bungkus ke Blob lalu ke objek File (sesuai dokumentasi Node.js Pinata)
    const blob = new Blob([buffer]);
    const fileObject = new File([blob], file.originalname, { type: file.mimetype });

    // 3. Gunakan path: pinata.upload.public.file
    const result = await pinata.upload.public.file(fileObject);

    // Di SDK v3, CID ada di property "cid"
    return result.cid; 
  } catch (error) {
    console.error("Kesalahan unggah Pinata:", error);
    throw error;
  }
}

/**
 * Upload sebuah JSON object ke IPFS sebagai file .json
 * Digunakan untuk membuat Master Metadata (mirip NFT metadata)
 * yang berisi seluruh data laporan: deskripsi, foto CIDs, financials, dll.
 * @param {Object} jsonData - Objek JSON yang akan diunggah
 * @param {string} fileName - Nama file (misal: "report_metadata.json")
 * @returns {string} CID dari file JSON yang diunggah
 */
async function uploadJSONToIPFS(jsonData, fileName = "report_metadata.json") {
  try {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const fileObject = new File([blob], fileName, { type: "application/json" });

    const result = await pinata.upload.public.file(fileObject);
    return result.cid;
  } catch (error) {
    console.error("Kesalahan unggah JSON ke Pinata:", error);
    throw error;
  }
}

module.exports = { uploadToIPFS, uploadJSONToIPFS };
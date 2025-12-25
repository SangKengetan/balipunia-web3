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

module.exports = { uploadToIPFS };
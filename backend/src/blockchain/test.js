const { keccak256, toUtf8Bytes } = require("ethers");
const {
  registerCampaignOnchain
} = require("./donation.write");

(async () => {
  try {
    const campaignId = 1; // number, akan di-BigInt-kan di helper
    const title = "Donasi Pura Test";
    const titleHash = keccak256(toUtf8Bytes(title));
    const deadline = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // +7 hari
    const creator = "0xC90e153198B209507E20ED3eEea8CE2120D9Bb92"; // address admin/creator

    const tx = await registerCampaignOnchain({
      campaignId,
      titleHash,
      deadline,
      creator
    });

    console.log("TX sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("TX mined in block:", receipt.blockNumber);
  } catch (err) {
    console.error("ERROR:", err);
  }
})();

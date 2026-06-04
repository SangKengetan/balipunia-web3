const campaignService = require("../../services/adminpura/campaign.service");
const vaultService = require("../../services/vault.service");
const { getAdminPuraProfile } = require("../../services/adminpura/adminPuraProfile.service");
const pool = require("../../db/pool");

const USDT = process.env.USDT_ADDRESS;
const USDC = process.env.USDC_ADDRESS;

/**
 * POST /api/adminpura/campaigns/sync
 * 
 * Universal sync — semua tipe kegiatan (HYBRID, MIDTRANS_ONLY, CRYPTO_ONLY)
 * wajib teregistrasi di blockchain terlebih dahulu via MetaMask.
 * Endpoint ini hanya menyimpan metadata ke database setelah tx on-chain sukses.
 */
async function syncCampaign(req, res) {
  try {
    const admin = req.admin;

    if (!admin || !admin.admin_pura_id) {
      return res.status(403).json({ message: "Admin belum terdaftar sebagai admin pura" });
    }

    // 🔒 VALIDASI KELENGKAPAN PROFIL (100%)
    const profile = await getAdminPuraProfile(admin.id);
    if (profile.profile_completion_percentage < 100) {
      return res.status(403).json({
        message: "Harap lengkapi profil Anda hingga 100% (termasuk pendaftaran Trustee) sebelum membuat kegiatan.",
      });
    }

    const {
      id_campaign_onchain,
      tx_hash,
      title,
      description,
      purpose,
      fund_mechanism,
      deadline,
      campaign_type,
    } = req.body;

    let image_url = null;
    if (req.file) {
      image_url = `/uploads/campaigns/${req.file.filename}`;
      req.body.image_url = image_url;
    }

    // Validasi campaign_type
    const validTypes = ['HYBRID', 'MIDTRANS_ONLY', 'CRYPTO_ONLY'];
    if (!validTypes.includes(campaign_type)) {
      return res.status(400).json({
        message: `Tipe kegiatan tidak valid. Harus salah satu dari: ${validTypes.join(', ')}`,
      });
    }

    // Validasi field wajib
    if (!id_campaign_onchain || !tx_hash) {
      return res.status(400).json({
        message: "id_campaign_onchain dan tx_hash wajib diisi (kegiatan harus sudah terdaftar di blockchain).",
      });
    }

    // Cek duplikasi
    const exists = await pool.query(
      `SELECT 1 FROM campaigns WHERE id_campaign_onchain = $1 LIMIT 1`,
      [id_campaign_onchain]
    );

    if (exists.rowCount > 0) {
      return res.status(409).json({ message: "Kegiatan sudah pernah disinkronisasi" });
    }

    const campaign = await campaignService.syncCampaignFromChain(
      admin.admin_pura_id,
      req.body
    );

    res.status(201).json({
      message: "Kegiatan berhasil disinkronisasi",
      campaign,
    });
  } catch (err) {
    console.error("SYNC CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/adminpura/campaigns
 */
async function getMyCampaigns(req, res) {
  try {
    const admin = req.admin;

    if (!admin || !admin.admin_pura_id) {
      return res.status(403).json({ message: "Admin belum terdaftar sebagai admin pura" });
    }

    // 1. Ambil List dari Database
    const { rows } = await pool.query(
      `SELECT id, admin_pura_id, title, description, purpose, fund_mechanism, campaign_type, 
              id_campaign_onchain, tx_hash, image_url, status, created_at, updated_at,
              CASE WHEN deadline IS NOT NULL 
                THEN TO_CHAR(deadline + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+08:00"')
                ELSE NULL 
              END as deadline
       FROM campaigns WHERE admin_pura_id = $1 ORDER BY created_at DESC`,
      [admin.admin_pura_id]
    );

    // 2. Hydrate data Blockchain (Saldo + Metadata SC)
    const campaigns = await Promise.all(
      rows.map(async (c) => {
        let onchainInfo = null;

        if (c.id_campaign_onchain) {
          try {
            // 🚀 PARALLEL REQUEST: Ambil Metadata SC & Saldo sekaligus
            const [scMetadata, balances] = await Promise.all([
               vaultService.getScCampaign(c.id_campaign_onchain),
               vaultService.getCampaignBalances(c.id_campaign_onchain, [USDT, USDC])
            ]);

            onchainInfo = {
              // Data Metadata (Deadline, Withdrawn, Creator)
              ...scMetadata, 
              
              // Data Saldo
              balance_usdt: balances[USDT],
              balance_usdc: balances[USDC],
              
              status: "SYNCED"
            };
          } catch (err) {
            console.error(`Service Error ID ${c.id}:`, err.message);
            onchainInfo = { status: "RPC_ERROR", error: "Gagal mengambil data blockchain" };
          }
        }

        return {
          ...c,
          onchain_info: onchainInfo,
        };
      })
    );

    res.json(campaigns);

  } catch (err) {
    console.error("GET MY CAMPAIGNS ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/adminpura/campaigns/:id (DETAIL)
 */
async function getCampaignById(req, res) {
  try {
    const admin = req.admin;
    const { id } = req.params;

    // 1. Ambil DB
    const { rows } = await pool.query(
      `SELECT id, admin_pura_id, title, description, purpose, fund_mechanism, campaign_type, 
              id_campaign_onchain, tx_hash, image_url, status, created_at, updated_at, payout_wallet,
              CASE WHEN deadline IS NOT NULL 
                THEN TO_CHAR(deadline + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"+08:00"')
                ELSE NULL 
              END as deadline
       FROM campaigns WHERE id = $1 AND admin_pura_id = $2 LIMIT 1`,
      [id, admin.admin_pura_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Kegiatan tidak ditemukan" });
    }

    const campaign = rows[0];
    let onchainDetails = null;
    let history = [];

    // 2. Ambil Blockchain Data via Service
    if (campaign.id_campaign_onchain) {
      const onchainId = campaign.id_campaign_onchain;
      
      try {
        const [scData, balances, donationEvents] = await Promise.all([
          vaultService.getScCampaign(onchainId),
          vaultService.getCampaignBalances(onchainId, [USDT, USDC]),
          vaultService.getDonationHistory({ campaignId: onchainId })
        ]);

        onchainDetails = {
          ...scData,
          balance_usdt: balances[USDT],
          balance_usdc: balances[USDC],
        };
        
        history = donationEvents;

      } catch (err) {
        console.error("Service Error:", err);
        onchainDetails = { status: "RPC_ERROR", message: err.message };
      }
    }

    res.json({
      campaign,
      onchain_details: onchainDetails,
      donation_history: history
    });

  } catch (err) {
    console.error("GET CAMPAIGN BY ID ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

const {
  getCampaignDetailFullService,
} = require("../../services/campaignDetail.service");

/**
 * GET /api/adminpura/campaigns/:id/detail-full
 */
async function getCampaignDetailFull(req, res) {
  try {
    const admin = req.admin;
    const { id } = req.params;

    if (!admin || !admin.admin_pura_id) {
      return res.status(403).json({
        message: "Admin belum terdaftar sebagai admin pura",
      });
    }

    const data = await getCampaignDetailFullService({
      campaignId: id,
      adminPuraId: admin.admin_pura_id,
    });

    res.json(data);
  } catch (err) {
    if (err.message === "CAMPAIGN_NOT_FOUND") {
      return res.status(404).json({ message: "Kegiatan tidak ditemukan" });
    }

    console.error("GET CAMPAIGN DETAIL FULL ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  syncCampaign,
  getMyCampaigns,
  getCampaignById,
  getCampaignDetailFull,
};

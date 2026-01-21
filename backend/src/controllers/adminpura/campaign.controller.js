const campaignService = require("../../services/adminpura/campaign.service");
const vault = require("../../blockchain/vault.contract");
const vaultService = require("../../services/vault.service");
const { ethers } = require("ethers");
const pool = require("../../db/pool");

const USDT = process.env.USDT_ADDRESS;
const USDC = process.env.USDC_ADDRESS;

/**
 * POST /api/adminpura/campaigns
 * DEFAULT = HYBRID
 */
async function createCampaign(req, res) {
  try {
    const admin = req.admin;

    // 🔒 VALIDASI DOMAIN
    if (!admin || !admin.admin_pura_id) {
      return res.status(403).json({
        message: "Admin belum terdaftar sebagai admin pura",
      });
    }

    const campaign = await campaignService.createHybridCampaign(
      admin.admin_pura_id, // ✅ admin_pura.id
      req.body
    );

    res.status(201).json({
      message: "Hybrid campaign created",
      campaign,
    });
  } catch (err) {
    console.error("CREATE CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * POST /api/adminpura/sync sc only
 */
async function syncScOnlyCampaign(req, res) {
  try {
    const admin = req.admin;
    const {
      id_campaign_onchain,
      tx_hash,
      title,
      description,
      purpose,
      deadline,
    } = req.body;

    if (!admin || !admin.admin_pura_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // cek duplikasi
    const exists = await pool.query(
      `SELECT 1 FROM campaigns WHERE id_campaign_onchain = $1 LIMIT 1`,
      [id_campaign_onchain]
    );

    if (exists.rowCount > 0) {
      return res.status(409).json({ message: "Campaign already synced" });
    }

    // Query INSERT yang sudah diperbaiki (onchain_status dihapus)
    const { rows } = await pool.query(
      `
      INSERT INTO campaigns (
        admin_pura_id,
        title,
        description,
        purpose,
        campaign_type,
        is_sc_registered,
        is_onchain_enabled,
        is_offchain_enabled,
        deadline,
        id_campaign_onchain,
        tx_hash,
        status
      )
      VALUES (
        $1, $2, $3, $4,
        'SC-ONLY',
        true,
        true,
        false,
        $5,
        $6,
        $7,
        'ACTIVE'
      )
      RETURNING *
      `,
      [
        admin.admin_pura_id,
        title,
        description,
        purpose,
        deadline,
        id_campaign_onchain,
        tx_hash,
      ]
    );

    res.json({
      message: "Campaign synced successfully",
      campaign: rows[0],
    });
  } catch (err) {
    console.error("SYNC CAMPAIGN ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * GET /api/adminpura/campaigns
 */
// controller/campaignController.js

async function getMyCampaigns(req, res) {
  try {
    const admin = req.admin;

    if (!admin || !admin.admin_pura_id) {
      return res.status(403).json({ message: "Admin belum terdaftar sebagai admin pura" });
    }

    // 1. Ambil List dari Database
    const { rows } = await pool.query(
      `SELECT * FROM campaigns WHERE admin_pura_id = $1 ORDER BY created_at DESC`,
      [admin.admin_pura_id]
    );

    // 2. Hydrate data Blockchain (Saldo + Metadata SC)
    const campaigns = await Promise.all(
      rows.map(async (c) => {
        let onchainInfo = null;

        if (c.campaign_type === 'sc_only' && c.onchain_campaign_id) {
          try {
            // 🚀 PARALLEL REQUEST: Ambil Metadata SC & Saldo Saldo sekaligus
            // Ini akan memanggil getScCampaign() DAN getCampaignBalances()
            const [scMetadata, balances] = await Promise.all([
               vaultService.getScCampaign(c.onchain_campaign_id), // <--- INI TAMBAHANNYA
               vaultService.getCampaignBalances(c.onchain_campaign_id, [USDT, USDC])
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
          onchain_info: onchainInfo, // Sekarang isinya lengkap (Saldo + Status Withdrawn)
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
      `SELECT * FROM campaigns WHERE id = $1 AND admin_pura_id = $2 LIMIT 1`,
      [id, admin.admin_pura_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const campaign = rows[0];
    let onchainDetails = null;
    let history = [];

    // 2. Ambil Blockchain Data via Service
    if (campaign.campaign_type === 'sc_only' && campaign.onchain_campaign_id) {
      const onchainId = campaign.onchain_campaign_id;
      
      try {
        // ✅ PANGGIL SERVICE: Ambil Data SC, Saldo, dan History Donasi
        const [scData, balances, donationEvents] = await Promise.all([
          vaultService.getScCampaign(onchainId),
          vaultService.getCampaignBalances(onchainId, [USDT, USDC]),
          vaultService.getDonationHistory({ campaignId: onchainId }) // 🔥 Fitur Baru
        ]);

        onchainDetails = {
          ...scData, // creator, deadline, withdrawn
          balance_usdt: balances[USDT],
          balance_usdc: balances[USDC],
        };
        
        history = donationEvents; // List pendonor

      } catch (err) {
        console.error("Service Error:", err);
        onchainDetails = { status: "RPC_ERROR", message: err.message };
      }
    }

    res.json({
      campaign,
      onchain_details: onchainDetails,
      donation_history: history // Dikirim ke frontend
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
      return res.status(404).json({ message: "Campaign not found" });
    }

    console.error("GET CAMPAIGN DETAIL FULL ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  createCampaign,
  getMyCampaigns,
  getCampaignById,
  getCampaignDetailFull,
  syncScOnlyCampaign
};

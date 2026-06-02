const { ethers } = require('ethers');
const pool = require('../../db/pool');
const abi = require('../abi/DonationVault.json');

const provider = new ethers.JsonRpcProvider(process.env.BSC_TESTNET_RPC);

const vault = new ethers.Contract(
  process.env.DONATION_VAULT_ADDRESS,
  abi,
  provider
);

function startWithdrawListener() {
  console.log('[SC] Withdrawn listener started');

  vault.on(
    'Withdrawn',
    async (
      campaignId,
      adminPuraWallet,
      usdtAmount,
      usdcAmount,
      timestamp,
      event
    ) => {
      const txHash = event.log.transactionHash;

      const client = await pool.connect();
      try {
        // 1️⃣ Idempotency check
        const exists = await client.query(
          'SELECT 1 FROM sc_event_logs WHERE tx_hash = $1',
          [txHash]
        );
        if (exists.rowCount > 0) {
          return;
        }

        await client.query('BEGIN');

        /**
         * 2️⃣ Ambil campaign dari DB
         * Mapping: onchain_campaign_id → campaigns.id
         */
        const campaignRes = await client.query(
          `
          SELECT id, admin_pura_id
          FROM campaigns
          WHERE id_campaign_onchain = $1
          `,
          [Number(campaignId)]
        );

        if (campaignRes.rowCount === 0) {
          throw new Error('CAMPAIGN_NOT_FOUND');
        }

        const {
          id: campaignDbId,
          admin_pura_id,
        } = campaignRes.rows[0];

        /**
         * 3️⃣ Update status campaign → WITHDRAWN
         */
        await client.query(
          `
          UPDATE campaigns
          SET status = 'WITHDRAWN',
              updated_at = NOW()
          WHERE id = $1
          `,
          [campaignDbId]
        );

        /**
         * 4️⃣ Update saldo admin_pura
         * NOTE:
         * usdtAmount & usdcAmount masih dalam smallest unit
         * Jika ingin konversi (misal ke IDR), lakukan DI SINI
         */
        const totalOnchain = BigInt(usdtAmount) + BigInt(usdcAmount);

        await client.query(
          `
          UPDATE admin_pura
          SET
            saldo_pending_onchain = saldo_pending_onchain - $1
          WHERE id = $2
          `,
          [totalOnchain.toString(), admin_pura_id]
        );

        /**
         * 5️⃣ Simpan event log (idempotent)
         */
        await client.query(
          `
          INSERT INTO sc_event_logs (
            tx_hash,
            event_name,
            campaign_onchain_id
          )
          VALUES ($1, 'Withdrawn', $2)
          `,
          [txHash, Number(campaignId)]
        );

        await client.query('COMMIT');
        console.log('[SC] Withdrawn processed:', txHash);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('[SC] Withdraw listener error:', err.message);
      } finally {
        client.release();
      }
    }
  );
}

module.exports = {
  startWithdrawListener,
};

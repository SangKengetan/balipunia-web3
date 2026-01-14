const pool = require('../../db/pool');

async function getCampaignTimeline(campaignId) {
  const timeline = [];

  // 1️⃣ Campaign created
  const { rows: campaignRows } = await pool.query(
    `
    SELECT status, created_at
    FROM campaigns
    WHERE id = $1
    `,
    [campaignId]
  );

  if (!campaignRows.length) {
    throw new Error('CAMPAIGN_NOT_FOUND');
  }

  const campaign = campaignRows[0];

  timeline.push({
    type: 'ACTIVE',
    title: 'Campaign dibuat & aktif',
    timestamp: campaign.created_at,
  });

  // 2️⃣ REQUEST_WD
  const { rows: wdRows } = await pool.query(
    `
    SELECT created_at
    FROM withdraw_requests
    WHERE campaign_id = $1
      AND status = 'EXECUTED'
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [campaignId]
  );

  if (wdRows.length) {
    timeline.push({
      type: 'REQUEST_WD',
      title: 'Permohonan pencairan dana diajukan',
      timestamp: wdRows[0].created_at,
    });
  }

  // 3️⃣ WITHDRAWN (SC)
  const { rows: scRows } = await pool.query(
    `
    SELECT processed_at
    FROM sc_event_logs
    WHERE campaign_onchain_id = (
      SELECT id_campaign_onchain FROM campaigns WHERE id = $1
    )
      AND event_name = 'Withdrawn'
    LIMIT 1
    `,
    [campaignId]
  );

  if (scRows.length) {
    timeline.push({
      type: 'WITHDRAWN',
      title: 'Dana berhasil dicairkan (on-chain)',
      timestamp: scRows[0].processed_at,
    });
  }

  // 4️⃣ REPORTED
  const { rows: reportRows } = await pool.query(
    `
    SELECT created_at
    FROM campaign_reports
    WHERE campaign_id = $1
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [campaignId]
  );

  if (reportRows.length) {
    timeline.push({
      type: 'REPORTED',
      title: 'Laporan pertanggungjawaban diunggah',
      timestamp: reportRows[0].created_at,
    });
  }

  // 5️⃣ Sort timeline (safety)
  timeline.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return timeline;
}

module.exports = {
  getCampaignTimeline,
};

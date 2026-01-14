const financialReportService = require(
  '../../services/public/financialReport.service'
);

/**
 * GET /public/pura/:puraId/financial-reports
 */
async function listFinancialReportsByPura(req, res) {
  try {
    const { puraId } = req.params;
    const reports =
      await financialReportService.getFinancialReportsByPura(puraId);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /public/financial-reports/:id
 */
async function getFinancialReportDetail(req, res) {
  try {
    const { id } = req.params;
    const report =
      await financialReportService.getFinancialReportDetail(id);
    res.json(report);
  } catch (err) {
    if (err.message === 'FINANCIAL_REPORT_NOT_FOUND') {
      return res.status(404).json({ message: 'Financial report not found' });
    }
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listFinancialReportsByPura,
  getFinancialReportDetail,
};

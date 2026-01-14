const puraService = require('../../services/public/pura.service');

async function listPura(req, res) {
  try {
    const pura = await puraService.listPura();
    res.json(pura);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getPuraDetail(req, res) {
  try {
    const { puraId } = req.params;
    const data = await puraService.getPuraDetail(puraId);
    res.json(data);
  } catch (err) {
    if (err.message === 'PURA_NOT_FOUND') {
      return res.status(404).json({ message: 'Pura not found' });
    }
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listPura,
  getPuraDetail,
};

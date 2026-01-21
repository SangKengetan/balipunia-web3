const {
  getAdminPuraProfile,
  updateAdminPuraProfile
} = require("../../services/adminpura/adminPuraProfile.service");

async function getProfileHandler(req, res) {
  try {
    const admin = req.admin;
    const data = await getAdminPuraProfile(admin.id);

    return res.status(200).json({
      message: "Profil admin pura",
      data
    });
  } catch (err) {
    if (err.message === "ADMIN_PURA_NOT_FOUND") {
      return res.status(404).json({
        message: "Profil admin pura belum tersedia"
      });
    }
    console.error(err);
    return res.status(500).json({
      message: "Gagal mengambil profil admin pura"
    });
  }
}

async function updateProfileHandler(req, res) {
  try {
    const admin = req.admin;

    // ❗ saldo TIDAK BOLEH diupdate dari sini
    const forbiddenFields = [
      "saldo_operasional",
      "saldo_pending_onchain",
      "saldo_pending_offchain"
    ];
    for (const f of forbiddenFields) {
      if (f in req.body) {
        return res.status(400).json({
          message: `Field ${f} tidak boleh diubah`
        });
      }
    }

    const data = await updateAdminPuraProfile(admin.id, req.body);

    return res.status(200).json({
      message: "Profil admin pura berhasil diperbarui",
      data
    });
  } catch (err) {
    if (err.message === "ADMIN_PURA_NOT_FOUND") {
      return res.status(404).json({
        message: "Profil admin pura belum tersedia"
      });
    }
    console.error(err);
    return res.status(500).json({
      message: "Gagal memperbarui profil admin pura"
    });
  }
}

module.exports = {
  getProfileHandler,
  updateProfileHandler
};

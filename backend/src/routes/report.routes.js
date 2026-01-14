const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { uploadReport } = require("../controllers/report.controller");

router.post("/submit", upload.single("file"), uploadReport);

module.exports = router;

const express = require("express");
const router = express.Router();
const faqController = require("../controllers/faq.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Middleware to check if user is superadmin
const requireSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === "SUPERADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Superadmin only" });
  }
};

// Public endpoints
router.get("/", faqController.getAllFaqs);
router.get("/:id", faqController.getFaqById);

// Protected endpoints (Superadmin only)
router.post("/", authMiddleware.authenticateAdmin, requireSuperAdmin, faqController.createFaq);
router.put("/:id", authMiddleware.authenticateAdmin, requireSuperAdmin, faqController.updateFaq);
router.delete("/:id", authMiddleware.authenticateAdmin, requireSuperAdmin, faqController.deleteFaq);

module.exports = router;

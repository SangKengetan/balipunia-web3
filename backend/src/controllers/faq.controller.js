const faqService = require("../services/faq.service");

async function getAllFaqs(req, res) {
  try {
    const faqs = await faqService.getAllFaqs();
    res.status(200).json({ data: faqs });
  } catch (error) {
    console.error("Error getAllFaqs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getFaqById(req, res) {
  try {
    const { id } = req.params;
    const faq = await faqService.getFaqById(id);
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }
    res.status(200).json({ data: faq });
  } catch (error) {
    console.error("Error getFaqById:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function createFaq(req, res) {
  try {
    const { category, question, answer, is_active } = req.body;
    if (!category || !question || !answer) {
      return res.status(400).json({ message: "Category, question, and answer are required" });
    }
    const newFaq = await faqService.createFaq({ category, question, answer, is_active });
    res.status(201).json({ data: newFaq, message: "FAQ created successfully" });
  } catch (error) {
    console.error("Error createFaq:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function updateFaq(req, res) {
  try {
    const { id } = req.params;
    const { category, question, answer, is_active } = req.body;
    
    if (!category || !question || !answer) {
      return res.status(400).json({ message: "Category, question, and answer are required" });
    }

    const updatedFaq = await faqService.updateFaq(id, { category, question, answer, is_active });
    res.status(200).json({ data: updatedFaq, message: "FAQ updated successfully" });
  } catch (error) {
    console.error("Error updateFaq:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function deleteFaq(req, res) {
  try {
    const { id } = req.params;
    await faqService.deleteFaq(id);
    res.status(200).json({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("Error deleteFaq:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
  getAllFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
};

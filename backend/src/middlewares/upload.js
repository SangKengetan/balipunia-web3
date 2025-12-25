const multer = require('multer');

const upload = multer({
  dest: 'tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = upload;

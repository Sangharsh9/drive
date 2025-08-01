const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const UploadModel = require('../models/upload.model');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/auth.middleware'); // JWT middleware
const verifyToken = require('../middleware/auth.middleware');
// Public route
router.get('/home', verifyToken, (req, res) => {
  res.render('home', { user: req.user });
});

// Upload route (protected)
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { originalname, buffer } = req.file;
    const userId = req.user.userId;

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(`uploads/${userId}/${originalname}`, buffer, {
        contentType: req.file.mimetype,
      });

    if (error) throw error;

    await UploadModel.create({
      userId,
      filename: originalname,
      supabasePath: data.path,
    });

    res.status(200).json({ message: 'Upload successful', path: data.path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// My uploads route (protected)
router.get('/my-uploads', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const uploads = await UploadModel.find({ userId }).sort({ uploadedAt: -1 });
    const filesWithUrls = await Promise.all(
      uploads.map(async (file) => {
        const { data: urlData, error } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET)
          .createSignedUrl(file.supabasePath, 60 * 60);
        return {
          filename: file.filename,
          uploadedAt: file.uploadedAt,
          url: urlData?.signedUrl || null
        };
      })
    );
    res.render('my-uploads', { uploads: filesWithUrls }); // <-- Render EJS template
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Could not fetch uploads');
  }
});

// Delete upload route (protected)
router.post('/delete-upload/:filename', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { filename } = req.params;

    // Find the upload document
    const uploadDoc = await UploadModel.findOne({ userId, filename });
    if (!uploadDoc) return res.status(404).send('File not found');

    // Delete from Supabase storage
    const { error: storageError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([uploadDoc.supabasePath]);
    if (storageError) throw storageError;

    // Delete from MongoDB
    await UploadModel.deleteOne({ userId, filename });

    res.redirect('/my-uploads');
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('Could not delete upload');
  }
});

module.exports = router;

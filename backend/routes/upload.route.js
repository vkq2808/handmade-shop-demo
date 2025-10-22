const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const { protect, isAdmin } = require('../middlewares/auth.middleware');

// [POST] /api/upload (admin)
// Accept both single (field: 'image') and multiple (field: 'images') files.
router.post(
  '/',
  protect,
  isAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 20 },
  ]),
  (req, res) => {
    try {
      const files = [];
      if (Array.isArray(req.files?.image)) {
        for (const f of req.files.image) {
          files.push({ filename: f.filename, path: `/uploads/${f.filename}` });
        }
      }
      if (Array.isArray(req.files?.images)) {
        for (const f of req.files.images) {
          files.push({ filename: f.filename, path: `/uploads/${f.filename}` });
        }
      }

      if (!files.length) {
        return res.status(400).json({ message: 'Không có file được tải lên' });
      }

      // Backward-compatible fields for single upload clients
      const single = files[0];
      return res.status(201).json({
        message: 'Upload thành công',
        filename: single?.filename,
        path: single?.path,
        files,
        paths: files.map((f) => f.path),
      });
    } catch (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ message: 'Lỗi khi tải lên', error: err.message });
    }
  }
);

module.exports = router;

// DELETE /api/upload (admin) - remove a file on server
router.delete('/', protect, isAdmin, async (req, res) => {
  try {
    const filePath = req.body?.path || req.query?.path;
    const filename = req.body?.filename || req.query?.filename;
    let target;

    if (filePath && typeof filePath === 'string') {
      // Expecting '/uploads/xyz'
      const base = path.basename(filePath);
      target = path.resolve(process.cwd(), 'uploads', base);
    } else if (filename && typeof filename === 'string') {
      target = path.resolve(process.cwd(), 'uploads', path.basename(filename));
    }

    if (!target) return res.status(400).json({ message: 'Thiếu đường dẫn hoặc tên file' });

    // Ensure target is inside uploads dir
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!target.startsWith(uploadsDir)) {
      return res.status(400).json({ message: 'Đường dẫn không hợp lệ' });
    }

    await fs.promises.unlink(target);
    return res.json({ message: 'Đã xoá file', path: `/uploads/${path.basename(target)}` });
  } catch (err) {
    console.error('Delete upload error:', err);
    if (err.code === 'ENOENT') return res.status(404).json({ message: 'File không tồn tại' });
    return res.status(500).json({ message: 'Lỗi khi xoá file', error: err.message });
  }
});

// Preference cookie to skip remove confirmation for 1 day
router.post('/prefs/skip-remove-confirm', protect, isAdmin, (req, res) => {
  try {
    res.cookie('skipConfirmRemoveImage', '1', {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax',
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Set prefs cookie error:', err);
    res.status(500).json({ message: 'Không thể lưu thiết lập' });
  }
});

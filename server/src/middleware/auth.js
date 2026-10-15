import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../db/store.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Akses ditolak. Silakan masuk terlebih dahulu.' 
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Pengguna tidak ditemukan.' 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false, 
      message: 'Sesi telah kedaluwarsa atau tidak valid.' 
    });
  }
};

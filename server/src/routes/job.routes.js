
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas (lectura)
router.get('/', jobController.getAllJobs);
router.get('/:jobId', jobController.getJobById);

// Rutas protegidas
router.post('/', verifyToken, jobController.createJob);
router.put('/:jobId', verifyToken, jobController.updateJob);
router.delete('/:jobId', verifyToken, jobController.deleteJob);

// Comentarios y respuestas
router.post('/:jobId/comments', verifyToken, jobController.addComment);
router.post('/comments/:commentId/replies', verifyToken, jobController.addReply);

// Likes y guardados
router.post('/:jobId/like', verifyToken, jobController.toggleJobLike);
router.post('/:jobId/save', verifyToken, jobController.toggleSavedJob);
router.get('/saved/me', verifyToken, jobController.getSavedJobs);

module.exports = router;

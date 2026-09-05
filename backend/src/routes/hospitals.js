import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getHospitals,
  searchHospitals,
  getHospitalStats,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
  updateBeds
} from '../controllers/hospitalController.js';
import {
  requestOtp,
  verifyOtp,
  reserveBed,
  confirmReservation,
  releaseReservation,
  dischargePatient,
  getHospitalReservations
} from '../controllers/bedReservationController.js';
import {
  registerHospitalRequest,
  getPendingQueue,
  verifyHospital
} from '../controllers/hospitalAdminController.js';

const router = Router();

// ─── DIRECTORY & SEARCH ROUTES ─────────────────────────────────────────────
router.get('/', getHospitals);
router.get('/search', searchHospitals);
router.get('/stats/overview', getHospitalStats);

// ─── ADMIN & REGISTRATION ROUTES ───────────────────────────────────────────
router.get('/pending/queue', authenticate, authorize('superadmin'), getPendingQueue);
router.post('/register-request', registerHospitalRequest);

// ─── BED RESERVATION & OTP AUTH ROUTES ─────────────────────────────────────
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reservations/:code/confirm', confirmReservation);
router.post('/reservations/:code/release', releaseReservation);
router.post('/reservations/:code/discharge', dischargePatient);

// ─── HOSPITAL CRUD & BED MANAGEMENT ROUTES ─────────────────────────────────
router.post('/', authenticate, authorize('superadmin'), createHospital);
router.get('/:id', getHospitalById);
router.put('/:id', authenticate, authorize('superadmin'), updateHospital);
router.delete('/:id', authenticate, authorize('superadmin'), deleteHospital);

router.put('/:id/beds', authenticate, authorize('admin', 'superadmin'), updateBeds);
router.post('/:id/reserve-bed', reserveBed);
router.get('/:id/reservations', authenticate, authorize('admin', 'superadmin'), getHospitalReservations);
router.patch('/:id/verify', authenticate, authorize('superadmin'), verifyHospital);

export default router;

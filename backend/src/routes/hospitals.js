import { Router } from 'express';
import { authenticate, authorize, authenticateOptional } from '../middleware/auth.js';
import { requireHospitalScope } from '../middleware/ownership.js';
import BedReservation from '../models/BedReservation.js';
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
  getHospitalReservations,
  getActiveHoldByPhone,
  getReservationStatus,
  createWalkinAdmission,
  updatePatientCaseSheet
} from '../controllers/bedReservationController.js';
import {
  registerHospitalRequest,
  getPendingQueue,
  verifyHospital,
  createBedUpgradeRequest,
  getHospitalUpgradeRequests,
  getAllBedUpgradeRequests,
  handleBedUpgradeRequest
} from '../controllers/hospitalAdminController.js';

const router = Router();

// Helper to resolve hospitalId from reservationCode
const resolveHospitalFromReservation = async (req) => {
  const reservation = await BedReservation.findOne({ reservationCode: req.params.code }).select('hospitalId');
  return reservation ? reservation.hospitalId : null;
};

// ─── DIRECTORY & SEARCH ROUTES ─────────────────────────────────────────────
router.get('/', getHospitals);
router.get('/search', searchHospitals);
router.get('/stats/overview', getHospitalStats);

// ─── ADMIN & REGISTRATION ROUTES ───────────────────────────────────────────
router.get('/pending/queue', authenticate, authorize('superadmin'), getPendingQueue);
router.get('/admin/bed-upgrade-requests', authenticate, authorize('superadmin'), getAllBedUpgradeRequests);
router.patch('/admin/bed-upgrade-requests/:requestId', authenticate, authorize('superadmin'), handleBedUpgradeRequest);
router.post('/register-request', registerHospitalRequest);


// ─── BED RESERVATION & OTP AUTH ROUTES ─────────────────────────────────────
router.get('/active-hold', getActiveHoldByPhone);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reservations/:code/confirm', authenticate, authorize('admin', 'superadmin'), requireHospitalScope({ resolver: resolveHospitalFromReservation }), confirmReservation);
router.patch('/reservations/:code/case-sheet', authenticate, authorize('admin', 'superadmin'), requireHospitalScope({ resolver: resolveHospitalFromReservation }), updatePatientCaseSheet);
router.post('/reservations/:code/release', authenticateOptional, releaseReservation);
router.post('/reservations/:code/discharge', authenticate, authorize('admin', 'superadmin'), requireHospitalScope({ resolver: resolveHospitalFromReservation }), dischargePatient);
router.get('/reservations/:code/status', getReservationStatus);

// ─── HOSPITAL CRUD & BED MANAGEMENT ROUTES ─────────────────────────────────
router.post('/', authenticate, authorize('superadmin'), createHospital);
router.get('/:id', getHospitalById);
router.put('/:id', authenticate, authorize('superadmin'), updateHospital);
router.delete('/:id', authenticate, authorize('superadmin'), deleteHospital);

router.put('/:id/beds', authenticate, authorize('admin', 'superadmin'), requireHospitalScope({ key: 'id' }), updateBeds);
router.post('/:id/bed-upgrade-request', authenticate, authorize('admin', 'superadmin'), requireHospitalScope({ key: 'id' }), createBedUpgradeRequest);
router.get('/:id/bed-upgrade-requests', authenticate, authorize('admin', 'superadmin'), requireHospitalScope({ key: 'id' }), getHospitalUpgradeRequests);
router.post('/:id/reserve-bed', reserveBed);
router.post('/:id/walkin-admission', authenticate, authorize('admin', 'superadmin'), requireHospitalScope({ key: 'id' }), createWalkinAdmission);
router.get('/:id/reservations', authenticate, authorize('admin', 'superadmin'), requireHospitalScope({ key: 'id' }), getHospitalReservations);
router.patch('/:id/verify', authenticate, authorize('superadmin'), verifyHospital);


export default router;

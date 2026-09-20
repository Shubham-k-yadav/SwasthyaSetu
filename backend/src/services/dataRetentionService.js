import cron from 'node-cron';
import mongoose from 'mongoose';
import BedReservation from '../models/BedReservation.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import BedUpgradeRequest from '../models/BedUpgradeRequest.js';
import Hospital from '../models/Hospital.js';
import { emitBedUpdate } from './socket.js';

/**
 * 3-Month Automated Data Retention Policy
 * Automatically purges patient tickets, admissions, case sheets, and emergency requests
 * that are older than retentionDays (default: 90 days / 3 months) to prevent database bloat.
 */
export async function purgeOldPatientData(retentionDays = 90) {
  if (mongoose.connection.readyState !== 1) {
    console.warn('[DataRetention] Database not connected. Skipping purge cycle.');
    return { success: false, reason: 'Database not connected' };
  }

  try {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

    console.log(`[DataRetention] 🕒 Starting automated cleanup of records older than ${retentionDays} days (before ${cutoffDate.toISOString()})...`);

    // 1. Check for any stale active/confirmed reservations older than 90 days that were never formally discharged.
    // We safely restore the bed count to hospital live inventory before deleting the document.
    const staleActiveReservations = await BedReservation.find({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['reserved', 'confirmed'] }
    });

    let restoredBedsCount = 0;
    for (const res of staleActiveReservations) {
      try {
        const bedField = `beds.${res.bedType}.available`;
        const updatedHosp = await Hospital.findByIdAndUpdate(
          res.hospitalId,
          { $inc: { [bedField]: 1 }, $set: { lastUpdated: now } },
          { new: true }
        );
        if (updatedHosp) {
          emitBedUpdate(updatedHosp._id, updatedHosp.beds);
          restoredBedsCount++;
        }
      } catch (err) {
        console.error(`[DataRetention] Could not restore bed for stale reservation ${res.reservationCode}:`, err.message);
      }
    }

    // 2. Permanently delete all BedReservation records older than 90 days (discharged, expired, released, and stale)
    const reservationDeleteResult = await BedReservation.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    // 3. Permanently delete all EmergencyRequest records older than 90 days
    const emergencyDeleteResult = await EmergencyRequest.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    // 4. Permanently delete all BedUpgradeRequest records older than 90 days
    const upgradeDeleteResult = await BedUpgradeRequest.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    const summary = {
      success: true,
      retentionDays,
      cutoffDate,
      deletedBedReservations: reservationDeleteResult.deletedCount || 0,
      deletedEmergencyRequests: emergencyDeleteResult.deletedCount || 0,
      deletedBedUpgradeRequests: upgradeDeleteResult.deletedCount || 0,
      restoredBedsCount
    };

    console.log(
      `[DataRetention] 🧹 Automated Purge Complete: ` +
      `${summary.deletedBedReservations} patient reservations, ` +
      `${summary.deletedEmergencyRequests} emergency requests, ` +
      `${summary.deletedBedUpgradeRequests} upgrade logs deleted. ` +
      `(${summary.restoredBedsCount} stale occupied beds restored).`
    );

    return summary;
  } catch (error) {
    console.error('[DataRetention] Error during patient data purge:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initializes recurring data retention cron job
 * Runs daily at 02:00 AM (server local time)
 * Also triggers on startup after a 15-second grace period
 */
export function startDataRetentionCron() {
  // Recurring daily at 02:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[DataRetention] Executing scheduled daily 02:00 AM patient data retention cycle...');
    await purgeOldPatientData(90);
  });
  console.log('✔ Patient 3-month (90-day) data retention cron scheduled (Daily at 02:00 AM)');

  // Initial check on server startup (after 15 seconds)
  setTimeout(async () => {
    try {
      await purgeOldPatientData(90);
    } catch (err) {
      console.warn('[DataRetention] Startup purge check encountered error:', err.message);
    }
  }, 15000);
}

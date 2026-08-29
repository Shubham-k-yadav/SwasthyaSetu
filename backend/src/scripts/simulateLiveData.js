import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import BloodStock from '../models/BloodStock.js';
import Ambulance from '../models/Ambulance.js';
import { getIO } from '../services/socket.js';

/**
 * Live Data Simulator for Demo Mode
 * Safely mutates ONLY records with isSimulated: true
 * NEVER touches real verified onboarded hospitals or blood banks!
 */
export async function runLiveDataSimulation() {
  const isDemoMode = process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === true || process.env.DEMO_MODE === undefined;

  if (!isDemoMode) {
    console.log('[SIMULATED] Demo mode is OFF (DEMO_MODE=false). Simulation skipped.');
    return;
  }

  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    const io = getIO();

    // ─── 1. SIMULATE HOSPITAL BED UPDATES ──────────────────────────────────
    const simulatedHospitals = await Hospital.find({ isSimulated: true }).limit(50);

    if (simulatedHospitals.length > 0) {
      // Pick 2-4 random simulated hospitals to mutate
      const numToMutate = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...simulatedHospitals].sort(() => 0.5 - Math.random());
      const selectedHospitals = shuffled.slice(0, Math.min(numToMutate, simulatedHospitals.length));

      for (const hospital of selectedHospitals) {
        const bedTypes = ['icu', 'general', 'ventilator'];
        const chosenBedType = bedTypes[Math.floor(Math.random() * bedTypes.length)];
        
        const currentAvail = hospital.beds?.[chosenBedType]?.available || 0;
        const totalBeds = hospital.beds?.[chosenBedType]?.total || 50;

        // Small random delta between -3 and +3
        const delta = (Math.floor(Math.random() * 3) + 1) * (Math.random() > 0.5 ? 1 : -1);
        const newAvail = Math.max(0, Math.min(totalBeds, currentAvail + delta));

        if (newAvail !== currentAvail) {
          hospital.beds[chosenBedType].available = newAvail;
          hospital.lastUpdated = new Date();
          await hospital.save();

          console.log(`[SIMULATED] Bed Update for ${hospital.name} (${hospital.city}): ${chosenBedType.toUpperCase()} beds ${currentAvail} -> ${newAvail} (Delta: ${delta > 0 ? '+' : ''}${delta})`);

          // Broadcast via Socket.io
          io.emit('bed-update', {
            hospitalId: hospital._id,
            beds: hospital.beds,
            updatedAt: hospital.lastUpdated.toISOString()
          });
        }
      }
    }

    // ─── 2. SIMULATE BLOOD STOCK UPDATES ───────────────────────────────────
    const simulatedBloodStocks = await BloodStock.find({}).limit(20);

    if (simulatedBloodStocks.length > 0) {
      const randomStock = simulatedBloodStocks[Math.floor(Math.random() * simulatedBloodStocks.length)];
      const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const chosenGroup = bloodGroups[Math.floor(Math.random() * bloodGroups.length)];

      const currentQty = randomStock.bloodGroups?.get?.(chosenGroup) || 10;
      // Small delta ±1 to ±4
      const delta = (Math.floor(Math.random() * 4) + 1) * (Math.random() > 0.6 ? 1 : -1);
      const newQty = Math.max(1, currentQty + delta);

      randomStock.bloodGroups.set(chosenGroup, newQty);
      randomStock.lastUpdated = new Date();
      await randomStock.save();

      const isCritical = newQty < 5;
      console.log(`[SIMULATED] Blood Stock Update for ${randomStock.city}: Group ${chosenGroup} ${currentQty} -> ${newQty} units ${isCritical ? '⚠️ [CRITICAL SHORTAGE]' : ''}`);

      // Broadcast via Socket.io
      io.emit('blood-stock-update', {
        bloodBankId: randomStock._id,
        stockData: Object.fromEntries(randomStock.bloodGroups),
        updatedAt: randomStock.lastUpdated.toISOString()
      });
    }

    // ─── 3. SIMULATE AMBULANCE MOVEMENT JITTER ─────────────────────────────
    const simulatedAmbulances = await Ambulance.find({ isSimulated: true }).limit(5);

    for (const amb of simulatedAmbulances) {
      // Small jitter ~10-50 meters
      const latJitter = (Math.random() - 0.5) * 0.001;
      const lngJitter = (Math.random() - 0.5) * 0.001;

      amb.currentLat = Number((amb.currentLat + latJitter).toFixed(6));
      amb.currentLng = Number((amb.currentLng + lngJitter).toFixed(6));
      amb.lastUpdated = new Date();
      await amb.save();

      console.log(`[SIMULATED] Ambulance ${amb.vehicleNumber} position updated: Lat ${amb.currentLat}, Lng ${amb.currentLng}`);

      // Broadcast via Socket.io
      io.emit('ambulance-updates', {
        ambulanceId: amb._id,
        vehicleNumber: amb.vehicleNumber,
        driverName: amb.driverName,
        lat: amb.currentLat,
        lng: amb.currentLng,
        status: amb.status,
        equipmentLevel: amb.equipmentLevel,
        updatedAt: amb.lastUpdated.toISOString()
      });
    }
  } catch (error) {
    console.error('[SIMULATED] Error running simulation step:', error.message);
  }
}

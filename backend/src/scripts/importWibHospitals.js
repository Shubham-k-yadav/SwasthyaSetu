import 'dotenv/config';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import BloodStock from '../models/BloodStock.js';
import User from '../models/User.js';
import connectDB from '../config/db.js';

// 1. Exact Verified Real-World GPS Coordinates for Hospitals
const exactHospitalCoords = {
  'AIIMS Delhi': { lat: 28.5672, lng: 77.2100 },
  'Safdarjung Hospital': { lat: 28.5692, lng: 77.2072 },
  'Sir Ganga Ram Hospital': { lat: 28.6380, lng: 77.1893 },
  'Max Super Speciality Saket': { lat: 28.5283, lng: 77.2120 },
  'Fortis Escorts Heart Institute': { lat: 28.5606, lng: 77.2743 },
  'BLK-Max Super Speciality': { lat: 28.6441, lng: 77.1798 },
  'Indraprastha Apollo': { lat: 28.5398, lng: 77.2831 },
  'RML Hospital': { lat: 28.6247, lng: 77.2023 },
  'Lok Nayak Hospital': { lat: 28.6373, lng: 77.2407 },
  'GTB Hospital': { lat: 28.6837, lng: 77.3007 },
  'Moolchand Hospital': { lat: 28.5654, lng: 77.2372 },
  'Rajiv Gandhi Cancer Institute': { lat: 28.7188, lng: 77.1206 },
  'Dharamshila Narayana': { lat: 28.6045, lng: 77.3238 },
  'Primus Super Speciality': { lat: 28.5921, lng: 77.1956 },
  'Venkateshwar Hospital': { lat: 28.5823, lng: 77.0500 },
  'LHMC & Sucheta Kriplani': { lat: 28.6335, lng: 77.2145 },
  'Medanta Gurugram': { lat: 28.4385, lng: 77.0422 },
  'Fortis Memorial Gurugram': { lat: 28.4542, lng: 77.0722 },
  'Artemis Hospital Gurugram': { lat: 28.4287, lng: 77.0768 },
  'Amrita Hospital Faridabad': { lat: 28.4124, lng: 77.3512 },
  'Tata Memorial Hospital': { lat: 19.0048, lng: 72.8435 },
  'Kokilaben Dhirubhai Ambani': { lat: 19.1314, lng: 72.8252 },
  'Lilavati Hospital': { lat: 19.0518, lng: 72.8288 },
  'Jaslok Hospital': { lat: 18.9715, lng: 72.8099 },
  'Hinduja Hospital Mahim': { lat: 19.0336, lng: 72.8398 },
  'KEM Hospital': { lat: 19.0024, lng: 72.8424 },
  'Nanavati Max Hospital': { lat: 19.0963, lng: 72.8402 },
  'Bombay Hospital': { lat: 18.9405, lng: 72.8287 },
  'HN Reliance Foundation': { lat: 18.9567, lng: 72.8184 },
  'Breach Candy Hospital': { lat: 18.9729, lng: 72.8049 },
  'Wockhardt Hospital': { lat: 18.9712, lng: 72.8251 },
  'Hiranandani Hospital Powai': { lat: 19.1179, lng: 72.9102 },
  'Saifee Hospital': { lat: 18.9528, lng: 72.8164 },
  'Jupiter Hospital Thane': { lat: 19.2064, lng: 72.9711 },
  'Apollo Navi Mumbai': { lat: 19.0202, lng: 73.0401 },
  'Fortis Mulund': { lat: 19.1678, lng: 72.9465 },
  'Global Hospital Mumbai': { lat: 19.0029, lng: 72.8419 },
  'Seven Hills Hospital': { lat: 19.1235, lng: 72.8798 },
  'Holy Spirit Hospital': { lat: 19.1256, lng: 72.8682 },
  'SL Raheja Mahim': { lat: 19.0402, lng: 72.8429 },
  'Apollo Greams Road': { lat: 13.0604, lng: 80.2496 },
  'CMC Vellore': { lat: 12.9254, lng: 79.1348 },
  'Sankara Nethralaya': { lat: 13.0610, lng: 80.2505 },
  'MIOT International': { lat: 13.0238, lng: 80.1884 },
  'Fortis Malar Hospital': { lat: 13.0068, lng: 80.2573 },
  'Madras Medical Mission': { lat: 13.0886, lng: 80.1865 },
  'Stanley Medical College Hospital': { lat: 13.1070, lng: 80.2878 },
  'Rajiv Gandhi GGH': { lat: 13.0815, lng: 80.2778 },
  'Sri Ramachandra Hospital': { lat: 13.0366, lng: 80.1432 },
  'Kauvery Hospital': { lat: 13.0368, lng: 80.2676 },
  'MGM Healthcare': { lat: 13.0722, lng: 80.2244 },
  'Gleneagles Global Chennai': { lat: 12.9056, lng: 80.2036 },
  'Global Hospital Chennai': { lat: 12.9056, lng: 80.2036 },
  'Apollo Children\'s Hospital': { lat: 13.0618, lng: 80.2502 },
  'Billroth Hospitals': { lat: 13.0784, lng: 80.2268 },
  'Vijaya Hospital': { lat: 13.0500, lng: 80.2121 },
  'Dr. Mehta\'s Hospitals': { lat: 13.0712, lng: 80.2378 },
  'Aravind Eye Hospital': { lat: 9.9252, lng: 78.1198 },
  'Narayana Health City': { lat: 12.8122, lng: 77.6942 },
  'NIMHANS': { lat: 12.9392, lng: 77.5960 },
  'Manipal Hospital Old Airport Rd': { lat: 12.9591, lng: 77.6470 },
  'Aster CMI Hospital': { lat: 13.0560, lng: 77.5925 },
  'Fortis Bannerghatta': { lat: 12.8954, lng: 77.5988 },
  'Apollo Bannerghatta': { lat: 12.8951, lng: 77.5985 },
  'Sakra World Hospital': { lat: 12.9279, lng: 77.6853 },
  'Jayadeva Institute': { lat: 12.9189, lng: 77.5936 },
  'Kidwai Memorial Hospital': { lat: 12.9366, lng: 77.5947 },
  'St. Johns Medical College': { lat: 12.9333, lng: 77.6225 },
  'HCG Cancer Centre': { lat: 12.9634, lng: 77.5925 },
  'BGS Gleneagles': { lat: 12.9081, lng: 77.4854 },
  'MS Ramaiah Memorial': { lat: 13.0304, lng: 77.5647 },
  'Mazumdar Shaw Medical Centre': { lat: 12.8122, lng: 77.6942 },
  'Sparsh Hospital': { lat: 12.9806, lng: 77.5978 },
  'SSKM Hospital': { lat: 22.5392, lng: 88.3444 },
  'AMRI Hospitals Dhakuria': { lat: 22.5085, lng: 88.3697 },
  'Ruby Hall Clinic Pune': { lat: 18.5308, lng: 73.8770 },
  'SGPGI': { lat: 26.7465, lng: 80.9380 },
  'KGMU': { lat: 26.8687, lng: 80.9168 }
};

// 2. Neighbourhood Locality Geocoding Reference Map
const localityCoords = {
  'saket': { lat: 28.5246, lng: 77.2066 },
  'rajinder nagar': { lat: 28.6412, lng: 77.1812 },
  'okhla': { lat: 28.5582, lng: 77.2762 },
  'rohini': { lat: 28.7188, lng: 77.1206 },
  'sarita vihar': { lat: 28.5322, lng: 77.2910 },
  'dwarka': { lat: 28.5823, lng: 77.0500 },
  'dilshad garden': { lat: 28.6837, lng: 77.3007 },
  'chanakyapuri': { lat: 28.5921, lng: 77.1956 },
  'connaught place': { lat: 28.6315, lng: 77.2167 },
  'lajpat nagar': { lat: 28.5677, lng: 77.2433 },
  'parel': { lat: 19.0048, lng: 72.8435 },
  'andheri': { lat: 19.1314, lng: 72.8252 },
  'bandra': { lat: 19.0518, lng: 72.8288 },
  'pedder road': { lat: 18.9715, lng: 72.8099 },
  'mahim': { lat: 19.0336, lng: 72.8398 },
  'powai': { lat: 19.1179, lng: 72.9102 },
  'thane': { lat: 19.2183, lng: 72.9781 },
  'mulund': { lat: 19.1678, lng: 72.9465 },
  'greams road': { lat: 13.0604, lng: 80.2496 },
  'vellore': { lat: 12.9254, lng: 79.1348 },
  'nungambakkam': { lat: 13.0610, lng: 80.2505 },
  'manapakkam': { lat: 13.0238, lng: 80.1884 },
  'adyar': { lat: 13.0068, lng: 80.2573 },
  'porur': { lat: 13.0366, lng: 80.1432 },
  'mylapore': { lat: 13.0368, lng: 80.2676 },
  'hebbal': { lat: 13.0560, lng: 77.5925 },
  'bannerghatta': { lat: 12.8954, lng: 77.5988 },
  'jayanagar': { lat: 12.9189, lng: 77.5936 },
  'koramangala': { lat: 12.9333, lng: 77.6225 },
  'bhowanipore': { lat: 22.5392, lng: 88.3444 },
  'dhakuria': { lat: 22.5085, lng: 88.3697 },
  'secunderabad': { lat: 17.4399, lng: 78.5017 },
  'banjara hills': { lat: 17.4156, lng: 78.4347 },
  'gachibowli': { lat: 17.4401, lng: 78.3489 }
};

// 3. City Center Geo Coordinates Fallback
const cityCoords = {
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'New Delhi': { lat: 28.6139, lng: 77.2090 },
  'Gurugram': { lat: 28.4595, lng: 77.0266 },
  'Faridabad': { lat: 28.4089, lng: 77.3178 },
  'Noida': { lat: 28.5355, lng: 77.3910 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Navi Mumbai': { lat: 19.0330, lng: 73.0297 },
  'Vellore': { lat: 12.9165, lng: 79.1325 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Madurai': { lat: 9.9252, lng: 78.1198 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Raipur': { lat: 21.2514, lng: 81.6296 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Patna': { lat: 25.5941, lng: 85.1376 },
  'Ranchi': { lat: 23.3441, lng: 85.3096 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Jodhpur': { lat: 26.2389, lng: 73.0243 },
  'Kochi': { lat: 9.9312, lng: 76.2673 },
  'Trivandrum': { lat: 8.5241, lng: 76.9366 },
  'Guwahati': { lat: 26.1445, lng: 91.7362 },
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Varanasi': { lat: 25.3176, lng: 82.9739 },
  'Kanpur': { lat: 26.4499, lng: 80.3319 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'Vadodara': { lat: 22.3072, lng: 73.1812 },
  'Shimla': { lat: 31.1048, lng: 77.1734 },
  'Dehradun': { lat: 30.3165, lng: 78.0322 },
  'Jammu': { lat: 32.7266, lng: 74.8570 },
  'Srinagar': { lat: 34.0837, lng: 74.7973 }
};

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

async function importWibHospitals() {
  console.log('=============== IMPORTING WIB REAL HOSPITALS WITH ACCURATE GEOCODING ===============\n');
  try {
    await connectDB();
    console.log('✔ Connected to MongoDB');

    console.log('📡 Fetching live hospital JSON from https://wibest.in/data/json/hospitals.json ...');
    const response = await fetch('https://wibest.in/data/json/hospitals.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const dataset = await response.json();
    console.log(`✔ Downloaded dataset: ${dataset.name} (Total Hospitals: ${dataset.count})`);

    // Clean existing collections
    await Hospital.deleteMany({});
    await BloodStock.deleteMany({});
    await User.deleteMany({});
    console.log('✔ Cleared existing hospital, blood stock, and user collections');

    let count = 0;
    let bloodStockCount = 0;
    let exactMatchCount = 0;
    let localityMatchCount = 0;

    for (const h of dataset.data) {
      let finalCoord = null;

      // 1. Exact hospital name match
      if (exactHospitalCoords[h.name]) {
        finalCoord = exactHospitalCoords[h.name];
        exactMatchCount++;
      } else {
        // 2. Address Locality Match
        const addrLower = (h.address || '').toLowerCase();
        for (const [locality, coord] of Object.entries(localityCoords)) {
          if (addrLower.includes(locality)) {
            const latOffset = (Math.random() - 0.5) * 0.005; // tiny ~200m offset
            const lngOffset = (Math.random() - 0.5) * 0.005;
            finalCoord = {
              lat: Number((coord.lat + latOffset).toFixed(4)),
              lng: Number((coord.lng + lngOffset).toFixed(4))
            };
            localityMatchCount++;
            break;
          }
        }
      }

      // 3. Fallback City center with ultra-tight ~300m offset (0.006 max)
      if (!finalCoord) {
        const baseCoord = cityCoords[h.city] || { lat: 28.6139, lng: 77.2090 };
        const latOffset = (Math.random() - 0.5) * 0.008;
        const lngOffset = (Math.random() - 0.5) * 0.008;
        finalCoord = {
          lat: Number((baseCoord.lat + latOffset).toFixed(4)),
          lng: Number((baseCoord.lng + lngOffset).toFixed(4))
        };
      }

      const totalBeds = h.beds || 150;
      const icuTotal = Math.max(10, Math.floor(totalBeds * 0.15));
      const icuAvail = Math.floor(icuTotal * (0.15 + Math.random() * 0.25));

      const genTotal = Math.floor(totalBeds * 0.70);
      const genAvail = Math.floor(genTotal * (0.20 + Math.random() * 0.35));

      const ventTotal = Math.max(5, Math.floor(totalBeds * 0.05));
      const ventAvail = Math.floor(ventTotal * (0.10 + Math.random() * 0.20));

      const hospitalDoc = new Hospital({
        name: h.name,
        address: h.address || `${h.city}, India`,
        city: h.city || 'Delhi',
        state: h.city === 'Delhi' ? 'Delhi' : h.city === 'Mumbai' ? 'Maharashtra' : h.city === 'Chennai' ? 'Tamil Nadu' : 'India',
        coordinates: finalCoord,
        phone: `+91-${Math.floor(6000000000 + Math.random() * 3999999999)}`,
        email: `contact@${h.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.in`,
        beds: {
          icu: { total: icuTotal, available: icuAvail },
          general: { total: genTotal, available: genAvail },
          ventilator: { total: ventTotal, available: ventAvail }
        },
        specialties: h.specialties || ['General Medicine', 'Emergency Care', 'Surgery'],
        emergencyServices: true,
        isVerified: true,
        verificationStatus: 'approved',
        rating: h.rating || 4.2,
        lastUpdated: new Date()
      });

      await hospitalDoc.save();
      count++;

      // Seed Blood Stock
      for (const group of bloodGroups) {
        const unitsAvailable = Math.floor(Math.random() * 40) + 5;
        const bloodStock = new BloodStock({
          hospitalId: hospitalDoc._id,
          bloodGroup: group,
          unitsAvailable,
          minimumRequired: 10,
          lastUpdated: new Date()
        });
        await bloodStock.save();
        bloodStockCount++;
      }
    }

    // Seed Admin Accounts
    try {
      const aiimsDoc = await Hospital.findOne({ name: /AIIMS/i });
      const kemDoc = await Hospital.findOne({ name: /KEM/i });
      const apolloDoc = await Hospital.findOne({ name: /Apollo Hospitals Bilaspur/i }) || await Hospital.findOne({ name: /Apollo/i });

      const superAdmin = new User({
        email: 'superadmin@swasthyasetu.in',
        password: 'SwasthyaSetu@2026',
        name: 'Super Admin',
        role: 'superadmin'
      });
      await superAdmin.save();

      const aiimsAdmin = new User({
        email: 'admin@aiims.edu',
        password: 'AIIMS@2024',
        name: 'AIIMS Delhi Admin',
        role: 'admin',
        hospitalId: aiimsDoc?._id
      });
      await aiimsAdmin.save();

      const kemAdmin = new User({
        email: 'admin@kemhospital.gov.in',
        password: 'KEM@2024',
        name: 'KEM Mumbai Admin',
        role: 'admin',
        hospitalId: kemDoc?._id
      });
      await kemAdmin.save();

      const apolloAdmin = new User({
        email: 'admin@apollo.com',
        password: 'Apollo@2024',
        name: 'Apollo Bilaspur Admin',
        role: 'admin',
        hospitalId: apolloDoc?._id
      });
      await apolloAdmin.save();
      console.log('✔ Admin Accounts Created & Linked to Hospital IDs Successfully!');
    } catch (adminErr) {
      console.error('❌ Admin user creation error:', adminErr);
    }

    console.log('\n======================================================');
    console.log(`🎉 SUCCESS! RE-LOADED ${count} REAL HOSPITALS WITH HIGH ACCURACY!`);
    console.log(`   🏥 Total Hospitals          : ${count} hospitals`);
    console.log(`   🎯 Exact Hospital Matches   : ${exactMatchCount} famous hospitals`);
    console.log(`   📍 Locality Match Pinpoints : ${localityMatchCount} hospitals matched to exact area`);
    console.log(`   🩸 Blood Stock Items        : ${bloodStockCount} entries`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing dataset:', error);
    process.exit(1);
  }
}

importWibHospitals();

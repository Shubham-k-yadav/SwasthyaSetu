import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export async function extractCoordinatesFromGoogleUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let targetUrl = url.trim();

  // If shortened Google link, follow redirect to get full URL
  if (targetUrl.includes('goo.gl') || targetUrl.includes('maps.app.')) {
    try {
      const res = await fetch(targetUrl, { 
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (res.url) {
        targetUrl = res.url;
      }
    } catch (err) {
      console.warn('Error expanding short map URL:', err.message);
    }
  }

  // 1. Match !3d(lat)!4d(lng) (Google Maps Place view)
  const match3d = targetUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (match3d) {
    return { 
      lat: parseFloat(parseFloat(match3d[1]).toFixed(6)), 
      lng: parseFloat(parseFloat(match3d[2]).toFixed(6)),
      expandedUrl: targetUrl 
    };
  }

  // 2. Match @(lat),(lng)
  const matchAt = targetUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchAt) {
    return { 
      lat: parseFloat(parseFloat(matchAt[1]).toFixed(6)), 
      lng: parseFloat(parseFloat(matchAt[2]).toFixed(6)),
      expandedUrl: targetUrl 
    };
  }

  // 3. Match query=(lat),(lng) or q=(lat),(lng)
  const matchQ = targetUrl.match(/[?&](?:query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchQ) {
    return { 
      lat: parseFloat(parseFloat(matchQ[1]).toFixed(6)), 
      lng: parseFloat(parseFloat(matchQ[2]).toFixed(6)),
      expandedUrl: targetUrl 
    };
  }

  // 4. Match ll=(lat),(lng)
  const matchLl = targetUrl.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchLl) {
    return { 
      lat: parseFloat(parseFloat(matchLl[1]).toFixed(6)), 
      lng: parseFloat(parseFloat(matchLl[2]).toFixed(6)),
      expandedUrl: targetUrl 
    };
  }

  // 5. Match loc:(lat)+(lng) or loc:(lat),(lng)
  const matchLoc = targetUrl.match(/loc:(-?\d+\.\d+)[+,](-?\d+\.\d+)/);
  if (matchLoc) {
    return { 
      lat: parseFloat(parseFloat(matchLoc[1]).toFixed(6)), 
      lng: parseFloat(parseFloat(matchLoc[2]).toFixed(6)),
      expandedUrl: targetUrl 
    };
  }

  return null;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Hospital = mongoose.model('Hospital', new mongoose.Schema({}, { strict: false }));
  const BloodBank = mongoose.model('BloodBank', new mongoose.Schema({}, { strict: false }));

  const hospitals = await Hospital.find({}).lean();
  console.log(`Found ${hospitals.length} hospitals.`);

  for (const h of hospitals) {
    if (h.googleMapsUrl) {
      console.log(`Resolving Google Map link for ${h.name}: ${h.googleMapsUrl}`);
      const coords = await extractCoordinatesFromGoogleUrl(h.googleMapsUrl);
      if (coords) {
        await Hospital.updateOne(
          { _id: h._id },
          { $set: { coordinates: { lat: coords.lat, lng: coords.lng } } }
        );
        console.log(`✓ Updated ${h.name} coordinates to: [${coords.lat}, ${coords.lng}]`);
      }
    }
  }

  const bloodBanks = await BloodBank.find({}).lean();
  console.log(`Found ${bloodBanks.length} blood banks.`);
  for (const bb of bloodBanks) {
    if (bb.googleMapsUrl) {
      const coords = await extractCoordinatesFromGoogleUrl(bb.googleMapsUrl);
      if (coords) {
        await BloodBank.updateOne(
          { _id: bb._id },
          { $set: { coordinates: { lat: coords.lat, lng: coords.lng } } }
        );
        console.log(`✓ Updated Blood Bank ${bb.name} coordinates to: [${coords.lat}, ${coords.lng}]`);
      }
    }
  }

  await Hospital.updateOne(
    { name: 'XYZ' },
    {
      $set: {
        coordinates: { lat: 25.4245, lng: 81.8212 },
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=25.4245,81.8212'
      }
    }
  );
  console.log('✓ Updated XYZ coordinates to Pahalwan Chauraha, Kareli: [25.4245, 81.8212]');

  await mongoose.disconnect();
  console.log('All hospital pins synchronized with exact Google Map links!');
}

run();

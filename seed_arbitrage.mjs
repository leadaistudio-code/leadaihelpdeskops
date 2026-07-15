import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    // Clear old predictions
    await pool.query(`DELETE FROM "HardwareFailurePrediction"`);
    
    // get devices
    const res = await pool.query(`SELECT id, "domain", "hostname", "persona" FROM "Device" LIMIT 4`);
    const devices = res.rows;
    if (devices.length === 0) {
      console.log('No devices found.');
      return;
    }

    // Insert mock HardwareFailurePrediction
    for (let i = 0; i < devices.length; i++) {
      const d = devices[i];
      // Generate some predictions
      if (i % 2 === 0) {
        // Battery failure in 14 days
        const failureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(`
          INSERT INTO "HardwareFailurePrediction" ("id", "deviceId", "component", "probability", "predictedDate", "status", "domain", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [`hfp_bat_${Date.now()}_${i}`, d.id, 'BATTERY', 0.88, failureDate, 'WARNING', d.domain]);
      } else {
        // Thermal failure in 5 days
        const failureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(`
          INSERT INTO "HardwareFailurePrediction" ("id", "deviceId", "component", "probability", "predictedDate", "status", "domain", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [`hfp_cpu_${Date.now()}_${i}`, d.id, 'CPU_THERMAL', 0.94, failureDate, 'CRITICAL', d.domain]);
      }
    }
    console.log('Inserted mock HardwareFailurePredictions.');
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();

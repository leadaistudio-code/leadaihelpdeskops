import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const mockApps = ['zoom.exe', 'ms-teams.exe', 'slack.exe', 'chrome.exe', 'excel.exe', 'explorer.exe', 'outlook.exe'];
  
  try {
    // Clean up mock software usage
    const res1 = await pool.query(`
      DELETE FROM "SoftwareUsage"
      WHERE LOWER("softwareName") IN ('zoom.exe', 'ms-teams.exe', 'slack.exe', 'chrome.exe', 'excel.exe', 'explorer.exe', 'outlook.exe')
    `);
    console.log(`Deleted ${res1.rowCount} mock SoftwareUsage records.`);

    // Clean up mock crashes
    const res2 = await pool.query(`
      DELETE FROM "AppCrashEvent"
      WHERE LOWER("appName") IN ('zoom.exe', 'ms-teams.exe', 'slack.exe', 'chrome.exe', 'excel.exe', 'explorer.exe', 'outlook.exe')
    `);
    console.log(`Deleted ${res2.rowCount} mock AppCrashEvent records.`);

    // Clean up other mock seeded data
    const res3 = await pool.query(`DELETE FROM "SecurityPosture"`);
    console.log(`Deleted ${res3.rowCount} mock SecurityPosture records.`);
    
    const res4 = await pool.query(`DELETE FROM "HardwareFailurePrediction"`);
    console.log(`Deleted ${res4.rowCount} mock HardwareFailurePrediction records.`);
    
    const res5 = await pool.query(`DELETE FROM "SmartContract" WHERE name = 'Prevent Thermal Event'`);
    console.log(`Deleted ${res5.rowCount} mock SmartContract records.`);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();

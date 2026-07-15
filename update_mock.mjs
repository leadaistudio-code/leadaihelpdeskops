import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const cutoff = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  try {
    await pool.query(`
      UPDATE "SoftwareUsage"
      SET "lastUsedAt" = $1
      WHERE "softwareName" IN ('zoom.exe', 'ms-teams.exe', 'slack.exe', 'chrome.exe', 'excel.exe')
    `, [cutoff]);
    console.log('Successfully backdated mock data.');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();

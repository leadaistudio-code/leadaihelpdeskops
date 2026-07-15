import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const saas = ["salesforce.exe", "figma.exe", "notion.exe", "zoom.exe", "slack.exe", "adobe.exe"];
  
  try {
    const domainRes = await pool.query('SELECT slug FROM "Domain" LIMIT 1');
    if (domainRes.rowCount === 0) return;
    const domain = domainRes.rows[0].slug;

    // Create 15 mock devices
    for (let i = 0; i < 15; i++) {
      const did = `mock_dev_${Date.now()}_${i}`;
      await pool.query(`
        INSERT INTO "Device" (id, "deviceKey", hostname, os, "user", domain, persona, "cpuPct", "memUsedMb", "memTotalMb", "diskPct", "uptimeSec", "latencyMs", "batteryPct", "lastSeenAt", "enrolledAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [did, `key_${i}`, `DESKTOP-MOCK${i}`, 'Windows 11', `user${i}@example.com`, domain, 'Sales', 20, 8000, 16000, 50, 100000, 20, 100]);
    }

    const res = await pool.query('SELECT id, domain FROM "Device"');
    const devices = res.rows;
    
    await pool.query('DELETE FROM "SoftwareUsage"');
    
    let inserted = 0;
    for (const d of devices) {
      for (const app of saas) {
        if (Math.random() > 0.6) continue;
        const isZombie = Math.random() > 0.5; 
        
        let lastUsed;
        let fgMin = 0;
        
        if (isZombie) {
          const daysAgo = Math.floor(Math.random() * 65) + 35;
          lastUsed = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
          fgMin = Math.floor(Math.random() * 120);
        } else {
          const daysAgo = Math.floor(Math.random() * 5);
          lastUsed = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
          fgMin = Math.floor(Math.random() * 5000) + 1000;
        }

        await pool.query(`
          INSERT INTO "SoftwareUsage" (id, "deviceId", "softwareName", "foregroundMinutes", "lastUsedAt", domain, "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [`cuid_sw_${Date.now()}_${Math.random()}`, d.id, app, fgMin, lastUsed, d.domain]);
        
        inserted++;
      }
    }
    console.log(`Seeded ${inserted} software usage records!`);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

seed();

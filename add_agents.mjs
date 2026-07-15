import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const users = [
    {email: 'agent1@example.com', name: 'Sarah Connor', role: 'IT_AGENT', domain: 'global'},
    {email: 'agent2@example.com', name: 'John Smith', role: 'IT_AGENT', domain: 'global'},
    {email: 'agent3@example.com', name: 'Emily Davis', role: 'IT_AGENT', domain: 'global'},
    {email: 'agent4@example.com', name: 'Michael Chen', role: 'IT_AGENT', domain: 'global'}
  ];
  
  try {
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const id = `cuid_${Date.now()}_${i}`;
      await pool.query(`
        INSERT INTO "User" (id, name, email, role, domain, "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
      `, [id, u.name, u.email, u.role, u.domain]);
    }
    console.log('Agents added');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

seed();

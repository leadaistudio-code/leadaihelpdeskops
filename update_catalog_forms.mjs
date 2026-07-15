import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const hardwareForm = [
  { id: "justification", label: "Business Justification", type: "textarea", required: true },
  { id: "shipping", label: "Shipping Address", type: "text", required: true },
  { id: "urgency", label: "Urgency", type: "select", options: ["Standard (3-5 Days)", "Expedited (1-2 Days)"], required: true }
];

const laptopForm = [
  ...hardwareForm,
  { id: "memory", label: "Memory Requirement", type: "select", options: ["16GB", "32GB (Requires Approval)", "64GB (Requires Approval)"], required: true }
];

const softwareForm = [
  { id: "justification", label: "Business Justification", type: "textarea", required: true },
  { id: "costCenter", label: "Cost Center", type: "text", required: true },
  { id: "licenseType", label: "License Duration", type: "select", options: ["Annual", "Monthly", "Perpetual"], required: true }
];

const accessForm = [
  { id: "justification", label: "Why do you need access?", type: "textarea", required: true },
  { id: "duration", label: "Access Duration", type: "select", options: ["Permanent", "Temporary (1 week)", "Temporary (1 month)"], required: true },
  { id: "accessLevel", label: "Requested Role", type: "select", options: ["Read-Only", "Contributor", "Admin (Requires Director Approval)"], required: true }
];

async function seed() {
  const updates = [
    { like: '%MacBook%', formSchema: JSON.stringify(laptopForm) },
    { like: '%Monitor%', formSchema: JSON.stringify(hardwareForm) },
    { like: '%Docking%', formSchema: JSON.stringify(hardwareForm) },
    { like: '%Figma%', formSchema: JSON.stringify(softwareForm) },
    { like: '%Office%', formSchema: JSON.stringify(softwareForm) },
    { like: '%Access%', formSchema: JSON.stringify(accessForm) }
  ];
  
  try {
    for (const update of updates) {
      const res = await pool.query(`
        UPDATE "CatalogItem" 
        SET "formSchema" = $1
        WHERE name ILIKE $2
      `, [update.formSchema, update.like]);
      console.log(`Updated ${res.rowCount} items for ${update.like}`);
    }
    console.log('Catalog forms updated!');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

seed();

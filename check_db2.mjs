import { Pool } from 'pg';
import { config } from 'dotenv';
config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT name, "formSchema" FROM "CatalogItem" WHERE name ILIKE \'%MacBook%\'')
  .then(res => { 
    console.log(typeof res.rows[0].formSchema);
    console.log(res.rows[0].formSchema);
    pool.end(); 
  });

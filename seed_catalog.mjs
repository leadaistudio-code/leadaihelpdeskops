import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const catalog = [
    {
      name: "Apple MacBook Pro 16",
      description: "M3 Pro chip with 12-core CPU, 18-core GPU.",
      category: "Hardware",
      icon: "Laptop",
      price: 2499,
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["M3 Pro Chip", "18GB RAM", "512GB SSD", "Liquid Retina XDR"])
    },
    {
      name: "Dell UltraSharp 32 4K",
      description: "32-inch 4K USB-C Hub Monitor. Brilliant color and clarity.",
      category: "Hardware",
      icon: "Monitor",
      price: 859,
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["31.5-inch IPS", "4K UHD", "USB-C 90W PD", "100% sRGB"])
    },
    {
      name: "Figma Professional",
      description: "Collaborative interface design tool. Request a pro license.",
      category: "Software",
      icon: "Figma",
      price: 144,
      imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["Unlimited Files", "Team Libraries", "Dev Mode", "Audio Conversations"])
    },
    {
      name: "Logitech MX Master 3S",
      description: "Advanced Wireless Mouse with MagSpeed scrolling.",
      category: "Hardware",
      icon: "Mouse",
      price: 99,
      imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["8000 DPI Sensor", "Quiet Clicks", "USB-C Rechargeable", "Multi-Device"])
    }
  ];
  
  try {
    for (let i = 0; i < catalog.length; i++) {
      const item = catalog[i];
      const id = `cuid_catalog_${Date.now()}_${i}`;
      await pool.query(`
        INSERT INTO "CatalogItem" (id, name, description, category, icon, "imageUrl", specs, price, "isActive", domain, "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 'global', NOW())
      `, [id, item.name, item.description, item.category, item.icon, item.imageUrl, item.specs, item.price]);
    }
    console.log('Visual catalog items added');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

seed();

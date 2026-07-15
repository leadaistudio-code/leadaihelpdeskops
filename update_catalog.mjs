import { Pool } from 'pg';
import { config } from 'dotenv';
config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const updates = [
    {
      like: '%MacBook%',
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["M3 Pro Chip", "18GB RAM", "512GB SSD", "Liquid Retina XDR"])
    },
    {
      like: '%Monitor%',
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["31.5-inch IPS", "4K UHD", "USB-C 90W PD", "100% sRGB"])
    },
    {
      like: '%Figma%',
      imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["Unlimited Files", "Team Libraries", "Dev Mode"])
    },
    {
      like: '%Mouse%',
      imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["8000 DPI Sensor", "Quiet Clicks", "USB-C Rechargeable"])
    },
    {
      like: '%Docking%',
      imageUrl: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["100W Power Delivery", "Dual 4K Support", "Gigabit Ethernet"])
    },
    {
      like: '%Printer%',
      imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["Color Laser", "30 ppm", "Wi-Fi enabled", "Duplex printing"])
    },
    {
      like: '%SSD%',
      imageUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["2TB Capacity", "NVMe Speed", "Hardware Encryption"])
    },
    {
      like: '%Keyboard%',
      imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["Tactile Switches", "Wireless", "Backlit", "Tenkeyless"])
    },
    {
      like: '%Headset%',
      imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["Active Noise Cancelling", "Boom Mic", "UC Certified"])
    },
    {
      like: '%Webcam%',
      imageUrl: "https://images.unsplash.com/photo-1622322359487-73d76e4c7003?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["1080p 60fps", "Auto-framing", "Privacy Shutter"])
    },
    {
      like: '%iPhone%',
      imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20a5bf616f?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["A17 Pro", "Titanium Frame", "128GB"])
    },
    {
      like: '%iPad%',
      imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
      specs: JSON.stringify(["M2 Chip", "Liquid Retina XDR", "Wi-Fi + Cellular"])
    }
  ];
  
  try {
    for (const update of updates) {
      const res = await pool.query(`
        UPDATE "CatalogItem" 
        SET "imageUrl" = $1, specs = $2
        WHERE name ILIKE $3
      `, [update.imageUrl, update.specs, update.like]);
      console.log(`Updated ${res.rowCount} items for ${update.like}`);
    }
    console.log('Visual catalog items updated for all domains!');
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

seed();

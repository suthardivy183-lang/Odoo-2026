import fs from 'fs';
import path from 'path';
import pool from './pool';

const runSeeds = async () => {
  const seedsDir = path.join(__dirname, 'seeds');
  const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf-8');
    console.log(`Running seed: ${file}`);
    await pool.query(sql);
    console.log(`✓ ${file} applied`);
  }

  console.log('All seeds complete.');
  await pool.end();
};

runSeeds().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

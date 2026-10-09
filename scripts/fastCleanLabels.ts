import { pool } from '../models/db';

async function fastClean() {
  console.log('Running fast database cleanup for labels, names, descriptions...');

  // 1. Reset corrupted/escaped labels
  const resLabels = await pool.query(`
    UPDATE products 
    SET labels = '[]'::jsonb 
    WHERE labels::text LIKE '%\\\\%'
       OR labels::text LIKE '%[]%'
       OR labels::text = '""'
       OR labels::text = '"[]"'
       OR labels::text = 'null'
       OR labels IS NULL;
  `);
  console.log('Updated corrupted labels count:', resLabels.rowCount);

  // 2. Clean backslashes from name, description, category, brand
  const resName = await pool.query(`
    UPDATE products 
    SET name = REGEXP_REPLACE(name, '\\\\+', '', 'g')
    WHERE name LIKE '%\\\\%';
  `);
  console.log('Cleaned backslashes in name count:', resName.rowCount);

  const resDesc = await pool.query(`
    UPDATE products 
    SET description = REGEXP_REPLACE(description, '\\\\+', '', 'g')
    WHERE description LIKE '%\\\\%';
  `);
  console.log('Cleaned backslashes in description count:', resDesc.rowCount);

  const resCat = await pool.query(`
    UPDATE products 
    SET category = REGEXP_REPLACE(category, '\\\\+', '', 'g')
    WHERE category LIKE '%\\\\%';
  `);
  console.log('Cleaned backslashes in category count:', resCat.rowCount);

  const resBrand = await pool.query(`
    UPDATE products 
    SET brand = REGEXP_REPLACE(brand, '\\\\+', '', 'g')
    WHERE brand LIKE '%\\\\%';
  `);
  console.log('Cleaned backslashes in brand count:', resBrand.rowCount);

  console.log('Fast cleanup finished successfully!');
}

fastClean().catch(console.error).finally(() => pool.end());

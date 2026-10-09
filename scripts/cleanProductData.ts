import { pool } from '../models/db';

export async function cleanAllProductsData() {
  const res = await pool.query("SELECT id, store_id, name, description, category, sub_category, brand, labels, barcode FROM products");
  let labelsCleaned = 0;
  let textCleaned = 0;

  for (const p of res.rows) {
    let updateNeeded = false;
    let newLabels = p.labels;
    let newName = p.name;
    let newDesc = p.description;
    let newCategory = p.category;
    let newBrand = p.brand;

    // Check and clean labels
    if (newLabels !== null && newLabels !== undefined) {
      let parsed = newLabels;
      while (typeof parsed === 'string') {
        const trimmed = parsed.trim();
        if (
          trimmed === '' || 
          trimmed === '[]' || 
          trimmed === '"[]"' || 
          trimmed === 'null' || 
          trimmed.includes('\\') || 
          trimmed === '""' || 
          trimmed === '""""'
        ) {
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            parsed = null;
            break;
          }
        } else {
          try {
            parsed = JSON.parse(trimmed);
          } catch {
            if (trimmed.includes('\\')) {
              parsed = trimmed.replace(/\\+/g, '').trim();
              if (!parsed || parsed === '[]' || parsed === '""') parsed = null;
            }
            break;
          }
        }
      }

      let cleanArray: string[] = [];
      if (Array.isArray(parsed)) {
        cleanArray = parsed
          .map(item => typeof item === 'string' ? item.replace(/\\+/g, '').replace(/^["'\[\]\s]+|["'\[\]\s]+$/g, '').trim() : item)
          .filter(item => Boolean(item) && item !== '[]' && item !== 'null' && item !== 'undefined');
      } else if (typeof parsed === 'string' && parsed.length > 0 && parsed !== '[]' && parsed !== 'null') {
        const cleanStr = parsed.replace(/\\+/g, '').replace(/^["'\[\]\s]+|["'\[\]\s]+$/g, '').trim();
        if (cleanStr && cleanStr !== '[]' && cleanStr !== 'null') {
          cleanArray = [cleanStr];
        }
      }

      const cleanJson = JSON.stringify(cleanArray);
      if (JSON.stringify(p.labels) !== cleanJson) {
        newLabels = cleanJson;
        updateNeeded = true;
        labelsCleaned++;
      }
    }

    // Check name, desc, category, brand for raw backslashes
    if (typeof newName === 'string' && newName.includes('\\')) {
      newName = newName.replace(/\\+/g, '').trim();
      updateNeeded = true;
      textCleaned++;
    }
    if (typeof newDesc === 'string' && newDesc.includes('\\')) {
      newDesc = newDesc.replace(/\\+/g, '').trim();
      updateNeeded = true;
      textCleaned++;
    }
    if (typeof newCategory === 'string' && newCategory.includes('\\')) {
      newCategory = newCategory.replace(/\\+/g, '').trim();
      updateNeeded = true;
      textCleaned++;
    }
    if (typeof newBrand === 'string' && newBrand.includes('\\')) {
      newBrand = newBrand.replace(/\\+/g, '').trim();
      updateNeeded = true;
      textCleaned++;
    }

    if (updateNeeded) {
      await pool.query(
        "UPDATE products SET labels = $1, name = $2, description = $3, category = $4, brand = $5 WHERE id = $6",
        [newLabels, newName, newDesc, newCategory, newBrand, p.id]
      );
    }
  }

  console.log(`Cleaned products: labels cleaned: ${labelsCleaned}, text fields cleaned: ${textCleaned}`);
}

if (process.argv[1] && process.argv[1].endsWith('cleanProductData.ts')) {
  cleanAllProductsData()
    .then(() => {
      console.log('Cleanup script finished successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Cleanup script error:', err);
      process.exit(1);
    });
}

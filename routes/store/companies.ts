import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

/**
 * Merges source duplicate company into target company.
 * Reassigns all purchase invoices, sales invoices, current account transactions, sales, e-waybills, and quotations.
 * Consolidates metadata and deletes the redundant source company record.
 */
export async function mergeCompanies(clientOrPool: any, sourceId: number, targetId: number, storeId?: number) {
  if (sourceId === targetId) {
    throw new Error("Kaynak ve hedef cari aynı olamaz.");
  }

  const isDirectClient = typeof clientOrPool.release === "function";
  const client = isDirectClient ? clientOrPool : await pool.connect();
  let mustCommit = false;

  try {
    if (!isDirectClient) {
      await client.query("BEGIN");
      mustCommit = true;
    }

    const sourceRes = await client.query("SELECT * FROM companies WHERE id = $1", [sourceId]);
    const targetRes = await client.query("SELECT * FROM companies WHERE id = $1", [targetId]);

    if (sourceRes.rows.length === 0) throw new Error(`Kaynak cari bulunamadı (ID: ${sourceId})`);
    if (targetRes.rows.length === 0) throw new Error(`Hedef cari bulunamadı (ID: ${targetId})`);

    const source = sourceRes.rows[0];
    const target = targetRes.rows[0];

    if (storeId && (source.store_id !== storeId || target.store_id !== storeId)) {
      throw new Error("Yetkisiz işlem: Cariler bu mağazaya ait değil.");
    }
    if (source.store_id !== target.store_id) {
      throw new Error("Farklı mağazalara ait cariler birleştirilemez.");
    }

    // 1. Move purchase invoices
    await client.query(
      "UPDATE purchase_invoices SET company_id = $1 WHERE company_id = $2",
      [target.id, source.id]
    );

    // 2. Move sales invoices
    await client.query(
      "UPDATE sales_invoices SET company_id = $1 WHERE company_id = $2",
      [target.id, source.id]
    );

    // 3. Move current account transactions
    await client.query(
      "UPDATE current_account_transactions SET company_id = $1 WHERE company_id = $2",
      [target.id, source.id]
    );

    // 4. Move sales
    await client.query(
      "UPDATE sales SET company_id = $1 WHERE company_id = $2",
      [target.id, source.id]
    );

    // 5. Move e_waybills
    await client.query(
      "UPDATE e_waybills SET company_id = $1 WHERE company_id = $2",
      [target.id, source.id]
    );

    // 6. Move quotations
    await client.query(
      "UPDATE quotations SET company_id = $1 WHERE company_id = $2",
      [target.id, source.id]
    );

    // 7. Consolidate company metadata: keep the longer / more complete details
    const cleanSourceTitle = (source.title || '').trim();
    const cleanTargetTitle = (target.title || '').trim();
    let resolvedTitle = cleanTargetTitle.length >= cleanSourceTitle.length ? cleanTargetTitle : (cleanSourceTitle || cleanTargetTitle);

    const cleanSourceVkn = source.tax_number ? String(source.tax_number).replace(/\D/g, '').trim() : '';
    const cleanTargetVkn = target.tax_number ? String(target.tax_number).replace(/\D/g, '').trim() : '';
    const resolvedTaxNumber = (cleanTargetVkn && cleanTargetVkn.length >= 10 && cleanTargetVkn !== '11111111111') 
      ? cleanTargetVkn 
      : ((cleanSourceVkn && cleanSourceVkn.length >= 10 && cleanSourceVkn !== '11111111111') ? cleanSourceVkn : (cleanTargetVkn || cleanSourceVkn || target.tax_number || source.tax_number));

    const resolvedTaxOffice = (target.tax_office && target.tax_office.trim().length > 0) ? target.tax_office : (source.tax_office || null);
    const resolvedPhone = (target.phone && target.phone.trim().length > 0) ? target.phone : (source.phone || null);
    const resolvedEmail = (target.email && target.email.trim().length > 0) ? target.email : (source.email || null);
    const resolvedAddress = (target.address && target.address.length >= (source.address || '').length) ? target.address : (source.address || target.address || null);
    const resolvedContact = (target.contact_person && target.contact_person.trim().length > 0) ? target.contact_person : (source.contact_person || null);
    const resolvedRep = (target.representative && target.representative.trim().length > 0) ? target.representative : (source.representative || null);
    const resolvedIsExpense = target.is_expense === true || source.is_expense === true;
    const resolvedExpenseCategory = target.expense_category || source.expense_category || null;
    const resolvedExpenseCenter = target.expense_center || source.expense_center || null;

    // 8. CRITICAL FIX: Delete redundant source company record FIRST!
    // This frees up any unique index locks (e.g. idx_companies_store_title_lower)
    await client.query("DELETE FROM companies WHERE id = $1", [source.id]);

    // Check if resolvedTitle would conflict with any other company in the same store
    const titleConflict = await client.query(
      "SELECT id FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) AND id != $3 LIMIT 1",
      [target.store_id, resolvedTitle, target.id]
    );
    if (titleConflict.rows.length > 0) {
      resolvedTitle = cleanTargetTitle; // fallback to target's existing title
    }

    // 9. Update target with merged attributes
    await client.query(`
      UPDATE companies
      SET title = $1,
          tax_number = $2,
          tax_office = $3,
          phone = $4,
          email = $5,
          address = $6,
          contact_person = $7,
          representative = $8,
          is_expense = $9,
          expense_category = $10,
          expense_center = $11
      WHERE id = $12
    `, [
      resolvedTitle,
      resolvedTaxNumber,
      resolvedTaxOffice,
      resolvedPhone,
      resolvedEmail,
      resolvedAddress,
      resolvedContact,
      resolvedRep,
      resolvedIsExpense,
      resolvedExpenseCategory,
      resolvedExpenseCenter,
      target.id
    ]);

    if (mustCommit) {
      await client.query("COMMIT");
    }

    return {
      success: true,
      mergedIntoId: target.id,
      targetTitle: resolvedTitle,
      sourceId,
      sourceTitle: source.title
    };
  } catch (err) {
    if (mustCommit) {
      await client.query("ROLLBACK");
    }
    throw err;
  } finally {
    if (!isDirectClient) {
      client.release();
    }
  }
}

/**
 * Auto-consolidates duplicate companies sharing the same cleaned VKN/TCKN or normalized title.
 */
export async function autoConsolidateDuplicateCompanies(storeId?: number) {
  try {
    let mergedCount = 0;

    // 1. Group by cleaned VKN (10-11 digits, excluding generic '11111111111')
    let vknQuery = `
      SELECT store_id, clean_vkn, array_agg(id ORDER BY id ASC) as ids
      FROM (
        SELECT id, store_id, regexp_replace(COALESCE(tax_number, ''), '\\D', '', 'g') as clean_vkn
        FROM companies
        WHERE tax_number IS NOT NULL 
          AND length(regexp_replace(COALESCE(tax_number, ''), '\\D', '', 'g')) IN (10, 11)
          AND regexp_replace(COALESCE(tax_number, ''), '\\D', '', 'g') != '11111111111'
          ${storeId ? 'AND store_id = $1' : ''}
      ) sub
      GROUP BY store_id, clean_vkn
      HAVING count(*) > 1
    `;
    const vknRes = await pool.query(vknQuery, storeId ? [storeId] : []);
    for (const group of vknRes.rows) {
      const ids: number[] = group.ids;
      if (!ids || ids.length < 2) continue;

      // Smart target selection: find company with most transactions or data
      const candidatesRes = await pool.query(
        `SELECT c.id, c.title, c.tax_number, c.phone, c.address,
                (SELECT count(*) FROM current_account_transactions WHERE company_id = c.id) as tx_count
         FROM companies c
         WHERE c.id = ANY($1::int[])`,
        [ids]
      );
      if (candidatesRes.rows.length < 2) continue;

      candidatesRes.rows.sort((a, b) => {
        const diffTx = Number(b.tx_count) - Number(a.tx_count);
        if (diffTx !== 0) return diffTx;
        const aScore = (a.phone ? 2 : 0) + (a.address ? 2 : 0) + (a.tax_number ? 2 : 0);
        const bScore = (b.phone ? 2 : 0) + (b.address ? 2 : 0) + (b.tax_number ? 2 : 0);
        if (bScore !== aScore) return bScore - aScore;
        return a.id - b.id;
      });

      const targetId = candidatesRes.rows[0].id;
      for (let i = 1; i < candidatesRes.rows.length; i++) {
        const sourceId = candidatesRes.rows[i].id;
        try {
          await mergeCompanies(pool, sourceId, targetId, group.store_id);
          mergedCount++;
          console.log(`[Auto-Consolidate Companies] Merged duplicate company #${sourceId} into #${targetId} (VKN: ${group.clean_vkn})`);
        } catch (e: any) {
          console.warn(`[Auto-Consolidate Companies] Failed to merge #${sourceId}:`, e.message);
        }
      }
    }

    // 2. Group by normalized title (ignoring trailing punctuation/dots and case)
    let titleQuery = `
      SELECT store_id, norm_title, array_agg(id ORDER BY id ASC) as ids
      FROM (
        SELECT id, store_id, LOWER(TRIM(regexp_replace(regexp_replace(COALESCE(title, ''), '[\\.,\\-_]+$', ''), '\\s+', ' ', 'g'))) as norm_title
        FROM companies
        WHERE title IS NOT NULL AND length(trim(title)) > 2
          ${storeId ? 'AND store_id = $1' : ''}
      ) sub
      GROUP BY store_id, norm_title
      HAVING count(*) > 1
    `;
    const titleRes = await pool.query(titleQuery, storeId ? [storeId] : []);
    for (const group of titleRes.rows) {
      const ids: number[] = group.ids;
      if (!ids || ids.length < 2) continue;

      const candidatesRes = await pool.query(
        `SELECT c.id, c.title, c.tax_number, c.phone, c.address,
                (SELECT count(*) FROM current_account_transactions WHERE company_id = c.id) as tx_count
         FROM companies c
         WHERE c.id = ANY($1::int[])`,
        [ids]
      );
      if (candidatesRes.rows.length < 2) continue;

      candidatesRes.rows.sort((a, b) => {
        const diffTx = Number(b.tx_count) - Number(a.tx_count);
        if (diffTx !== 0) return diffTx;
        const aScore = (a.phone ? 2 : 0) + (a.address ? 2 : 0) + (a.tax_number ? 2 : 0);
        const bScore = (b.phone ? 2 : 0) + (b.address ? 2 : 0) + (b.tax_number ? 2 : 0);
        if (bScore !== aScore) return bScore - aScore;
        return a.id - b.id;
      });

      const targetId = candidatesRes.rows[0].id;
      for (let i = 1; i < candidatesRes.rows.length; i++) {
        const sourceId = candidatesRes.rows[i].id;
        try {
          await mergeCompanies(pool, sourceId, targetId, group.store_id);
          mergedCount++;
          console.log(`[Auto-Consolidate Companies] Merged duplicate company by title #${sourceId} into #${targetId}`);
        } catch (e: any) {
          // ignore already merged
        }
      }
    }

    return { success: true, mergedCount };
  } catch (err: any) {
    console.error("[Auto-Consolidate Companies] Error:", err.message);
    return { success: false, error: err.message };
  }
}

// Get All Companies (with automatic duplicate consolidation)
router.get("/", async (req: any, res) => {
  try {
    let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;

    // Self-heal duplicate companies on read to guarantee deduplicated clean listing
    if (storeId) {
      try {
        await autoConsolidateDuplicateCompanies(Number(storeId));
      } catch (consolErr) {
        console.warn("Auto-consolidate error during GET /companies:", consolErr);
      }
    }
    
    const result = await pool.query(
      `SELECT 
        c.*,
        COALESCE(
          (
            SELECT json_object_agg(currency, bal)
            FROM (
              SELECT COALESCE(currency, 'TRY') as currency, SUM(CASE WHEN type = 'debt' THEN amount ELSE -amount END) as bal
              FROM current_account_transactions
              WHERE company_id = c.id
              GROUP BY COALESCE(currency, 'TRY')
            ) sub
          ), 
          '{}'::json
        ) as balances
      FROM companies c
      WHERE c.store_id = $1
      ORDER BY c.title ASC`,
      [storeId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Explicit endpoint to merge duplicate companies
router.post("/merge-duplicates", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  try {
    const outcome = await autoConsolidateDuplicateCompanies(Number(storeId));
    res.json(outcome);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Company
router.post("/", async (req: any, res) => {
  const { tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative, is_expense, expense_category, expense_center } = req.body;
  const title = String(req.body.title || "").trim();
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    // Check limit
    const limitRes = await pool.query("SELECT max_customers FROM stores WHERE id = $1", [storeId]);
    const maxCustomers = Math.max(limitRes.rows[0]?.max_customers ?? 50, 5000);
    const currentCountRes = await pool.query("SELECT COUNT(*)::INT as count FROM companies WHERE store_id = $1", [storeId]);
    const currentCount = currentCountRes.rows[0].count;
    if (currentCount >= maxCustomers) {
      return res.status(400).json({ error: `Cari hesap limitine (${maxCustomers}) ulaşıldı. Lütfen limitlerinizi yükseltin.` });
    }

    // 1. Strict VKN/TCKN deduplication check (primary identifier)
    const cleanVkn = tax_number ? String(tax_number).replace(/\D/g, '').trim() : '';
    if (cleanVkn && (cleanVkn.length === 10 || cleanVkn.length === 11) && cleanVkn !== '11111111111') {
      const existingVkn = await pool.query(
        "SELECT id, title, tax_number FROM companies WHERE store_id = $1 AND clean_tax_number(tax_number) = $2 LIMIT 1",
        [storeId, cleanVkn]
      );
      if (existingVkn.rows.length > 0) {
        return res.status(400).json({ 
          error: `Bu Vergi / TC Kimlik Numarası (${cleanVkn}) ile kayıtlı '${existingVkn.rows[0].title}' adında bir cari hesap zaten mevcut. Aynı VKN/TCKN ile mükerrer cari açılamaz.` 
        });
      }
    }

    // 2. Title uniqueness check
    const existingTitle = await pool.query("SELECT id, title FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER($2) LIMIT 1", [storeId, title]);
    if (existingTitle.rows.length > 0) {
      return res.status(400).json({ error: "Bu isimde bir cari hesap zaten mevcut." });
    }

    const finalIsExpense = is_expense === true || is_expense === 'true';
    const result = await pool.query(
      "INSERT INTO companies (store_id, title, tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative, is_expense, expense_category, expense_center) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
      [storeId, title, tax_office, cleanVkn || tax_number, address, delivery_address || null, phone, email, contact_person, representative, finalIsExpense, expense_category || null, expense_center || null]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Company
router.put("/:id", async (req: any, res) => {
  const { title, tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative, is_expense, expense_category, expense_center } = req.body;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    // 1. Strict VKN/TCKN deduplication check for other companies
    const cleanVkn = tax_number ? String(tax_number).replace(/\D/g, '').trim() : '';
    if (cleanVkn && (cleanVkn.length === 10 || cleanVkn.length === 11) && cleanVkn !== '11111111111') {
      const existingVkn = await pool.query(
        "SELECT id, title FROM companies WHERE store_id = $1 AND clean_tax_number(tax_number) = $2 AND id != $3 LIMIT 1",
        [storeId, cleanVkn, req.params.id]
      );
      if (existingVkn.rows.length > 0) {
        return res.status(400).json({ 
          error: `Bu Vergi / TC Kimlik Numarası (${cleanVkn}) ile kayıtlı '${existingVkn.rows[0].title}' adında başka bir cari hesap zaten mevcut. Mükerrer VKN atanamaz.` 
        });
      }
    }

    // 2. Title uniqueness check for other companies
    const existing = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) AND id != $3", [storeId, title, req.params.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu isimde bir cari hesap zaten mevcut." });
    }

    const finalIsExpense = is_expense === true || is_expense === 'true';
    const result = await pool.query(
      "UPDATE companies SET title = $1, tax_office = $2, tax_number = $3, address = $4, delivery_address = $5, phone = $6, email = $7, contact_person = $8, representative = $9, is_expense = $10, expense_category = $11, expense_center = $12 WHERE id = $13 AND store_id = $14 RETURNING *",
      [title, tax_office, cleanVkn || tax_number, address, delivery_address || null, phone, email, contact_person, representative, finalIsExpense, expense_category || null, expense_center || null, req.params.id, storeId]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Company
router.delete("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    await pool.query("DELETE FROM companies WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Company Transactions
router.get("/:id/transactions", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  
  const { startDate, endDate } = req.query;
  
  try {
    // Fetch store currency rates and default currency for fallback when currency is non-default
    let storeRates: Record<string, number> = { USD: 34.50, EUR: 37.80, GBP: 45.20, TRY: 1 };
    let defaultCurrency = 'TRY';
    if (storeId) {
      try {
        const storeRes = await pool.query("SELECT currency, currency_rates, branding FROM stores WHERE id = $1", [storeId]);
        if (storeRes.rows.length > 0) {
          const row = storeRes.rows[0];
          defaultCurrency = (row.branding?.default_currency || row.branding?.currency || row.currency || 'TRY').toUpperCase();
          storeRates[defaultCurrency] = 1;
          const rates = row.currency_rates || row.branding?.currency_rates || {};
          if (typeof rates === 'object' && rates !== null) {
            Object.keys(rates).forEach(k => {
              const val = parseFloat(rates[k]);
              if (!isNaN(val) && val > 0) storeRates[k.toUpperCase()] = val;
            });
          }
        }
      } catch (e) {
        console.error("Error fetching store rates in transactions:", e);
      }
    }

    let openingBalances: Record<string, number> = {};
    let openingBalancesBase: Record<string, number> = {};
    if (startDate && startDate !== "") {
      const obQuery = `
        SELECT 
          COALESCE(c.currency, $4) as currency, 
          COALESCE(SUM(CASE WHEN c.type = 'debt' THEN c.amount ELSE -c.amount END), 0)::FLOAT as balance,
          COALESCE(SUM(
            (CASE WHEN c.type = 'debt' THEN c.amount ELSE -c.amount END) * 
            (CASE 
              WHEN UPPER(COALESCE(c.currency, $4)) = $4 THEN 1
              WHEN COALESCE(NULLIF(c.exchange_rate, 0), NULLIF(si.exchange_rate, 0), NULLIF(pi.exchange_rate, 0), 1) > 1 
                THEN COALESCE(NULLIF(c.exchange_rate, 0), NULLIF(si.exchange_rate, 0), NULLIF(pi.exchange_rate, 0), 1)
              ELSE 1
            END)
          ), 0)::FLOAT as base_balance
        FROM current_account_transactions c
        LEFT JOIN sales_invoices si ON c.sales_invoice_id = si.id
        LEFT JOIN purchase_invoices pi ON c.purchase_invoice_id = pi.id
        WHERE c.company_id = $1 AND (c.store_id = $2 OR c.store_id IS NULL) AND c.transaction_date < $3
        GROUP BY COALESCE(c.currency, $4)
      `;
      const obResult = await pool.query(obQuery, [req.params.id, storeId, startDate, defaultCurrency]);
      obResult.rows.forEach(row => {
        const currKey = (row.currency || defaultCurrency).toUpperCase();
        openingBalances[currKey] = row.balance;
        if (currKey === defaultCurrency) {
          openingBalancesBase[currKey] = row.balance;
        } else {
          // If base_balance equals balance because historical rows had rate=1, fallback to storeRates[currKey]
          const fallbackRate = storeRates[currKey] || 1;
          openingBalancesBase[currKey] = (Math.abs(row.base_balance - row.balance) < 0.01 && fallbackRate > 1)
            ? Number((row.balance * fallbackRate).toFixed(2))
            : Number(row.base_balance.toFixed(2));
        }
      });
    }

    let query = `
      SELECT 
        c.*, 
        c.transaction_date,
        s.due_date,
        s.id as sale_id,
        COALESCE(pi.id, pi_fallback.id) as purchase_invoice_id,
        COALESCE(
          NULLIF(pi.invoice_number, ''), 
          NULLIF(pi.document_number, ''),
          NULLIF(pi_fallback.invoice_number, ''),
          NULLIF(pi_fallback.document_number, '')
        ) as purchase_invoice_number,
        COALESCE(NULLIF(pi.exchange_rate, 1), NULLIF(pi_fallback.exchange_rate, 1)) as pi_exchange_rate,
        COALESCE(pi.currency, pi_fallback.currency) as pi_currency,
        COALESCE(si.id, si_fallback.id) as sales_invoice_id,
        COALESCE(
          NULLIF(si.invoice_number, ''), 
          NULLIF(si.document_number, ''),
          NULLIF(si_fallback.invoice_number, ''),
          NULLIF(si_fallback.document_number, '')
        ) as sales_invoice_number,
        COALESCE(NULLIF(si.exchange_rate, 1), NULLIF(si_fallback.exchange_rate, 1)) as si_exchange_rate,
        COALESCE(si.currency, si_fallback.currency) as si_currency
      FROM current_account_transactions c
      LEFT JOIN sales s ON c.sale_id = s.id
      LEFT JOIN purchase_invoices pi ON c.purchase_invoice_id = pi.id
      LEFT JOIN sales_invoices si ON c.sales_invoice_id = si.id
      LEFT JOIN LATERAL (
        SELECT id, invoice_number, document_number, exchange_rate, currency
        FROM sales_invoices si_m
        WHERE si_m.company_id = c.company_id
          AND (
            (c.sale_id IS NOT NULL AND si_m.sale_id = c.sale_id)
            OR (
              c.sales_invoice_id IS NULL 
              AND c.purchase_invoice_id IS NULL
              AND ABS(COALESCE(NULLIF(si_m.grand_total, 0), si_m.total_amount, 0) - c.amount) < 0.5
            )
          )
        ORDER BY ABS(EXTRACT(EPOCH FROM (COALESCE(si_m.invoice_date::timestamp, si_m.created_at) - c.transaction_date))) ASC, id DESC
        LIMIT 1
      ) si_fallback ON c.sales_invoice_id IS NULL
      LEFT JOIN LATERAL (
        SELECT id, invoice_number, document_number, exchange_rate, currency
        FROM purchase_invoices pi_m
        WHERE pi_m.company_id = c.company_id
          AND c.purchase_invoice_id IS NULL
          AND c.sales_invoice_id IS NULL
          AND ABS(COALESCE(NULLIF(pi_m.grand_total, 0), pi_m.total_amount, 0) - c.amount) < 0.5
        ORDER BY ABS(EXTRACT(EPOCH FROM (COALESCE(pi_m.invoice_date::timestamp, pi_m.created_at) - c.transaction_date))) ASC, id DESC
        LIMIT 1
      ) pi_fallback ON c.purchase_invoice_id IS NULL
      WHERE c.company_id = $1 AND (c.store_id = $2 OR c.store_id IS NULL)
    `;
    
    const params: any[] = [req.params.id, storeId];
    
    if (startDate && startDate !== "") {
      params.push(startDate);
      query += ` AND c.transaction_date >= $${params.length}`;
    }
    
    if (endDate && endDate !== "") {
      params.push(`${endDate} 23:59:59`);
      query += ` AND c.transaction_date <= $${params.length}`;
    }
    
    query += " ORDER BY c.transaction_date ASC, c.id ASC";
    
    const result = await pool.query(query, params);
    const enrichedTransactions = result.rows.map(row => {
      let invNo = row.sales_invoice_number || row.purchase_invoice_number || '';
      let desc = (row.description || '').trim();

      // If invNo is still empty, extract invoice/document number from description
      if (!invNo) {
        const matchBracket = desc.match(/\[(?:Belge|Evrak|Ref|Dekont|Fatura):\s*([^\]]+)\]/i);
        if (matchBracket) {
          invNo = matchBracket[1].trim();
        } else {
          const matchPrefix = desc.match(/(?:Satış Faturası|Alış Faturası|Fatura|Belge|Evrak|E-Fatura|E-Arşiv)(?:\s+(?:Tahsilatı|Ödemesi))?[\s:]+([A-Z0-9\-_/]{3,})/i);
          if (matchPrefix) {
            invNo = matchPrefix[1].trim();
          } else {
            const matchCode = desc.match(/\b(GIB\d{10,16}|EAR\d{10,16}|SAT-\d+|ALI-\d+|FT-\d+|INV-\d+|\d{4}-\d{3,8})\b/i);
            if (matchCode) {
              invNo = matchCode[1].trim();
            }
          }
        }
      }

      if (!invNo && row.sale_id) {
        invNo = `POS #${row.sale_id}`;
      }

      // Clean duplicate invoice numbers from description string to prevent repeating same info
      if (invNo && invNo !== '-') {
        const safeInvNo = invNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        desc = desc.replace(new RegExp(`^Satış Faturası:\\s*${safeInvNo}\\s*[-:]?\\s*`, 'i'), 'Satış Faturası');
        desc = desc.replace(new RegExp(`^Alış Faturası:\\s*${safeInvNo}\\s*[-:]?\\s*`, 'i'), 'Alış Faturası');
        desc = desc.replace(new RegExp(`^Satış Faturası Tahsilatı:\\s*${safeInvNo}\\s*`, 'i'), 'Satış Faturası Tahsilatı ');
        desc = desc.replace(new RegExp(`^Alış Faturası Ödemesi:\\s*${safeInvNo}\\s*`, 'i'), 'Alış Faturası Ödemesi ');
        desc = desc.replace(new RegExp(`[:\\s-]*${safeInvNo}`, 'gi'), '');
        desc = desc.replace(/\[(?:Belge|Evrak|Ref|Dekont|Fatura):\s*[^\]]+\]/gi, '');
        desc = desc.replace(/[:\-]+$/, '').trim();
      }

      if (!desc) {
        if (row.sales_invoice_id || row.sales_invoice_number) desc = 'Satış Faturası';
        else if (row.purchase_invoice_id || row.purchase_invoice_number) desc = 'Alış Faturası';
        else if (row.sale_id) desc = 'POS Satışı';
        else desc = row.type === 'debt' ? 'Borç Hareketi' : 'Alacak Hareketi';
      }

      // Currency and Exchange Rate Consolidation
      const curr = (row.currency || row.si_currency || row.pi_currency || defaultCurrency).toUpperCase();
      let rate = Number(row.exchange_rate || row.si_exchange_rate || row.pi_exchange_rate || 0);
      if (isNaN(rate) || rate <= 0 || (curr !== defaultCurrency && rate === 1)) {
        if (curr !== defaultCurrency && storeRates[curr]) {
          rate = storeRates[curr];
        } else {
          rate = 1;
        }
      }

      return {
        ...row,
        invoice_number: invNo || '-',
        description: desc,
        currency: curr,
        exchange_rate: rate
      };
    });

    res.json({
      transactions: enrichedTransactions,
      opening_balances: openingBalances,
      opening_balances_base: openingBalancesBase,
      default_currency: defaultCurrency
    });
  } catch (err: any) {
    console.error("Error fetching company transactions:", err);
    res.status(500).json({ error: err.message, transactions: [], opening_balances: {} });
  }
});

// Create Company Transaction
router.post("/:id/transactions", async (req: any, res) => {
  const { type, amount, description, transaction_date, payment_method, currency, exchange_rate } = req.body;
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  
  try {
    const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
    const branding = storeRes.rows[0]?.branding || {};
    
    // Clean parse amount
    let cleanAmount = 0;
    if (amount !== undefined && amount !== null && amount !== '') {
      if (typeof amount === 'number') {
        cleanAmount = isNaN(amount) ? 0 : amount;
      } else {
        const s = String(amount).trim().replace(/\s/g, '');
        if (s.includes(',') && s.includes('.')) {
          cleanAmount = s.lastIndexOf(',') > s.lastIndexOf('.') ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s.replace(/,/g, ''));
        } else if (s.includes(',')) {
          cleanAmount = parseFloat(s.replace(',', '.'));
        } else {
          cleanAmount = parseFloat(s);
        }
      }
    }
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return res.status(400).json({ error: "Geçerli bir işlem tutarı girilmelidir." });
    }

    let cleanExchangeRate = 1;
    if (exchange_rate !== undefined && exchange_rate !== null && exchange_rate !== '') {
      const s = String(exchange_rate).trim().replace(/\s/g, '').replace(',', '.');
      const pr = parseFloat(s);
      if (!isNaN(pr) && pr > 0) cleanExchangeRate = pr;
    }

    let finalDate = new Date();
    if (transaction_date) {
      const providedDate = new Date(transaction_date);
      if (!isNaN(providedDate.getTime())) {
        const now = new Date();
        if (providedDate.toDateString() === now.toDateString()) {
          finalDate = now;
        } else {
          providedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
          finalDate = providedDate;
        }
      }
    }

    const finalCurrency = (currency || branding?.default_currency || 'TRY').toUpperCase();
    const finalType = type === 'debt' ? 'debt' : 'credit';
    const finalPaymentMethod = payment_method || 'cash';

    const result = await pool.query(
      "INSERT INTO current_account_transactions (store_id, company_id, type, amount, description, transaction_date, payment_method, currency, exchange_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [storeId, req.params.id, finalType, cleanAmount, description || '', finalDate, finalPaymentMethod, finalCurrency, cleanExchangeRate]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error creating company transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update Company Transaction
router.put("/:companyId/transactions/:id", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  const { companyId, id } = req.params;
  const { type, amount, description, transaction_date, payment_method, currency, exchange_rate, new_company_id } = req.body;

  try {
    let checkQuery = "SELECT * FROM current_account_transactions WHERE id = $1 AND company_id = $2";
    let checkParams: any[] = [id, companyId];
    if (req.user.role !== "superadmin") {
      checkQuery += " AND (store_id = $3 OR store_id IS NULL)";
      checkParams.push(storeId);
    }
    const checkRes = await pool.query(checkQuery, checkParams);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "İşlem bulunamadı" });
    }

    const currentTx = checkRes.rows[0];
    const newType = type || currentTx.type;
    
    // Clean parse amount
    let newAmount = currentTx.amount;
    if (amount !== undefined && amount !== null && amount !== "") {
      const s = String(amount).trim().replace(/\s/g, '');
      if (s.includes(',') && s.includes('.')) {
        newAmount = s.lastIndexOf(',') > s.lastIndexOf('.') ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s.replace(/,/g, ''));
      } else if (s.includes(',')) {
        newAmount = parseFloat(s.replace(',', '.'));
      } else {
        newAmount = parseFloat(s);
      }
      if (isNaN(newAmount)) newAmount = currentTx.amount;
    }

    const newDescription = description !== undefined ? description : currentTx.description;
    const newPaymentMethod = payment_method !== undefined ? payment_method : currentTx.payment_method;
    const newCurrency = currency !== undefined ? currency : currentTx.currency;
    
    let newExchangeRate = currentTx.exchange_rate;
    if (exchange_rate !== undefined && exchange_rate !== null && exchange_rate !== "") {
      const s = String(exchange_rate).trim().replace(/\s/g, '').replace(',', '.');
      const parsedRate = parseFloat(s);
      if (!isNaN(parsedRate)) newExchangeRate = parsedRate;
    }

    const targetCompanyId = (new_company_id !== undefined && new_company_id !== null && new_company_id !== '') ? Number(new_company_id) : companyId;

    let newDate = currentTx.transaction_date;
    if (transaction_date) {
      const d = new Date(transaction_date);
      if (!isNaN(d.getTime())) newDate = d;
    }

    const updateRes = await pool.query(
      `UPDATE current_account_transactions 
       SET type = $1, amount = $2, description = $3, transaction_date = $4, payment_method = $5, currency = $6, exchange_rate = $7, company_id = $8
       WHERE id = $9
       RETURNING *`,
      [newType, newAmount, newDescription, newDate, newPaymentMethod, newCurrency, newExchangeRate, targetCompanyId, id]
    );

    res.json({ success: true, transaction: updateRes.rows[0] });
  } catch (err: any) {
    console.error("Error updating company transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Company Transaction
router.delete("/:companyId/transactions/:id", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  try {
    let deleteQuery = "DELETE FROM current_account_transactions WHERE id = $1 AND company_id = $2";
    let deleteParams: any[] = [req.params.id, req.params.companyId];
    if (req.user.role !== "superadmin") {
      deleteQuery += " AND (store_id = $3 OR store_id IS NULL)";
      deleteParams.push(storeId);
    }
    deleteQuery += " RETURNING *";

    const result = await pool.query(deleteQuery, deleteParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "İşlem bulunamadı veya silinemedi" });
    }
    res.json({ success: true, message: "İşlem başarıyla silindi", deleted: result.rows[0] });
  } catch (err: any) {
    console.error("Error deleting company transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

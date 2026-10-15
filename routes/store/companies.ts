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

    // 6b. Move digital reconciliations if table exists
    try {
      await client.query(
        "UPDATE company_reconciliations SET company_id = $1 WHERE company_id = $2",
        [target.id, source.id]
      );
    } catch {
      // Ignore if table not yet initialized
    }

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
  const { tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative, is_expense, expense_category, expense_center, due_days, late_interest_rate, notes } = req.body;
  const title = String(req.body.title || "").trim();
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    // Check limit
    const limitRes = await pool.query("SELECT max_customers FROM stores WHERE id = $1", [storeId]);
    const maxVal = limitRes.rows[0]?.max_customers;
    const maxCustomers = (maxVal !== null && maxVal !== undefined) ? Number(maxVal) : 5000;
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
    const parsedDueDays = Math.max(0, parseInt(due_days, 10) || 0);
    const parsedLateRate = Math.max(0, parseFloat(late_interest_rate) || 0);
    const result = await pool.query(
      "INSERT INTO companies (store_id, title, tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative, is_expense, expense_category, expense_center, due_days, late_interest_rate, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *",
      [storeId, title, tax_office, cleanVkn || tax_number, address, delivery_address || null, phone, email, contact_person, representative, finalIsExpense, expense_category || null, expense_center || null, parsedDueDays, parsedLateRate, notes || null]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Company
router.put("/:id", async (req: any, res) => {
  const { title, tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative, is_expense, expense_category, expense_center, due_days, late_interest_rate, notes } = req.body;
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
    const parsedDueDays = due_days !== undefined ? Math.max(0, parseInt(due_days, 10) || 0) : 0;
    const parsedLateRate = late_interest_rate !== undefined ? Math.max(0, parseFloat(late_interest_rate) || 0) : 0;
    const result = await pool.query(
      "UPDATE companies SET title = $1, tax_office = $2, tax_number = $3, address = $4, delivery_address = $5, phone = $6, email = $7, contact_person = $8, representative = $9, is_expense = $10, expense_category = $11, expense_center = $12, due_days = $13, late_interest_rate = $14, notes = $15 WHERE id = $16 AND store_id = $17 RETURNING *",
      [title, tax_office, cleanVkn || tax_number, address, delivery_address || null, phone, email, contact_person, representative, finalIsExpense, expense_category || null, expense_center || null, parsedDueDays, parsedLateRate, notes || null, req.params.id, storeId]
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

    // Fetch company profile for defined due days and late interest rate
    const compMetaRes = await pool.query(
      "SELECT id, title, due_days, late_interest_rate FROM companies WHERE id = $1 AND (store_id = $2 OR store_id IS NULL)",
      [req.params.id, storeId]
    );
    const compDueDays = Number(compMetaRes.rows[0]?.due_days || 0);
    const compLateRate = Number(compMetaRes.rows[0]?.late_interest_rate || 0);

    let query = `
      SELECT 
        c.*, 
        c.transaction_date,
        s.due_date,
        s.id as sale_id,
        pi.id as direct_purchase_invoice_id,
        COALESCE(
          NULLIF(pi.invoice_number, ''), 
          NULLIF(pi.document_number, '')
        ) as direct_purchase_invoice_number,
        COALESCE(NULLIF(pi.exchange_rate, 1), 1) as pi_exchange_rate,
        pi.currency as pi_currency,
        pi.due_date as pi_due_date,
        si.id as direct_sales_invoice_id,
        COALESCE(
          NULLIF(si.invoice_number, ''), 
          NULLIF(si.document_number, '')
        ) as direct_sales_invoice_number,
        COALESCE(NULLIF(si.exchange_rate, 1), 1) as si_exchange_rate,
        si.currency as si_currency,
        si.due_date as si_due_date,
        si.due_days as si_due_days,
        si.late_interest_rate as si_late_interest_rate,
        si_fallback.id as fallback_sales_invoice_id,
        COALESCE(
          NULLIF(si_fallback.invoice_number, ''), 
          NULLIF(si_fallback.document_number, '')
        ) as fallback_sales_invoice_number,
        si_fallback.due_date as si_fallback_due_date,
        si_fallback.due_days as si_fallback_due_days,
        si_fallback.late_interest_rate as si_fallback_late_interest_rate,
        pi_fallback.id as fallback_purchase_invoice_id,
        COALESCE(
          NULLIF(pi_fallback.invoice_number, ''), 
          NULLIF(pi_fallback.document_number, '')
        ) as fallback_purchase_invoice_number,
        pi_fallback.due_date as pi_fallback_due_date
      FROM current_account_transactions c
      LEFT JOIN sales s ON c.sale_id = s.id
      LEFT JOIN purchase_invoices pi ON c.purchase_invoice_id = pi.id
      LEFT JOIN sales_invoices si ON c.sales_invoice_id = si.id
      LEFT JOIN LATERAL (
        SELECT id, invoice_number, document_number, exchange_rate, currency, due_date, due_days, late_interest_rate
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
        SELECT id, invoice_number, document_number, exchange_rate, currency, due_date
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

    // Fetch all sales and purchase invoices of this company for FIFO aging / invoice settlement calculation
    const compSalesInvoicesRes = await pool.query(
      `SELECT id, COALESCE(NULLIF(invoice_number, ''), NULLIF(document_number, ''), 'Fatura #' || id) as invoice_number, 
              COALESCE(NULLIF(grand_total, 0), total_amount, 0)::FLOAT as total_amount,
              currency, COALESCE(invoice_date::timestamp, created_at) as invoice_date,
              due_date, due_days, late_interest_rate
       FROM sales_invoices 
       WHERE company_id = $1 AND (store_id = $2 OR store_id IS NULL)
       ORDER BY COALESCE(invoice_date::timestamp, created_at) ASC, id ASC`,
      [req.params.id, storeId]
    );

    const compPurchaseInvoicesRes = await pool.query(
      `SELECT id, COALESCE(NULLIF(invoice_number, ''), NULLIF(document_number, ''), 'Alış #' || id) as invoice_number, 
              COALESCE(NULLIF(grand_total, 0), total_amount, 0)::FLOAT as total_amount,
              currency, COALESCE(invoice_date::timestamp, created_at) as invoice_date,
              due_date
       FROM purchase_invoices 
       WHERE company_id = $1 AND (store_id = $2 OR store_id IS NULL)
       ORDER BY COALESCE(invoice_date::timestamp, created_at) ASC, id ASC`,
      [req.params.id, storeId]
    );

    const salesAging = compSalesInvoicesRes.rows.map(inv => ({
      ...inv,
      unpaid_amount: Number(inv.total_amount || 0)
    }));

    const purchaseAging = compPurchaseInvoicesRes.rows.map(inv => ({
      ...inv,
      unpaid_amount: Number(inv.total_amount || 0)
    }));

    const enrichedTransactions = result.rows.map(row => {
      let desc = (row.description || '').trim();
      const rawAmt = Number(row.amount || 0);
      const isDebt = row.type === 'debt';
      const pMethod = (row.payment_method || '').toLowerCase();
      const descLower = desc.toLowerCase();

      // Check if this transaction is the invoice itself:
      // A Sales Invoice in customer ledger is ALWAYS DEBT (Borç)!
      const isDirectSalesInvoice = (row.direct_sales_invoice_id && isDebt) || 
        (isDebt && !row.sale_id && (descLower.startsWith('satış faturası') || descLower.includes('satış faturası:')));
      
      // A Purchase Invoice in supplier ledger is ALWAYS CREDIT (Alacak)!
      const isDirectPurchaseInvoice = (row.direct_purchase_invoice_id && !isDebt) || 
        (!isDebt && (descLower.startsWith('alış faturası') || descLower.includes('alış faturası:')));

      const isPosSale = !!(row.sale_id && isDebt);

      let txType = '';
      let txTypeLabel = '';
      let docNo = '-';
      let closedInvNo = '-';

      // 1. Transaction Type and Classification
      if (descLower.includes('iade')) {
        txType = 'return';
        txTypeLabel = 'İade Faturası';
      } else if (descLower.includes('kur fark')) {
        txType = 'exchange_diff';
        txTypeLabel = 'Kur Farkı Faturası';
      } else if (isDirectSalesInvoice) {
        txType = 'sales_invoice';
        txTypeLabel = 'Satış Faturası';
        docNo = row.direct_sales_invoice_number || '';
        closedInvNo = '-'; // It is the main invoice itself
      } else if (isDirectPurchaseInvoice) {
        txType = 'purchase_invoice';
        txTypeLabel = 'Alış Faturası';
        docNo = row.direct_purchase_invoice_number || '';
        closedInvNo = '-'; // It is the main invoice itself
      } else if (isPosSale) {
        txType = 'pos_sale';
        txTypeLabel = 'POS Satışı';
        docNo = `POS #${row.sale_id}`;
        closedInvNo = '-';
      } else if (!isDebt) {
        // CREDIT -> Tahsilat / Gelen Ödeme (Müşteri Alacağı / Ödeme Girişi)
        txType = 'collection';
        if (pMethod === 'bank' || descLower.includes('bank') || descLower.includes('garanti') || descLower.includes('havale') || descLower.includes('eft') || descLower.includes('fast') || descLower.includes('akbank') || descLower.includes('isbank') || descLower.includes('yapikredi') || descLower.includes('ziraat') || descLower.includes('vakif') || descLower.includes('qnb') || descLower.includes('teb') || descLower.includes('halk')) {
          txTypeLabel = 'Tahsilat (Banka)';
        } else if (pMethod === 'cash' || descLower.includes('nakit') || descLower.includes('kasa') || descLower.includes('elden')) {
          txTypeLabel = 'Tahsilat (Nakit)';
        } else if (pMethod === 'credit_card' || descLower.includes('kart') || descLower.includes('pos')) {
          txTypeLabel = 'Tahsilat (Kredi Kartı)';
        } else {
          txTypeLabel = 'Tahsilat';
        }

        // Determine which invoice this collection closes / ages:
        // Priority A: Direct link in current_account_transactions
        if (row.direct_sales_invoice_number) {
          closedInvNo = row.direct_sales_invoice_number;
        } else {
          // Priority B: Explicit invoice code inside description
          const matchCode = desc.match(/\b(GIB\d{10,16}|GAP\d{10,16}|EAR\d{10,16}|SAT-\d+|FT-\d+|INV-\d+|\d{4}-\d{3,8})\b/i);
          if (matchCode) {
            closedInvNo = matchCode[1].trim();
          } else {
            // Priority C: Exact amount match with an open sales invoice
            const exactInv = salesAging.find(inv => inv.unpaid_amount > 0.01 && Math.abs(inv.unpaid_amount - rawAmt) < 0.5);
            if (exactInv) {
              closedInvNo = exactInv.invoice_number;
              exactInv.unpaid_amount = Math.max(0, exactInv.unpaid_amount - rawAmt);
            } else {
              // Priority D: FIFO Aging - earliest open sales invoice
              const fifoInv = salesAging.find(inv => inv.unpaid_amount > 0.01);
              if (fifoInv) {
                closedInvNo = fifoInv.invoice_number;
                fifoInv.unpaid_amount = Math.max(0, fifoInv.unpaid_amount - rawAmt);
              } else if (row.fallback_sales_invoice_number) {
                closedInvNo = row.fallback_sales_invoice_number;
              } else {
                closedInvNo = '-';
              }
            }
          }
        }
      } else {
        // DEBT -> Ödeme / Giden Ödeme (Tedarikçi Borcu Kapatma / Çıkış)
        txType = 'payment';
        if (pMethod === 'bank' || descLower.includes('bank') || descLower.includes('havale') || descLower.includes('eft') || descLower.includes('fast')) {
          txTypeLabel = 'Ödeme (Banka)';
        } else if (pMethod === 'cash' || descLower.includes('nakit') || descLower.includes('kasa') || descLower.includes('elden')) {
          txTypeLabel = 'Ödeme (Nakit)';
        } else if (pMethod === 'credit_card' || descLower.includes('kart') || descLower.includes('pos')) {
          txTypeLabel = 'Ödeme (Kredi Kartı)';
        } else {
          txTypeLabel = 'Ödeme';
        }

        // Determine which purchase invoice this payment closes:
        if (row.direct_purchase_invoice_number) {
          closedInvNo = row.direct_purchase_invoice_number;
        } else {
          const matchCode = desc.match(/\b(ALI-\d+|GIB\d{10,16}|GAP\d{10,16}|EAR\d{10,16}|FT-\d+|INV-\d+|\d{4}-\d{3,8})\b/i);
          if (matchCode) {
            closedInvNo = matchCode[1].trim();
          } else {
            const exactPi = purchaseAging.find(inv => inv.unpaid_amount > 0.01 && Math.abs(inv.unpaid_amount - rawAmt) < 0.5);
            if (exactPi) {
              closedInvNo = exactPi.invoice_number;
              exactPi.unpaid_amount = Math.max(0, exactPi.unpaid_amount - rawAmt);
            } else {
              const fifoPi = purchaseAging.find(inv => inv.unpaid_amount > 0.01);
              if (fifoPi) {
                closedInvNo = fifoPi.invoice_number;
                fifoPi.unpaid_amount = Math.max(0, fifoPi.unpaid_amount - rawAmt);
              } else if (row.fallback_purchase_invoice_number) {
                closedInvNo = row.fallback_purchase_invoice_number;
              } else {
                closedInvNo = '-';
              }
            }
          }
        }
      }

      // 2. Extract Document No (Belge / Fiş / Dekont No) for Payments and Collections
      if (!isDirectSalesInvoice && !isDirectPurchaseInvoice && !isPosSale) {
        const matchBracket = desc.match(/\[(?:Belge|Evrak|Ref|Dekont|Makbuz|Fiş):\s*([^\]]+)\]/i);
        if (matchBracket) {
          docNo = matchBracket[1].trim();
        } else {
          const matchVoucher = desc.match(/\b(DEK-[A-Z0-9\-_/]+|TAH-[A-Z0-9\-_/]+|MAK-[A-Z0-9\-_/]+|REF-[A-Z0-9\-_/]+|OD-[A-Z0-9\-_/]+)\b/i);
          if (matchVoucher) {
            docNo = matchVoucher[1].trim();
          } else {
            docNo = '-';
          }
        }
      }

      // If docNo is empty for an invoice, check if invoice code is in description
      if ((isDirectSalesInvoice || isDirectPurchaseInvoice) && (!docNo || docNo === '-')) {
        const matchCode = desc.match(/\b(GIB\d{10,16}|GAP\d{10,16}|EAR\d{10,16}|SAT-\d+|ALI-\d+|FT-\d+|INV-\d+|\d{4}-\d{3,8})\b/i);
        if (matchCode) docNo = matchCode[1].trim();
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

      // Due Date and Payment Terms Calculation
      let dueDateRaw = row.due_date || row.si_due_date || row.si_fallback_due_date || row.pi_due_date || row.pi_fallback_due_date || null;
      let dueDaysVal = Number(row.si_due_days || row.si_fallback_due_days || compDueDays || 0);
      let lateRateVal = Number(row.si_late_interest_rate || row.si_fallback_late_interest_rate || compLateRate || 0);

      let dueDateStr: string | null = null;
      if (dueDateRaw) {
        try {
          dueDateStr = new Date(dueDateRaw).toISOString().split('T')[0];
        } catch {
          dueDateStr = String(dueDateRaw).split('T')[0];
        }
      } else if (dueDaysVal > 0 && row.transaction_date && (isDirectSalesInvoice || isDirectPurchaseInvoice || isPosSale)) {
        try {
          const autoD = new Date(row.transaction_date);
          autoD.setDate(autoD.getDate() + dueDaysVal);
          dueDateStr = autoD.toISOString().split('T')[0];
        } catch {
          dueDateStr = null;
        }
      }

      let dueStatus = 'normal'; // 'overdue' | 'due_today' | 'upcoming' | 'normal'
      let overdueDays = 0;
      let daysLeft = 0;
      let isOverdue = false;
      let estimatedLateFee = 0;

      if (dueDateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetD = new Date(dueDateStr);
        targetD.setHours(0, 0, 0, 0);
        const diffMs = today.getTime() - targetD.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          dueStatus = 'overdue';
          isOverdue = true;
          overdueDays = diffDays;
          if (lateRateVal > 0 && rawAmt > 0 && isDebt) {
            // Monthly lateRateVal simple interest pro-rated by overdue days
            estimatedLateFee = Number(((rawAmt * (lateRateVal / 100) * overdueDays) / 30).toFixed(2));
          }
        } else if (diffDays === 0) {
          dueStatus = 'due_today';
        } else {
          dueStatus = 'upcoming';
          daysLeft = Math.abs(diffDays);
        }
      }

      return {
        ...row,
        // Genuine Sales Invoice ID / Number only if actually a sales invoice or closed invoice link
        sales_invoice_id: isDirectSalesInvoice ? row.direct_sales_invoice_id : (closedInvNo !== '-' ? (row.direct_sales_invoice_id || row.fallback_sales_invoice_id) : null),
        sales_invoice_number: isDirectSalesInvoice ? (row.direct_sales_invoice_number || docNo) : null,
        purchase_invoice_id: isDirectPurchaseInvoice ? row.direct_purchase_invoice_id : (closedInvNo !== '-' ? (row.direct_purchase_invoice_id || row.fallback_purchase_invoice_id) : null),
        purchase_invoice_number: isDirectPurchaseInvoice ? (row.direct_purchase_invoice_number || docNo) : null,
        // Clear ERP Fields
        is_invoice: isDirectSalesInvoice || isDirectPurchaseInvoice,
        transaction_type: txType,
        transaction_type_label: txTypeLabel,
        document_number: docNo || '-',
        invoice_number: (isDirectSalesInvoice || isDirectPurchaseInvoice) ? (docNo || '-') : docNo,
        closed_invoice_number: closedInvNo || '-',
        description: desc,
        currency: curr,
        exchange_rate: rate,
        // Due Date & Terms Fields
        due_date: dueDateStr,
        due_days: dueDaysVal,
        late_interest_rate: lateRateVal,
        due_status: dueStatus,
        is_overdue: isOverdue,
        overdue_days: overdueDays,
        days_left: daysLeft,
        estimated_late_fee: estimatedLateFee
      };
    });

    // Compute Company-level Aging & Overdue Summaries
    let overdueBalance = 0;
    let upcomingBalance = 0;
    let totalEstimatedLateFee = 0;

    enrichedTransactions.forEach(tx => {
      // For sales invoices / debt transactions not closed:
      if (tx.type === 'debt' && (tx.is_invoice || tx.due_date)) {
        if (tx.due_status === 'overdue') {
          overdueBalance += Number(tx.amount || 0);
          totalEstimatedLateFee += Number(tx.estimated_late_fee || 0);
        } else if (tx.due_status === 'upcoming' || tx.due_status === 'due_today') {
          upcomingBalance += Number(tx.amount || 0);
        }
      }
    });

    res.json({
      transactions: enrichedTransactions,
      opening_balances: openingBalances,
      opening_balances_base: openingBalancesBase,
      default_currency: defaultCurrency,
      company_terms: {
        due_days: compDueDays,
        late_interest_rate: compLateRate,
        overdue_balance: Number(overdueBalance.toFixed(2)),
        upcoming_balance: Number(upcomingBalance.toFixed(2)),
        total_estimated_late_fee: Number(totalEstimatedLateFee.toFixed(2))
      }
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

// Helper to format DB row into frontend reconciliation object
function formatReconciliationRow(row: any) {
  const payload = typeof row.payload === 'object' && row.payload !== null ? row.payload : {};
  return {
    ...payload,
    id: Number(row.id) || row.id,
    storeId: Number(row.store_id),
    companyId: row.company_id ? Number(row.company_id) : (payload.companyId || null),
    companyTitle: row.company_title || payload.companyTitle || '',
    companyAddress: row.company_address || payload.companyAddress || '',
    taxOffice: row.tax_office || payload.taxOffice || '',
    taxNumber: row.tax_number || payload.taxNumber || '',
    storeName: row.store_name || payload.storeName || '',
    storeAddress: row.store_address || payload.storeAddress || '',
    storeTaxOffice: row.store_tax_office || payload.storeTaxOffice || '',
    storeTaxNumber: row.store_tax_number || payload.storeTaxNumber || '',
    currency: row.currency || payload.currency || 'TRY',
    balance: Number(row.balance ?? payload.balance ?? 0),
    carryOverBalance: Number(row.carry_over_balance ?? payload.carryOverBalance ?? 0),
    startDate: row.start_date || payload.startDate || '',
    periodMonthName: row.period_month_name || payload.periodMonthName || '',
    transactions: Array.isArray(row.transactions) ? row.transactions : (Array.isArray(payload.transactions) ? payload.transactions : []),
    babsInvoiceCount: Number(row.babs_invoice_count ?? payload.babsInvoiceCount ?? 0),
    babsTotalSum: Number(row.babs_total_sum ?? payload.babsTotalSum ?? 0),
    date: row.date_str || payload.date || '',
    status: row.status || payload.status || 'pending',
    disputeNote: row.dispute_note ?? payload.disputeNote ?? '',
    responderName: row.responder_name ?? payload.responderName ?? '',
    responderIp: row.responder_ip ?? payload.responderIp ?? '',
    respondedAt: row.responded_at || payload.respondedAt || null,
    isArchived: Boolean(row.is_archived ?? payload.isArchived ?? false),
    archivedAt: row.archived_at || payload.archivedAt || null,
    archiveNote: row.archive_note ?? payload.archiveNote ?? '',
    notes: row.notes ?? payload.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Ensure company_reconciliations table exists (defensive self-heal)
async function ensureReconciliationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_reconciliations (
      id BIGINT PRIMARY KEY,
      store_id INTEGER NOT NULL,
      company_id INTEGER,
      company_title TEXT NOT NULL,
      company_address TEXT,
      tax_office TEXT,
      tax_number TEXT,
      store_name TEXT,
      store_address TEXT,
      store_tax_office TEXT,
      store_tax_number TEXT,
      currency VARCHAR(10) DEFAULT 'TRY',
      balance DOUBLE PRECISION DEFAULT 0,
      carry_over_balance DOUBLE PRECISION DEFAULT 0,
      start_date TEXT,
      period_month_name TEXT,
      transactions JSONB DEFAULT '[]',
      babs_invoice_count INTEGER DEFAULT 0,
      babs_total_sum DOUBLE PRECISION DEFAULT 0,
      date_str TEXT,
      status VARCHAR(30) DEFAULT 'pending',
      dispute_note TEXT,
      responder_name TEXT,
      responder_ip TEXT,
      responded_at TIMESTAMP,
      is_archived BOOLEAN DEFAULT FALSE,
      archived_at TIMESTAMP,
      archive_note TEXT,
      notes TEXT,
      payload JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// List all Reconciliations for a store (including active & archived)
router.get("/reconciliations/list", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  const companyId = req.query.companyId ? Number(req.query.companyId) : null;

  try {
    await ensureReconciliationsTable();
    let query = `SELECT * FROM company_reconciliations WHERE store_id = $1`;
    const params: any[] = [storeId || 1];

    if (companyId && !isNaN(companyId)) {
      query += ` AND company_id = $2`;
      params.push(companyId);
    }
    query += ` ORDER BY id DESC`;

    const result = await pool.query(query, params);
    res.json({
      success: true,
      reconciliations: result.rows.map(formatReconciliationRow)
    });
  } catch (err: any) {
    console.error("Error listing reconciliations:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create or Upsert a Digital Reconciliation Record (Official Document Persistence)
router.post("/reconciliations", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  const finalStoreId = Number(storeId || req.body.storeId || 1);

  try {
    await ensureReconciliationsTable();
    const r = req.body;
    const reconId = Number(r.id) || Date.now();

    // Try to resolve company_id if not explicitly passed
    let resolvedCompanyId = r.companyId || r.company_id || null;
    if (!resolvedCompanyId && r.companyTitle) {
      const compLookup = await pool.query(
        "SELECT id FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) LIMIT 1",
        [finalStoreId, String(r.companyTitle)]
      );
      if (compLookup.rows.length > 0) {
        resolvedCompanyId = compLookup.rows[0].id;
      }
    }

    const upsertRes = await pool.query(
      `INSERT INTO company_reconciliations (
        id, store_id, company_id, company_title, company_address, tax_office, tax_number,
        store_name, store_address, store_tax_office, store_tax_number,
        currency, balance, carry_over_balance, start_date, period_month_name,
        transactions, babs_invoice_count, babs_total_sum, date_str,
        status, dispute_note, responder_name, is_archived, archive_note, notes, payload, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        company_id = COALESCE(EXCLUDED.company_id, company_reconciliations.company_id),
        company_title = EXCLUDED.company_title,
        company_address = EXCLUDED.company_address,
        tax_office = EXCLUDED.tax_office,
        tax_number = EXCLUDED.tax_number,
        store_name = EXCLUDED.store_name,
        store_address = EXCLUDED.store_address,
        store_tax_office = EXCLUDED.store_tax_office,
        store_tax_number = EXCLUDED.store_tax_number,
        currency = EXCLUDED.currency,
        balance = EXCLUDED.balance,
        carry_over_balance = EXCLUDED.carry_over_balance,
        start_date = EXCLUDED.start_date,
        period_month_name = EXCLUDED.period_month_name,
        transactions = EXCLUDED.transactions,
        babs_invoice_count = EXCLUDED.babs_invoice_count,
        babs_total_sum = EXCLUDED.babs_total_sum,
        status = COALESCE(company_reconciliations.status, EXCLUDED.status),
        notes = EXCLUDED.notes,
        payload = EXCLUDED.payload,
        updated_at = NOW()
      RETURNING *`,
      [
        reconId,
        finalStoreId,
        resolvedCompanyId,
        r.companyTitle || 'Bilinmeyen Cari',
        r.companyAddress || '',
        r.taxOffice || '',
        r.taxNumber || '',
        r.storeName || '',
        r.storeAddress || '',
        r.storeTaxOffice || '',
        r.storeTaxNumber || '',
        (r.currency || 'TRY').toUpperCase(),
        Number(r.balance || 0),
        Number(r.carryOverBalance || 0),
        r.startDate || '',
        r.periodMonthName || '',
        JSON.stringify(Array.isArray(r.transactions) ? r.transactions : []),
        Number(r.babsInvoiceCount || 0),
        Number(r.babsTotalSum || 0),
        r.date || '',
        r.status || 'pending',
        r.disputeNote || null,
        r.responderName || null,
        Boolean(r.isArchived || false),
        r.archiveNote || null,
        r.notes || '',
        JSON.stringify(r)
      ]
    );

    res.json({
      success: true,
      reconciliation: formatReconciliationRow(upsertRes.rows[0])
    });
  } catch (err: any) {
    console.error("Error saving reconciliation:", err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk Sync LocalStorage Reconciliations to Database (Zero Data Loss Migration)
router.post("/reconciliations/sync", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  const finalStoreId = Number(storeId || req.body.storeId || 1);
  const items = Array.isArray(req.body.items) ? req.body.items : [];

  try {
    await ensureReconciliationsTable();

    for (const r of items) {
      if (!r || !r.id) continue;
      const reconId = Number(r.id);
      if (isNaN(reconId)) continue;

      let resolvedCompanyId = r.companyId || r.company_id || null;
      if (!resolvedCompanyId && r.companyTitle) {
        const compLookup = await pool.query(
          "SELECT id FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) LIMIT 1",
          [finalStoreId, String(r.companyTitle)]
        );
        if (compLookup.rows.length > 0) {
          resolvedCompanyId = compLookup.rows[0].id;
        }
      }

      await pool.query(
        `INSERT INTO company_reconciliations (
          id, store_id, company_id, company_title, company_address, tax_office, tax_number,
          store_name, store_address, store_tax_office, store_tax_number,
          currency, balance, carry_over_balance, start_date, period_month_name,
          transactions, babs_invoice_count, babs_total_sum, date_str,
          status, dispute_note, responder_name, is_archived, archive_note, notes, payload
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27
        )
        ON CONFLICT (id) DO UPDATE SET
          company_id = COALESCE(company_reconciliations.company_id, EXCLUDED.company_id),
          status = CASE 
            WHEN company_reconciliations.status = 'pending' AND EXCLUDED.status IN ('confirmed', 'disputed') THEN EXCLUDED.status
            ELSE company_reconciliations.status
          END,
          dispute_note = COALESCE(company_reconciliations.dispute_note, EXCLUDED.dispute_note)`,
        [
          reconId,
          Number(r.storeId || finalStoreId),
          resolvedCompanyId,
          r.companyTitle || 'Bilinmeyen Cari',
          r.companyAddress || '',
          r.taxOffice || '',
          r.taxNumber || '',
          r.storeName || '',
          r.storeAddress || '',
          r.storeTaxOffice || '',
          r.storeTaxNumber || '',
          (r.currency || 'TRY').toUpperCase(),
          Number(r.balance || 0),
          Number(r.carryOverBalance || 0),
          r.startDate || '',
          r.periodMonthName || '',
          JSON.stringify(Array.isArray(r.transactions) ? r.transactions : []),
          Number(r.babsInvoiceCount || 0),
          Number(r.babsTotalSum || 0),
          r.date || '',
          r.status || 'pending',
          r.disputeNote || null,
          r.responderName || null,
          Boolean(r.isArchived || false),
          r.archiveNote || null,
          r.notes || '',
          JSON.stringify(r)
        ]
      );
    }

    const allRes = await pool.query(
      "SELECT * FROM company_reconciliations WHERE store_id = $1 ORDER BY id DESC",
      [finalStoreId]
    );
    res.json({
      success: true,
      reconciliations: allRes.rows.map(formatReconciliationRow)
    });
  } catch (err: any) {
    console.error("Error syncing reconciliations:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update Reconciliation Status / Archive State / Notes (Operator Full Control)
router.patch("/reconciliations/:reconId", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  const { reconId } = req.params;
  const { status, disputeNote, responderName, isArchived, archiveNote, notes } = req.body;

  try {
    await ensureReconciliationsTable();
    const existingRes = await pool.query("SELECT * FROM company_reconciliations WHERE id = $1", [reconId]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Mutabakat kaydı bulunamadı." });
    }

    const row = existingRes.rows[0];
    const newStatus = status !== undefined ? status : row.status;
    const newDisputeNote = disputeNote !== undefined ? disputeNote : row.dispute_note;
    const newResponderName = responderName !== undefined ? responderName : row.responder_name;
    const newIsArchived = isArchived !== undefined ? Boolean(isArchived) : row.is_archived;
    const newArchivedAt = isArchived === true ? new Date() : (isArchived === false ? null : row.archived_at);
    const newArchiveNote = archiveNote !== undefined ? archiveNote : row.archive_note;
    const newNotes = notes !== undefined ? notes : row.notes;
    const newRespondedAt = (status && status !== row.status && (status === 'confirmed' || status === 'disputed')) ? new Date() : row.responded_at;

    const updatedPayload = {
      ...(typeof row.payload === 'object' && row.payload ? row.payload : {}),
      status: newStatus,
      disputeNote: newDisputeNote,
      responderName: newResponderName,
      isArchived: newIsArchived,
      archiveNote: newArchiveNote,
      notes: newNotes
    };

    const updateRes = await pool.query(
      `UPDATE company_reconciliations
       SET status = $1,
           dispute_note = $2,
           responder_name = $3,
           responded_at = $4,
           is_archived = $5,
           archived_at = $6,
           archive_note = $7,
           notes = $8,
           payload = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        newStatus,
        newDisputeNote,
        newResponderName,
        newRespondedAt,
        newIsArchived,
        newArchivedAt,
        newArchiveNote,
        newNotes,
        JSON.stringify(updatedPayload),
        reconId
      ]
    );

    res.json({
      success: true,
      reconciliation: formatReconciliationRow(updateRes.rows[0])
    });
  } catch (err: any) {
    console.error("Error updating reconciliation:", err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk Archive Completed Reconciliations
router.post("/reconciliations/bulk-archive", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  const finalStoreId = Number(storeId || req.body.storeId || 1);
  const { ids, onlyConfirmed } = req.body;

  try {
    await ensureReconciliationsTable();
    let result;
    if (Array.isArray(ids) && ids.length > 0) {
      result = await pool.query(
        `UPDATE company_reconciliations
         SET is_archived = TRUE, archived_at = NOW(), updated_at = NOW()
         WHERE store_id = $1 AND id = ANY($2::bigint[])
         RETURNING id`,
        [finalStoreId, ids.map(Number)]
      );
    } else if (onlyConfirmed) {
      result = await pool.query(
        `UPDATE company_reconciliations
         SET is_archived = TRUE, archived_at = NOW(), updated_at = NOW()
         WHERE store_id = $1 AND status = 'confirmed' AND is_archived = FALSE
         RETURNING id`,
        [finalStoreId]
      );
    } else {
      result = await pool.query(
        `UPDATE company_reconciliations
         SET is_archived = TRUE, archived_at = NOW(), updated_at = NOW()
         WHERE store_id = $1 AND status IN ('confirmed', 'disputed') AND is_archived = FALSE
         RETURNING id`,
        [finalStoreId]
      );
    }

    res.json({
      success: true,
      archivedCount: result.rowCount || 0
    });
  } catch (err: any) {
    console.error("Error bulk archiving reconciliations:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a Single Reconciliation Record (Only if explicitly requested by operator)
router.delete("/reconciliations/:reconId", async (req: any, res) => {
  const { reconId } = req.params;
  try {
    await ensureReconciliationsTable();
    await pool.query("DELETE FROM company_reconciliations WHERE id = $1", [reconId]);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting reconciliation:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

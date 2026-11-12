import express from 'express';
import { pool } from '../models/db';
import { authenticate, getAuthorizedStoreId } from '../middleware/auth';

const router = express.Router();

export async function initDeveloperProjectsSchema() {
  try {
    // 1. Developer Projects Table (Maldives, Mykonos, Hawaii, Aloha, Phuket, etc.)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS developer_projects (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        project_code TEXT NOT NULL,
        folder_prefix TEXT,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        sub_region TEXT,
        concept_tagline TEXT,
        status TEXT DEFAULT 'under_construction',
        completion_date TEXT,
        construction_progress INTEGER DEFAULT 65,
        total_units INTEGER DEFAULT 120,
        available_units INTEGER DEFAULT 45,
        optioned_units INTEGER DEFAULT 12,
        sold_units INTEGER DEFAULT 63,
        starting_price NUMERIC DEFAULT 145000,
        currency TEXT DEFAULT 'GBP',
        default_commission_rate NUMERIC DEFAULT 8,
        drive_folder_id TEXT DEFAULT '1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM',
        drive_folder_url TEXT DEFAULT 'https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM',
        last_drive_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cover_image TEXT,
        architectural_specs JSONB DEFAULT '[]'::jsonb,
        lifestyle_facilities JSONB DEFAULT '{}'::jsonb,
        payment_plan JSONB DEFAULT '{}'::jsonb,
        investment_metrics JSONB DEFAULT '{}'::jsonb,
        media_vault JSONB DEFAULT '[]'::jsonb,
        authorized_regions TEXT[] DEFAULT ARRAY['ALL'],
        min_agency_tier TEXT DEFAULT 'Standard',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Developer Project Units (Live Availability Matrix)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS developer_project_units (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        project_id INTEGER REFERENCES developer_projects(id) ON DELETE CASCADE,
        block_name TEXT NOT NULL,
        floor_level TEXT NOT NULL,
        unit_number TEXT NOT NULL,
        unit_type TEXT NOT NULL,
        gross_sqm NUMERIC NOT NULL,
        net_sqm NUMERIC NOT NULL,
        terrace_sqm NUMERIC DEFAULT 0,
        pool_access TEXT DEFAULT 'Ortak Havuz',
        view_direction TEXT DEFAULT 'Tam Deniz & Havuz',
        price NUMERIC NOT NULL,
        currency TEXT DEFAULT 'GBP',
        status TEXT DEFAULT 'available', -- 'available' | 'optioned' | 'sold'
        optioned_by_agency_id INTEGER,
        optioned_by_agency_name TEXT,
        optioned_client_name TEXT,
        option_expires_at TIMESTAMP,
        floor_plan_url TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Separate External B2B Agencies Table (Scalable to 1,000s of external real estate offices, isolated from internal store users)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS developer_b2b_agencies (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        agency_code TEXT NOT NULL,
        access_pin TEXT NOT NULL DEFAULT '2026',
        portal_token TEXT NOT NULL,
        company_name TEXT NOT NULL,
        broker_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        country TEXT NOT NULL,
        city_region TEXT NOT NULL,
        tier TEXT DEFAULT 'Gold', -- 'Standard' | 'Silver' | 'Gold' | 'VIP'
        commission_rate NUMERIC DEFAULT 8,
        bonus_commission_rate NUMERIC DEFAULT 2,
        contract_status TEXT DEFAULT 'signed', -- 'pending' | 'signed' | 'suspended'
        contract_signed_at TIMESTAMP,
        authorized_project_ids JSONB DEFAULT '[]'::jsonb,
        allowed_regions JSONB DEFAULT '["Girne Esentepe", "Tatlısu", "Bahçeli", "İskele"]'::jsonb,
        permissions JSONB DEFAULT '{"can_download_unbranded_media": true, "can_view_live_pricelist": true, "can_request_unit_option": true, "can_register_lead": true, "can_generate_branded_poster": true}'::jsonb,
        total_downloads INTEGER DEFAULT 0,
        active_leads_count INTEGER DEFAULT 0,
        closed_sales_count INTEGER DEFAULT 0,
        total_sales_volume_gbp NUMERIC DEFAULT 0,
        last_portal_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Internal Developer Management Staff Roles (8-10 internal executives/managers)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS developer_internal_staff (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        title_role TEXT NOT NULL,
        department TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        assigned_regions TEXT,
        permissions JSONB DEFAULT '{}'::jsonb,
        active_status BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. B2B Agency Lead Protection (Müşteri Zimmetleme), Unit Option Requests & Event RSVPs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS developer_b2b_requests (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        agency_id INTEGER,
        agency_name TEXT NOT NULL,
        agency_country TEXT,
        request_type TEXT NOT NULL, -- 'lead_protection' | 'unit_option' | 'event_rsvp'
        project_id INTEGER,
        project_name TEXT,
        unit_code TEXT,
        investor_name TEXT NOT NULL,
        investor_nationality TEXT,
        investor_phone_masked TEXT,
        budget_gbp NUMERIC DEFAULT 0,
        notes TEXT,
        status TEXT DEFAULT 'approved', -- 'pending' | 'approved' | 'rejected' | 'converted_to_sale'
        protection_expires_at TIMESTAMP,
        reviewed_by TEXT DEFAULT 'Satış Direktörlüğü',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Developer Launch Events & Inspection Trips
    await pool.query(`
      CREATE TABLE IF NOT EXISTS developer_launch_events (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        event_type TEXT NOT NULL, -- 'launch_party' | 'inspection_trip' | 'webinar' | 'roadshow'
        project_name TEXT,
        event_date TEXT NOT NULL,
        location TEXT NOT NULL,
        target_regions TEXT DEFAULT 'Global (Tüm Acenteler)',
        media_preview_url TEXT,
        registered_agencies_count INTEGER DEFAULT 42,
        max_capacity INTEGER DEFAULT 150,
        description TEXT,
        status TEXT DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Construction Developer Companies (İnşaat Firmaları Tanımlama & Drive Havuzu)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS developer_companies (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        company_code TEXT NOT NULL,
        company_name TEXT NOT NULL,
        headquarters_region TEXT DEFAULT 'Girne / Esentepe, KKTC',
        license_grade TEXT DEFAULT '1. Sınıf Müteahhitlik & Gayrimenkul Geliştirme',
        contact_director TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        drive_folder_id TEXT DEFAULT '1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM',
        drive_folder_url TEXT DEFAULT 'https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM',
        default_commission_rate NUMERIC DEFAULT 8,
        lead_protection_days INTEGER DEFAULT 60,
        option_hold_hours INTEGER DEFAULT 72,
        active_projects_count INTEGER DEFAULT 5,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Central Global Agency Pool (Managed from SuperAdmin + Reverse-Fed by projectLP Store Operators)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS global_agency_pool (
        id SERIAL PRIMARY KEY,
        agency_code TEXT UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        broker_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        whatsapp_phone TEXT,
        website TEXT,
        country TEXT NOT NULL,
        city_region TEXT NOT NULL,
        spoken_languages TEXT[] DEFAULT ARRAY['TR','EN'],
        specialization TEXT DEFAULT 'Kıyı Yatırım, Rezidans & Lüks Villa',
        agent_count INTEGER DEFAULT 12,
        tier TEXT DEFAULT 'Gold',
        default_commission_rate NUMERIC DEFAULT 8,
        bonus_commission_rate NUMERIC DEFAULT 2,
        restatelp_status TEXT DEFAULT 'prospect', -- 'active_member' | 'invited' | 'prospect'
        restatelp_store_slug TEXT,
        source_type TEXT DEFAULT 'superadmin_master', -- 'superadmin_master' | 'operator_reverse_feed'
        contributed_by_store_id INTEGER,
        contributed_by_store_name TEXT DEFAULT 'LookPrice SuperAdmin Havuzu',
        verified BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add Multilingual & B2B Recruitment CRM columns to developer_b2b_agencies if missing
    await pool.query(`
      ALTER TABLE developer_b2b_agencies
        ADD COLUMN IF NOT EXISTS global_pool_id INTEGER,
        ADD COLUMN IF NOT EXISTS spoken_languages TEXT[] DEFAULT ARRAY['TR','EN'],
        ADD COLUMN IF NOT EXISTS assigned_desk TEXT DEFAULT 'KKTC & Türkiye Masası',
        ADD COLUMN IF NOT EXISTS assigned_crm_manager TEXT DEFAULT 'Mert Karadağ',
        ADD COLUMN IF NOT EXISTS crm_stage TEXT DEFAULT 'active_partner',
        ADD COLUMN IF NOT EXISTS last_meeting_note TEXT,
        ADD COLUMN IF NOT EXISTS next_visit_date TEXT,
        ADD COLUMN IF NOT EXISTS preferred_contract_lang TEXT DEFAULT 'TR-EN',
        ADD COLUMN IF NOT EXISTS source_origin TEXT DEFAULT 'master_pool';
    `);

    // Seed Central Global Agency Pool (12 International & Regional Agencies across 9 Countries)
    const poolCountRes = await pool.query('SELECT COUNT(*)::INT as cnt FROM global_agency_pool');
    if (poolCountRes.rows[0].cnt === 0) {
      const masterPoolSeed = [
        { code: 'AG-KKTC-101', name: 'Kuzey Prestige Realty & Investment', broker: 'Kemal Arhun', email: 'info@kuzeyprestige.com', phone: '+90 548 881 20 30', country: 'KKTC', city: 'Girne & Esentepe', langs: ['TR', 'EN', 'RU'], spec: 'Esentepe & Tatlısu Sahil Projeleri', agents: 18, tier: 'VIP', comm: 10, bonus: 2, restate: 'active_member', slug: 'kuzey-prestige', source: 'superadmin_master', contributor: 'LookPrice SuperAdmin Havuzu', notes: 'Girne bölgesinde en yüksek sahil rezidans satış hacmine sahip VIP acente.' },
        { code: 'AG-KKTC-104', name: 'İskele Golden Coast Estates', broker: 'Tuğba Soylu', email: 'tugba@goldencoastkktc.com', phone: '+90 533 870 44 10', country: 'KKTC', city: 'İskele & Gazimağusa', langs: ['TR', 'EN', 'DE'], spec: 'Long Beach & Tatlısu Yatırım Konutları', agents: 14, tier: 'Gold', comm: 8, bonus: 2, restate: 'active_member', slug: 'golden-coast', source: 'superadmin_master', contributor: 'LookPrice SuperAdmin Havuzu', notes: 'İskele ve Tatlısu hattında Alman ve İngiliz yatırımcı turları düzenliyor.' },
        { code: 'AG-UK-201', name: 'Thames Global Property Advisors Ltd.', broker: 'Oliver Thornton', email: 'o.thornton@thamesproperty.co.uk', phone: '+44 20 7946 0821', country: 'İngiltere (UK)', city: 'Londra & Manchester', langs: ['EN'], spec: 'UK Expat & Emeklilik Sahil Villaları (GBP)', agents: 32, tier: 'VIP', comm: 10, bonus: 2, restate: 'invited', slug: '', source: 'superadmin_master', contributor: 'LookPrice SuperAdmin Havuzu', notes: 'Londra Mayfair merkezli, İngiliz yatırımcılara KKTC ve İspanya GBP bazlı projeler pazarlıyor.' },
        { code: 'AG-DE-305', name: 'Rheinland Mediterranean Invest GmbH', broker: 'Markus Becker', email: 'becker@rheinland-invest.de', phone: '+49 172 449 1020', country: 'Almanya (DACH)', city: 'Berlin & Münih', langs: ['DE', 'EN'], spec: 'DACH Bölgesi Vergi Avantajlı Döviz Yatırımı', agents: 24, tier: 'Gold', comm: 8, bonus: 2, restate: 'invited', slug: '', source: 'superadmin_master', contributor: 'LookPrice SuperAdmin Havuzu', notes: 'Almanya, Avusturya ve İsviçre yatırımcılarına ayda 2 kez KKTC Inspection Trip düzenliyor.' },
        { code: 'AG-TR-402', name: 'Bosphorus Luxury Estates & Brokerage', broker: 'Serkan Yalçınkaya', email: 'serkan@bosphorusestates.com.tr', phone: '+90 532 410 88 90', country: 'Türkiye', city: 'İstanbul & İzmir', langs: ['TR', 'EN', 'AR'], spec: 'Sterlin Kira Getirili KKTC & Yurt Dışı Konut', agents: 28, tier: 'Gold', comm: 8, bonus: 1.5, restate: 'active_member', slug: 'bosphorus-estates', source: 'superadmin_master', contributor: 'LookPrice SuperAdmin Havuzu', notes: 'İstanbul Etiler ve İzmir Alsancak ofisleriyle Türk yatırımcılara döviz kira getirili projeler sunuyor.' },
        { code: 'AG-RU-509', name: 'Eurasia Prime Overseas Realty', broker: 'Dmitry Volkov', email: 'd.volkov@eurasiaprime.ru', phone: '+7 916 550 19 88', country: 'Rusya & CIS', city: 'Moskova & Almatı', langs: ['RU', 'EN'], spec: 'CIS Yatırımcıları, Oturum İzni & Toplu Alım', agents: 45, tier: 'VIP', comm: 10, bonus: 2, restate: 'invited', slug: '', source: 'superadmin_master', contributor: 'LookPrice SuperAdmin Havuzu', notes: 'Rusya ve Kazakistan pazarında en güçlü lüks proje distribütörü.' },
        { code: 'AG-SE-601', name: 'Nordic Sun & Sea Homes AB', broker: 'Astrid Lindholm', email: 'astrid@nordicsunhomes.se', phone: '+46 70 882 41 10', country: 'İskandinavya', city: 'Stockholm & Oslo', langs: ['SV', 'EN', 'DE'], spec: 'Kış Güneşi, Golf & Wellness Resort Konutları', agents: 16, tier: 'Silver', comm: 8, bonus: 1, restate: 'prospect', slug: '', source: 'superadmin_master', contributor: 'LookPrice SuperAdmin Havuzu', notes: 'İsveç ve Norveçli emekli/uzaktan çalışan kitleye Phuket Wellness & Maldives projelerini satıyor.' },
        { code: 'AG-AE-703', name: 'Gulf Horizon Wealth & Real Estate', broker: 'Tariq Al-Mansoor', email: 'tariq@gulfhorizon.ae', phone: '+971 50 912 4400', country: 'BAE & Orta Doğu', city: 'Dubai & Abu Dabi', langs: ['AR', 'EN'], spec: 'Körfez Fonları & Çoklu Ünite Blok Yatırımı', agents: 38, tier: 'VIP', comm: 10, bonus: 2, restate: 'invited', slug: '', source: 'superadmin_master', contributor: 'LookPrice SuperAdmin Havuzu', notes: 'Dubai merkezli portföy yönetim firması; Akdeniz sahil projelerinde toplu kat alımı yapıyor.' },
        { code: 'AG-IR-802', name: 'Caspian Royal Property Group', broker: 'Kambiz Rostami', email: 'rostami@caspianroyal.com', phone: '+90 548 844 77 12', country: 'İran & Körfez', city: 'Tahran & Girne', langs: ['FA', 'EN', 'TR'], spec: 'Aile Oturumu & Döviz Taksitli Rezidanslar', agents: 22, tier: 'Gold', comm: 8, bonus: 2, restate: 'prospect', slug: '', source: 'operator_reverse_feed', contributor: 'Cyprus Constructions (projectLP)', notes: 'Proje firması operatörü tarafından sahada eklendi ve merkezi havuza geri beslendi.' },
        { code: 'AG-ES-904', name: 'Marbella & Med Prestige Brokers SL', broker: 'Carlos Mendoza', email: 'c.mendoza@marbellamed.es', phone: '+34 612 884 190', country: 'İspanya & Avrupa', city: 'Marbella & Madrid', langs: ['ES', 'EN', 'DE'], spec: 'Costa del Sol & Doğu Akdeniz Kıyaslamalı Yatırım', agents: 19, tier: 'Gold', comm: 8, bonus: 1.5, restate: 'prospect', slug: '', source: 'superadmin_master', contributor: 'LookPrice SuperAdmin Havuzu', notes: 'Avrupalı yatırımcılara İspanya alternatifli yüksek kira çarpanlı KKTC projeleri sunuyor.' },
        { code: 'AG-UA-512', name: 'Kyiv & Warsaw Overseas Property Hub', broker: 'Oksana Shevchenko', email: 'oksana@overseashub.ua', phone: '+48 512 904 331', country: 'Rusya & CIS', city: 'Varşova & Kiev', langs: ['RU', 'EN'], spec: 'Avrupa & Doğu Avrupa Aile Konut Yatırımları', agents: 21, tier: 'Gold', comm: 8, bonus: 2, restate: 'prospect', slug: '', source: 'operator_reverse_feed', contributor: 'Döveç Construction Group (projectLP)', notes: 'Polonya ve Ukrayna mukimi yatırımcılar için saha ekibi tarafından havuza kazandırıldı.' },
        { code: 'AG-TR-415', name: 'Ankara Diplomasi & Yatırım Gayrimenkul', broker: 'Hakan Çelikkol', email: 'hakan@ankaradiplomasi.com.tr', phone: '+90 532 611 40 50', country: 'Türkiye', city: 'Ankara & Antalya', langs: ['TR', 'EN', 'RU'], spec: 'Bürokrat, Doktor & Kurumsal Yatırımcı Portföyü', agents: 15, tier: 'Gold', comm: 8, bonus: 1.5, restate: 'active_member', slug: 'ankara-diplomasi', source: 'superadmin_master', contributor: 'LookPrice SuperAdmin Havuzu', notes: 'Ankara Çankaya ve Antalya Lara şubeleriyle düzenli Kıbrıs yatırım seminerleri yapıyor.' }
      ];

      for (const mp of masterPoolSeed) {
        await pool.query(
          `INSERT INTO global_agency_pool (
            agency_code, company_name, broker_name, email, phone, whatsapp_phone, website,
            country, city_region, spoken_languages, specialization, agent_count, tier,
            default_commission_rate, bonus_commission_rate, restatelp_status, restatelp_store_slug,
            source_type, contributed_by_store_name, verified, notes
          ) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,true,$19)
          ON CONFLICT (agency_code) DO NOTHING`,
          [
            mp.code, mp.name, mp.broker, mp.email, mp.phone,
            `https://www.${mp.email.split('@')[1]}`, mp.country, mp.city, mp.langs,
            mp.spec, mp.agents, mp.tier, mp.comm, mp.bonus, mp.restate, mp.slug,
            mp.source, mp.contributor, mp.notes
          ]
        );
      }
    }

    // 9. Ensure standalone developer_project accounts exist in `stores` with clean corporate names
    try {
      const sampleDevStores = [
        {
          name: 'Cyprus Constructions',
          slug: 'cyprus-constructions',
          address: 'Girne — Esentepe & Tatlısu Sahil Hattı, KKTC',
          contact_person: 'Salih Kayım / Global Satış Direktörlüğü',
          phone: '+90 548 860 00 01',
          email: 'b2b@cyprusconstructions.com',
          plan: 'enterprise'
        },
        {
          name: 'Döveç Construction Group',
          slug: 'dovec-group',
          address: 'İskele Long Beach & Gazimağusa, KKTC',
          contact_person: 'Burçin Döveç / Proje Geliştirme Direktörlüğü',
          phone: '+90 548 888 00 02',
          email: 'b2b@dovecgroup.com',
          plan: 'enterprise'
        },
        {
          name: 'Noyanlar Group Construction',
          slug: 'projectlp-demo',
          address: 'Girne & İskele, KKTC',
          contact_person: 'Proje Yönetimi & Satış Direktörlüğü',
          phone: '+90 548 860 00 99',
          email: 'demo@projectlp.com',
          plan: 'pro'
        }
      ];

      try {
        await pool.query("SELECT setval(pg_get_serial_sequence('stores', 'id'), COALESCE((SELECT MAX(id) FROM stores), 1) + 1, false);");
      } catch (_seqErr) {
        // ignore sequence notice
      }

      for (const ds of sampleDevStores) {
        const checkStore = await pool.query('SELECT id FROM stores WHERE LOWER(slug) = $1', [ds.slug]);
        const brandingObj = {
          store_name: ds.name,
          name: ds.name,
          slug: ds.slug,
          contact_person: ds.contact_person,
          phone: ds.phone,
          whatsapp_number: ds.phone.replace(/[^0-9]/g, ''),
          address: ds.address,
          email: ds.email,
          country: 'CY',
          default_currency: 'GBP',
          language: 'tr',
          store_type: 'developer_project',
          sub_sector: 'developer_project',
          store_concept: 'developer_project',
          logo_url: 'https://drive.google.com/thumbnail?id=1bHq40srfUMn8exQUGUDz6EB8cnaKZyZc&sz=w800',
          hero_image_url: 'https://drive.google.com/thumbnail?id=12hVM_oRM_irEFbk57JDZmbyUIoE0OQhq&sz=w1600',
          page_layout_settings: {
            sector: 'developer_project'
          }
        };
        let targetStoreId: number | null = null;
        if (checkStore.rows.length === 0) {
          const insStore = await pool.query(
            `INSERT INTO stores (
              name, slug, address, contact_person, phone, country, email, subscription_end,
              default_currency, language, plan, store_type, sub_sector,
              status, is_approved, max_products, max_properties, max_vehicles, max_users, max_customers, branding
            ) VALUES ($1,$2,$3,$4,$5,'CY',$6, CURRENT_DATE + INTERVAL '365 days', 'GBP', 'tr', $7, 'developer_project', 'developer_project', 'approved', true, 500, 500, 20, 15, 5000, $8) RETURNING id`,
            [ds.name, ds.slug, ds.address, ds.contact_person, ds.phone, ds.email, ds.plan, JSON.stringify(brandingObj)]
          );
          targetStoreId = insStore.rows[0]?.id;
        } else {
          targetStoreId = checkStore.rows[0].id;
          await pool.query(
            `UPDATE stores
             SET name = $1,
                 store_type = 'developer_project',
                 sub_sector = 'developer_project',
                 default_currency = 'GBP',
                 status = 'approved',
                 is_approved = true,
                 branding = COALESCE(branding, '{}'::jsonb) || $2::jsonb
             WHERE id = $3`,
            [ds.name, JSON.stringify(brandingObj), targetStoreId]
          );
        }

        await pool.query(
          `UPDATE stores SET name = regexp_replace(name, '\\s*\\(projectLP\\)\\s*', '', 'gi') WHERE store_type = 'developer_project'`
        );
        await pool.query(
          `UPDATE developer_companies SET company_name = regexp_replace(company_name, '\\s*\\(projectLP\\)\\s*', '', 'gi')`
        );

        if (targetStoreId && ds.email) {
          const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [ds.email]);
          if (userCheck.rows.length === 0) {
            await pool.query(
              `INSERT INTO users (email, password, role, store_id) VALUES ($1, 'projectlp1234', 'admin', $2)`,
              [ds.email, targetStoreId]
            );
          }
        }
      }
    } catch (seedStoreErr) {
      console.warn('Notice while seeding standalone projectLP stores:', seedStoreErr);
    }

    console.log('Developer Projects schema verified.');
  } catch (err) {
    console.error('Error initializing Developer Projects schema:', err);
  }
}

let schemaReadyPromise: Promise<void> | null = initDeveloperProjectsSchema();

function resolveCountryDeskAndManager(country: string) {
  const c = (country || '').toLowerCase();
  if (c.includes('uk') || c.includes('ingiltere')) {
    return { desk: 'Londra & UK Temsilciliği (EN)', manager: 'Cenk Soydan', contractLang: 'TR-EN' };
  }
  if (c.includes('almanya') || c.includes('dach')) {
    return { desk: 'Berlin & DACH Temsilciliği (DE)', manager: 'Hans-Peter Lindner', contractLang: 'EN-DE' };
  }
  if (c.includes('rusya') || c.includes('cis') || c.includes('ukrayna') || c.includes('kazak')) {
    return { desk: 'Moskova & CIS Temsilciliği (RU)', manager: 'Elena Voronova', contractLang: 'EN-RU' };
  }
  if (c.includes('iskandinav') || c.includes('isveç') || c.includes('norveç')) {
    return { desk: 'Stockholm & Nordic Masası (SV/EN)', manager: 'Hans-Peter Lindner', contractLang: 'EN-DE' };
  }
  if (c.includes('bae') || c.includes('dubai') || c.includes('iran') || c.includes('körfez')) {
    return { desk: 'Dubai & Orta Doğu / Farsça Masası (AR/FA)', manager: 'Cenk Soydan', contractLang: 'TR-EN' };
  }
  return { desk: 'Girne & İstanbul Merkez Masası (TR/EN)', manager: 'Mert Karadağ', contractLang: 'TR-EN' };
}

export async function syncGlobalPoolToStore(storeId: number) {
  try {
    const [poolRes, storeAgenciesRes] = await Promise.all([
      pool.query('SELECT * FROM global_agency_pool ORDER BY id ASC'),
      pool.query('SELECT id, agency_code, email, company_name FROM developer_b2b_agencies WHERE store_id = $1', [storeId])
    ]);

    const existingEmails = new Set(storeAgenciesRes.rows.map((r: any) => String(r.email || '').trim().toLowerCase()));
    const existingCodes = new Set(storeAgenciesRes.rows.map((r: any) => String(r.agency_code || '').trim().toUpperCase()));
    const existingNames = new Set(storeAgenciesRes.rows.map((r: any) => String(r.company_name || '').trim().toLowerCase()));

    let insertedCount = 0;
    for (const gp of poolRes.rows) {
      const emailKey = String(gp.email || '').trim().toLowerCase();
      const codeKey = String(gp.agency_code || '').trim().toUpperCase();
      const nameKey = String(gp.company_name || '').trim().toLowerCase();

      if (existingEmails.has(emailKey) || existingCodes.has(codeKey) || existingNames.has(nameKey)) {
        await pool.query(
          `UPDATE developer_b2b_agencies
           SET global_pool_id = COALESCE(global_pool_id, $1),
               spoken_languages = COALESCE(spoken_languages, $2)
           WHERE store_id = $3 AND (LOWER(email) = $4 OR UPPER(agency_code) = $5)`,
          [gp.id, gp.spoken_languages || ['TR', 'EN'], storeId, emailKey, codeKey]
        );
        continue;
      }

      const deskMeta = resolveCountryDeskAndManager(gp.country);
      const isSigned = ['AG-KKTC-101', 'AG-KKTC-104', 'AG-UK-201', 'AG-DE-305', 'AG-TR-402', 'AG-RU-509', 'AG-SE-601'].includes(gp.agency_code);

      await pool.query(
        `INSERT INTO developer_b2b_agencies (
          store_id, global_pool_id, agency_code, access_pin, portal_token, company_name, broker_name,
          email, phone, country, city_region, tier, commission_rate, bonus_commission_rate,
          contract_status, contract_signed_at, spoken_languages, assigned_desk, assigned_crm_manager,
          crm_stage, last_meeting_note, next_visit_date, preferred_contract_lang, source_origin
        ) VALUES (
          $1,$2,$3,'2026',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
          CASE WHEN $14 = 'signed' THEN CURRENT_TIMESTAMP - INTERVAL '10 days' ELSE NULL END,
          $15,$16,$17,$18,$19,$20,$21,$22
        )`,
        [
          storeId,
          gp.id,
          gp.agency_code,
          `b2b_tok_${gp.agency_code.toLowerCase()}_${storeId}`,
          gp.company_name,
          gp.broker_name,
          gp.email,
          gp.phone,
          gp.country,
          gp.city_region,
          gp.tier || 'Gold',
          Number(gp.default_commission_rate) || 8,
          Number(gp.bonus_commission_rate) || 2,
          isSigned ? 'signed' : 'pending',
          gp.spoken_languages || ['TR', 'EN'],
          deskMeta.desk,
          deskMeta.manager,
          isSigned ? 'active_partner' : 'visit_scheduled',
          gp.notes || 'Merkezi Global Emlakçı Havuzundan otomatik tanımlandı.',
          '2026-05-28 14:00',
          deskMeta.contractLang,
          gp.source_type === 'operator_reverse_feed' ? 'operator_reverse_feed' : 'master_pool'
        ]
      );
      insertedCount++;
    }
    return insertedCount;
  } catch (err) {
    console.warn('Error syncing global agency pool to store:', err);
    return 0;
  }
}

async function ensureSeedDataForStore(storeId: number) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = initDeveloperProjectsSchema();
  }
  await schemaReadyPromise;

  const storeInfoRes = await pool.query('SELECT name, slug, address, contact_person, phone, email FROM stores WHERE id = $1', [storeId]);
  const storeInfo = storeInfoRes.rows[0];
  const resolvedCompanyName = storeInfo?.name && !/restatelp|emlak/i.test(storeInfo.name)
    ? storeInfo.name.replace(/\s*\(projectLP\)\s*/gi, '').trim()
    : 'Cyprus Constructions';

  const compCheck = await pool.query('SELECT COUNT(*)::INT as cnt FROM developer_companies WHERE store_id = $1', [storeId]);
  if (compCheck.rows[0].cnt === 0) {
    await pool.query(
      `INSERT INTO developer_companies (
        store_id, company_code, company_name, headquarters_region, license_grade,
        contact_director, phone, email, website, drive_folder_id, drive_folder_url,
        default_commission_rate, lead_protection_days, option_hold_hours, active_projects_count
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        storeId,
        `DEV-CC-0${storeId}`,
        resolvedCompanyName,
        storeInfo?.address || 'Girne — Esentepe & Tatlısu Sahil Hattı, KKTC',
        '1. Sınıf Uluslararası Konut & Resort Geliştiricisi (10 Aktif Sahil & Villa Projesi)',
        storeInfo?.contact_person || 'Salih Kayım / Global Satış Direktörlüğü',
        storeInfo?.phone || '+90 548 860 00 01',
        storeInfo?.email || 'b2b@cyprusconstructions.com',
        'https://www.cyprusconstructions.com',
        '1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM',
        'https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM',
        8,
        60,
        72,
        10
      ]
    );
  } else {
    await pool.query('UPDATE developer_companies SET active_projects_count = 10 WHERE store_id = $1 AND active_projects_count < 10', [storeId]);
  }

  // All 10 real Cyprus Constructions projects extracted directly from Google Drive (1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM)
  const projectsSeed = [
    {
      project_code: 'CC-PRJ-01',
      folder_prefix: '1. Maldives Homes',
      drive_folder_id: '1suTGEC7FBv17tx68JQuU8NFS2SJVCX0U',
      drive_folder_url: 'https://drive.google.com/drive/folders/1suTGEC7FBv17tx68JQuU8NFS2SJVCX0U',
      name: 'Maldives Homes',
      region: 'Girne',
      sub_region: 'Esentepe Sahil Şeridi',
      concept_tagline: 'Özel Plaj, Açık Hava Sineması (Maldives Cinema) ve Maldivler Konseptli Lagün Havuzlu Sahil Rezidansları & Villalar',
      status: 'ready_to_move',
      completion_date: 'Teslime Hazır (Anahtar Teslim)',
      construction_progress: 100,
      total_units: 140,
      available_units: 14,
      optioned_units: 5,
      sold_units: 121,
      starting_price: 189000,
      currency: 'GBP',
      default_commission_rate: 8,
      cover_image: 'https://drive.google.com/thumbnail?id=1BByvpSoIl22UNb4De-Dgna5RyN01_TbD&sz=w1200',
      architectural_specs: [
        'Kesintisiz Akdeniz ve Beşparmak Dağları Panoraması (Kademeli Teras Mimarisi)',
        'Özel İskele, Lagün Tarzı Yüzme Havuzları ve Palmiye Adacıkları',
        'Yüksek Isı/Ses Yalıtımlı Çift Cam Alüminyum Doğrama & VRF İklimlendirme Altyapısı',
        'Birinci Sınıf İtalyan Seramik, Granit Tezgah & Akıllı Ev Hazırlığı',
        'Penthouse Ünitelerde Özel Çatı Terası, Jakuzi, Barbekü ve Pergola Standartları'
      ],
      lifestyle_facilities: {
        beach_marina: ['Özel Kum Plaj & Beach Club', 'Deniz Üstü Cabana & İskele', 'Su Sporları & Dalış Noktası'],
        entertainment: ['Maldives Açık Hava Su Üstü Sineması (Maldives Cinema)', 'Amfi Tiyatro & Akşam Etkinlik Alanı'],
        wellness_spa: ['Isıtmalı Kapalı Havuz', 'Türk Hamamı, Sauna & Buhar Odası', 'Panoramik Fitness & Yoga Stüdyosu'],
        gastronomy: ['Fine-Dining Sahil Restoranı', 'Pool Bar & Sunset Lounge'],
        family_sports: ['Tenis & Basketbol Kortu', 'Çocuk Kulübü & Aqua Park', 'Mini Golf Sahası']
      },
      payment_plan: {
        plan_name: 'Hazır Teslim Esnek Plan',
        down_payment_percent: 50,
        during_construction_percent: 0,
        installment_percent: 50,
        installment_months: 24,
        interest_rate: 0,
        reservation_deposit_gbp: 5000,
        notes: '%50 Peşinat ile anında anahtar teslim ve kira geliri başlangıcı; kalan %50 için 24 ay 0 faiz şirket içi taksit.'
      },
      investment_metrics: {
        annual_rental_yield_percent: 9.2,
        capital_appreciation_percent: 42,
        short_term_occupancy_percent: 82,
        management_service: '7/24 Profesyonel Kiralama & Site Yönetimi (Rental Pool Aktif)',
        target_buyer_profile: 'Kısa Dönem Döviz Kira Geliri & Hemen Oturum Arayan Yatırımcılar'
      },
      media_vault: [
        { id: 'm1_1', name: 'Maldives Cinema.mp4 (Su Üstü Sinema Tanıtımı)', url: 'https://drive.google.com/file/d/1XZIDqmaxkHd1m59EPrLE0oNsHWZj_qi3/view', type: 'video', size: '358.8 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm1_2', name: 'MALDIVES FPV.mp4 (Drone FPV Turu)', url: 'https://drive.google.com/file/d/1t-PVRAVRUlWiCl9Y-PqDbLvhl8CQMlLj/view', type: 'video', size: '84.5 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm1_3', name: 'MALDIVES HOMES REEL.mp4', url: 'https://drive.google.com/file/d/1c6R2wOYyqnBQy7AOCuJhbK8JIWlUx7-j/view', type: 'video', size: '41.2 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm1_4', name: 'Floor plan — Maldives Kat Planları Klasörü', url: 'https://drive.google.com/drive/folders/14A7ByouV4u6Nrex1dLiNFMccj8Rp1ENr', type: 'masterplan', size: 'Klasör', category: 'Masterplan & Kat Planları', drive_synced: true },
        { id: 'm1_5', name: 'Pricelist — Maldives Güncel Fiyat Listesi Klasörü', url: 'https://drive.google.com/drive/folders/1-oPNdlk-Bfjb6r92SYrdjhDPtpMiVrEr', type: 'pricelist', size: 'Klasör', category: 'Fiyat Listesi & Ödeme Planı', drive_synced: true },
        { id: 'm1_6', name: 'Technical spec — Teknik Şartname Klasörü', url: 'https://drive.google.com/drive/folders/17LoKOny62tvNK1KYbBFOCt6avEmzmtOa', type: 'legal', size: 'Klasör', category: 'Ruhsat & Hukuki Belgeler', drive_synced: true },
        { id: 'm1_7', name: 'Photos & Villa — 4K Mimari Fotoğraf Klasörü', url: 'https://drive.google.com/drive/folders/1RB9Iy4WqTBeN1q6c035GwZe7oFiSIwIi', type: 'photos', size: 'Klasör', category: '4K Görsel & Render Paketi', drive_synced: true }
      ]
    },
    {
      project_code: 'CC-PRJ-02',
      folder_prefix: '2. IDYLL Homes',
      drive_folder_id: '1ywG0Vc_ftaGu2xB-voLsX1xch4f-xcXK',
      drive_folder_url: 'https://drive.google.com/drive/folders/1ywG0Vc_ftaGu2xB-voLsX1xch4f-xcXK',
      name: 'IDYLL Homes',
      region: 'Girne',
      sub_region: 'Esentepe Merkez & Cali Pub Etabı',
      concept_tagline: 'Butik Akdeniz Mimarisi, Cali Pub Gastronomy Lounge ve Panoramik Havuz Manzaralı Tamamlanmış Lüks Daireler',
      status: 'ready_to_move',
      completion_date: 'Teslime Hazır (Tamamlanmış Proje)',
      construction_progress: 100,
      total_units: 88,
      available_units: 9,
      optioned_units: 3,
      sold_units: 76,
      starting_price: 165000,
      currency: 'GBP',
      default_commission_rate: 8,
      cover_image: 'https://drive.google.com/thumbnail?id=1SzG3SK7biZR9YLr7kfNTGf_3QAf0wbTY&sz=w1200',
      architectural_specs: [
        'Tamamlanmış ve Yaşamın Başladığı Prestijli Esentepe Rezidans Kompleksi',
        '1+1 Bahçe Dubleks ve 2+1 Çatı Teraslı Penthouse Seçenekleri',
        'Özel Tasarım Cali Pub & Bistro Sosyal Yaşam Alanı Entegrasyonu',
        'Geniş Peyzajlı Ortak Yüzme Havuzu ve Akdeniz Panoraması',
        'Hemen Koçan Devri ve Anında GBP Kira Getirisi İmkanı'
      ],
      lifestyle_facilities: {
        beach_marina: ['Esentepe Plajına 400m Yürüme Mesafesi', 'Sahil Bisiklet Yolu'],
        entertainment: ['Cali Pub & Gastro Lounge (Canlı Müzik & Sosyal Kulüp)'],
        wellness_spa: ['Açık Lagün Yüzme Havuzu', 'Fitness & Güneşlenme Terasları'],
        gastronomy: ['Cali Pub Signature Kitchen & Craft Bar'],
        family_sports: ['Botanik Peyzaj Bahçeleri', 'Açık Otopark & 7/24 Site Yönetimi']
      },
      payment_plan: {
        plan_name: 'IDYLL Hemen Teslim Planı',
        down_payment_percent: 50,
        during_construction_percent: 0,
        installment_percent: 50,
        installment_months: 18,
        interest_rate: 0,
        reservation_deposit_gbp: 5000,
        notes: '%50 Peşinat ile hemen anahtar teslim; kalan %50 için 18 ay %0 faizli şirket içi ödeme planı.'
      },
      investment_metrics: {
        annual_rental_yield_percent: 9.0,
        capital_appreciation_percent: 36,
        short_term_occupancy_percent: 84,
        management_service: 'Aktif Kiralama & Site Yönetimi (Hemen Kira Geliri)',
        target_buyer_profile: 'İnşaat Beklemeden Hemen Anahtar Teslim ve Kira Geliri İsteyen Yatırımcılar'
      },
      media_vault: [
        { id: 'm2_1', name: 'IDYLL PRICELIST SEP 7TH 2026.pdf', url: 'https://drive.google.com/file/d/1ShhxTI6XEJHio4ECp9RcGhO2AGucD2It/view', type: 'pricelist', size: '2.4 MB', category: 'Fiyat Listesi & Ödeme Planı', drive_synced: true },
        { id: 'm2_2', name: 'CALI PUB.mp4 (Sosyal Tesis & Gastro Pub Tanıtımı)', url: 'https://drive.google.com/file/d/1KNHl-HW4l7XUpGjc0G4MgNWuloaP_fQG/view', type: 'video', size: '48.2 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm2_3', name: 'COMPLETED PROJECT PHOTOS — Tamamlanmış Proje Fotoğrafları', url: 'https://drive.google.com/drive/folders/1BoB733scMYAg5c1FUQ-KONzvrIvlM4pW', type: 'photos', size: 'Klasör', category: '4K Görsel & Render Paketi', drive_synced: true },
        { id: 'm2_4', name: 'Floor plans — IDYLL Kat Planları Klasörü', url: 'https://drive.google.com/drive/folders/1IbjDgKT9y2Y0he5-60jCwgDYKlwhJGnB', type: 'masterplan', size: 'Klasör', category: 'Masterplan & Kat Planları', drive_synced: true },
        { id: 'm2_5', name: 'Technical spec — Teknik Şartname Klasörü', url: 'https://drive.google.com/drive/folders/1-spphgTT0u1BiLd1tVCz9n3nS3w1kEQ8', type: 'legal', size: 'Klasör', category: 'Ruhsat & Hukuki Belgeler', drive_synced: true }
      ]
    },
    {
      project_code: 'CC-PRJ-03',
      folder_prefix: '3. Mykonos Homes',
      drive_folder_id: '1c64SFQu5KF5mHi_Vh2tviXbFGKp5vGpC',
      drive_folder_url: 'https://drive.google.com/drive/folders/1c64SFQu5KF5mHi_Vh2tviXbFGKp5vGpC',
      name: 'Mykonos Homes',
      region: 'Girne',
      sub_region: 'Bahçeli / Esentepe Doğu Sahili',
      concept_tagline: 'Ege & Kiklad Adaları Mimarisinde Beyaz Taş Dokulu, Özel Havuzlu Lüks Teras Evler ve Villalar',
      status: 'near_completion',
      completion_date: 'Q4 2026',
      construction_progress: 92,
      total_units: 110,
      available_units: 16,
      optioned_units: 7,
      sold_units: 87,
      starting_price: 215000,
      currency: 'GBP',
      default_commission_rate: 8,
      cover_image: 'https://drive.google.com/thumbnail?id=1a3Ue3hWu7FF_CIxo7QsM2mL0aQ8ijznK&sz=w1200',
      architectural_specs: [
        'Yunan Adaları (Mykonos) İkonik Beyaz Minimalist Mimari & Doğal Taş Cephe Detayları',
        'Her Bloğun Önünün Açık Kalmasını Sağlayan Kademeli Amfi Yerleşim Planı',
        'Bahçe Katlarında Özel Swim-Up Havuz Bağlantısı, Penthouse Ünitelerde Infinity Çatı Terası',
        'Yüksek Tavanlı Ferah Salonlar, Gömme Dolap Sistemleri ve Lüks Ankastre Mutfak',
        'Düşük Yoğunluklu Butik Yerleşim ve Yüksek Mahremiyetli Müstakil/Yarı-Müstakil Tasarım'
      ],
      lifestyle_facilities: {
        beach_marina: ['Koya Yürüme Mesafesi (Denize Sıfır Konum)', 'Sunset Beach Deck & Lounge'],
        entertainment: ['Mykonos Chill-Out Lounge & Etkinlik Terası'],
        wellness_spa: ['Sonsuzluk (Infinity) Açık Yüzme Havuzu', 'Butik Spa, Sauna & Masaj Odaları', 'Açık Hava Fitness Alanı'],
        gastronomy: ['Ege & Akdeniz Taverna / Fine-Dining Restoran', 'Cava & Kokteyl Bar'],
        family_sports: ['Peyzajlı Yürüyüş Bahçeleri', 'Çocuk Oyun Alanı', '7/24 Konsiyerj & VIP Transfer']
      },
      payment_plan: {
        plan_name: 'Mykonos Prestij Planı',
        down_payment_percent: 35,
        during_construction_percent: 45,
        installment_percent: 20,
        installment_months: 24,
        interest_rate: 0,
        reservation_deposit_gbp: 5000,
        notes: '%35 Peşinat, %45 anahtar teslimine kadar faizsiz ara ödemeler, kalan %20 anahtar teslimi sonrası 24 ay 0 faiz taksit.'
      },
      investment_metrics: {
        annual_rental_yield_percent: 9.8,
        capital_appreciation_percent: 38,
        short_term_occupancy_percent: 85,
        management_service: 'Butik Lüks Tatil Kiralama Yönetimi (Yüksek Gecelik GBP Getirisi)',
        target_buyer_profile: 'Yüksek Prestij, Butik Mimari ve Kısa Sürede Teslim Arayan Yatırımcılar'
      },
      media_vault: [
        { id: 'm3_1', name: 'Mykonos Pricelist Aug 24th 2026.pdf', url: 'https://drive.google.com/file/d/1fvc76ftOeOcKcFAIHOIXMhckw6HUKIUI/view', type: 'pricelist', size: '3.1 MB', category: 'Fiyat Listesi & Ödeme Planı', drive_synced: true },
        { id: 'm3_2', name: 'MYKONOS OVERVIEW.mp4 (Genel Tanıtım & Drone Filmi)', url: 'https://drive.google.com/file/d/1-5HflN3rCdD2hrSOaqaD9ymc6S_fiEqi/view', type: 'video', size: '95.4 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm3_3', name: 'BUILDING PERMISTS AND LICENSE — İnşaat Ruhsatları Klasörü', url: 'https://drive.google.com/drive/folders/1QsRUl86n-pwqAc0nCnxie8aCSrwzCcmV', type: 'legal', size: 'Klasör', category: 'Ruhsat & Hukuki Belgeler', drive_synced: true },
        { id: 'm3_4', name: 'Floor plans — Mykonos Kat Planları Klasörü', url: 'https://drive.google.com/drive/folders/1I6qMGJMsOACUpqtQDKhpZboPRXvF_5tV', type: 'masterplan', size: 'Klasör', category: 'Masterplan & Kat Planları', drive_synced: true },
        { id: 'm3_5', name: 'COMPLETED PROJECT PHOTOS — Tamamlanan Etap Görselleri', url: 'https://drive.google.com/drive/folders/1C_6DWDG-XK79_QURaH--j9naiMZOjLBB', type: 'photos', size: 'Klasör', category: '4K Görsel & Render Paketi', drive_synced: true }
      ]
    },
    {
      project_code: 'CC-PRJ-04',
      folder_prefix: '4. Pearl Island Homes',
      drive_folder_id: '1jCSyV4527WmYZO4f9S8JSwAI0Jen8qbk',
      drive_folder_url: 'https://drive.google.com/drive/folders/1jCSyV4527WmYZO4f9S8JSwAI0Jen8qbk',
      name: 'Pearl Island Homes',
      region: 'Girne',
      sub_region: 'Tatlısu — Esentepe Kıyı Şeridi',
      concept_tagline: 'Özel Ada Havuzu Peyzajı, Deniz Manzaralı Stüdyo & Loft Süitlerle Yüksek Kira Çarpanlı Yatırım Projesi',
      status: 'ready_to_move',
      completion_date: 'Teslime Hazır (Anahtar Teslim)',
      construction_progress: 100,
      total_units: 156,
      available_units: 11,
      optioned_units: 4,
      sold_units: 141,
      starting_price: 135000,
      currency: 'GBP',
      default_commission_rate: 8,
      cover_image: 'https://drive.google.com/thumbnail?id=1_q0jTOFmj7xb4G0ry-Jq56AbVruLcIkk&sz=w1200',
      architectural_specs: [
        'Merkezi Ada Havuzu Etrafında Konumlanan Modern Kıyı Rezidansları',
        'Yüksek Doluluk Oranlı Stüdyo Bahçe ve 1+1 Çatı Teraslı Penthouse Planları',
        'Denize Yürüme Mesafesinde Panoramik Kıyı ve Dağ Manzarası',
        'Onaylı İnşaat İzinleri (Permits & Plan) ve Hemen Teslim Avantajı',
        'Düşük Aidat & Yüksek Airbnb / Booking Döviz Kira Çarpanı'
      ],
      lifestyle_facilities: {
        beach_marina: ['Kıyı Şeridine 300m Erişim', 'Maldives & Hawaii Beach Club Kullanım Hakkı'],
        entertainment: ['Ada Havuzu Sosyal Terası'],
        wellness_spa: ['Merkezi Açık Yüzme Havuzu', 'Güneşlenme Adası'],
        gastronomy: ['Poolside Cafe & Bar'],
        family_sports: ['Yürüyüş Parkurları', 'Site İçi Otopark & Güvenlik']
      },
      payment_plan: {
        plan_name: 'Pearl Island Hazır Teslim Planı',
        down_payment_percent: 60,
        during_construction_percent: 0,
        installment_percent: 40,
        installment_months: 18,
        interest_rate: 0,
        reservation_deposit_gbp: 5000,
        notes: '%60 Peşinat ile anında anahtar teslim; kalan %40 için 18 ay %0 faiz taksit.'
      },
      investment_metrics: {
        annual_rental_yield_percent: 10.1,
        capital_appreciation_percent: 40,
        short_term_occupancy_percent: 87,
        management_service: 'Kısa Dönem Tatil Kiralama Yönetimi (Airbnb & Booking Entegre)',
        target_buyer_profile: 'Uygun Giriş Bütçesi (£135,000+) ile Hemen Kira Getirisi Arayan Yatırımcılar'
      },
      media_vault: [
        { id: 'm4_1', name: 'PEARL ISLAND PRICELIST DEC 26TH 2024.pdf', url: 'https://drive.google.com/file/d/1yEiQSDA-kgQsy8sbTacagILDs5j6UgCW/view', type: 'pricelist', size: '1.9 MB', category: 'Fiyat Listesi & Ödeme Planı', drive_synced: true },
        { id: 'm4_2', name: 'Permits and plan — Ruhsatlar ve Onaylı Planlar Klasörü', url: 'https://drive.google.com/drive/folders/1D2jl8F5cN2nFNvwusQZtqJu4sFCsXIfh', type: 'legal', size: 'Klasör', category: 'Ruhsat & Hukuki Belgeler', drive_synced: true },
        { id: 'm4_3', name: 'Floor plans — Pearl Island Kat Planları Klasörü', url: 'https://drive.google.com/drive/folders/12JlYAgpEZmyMlUB5mYho1RdbCTPGiPF0', type: 'masterplan', size: 'Klasör', category: 'Masterplan & Kat Planları', drive_synced: true },
        { id: 'm4_4', name: 'SITE PHOTOS — Şantiye & Tamamlanmış Görseller Klasörü', url: 'https://drive.google.com/drive/folders/1uWs55QphRRt2rQSDn-ml3VhbEGqQrX3C', type: 'photos', size: 'Klasör', category: '4K Görsel & Render Paketi', drive_synced: true },
        { id: 'm4_5', name: 'Videos — Pearl Island Tanıtım Videoları Klasörü', url: 'https://drive.google.com/drive/folders/1rFbBy3AU0rN2GQ7xA26-izj8yeIo9G8y', type: 'video', size: 'Klasör', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true }
      ]
    },
    {
      project_code: 'CC-PRJ-05',
      folder_prefix: '5. MoonLight Villas',
      drive_folder_id: '1Af3S-AMbdLhoLv8GpCs640TXn977Gjsq',
      drive_folder_url: 'https://drive.google.com/drive/folders/1Af3S-AMbdLhoLv8GpCs640TXn977Gjsq',
      name: 'MoonLight Villas',
      region: 'Girne',
      sub_region: 'Bahçeli Kıyı Yamaç',
      concept_tagline: 'Özel Sonsuzluk Havuzlu, Müstakil Bahçeli ve Kesintisiz Akdeniz Manzaralı Ultra Lüks Butik Villa Koleksiyonu',
      status: 'near_completion',
      completion_date: 'Q3 2026',
      construction_progress: 90,
      total_units: 24,
      available_units: 4,
      optioned_units: 2,
      sold_units: 18,
      starting_price: 545000,
      currency: 'GBP',
      default_commission_rate: 8,
      cover_image: 'https://drive.google.com/thumbnail?id=1_PX-qC5IXhosZ4PaymL3lVJxrhREBx_C&sz=w1200',
      architectural_specs: [
        'Müstakil Parseller Üzerinde Özel Infinity Havuzlu 3+1 ve 4+1 Lüks Villalar',
        'Yerden Tavana Panoramik Alüminyum Cam Cepheler ve Çatı Güneşlenme Terasları',
        'Özel Kapalı Garaj, Barbekü Mutfağı, Ateş Çukuru (Fire Pit) ve Tropikal Peyzaj',
        'VRF Merkezi İklimlendirme, Yerden Isıtma ve Akıllı Villa Otomasyonu',
        'Deniz ve Dağ Panoramasını Aynı Anda Gören Özel Yamaç Konumu'
      ],
      lifestyle_facilities: {
        beach_marina: ['Koya 250m Özel Erişim', 'VIP Beach Club Üyeliği'],
        entertainment: ['Özel Çatı Barbekü & Jacuzzi Terası'],
        wellness_spa: ['Müstakil Sonsuzluk Havuzu', 'Villa İçi Özel Sauna Opsiyonu'],
        gastronomy: ['Komşu Mykonos & Maldives Fine-Dining Restoranlarına VIP Erişim'],
        family_sports: ['Geniş Müstakil Bahçe', '7/24 Güvenlikli Butik Villa Sitesi']
      },
      payment_plan: {
        plan_name: 'MoonLight VIP Villa Planı',
        down_payment_percent: 40,
        during_construction_percent: 40,
        installment_percent: 20,
        installment_months: 24,
        interest_rate: 0,
        reservation_deposit_gbp: 10000,
        notes: '%40 Peşinat, %40 anahtar teslimine kadar, kalan %20 için teslim sonrası 24 ay 0 faiz.'
      },
      investment_metrics: {
        annual_rental_yield_percent: 8.8,
        capital_appreciation_percent: 45,
        short_term_occupancy_percent: 80,
        management_service: 'VIP Villa Concierge & Sezonluk Lüks Kiralama Yönetimi',
        target_buyer_profile: 'Müstakil Villa Mahremiyeti ve Yüksek Sermaye Koruma Arayan HNWI Yatırımcılar'
      },
      media_vault: [
        { id: 'm5_1', name: 'PRICE LIST — MoonLight Villas Fiyat Listesi Klasörü', url: 'https://drive.google.com/drive/folders/1cefy1zrKlygmdxkmPv0VnZxAJEzSDhSD', type: 'pricelist', size: 'Klasör', category: 'Fiyat Listesi & Ödeme Planı', drive_synced: true },
        { id: 'm5_2', name: 'FLOOR PLAN AND LAND MAP — Kat Planları & Vaziyet Haritası', url: 'https://drive.google.com/drive/folders/1KgYBZk59AfWL20BQtmLWwXwx0eOeaMxn', type: 'masterplan', size: 'Klasör', category: 'Masterplan & Kat Planları', drive_synced: true },
        { id: 'm5_3', name: '3D — MoonLight Mimari Görseller Klasörü', url: 'https://drive.google.com/drive/folders/1m27fhVV7t1Wn0dQ_dn7nfhd0e4nW1w56', type: 'photos', size: 'Klasör', category: '4K Görsel & Render Paketi', drive_synced: true },
        { id: 'm5_4', name: 'SKY VIEW.jpeg (Hava Fotoğrafı & Parsel Yerleşimi)', url: 'https://drive.google.com/file/d/1udcU3ODRa88tGypuWLCBfqufbAXrU2AD/view', type: 'photos', size: '5.4 MB', category: '4K Görsel & Render Paketi', drive_synced: true }
      ]
    },
    {
      project_code: 'CC-PRJ-06',
      folder_prefix: '6. Bahamas Homes',
      drive_folder_id: '1-6kzix6-3OR7kvnjY_4e8mzQyK-BCGHh',
      drive_folder_url: 'https://drive.google.com/drive/folders/1-6kzix6-3OR7kvnjY_4e8mzQyK-BCGHh',
      name: 'Bahamas Homes',
      region: 'Girne',
      sub_region: 'Bahçeli Denize Sıfır (Phase I, II & III)',
      concept_tagline: '3 Fazlı Denize Sıfır Tropikal Tatil Köyü Konsepti, Özel Plaj, Lagün Havuzları ve Sahil Villaları',
      status: 'near_completion',
      completion_date: 'Q4 2026 (Phase I-II Teslim / Phase III Son Aşama)',
      construction_progress: 88,
      total_units: 230,
      available_units: 31,
      optioned_units: 11,
      sold_units: 188,
      starting_price: 169000,
      currency: 'GBP',
      default_commission_rate: 8,
      cover_image: 'https://drive.google.com/thumbnail?id=1HGEmN6o6rTeb6OkJDTbr5NolV2DxhuvB&sz=w1200',
      architectural_specs: [
        'Phase I, Phase II ve Phase III Olarak Kurgulanmış Denize Sıfır Dev Sahil Yerleşkesi',
        'Denize Sıfır Ön Cephe Beach Villa, Lagün Swim-Up Süit ve Loft Penthouse Seçenekleri',
        'Bahamas_Homes_Catalog.pdf Standartlarında Eksiksiz Resort Altyapısı',
        'Kademeli Arazi Kotu Sayesinde Arka Bloklardan Dahi Kesintisiz Deniz Manzarası',
        'Yatırımcılar İçin Kanıtlanmış Yüksek İkinci El ve Kira Değer Artışı'
      ],
      lifestyle_facilities: {
        beach_marina: ['Özel Kumsal Plaj & Beach Restaurant', 'Su Sporları Merkezi'],
        entertainment: ['Açık Hava Sineması', 'Beach Lounge & Sunset Bar'],
        wellness_spa: ['Isıtmalı Kapalı Havuz', 'Spa, Hamam, Sauna & Masaj Süitleri', 'Deniz Manzaralı Gym'],
        gastronomy: ['Bahamas Seafront A La Carte Restaurant', 'Pool Bar'],
        family_sports: ['Tenis Kortu', 'Çocuk Oyun Parkı & Kaydıraklı Havuz', 'Organik Bahçe Alanları']
      },
      payment_plan: {
        plan_name: 'Bahamas 3 Faz Esnek Plan',
        down_payment_percent: 35,
        during_construction_percent: 45,
        installment_percent: 20,
        installment_months: 24,
        interest_rate: 0,
        reservation_deposit_gbp: 5000,
        notes: '%35 Peşinat, kalan %65 için teslim ve sonrasını kapsayan 24-30 ay %0 faizli ödeme planı.'
      },
      investment_metrics: {
        annual_rental_yield_percent: 9.6,
        capital_appreciation_percent: 46,
        short_term_occupancy_percent: 85,
        management_service: 'Profesyonel Resort Kiralama & Konsiyerj Yönetimi',
        target_buyer_profile: 'Denize Sıfır Konumda Yüksek Likidite ve Değer Artışı Arayan Yatırımcılar'
      },
      media_vault: [
        { id: 'm6_1', name: 'BAHAMAS ALL PHASES.pdf (Tüm Fazlar Güncel Fiyat Listesi)', url: 'https://drive.google.com/file/d/1245UHVbT2b0Zp3Kb9EOLcT439Ndra8iP/view', type: 'pricelist', size: '3.8 MB', category: 'Fiyat Listesi & Ödeme Planı', drive_synced: true },
        { id: 'm6_2', name: 'Bahamas_Homes_Catalog.pdf (Resmi Proje Kataloğu)', url: 'https://drive.google.com/file/d/1GEE-Rb5T0lo9mMDlBc22Q4Dl_URP2bIi/view', type: 'masterplan', size: '24.6 MB', category: 'Masterplan & Kat Planları', drive_synced: true },
        { id: 'm6_3', name: 'BAHAMAS HD ALL PHASES.mp4 (3 Faz Tanıtım Filmi)', url: 'https://drive.google.com/file/d/1-k7joX0Ht35MnzupHYpjaAXeaEvngLJe/view', type: 'video', size: '142.0 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm6_4', name: 'CONSTRUCTION UPDATE — Şantiye İlerleme Klasörü', url: 'https://drive.google.com/drive/folders/18iRBBVWPvfDBupy_2KarlORygGO4J-Nx', type: 'photos', size: 'Klasör', category: '4K Görsel & Render Paketi', drive_synced: true },
        { id: 'm6_5', name: 'Floor plan — Bahamas Kat Planları Klasörü', url: 'https://drive.google.com/drive/folders/1K2Y20HnLgWx1DWJSdUkzzCL-oOmcmt6q', type: 'masterplan', size: 'Klasör', category: 'Masterplan & Kat Planları', drive_synced: true }
      ]
    },
    {
      project_code: 'CC-PRJ-07',
      folder_prefix: '7. Hawaii Homes',
      drive_folder_id: '1J6u7cfhyTPX8e3w9iH7yv5uVPI7gQUds',
      drive_folder_url: 'https://drive.google.com/drive/folders/1J6u7cfhyTPX8e3w9iH7yv5uVPI7gQUds',
      name: 'Hawaii Homes',
      region: 'Girne',
      sub_region: 'Tatlısu Sahil',
      concept_tagline: 'Tropikal Ada Peyzajı, Yapay Nehir Havuzları ve Dev Sosyal Tesislerle Tatil Köyü Konsepti',
      status: 'under_construction',
      completion_date: 'Q2 2027',
      construction_progress: 68,
      total_units: 280,
      available_units: 64,
      optioned_units: 18,
      sold_units: 198,
      starting_price: 155000,
      currency: 'GBP',
      default_commission_rate: 8,
      cover_image: 'https://drive.google.com/thumbnail?id=1BxrG_CeV8tZmR_ar_fVz2KOFsL76YS_5&sz=w1200',
      architectural_specs: [
        'Binaların Etrafını Saran Kesintisiz Tropikal Nehir & Lagün Havuz Mimarisi',
        'Stüdyo, 1+1 Bahçe, 1+1/2+1 Loft Penthouse ve Lüks Villa Seçenekleri',
        'Geniş Cam Cepheler, Ferah Balkonlar ve Özel Çatı Terası Jakuzi Opsiyonları',
        'Tropikal İklime Uygun Doğal Ahşap Görünümlü Kompozit Güneş Kırıcılar',
        'Yatırımcı Dostu Kompakt & Yüksek Kira Çarpanlı Kat Planları'
      ],
      lifestyle_facilities: {
        beach_marina: ['Düzenlenmiş Plaj Alanı & Güneşlenme Terasları', 'Hawai Konseptli Palmiye Adaları'],
        entertainment: ['Hawaii Opening Party & Beach Etkinlik Meydanı', 'Oyun Salonu & Sosyal Kulüp'],
        wellness_spa: ['Isıtmalı Kapalı Havuz', 'Tam Donanımlı Spa, Hamam & Masaj Merkezi', 'Crossfit & Fitness Salonu'],
        gastronomy: ['Aloha Tiki Bar & Poolside Cafe', 'Uluslararası A La Carte Restoran'],
        family_sports: ['Tenis Kortu', 'Çocuk Su Parkı & Oyun Alanları', 'Bisiklet & Koşu Parkurları']
      },
      payment_plan: {
        plan_name: 'Hawaii Yatırımcı Lansman Planı',
        down_payment_percent: 35,
        during_construction_percent: 65,
        installment_percent: 0,
        installment_months: 36,
        interest_rate: 0,
        reservation_deposit_gbp: 5000,
        notes: '%35 Peşinat, kalan %65 anahtar teslimine kadar 36 aya varan faizsiz (aylık veya 3 aylık) esnek ödeme planı.'
      },
      investment_metrics: {
        annual_rental_yield_percent: 10.4,
        capital_appreciation_percent: 48,
        short_term_occupancy_percent: 84,
        management_service: 'Tatil Köyü Konseptli Kiralama Havuzu (Yüksek Doluluk Oranı)',
        target_buyer_profile: 'Hem Değer Artışı Hem Yüksek Sezonluk Kira Geliri Hedefleyen Yatırımcılar'
      },
      media_vault: [
        { id: 'm7_1', name: 'HAWAII PRICELIST NOV 10TH 2026.pdf', url: 'https://drive.google.com/file/d/1vwIdbSK6JlQiHx5H-Y_Zs87_HNkIOivY/view', type: 'pricelist', size: '2.8 MB', category: 'Fiyat Listesi & Ödeme Planı', drive_synced: true },
        { id: 'm7_2', name: 'HAWAII MAP NOV 10TH 2026.pdf (Müsaitlik & Vaziyet Haritası)', url: 'https://drive.google.com/file/d/1j0ICRrbN2KJYUarutGE5IYSz9j4jN_dH/view', type: 'masterplan', size: '6.4 MB', category: 'Masterplan & Kat Planları', drive_synced: true },
        { id: 'm7_3', name: 'Hawaii Homes Specifications.pdf (Teknik Şartname)', url: 'https://drive.google.com/file/d/1xTa6MQ9RgoU2d8Mt9lzkYMAeKi3GRQui/view', type: 'legal', size: '4.9 MB', category: 'Ruhsat & Hukuki Belgeler', drive_synced: true },
        { id: 'm7_4', name: 'Cumhurbaşkanı Ersin Tatar - HAWAII OPENING PARTY.mp4', url: 'https://drive.google.com/file/d/1S-voP7vN7ciN52agBq4iuWHSoP0yfRCW/view', type: 'video', size: '299.8 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm7_5', name: 'Hawaii video.mp4 (Proje Tanıtım Filmi)', url: 'https://drive.google.com/file/d/19Mmt-VRFssX1stiB6v2VrhAIbCaCxOtn/view', type: 'video', size: '78.2 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm7_6', name: 'FLOOR PLANS — Hawaii Kat Planları Klasörü', url: 'https://drive.google.com/drive/folders/1CK4pES1nlUBL6KkfY92fvC6UwZ03E292', type: 'masterplan', size: 'Klasör', category: 'Masterplan & Kat Planları', drive_synced: true }
      ]
    },
    {
      project_code: 'CC-PRJ-08',
      folder_prefix: '8. Aloha Beach Resort',
      drive_folder_id: '1LVIV6TVd1Xwe1N3uUz7TMO8PkI9OiIO7',
      drive_folder_url: 'https://drive.google.com/drive/folders/1LVIV6TVd1Xwe1N3uUz7TMO8PkI9OiIO7',
      name: 'Aloha Beach Resort',
      region: 'Girne',
      sub_region: 'Tatlısu Sahil Şeridi',
      concept_tagline: '5 Yıldızlı Resort Konseptinde Uzun Vadeli (48 Ay %0 Faiz) Ödeme Avantajlı Sahil Rezidansları',
      status: 'off_plan',
      completion_date: 'Q4 2027',
      construction_progress: 40,
      total_units: 320,
      available_units: 112,
      optioned_units: 24,
      sold_units: 184,
      starting_price: 139000,
      currency: 'GBP',
      default_commission_rate: 8,
      cover_image: 'https://drive.google.com/thumbnail?id=1_R2RenE5ef343qcF6BcixWt5tb2UEjUM&sz=w1200',
      architectural_specs: [
        'Modern Resort Mimarisi ve Geniş Ortak Sosyal Avlular',
        'Düşük Giriş Maliyetli Yatırımcı Tipi Stüdyo, 1+1 ve 2+1 Loft Daireler',
        'Tüm Bloklardan Havuz, Tropikal Bahçe veya Akdeniz Manzarası',
        'Yüksek Enerji Verimliliği, Akıllı Kartlı Giriş ve 7/24 Güvenlik Altyapısı',
        'Anahtar Teslim İç Mimar Mobilya ve Beyaz Eşya Tasarım Paketi (INTERIOR DESIGN 3Ds)'
      ],
      lifestyle_facilities: {
        beach_marina: ['Doğrudan Plaj Erişimi & Beach Shuttle', 'Güneşlenme İskelesi & Cabanalar'],
        entertainment: ['Açık Hava Etkinlik Meydanı', 'Sosyal Lounge & Sinema Odası'],
        wellness_spa: ['Devasa Resort Açık Havuzları', 'Kapalı Havuz, Spa & Wellness Merkezi', 'Fitness & Pilates Stüdyosu'],
        gastronomy: ['Resort Ana Restoran', 'Havuz Başı Snack & Kokteyl Bar', 'Kahve Evi & Bakery'],
        family_sports: ['Çok Amaçlı Spor Sahaları', 'Çocuk Kulübü & Aqua Oyun Alanı']
      },
      payment_plan: {
        plan_name: 'Aloha Erken Lansman 48 Ay Planı',
        down_payment_percent: 35,
        during_construction_percent: 45,
        installment_percent: 20,
        installment_months: 48,
        interest_rate: 0,
        reservation_deposit_gbp: 5000,
        notes: '%35 Peşinat, kalan %65 için inşaat süresince ve teslim sonrasına yayılan toplam 48 ay %0 faizli uzun vade.'
      },
      investment_metrics: {
        annual_rental_yield_percent: 11.2,
        capital_appreciation_percent: 55,
        short_term_occupancy_percent: 86,
        management_service: 'Otel Tipi Profesyonel Kiralama Havuzu (Hands-Free Yatırım)',
        target_buyer_profile: 'Erken Aşama Lansman Fiyatıyla Maksimum Sermaye Artışı (%50+) Hedefleyen Yatırımcılar'
      },
      media_vault: [
        { id: 'm8_1', name: 'BOOKLET_ALOHA.pdf (Resmi Aloha Beach Resort Katalog & Broşür)', url: 'https://drive.google.com/file/d/1lugfCaQ7mi0el_OfMJcuCaIlji1sUi07/view', type: 'masterplan', size: '28.6 MB', category: 'Masterplan & Kat Planları', drive_synced: true },
        { id: 'm8_2', name: 'FACILITIES AND FEATURES.png (Tesis & Özellikler Görseli)', url: 'https://drive.google.com/file/d/1_R2RenE5ef343qcF6BcixWt5tb2UEjUM/view', type: 'photos', size: '8.4 MB', category: '4K Görsel & Render Paketi', drive_synced: true },
        { id: 'm8_3', name: 'ALOHA FINAL VIDEO.mp4 (Ana Lansman Filmi)', url: 'https://drive.google.com/file/d/1lua1tZfKVYyoi1inGL1LiYeznt_wK0l2/view', type: 'video', size: '115.0 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm8_4', name: 'PRICE LISTS — Aloha Fiyat Listeleri Klasörü', url: 'https://drive.google.com/drive/folders/1DqPrE-VGAIodQFL2qay4ivN7lO8vqWwz', type: 'pricelist', size: 'Klasör', category: 'Fiyat Listesi & Ödeme Planı', drive_synced: true },
        { id: 'm8_5', name: 'INTERIOR DESIGN 3Ds — İç Mekan 3D Tasarım Klasörü', url: 'https://drive.google.com/drive/folders/14xy_r00r02VOBMTg6F0FpPIzvSZAHx9u', type: 'photos', size: 'Klasör', category: '4K Görsel & Render Paketi', drive_synced: true }
      ]
    },
    {
      project_code: 'CC-PRJ-09',
      folder_prefix: '9. Phuket Health and Wellness resort',
      drive_folder_id: '1Qi9qwnB5iQndzZJ428e4j7Jpi_y9DRlf',
      drive_folder_url: 'https://drive.google.com/drive/folders/1Qi9qwnB5iQndzZJ428e4j7Jpi_y9DRlf',
      name: 'Phuket Health & Wellness Resort',
      region: 'Girne',
      sub_region: 'Tatlısu / Esentepe Doğu Aksı',
      concept_tagline: 'Sağlık, Anti-Aging, Medikal Spa ve Bütünsel Wellness Odaklı 3 Fazlı Dört Mevsim Yaşam & Yatırım Merkezi',
      status: 'off_plan',
      completion_date: 'Q2 2028',
      construction_progress: 32,
      total_units: 240,
      available_units: 95,
      optioned_units: 19,
      sold_units: 126,
      starting_price: 149000,
      currency: 'GBP',
      default_commission_rate: 8,
      cover_image: 'https://drive.google.com/thumbnail?id=1Nm2uhv9CxBvY9tiqJxl6jCmOtfmjE8Cg&sz=w1200',
      architectural_specs: [
        'Uzak Doğu (Phuket) Zen Mimarisinden İlham Alan Doğal Taş ve Ahşap Dokulu Cepheler',
        'Biyofilik Tasarım, Meditasyon Bahçeleri ve Sessiz Dinlenme Zonları (Phase 1, 2 & 3)',
        'Engelsiz Erişim ve Sağlık Turizmine Uygun Ergonomik İç Mekan Standartları',
        'Özel Havuzlu Wellness Villaları, Bahçe Süitleri ve Loft Daire Seçenekleri',
        'Dört Mevsim İklimlendirme ve Hava Kalitesi Filtrasyon Altyapısı'
      ],
      lifestyle_facilities: {
        beach_marina: ['Sahil Yürüyüş Yolu & Plaj Erişimi', 'Dinginlik İskelesi'],
        entertainment: ['Zen Bahçeleri & Kütüphane Lounge', 'Seminer & Workshop Salonu'],
        wellness_spa: ['Medikal Wellness & Anti-Aging Kliniği', 'Detoks, Kriyoterapi & Hidroterapi Havuzları', 'Yoga, Meditasyon & Tai-Chi Pavilyonları'],
        gastronomy: ['Organik Farm-to-Table Wellness Restoranı', 'Detoks & Bitki Çayı Barı'],
        family_sports: ['Kapalı & Açık Terapi Havuzları', 'Doğa Yürüyüş & Bisiklet Parkurları']
      },
      payment_plan: {
        plan_name: 'Phuket Wellness Lansman Planı',
        down_payment_percent: 35,
        during_construction_percent: 65,
        installment_percent: 0,
        installment_months: 40,
        interest_rate: 0,
        reservation_deposit_gbp: 5000,
        notes: '%35 Peşinat, kalan %65 için teslim tarihine kadar 40 ay 0 faiz esnek ödeme planı.'
      },
      investment_metrics: {
        annual_rental_yield_percent: 10.8,
        capital_appreciation_percent: 52,
        short_term_occupancy_percent: 91,
        management_service: '365 Gün Sağlık & Wellness Turizmi Kiralama Yönetimi (Kış Sezonunda da Yüksek Doluluk)',
        target_buyer_profile: '12 Ay Kesintisiz Sağlık Turizmi Doluluğu ve Uzun Dönem Değer Artışı Arayan Yatırımcılar'
      },
      media_vault: [
        { id: 'm9_1', name: 'Phuket Catalog .pdf (Resmi Phuket Health & Wellness Kataloğu)', url: 'https://drive.google.com/file/d/1GBg9M_ADhTVQ9FcL-QENonJfdHEyTrsS/view', type: 'masterplan', size: '25.1 MB', category: 'Masterplan & Kat Planları', drive_synced: true },
        { id: 'm9_2', name: 'SKY VIEW.png (Phuket Masterplan Vaziyet Görseli)', url: 'https://drive.google.com/file/d/1Nm2uhv9CxBvY9tiqJxl6jCmOtfmjE8Cg/view', type: 'photos', size: '12.4 MB', category: '4K Görsel & Render Paketi', drive_synced: true },
        { id: 'm9_3', name: 'Phase 1 Video.mp4', url: 'https://drive.google.com/file/d/1H4wbXQmXLS95riVrnBEZMOEQg0mtB6Mw/view', type: 'video', size: '64.0 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm9_4', name: 'Phase 2 Video.mp4', url: 'https://drive.google.com/file/d/1EP97si11IvRoEjDQrft42f3cUWniGNzl/view', type: 'video', size: '58.0 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm9_5', name: 'Phase 3 Video.mp4', url: 'https://drive.google.com/file/d/122XdH12ke3r9FQtIVVhW_7EWKRDAdn8y/view', type: 'video', size: '71.0 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm9_6', name: 'PRICE LISTS — Phuket Fiyat Listeleri Klasörü', url: 'https://drive.google.com/drive/folders/1lclmb4kAndbOEavWQkQOu6j12JTDwWfF', type: 'pricelist', size: 'Klasör', category: 'Fiyat Listesi & Ödeme Planı', drive_synced: true }
      ]
    },
    {
      project_code: 'CC-PRJ-10',
      folder_prefix: '10. Edremit Villas',
      drive_folder_id: '1j2RA-a5rLf2AlwKoFVXtLimnsxsP1NKs',
      drive_folder_url: 'https://drive.google.com/drive/folders/1j2RA-a5rLf2AlwKoFVXtLimnsxsP1NKs',
      name: 'Edremit Villas',
      region: 'Girne',
      sub_region: 'Edremit / Karmi Dağ & Deniz Manzaralı Yamaç',
      concept_tagline: 'Girne Merkez Batı Aksında, Çam Ormanları ve Akdeniz Panoramasına Hakim Özel Havuzlu Ultra Lüks Müstakil Villalar',
      status: 'under_construction',
      completion_date: 'Q4 2027',
      construction_progress: 60,
      total_units: 18,
      available_units: 6,
      optioned_units: 2,
      sold_units: 10,
      starting_price: 695000,
      currency: 'GBP',
      default_commission_rate: 8,
      cover_image: 'https://drive.google.com/thumbnail?id=1XZhdJ2QsY6QMdlprZ3umQerIS1zYhg6n&sz=w1200',
      architectural_specs: [
        'Girne Edremit Bölgesinde Geniş Arsa Paylı 4+1 ve 5+1 Özel Havuzlu Signature Villalar',
        'Girne Amerikan Üniversitesi, Kolejler ve Girne Yat Limanına 5-8 Dakika Mesafe',
        'Panoramik Cam Cepheler, Galeri Boşluklu Yüksek Tavan ve Şömineli Salon Tasarımı',
        'Müstakil Infinity Yüzme Havuzu, Özel Peyzajlı Bahçe ve 2 Araçlık Otopark',
        'Yüksek Aile Yaşam Standartları ve Değerini Katlayan Merkez Girne Lokasyonu'
      ],
      lifestyle_facilities: {
        beach_marina: ['Escape Beach & Kervansaray Plajına 5 Dakika', 'Girne Antik Limana Hızlı Erişim'],
        entertainment: ['Özel Havuz Başı Barbekü & Teras Lounge'],
        wellness_spa: ['Müstakil Sonsuzluk Havuzu', 'Özel Sauna & Hamam Altyapısı'],
        gastronomy: ['Edremit & Karmi Gurme Restoranlarına Komşu Konum'],
        family_sports: ['Uluslararası Okullara & Üniversiteye Yakınlık', 'Doğa Yürüyüş Rotaları']
      },
      payment_plan: {
        plan_name: 'Edremit Prestij Villa Planı',
        down_payment_percent: 35,
        during_construction_percent: 45,
        installment_percent: 20,
        installment_months: 24,
        interest_rate: 0,
        reservation_deposit_gbp: 10000,
        notes: '%35 Peşinat, %45 inşaat sürecinde esnek ara ödemeler, %20 anahtar tesliminde veya 24 ay şirket içi vade.'
      },
      investment_metrics: {
        annual_rental_yield_percent: 8.5,
        capital_appreciation_percent: 48,
        short_term_occupancy_percent: 82,
        management_service: 'VIP Villa Yönetimi & Uzun/Kısa Dönem Diplomatik Kiralama Potansiyeli',
        target_buyer_profile: 'Girne Merkezde Elit Aile Yaşamı ve Prestijli Arsa/Villa Yatırımı Arayan Alıcılar'
      },
      media_vault: [
        { id: 'm10_1', name: 'EDREMIT PRICELIST.pdf (Resmi Villa Fiyat Listesi)', url: 'https://drive.google.com/file/d/1VqSZPXWIf7q5ntn-6KEOVv86U0VlYqEq/view', type: 'pricelist', size: '2.1 MB', category: 'Fiyat Listesi & Ödeme Planı', drive_synced: true },
        { id: 'm10_2', name: 'VIDEO EDREMIT VILLAS.mp4 (Mimari & Lokasyon Tanıtımı)', url: 'https://drive.google.com/file/d/15IiY_Q9ZPQaa6Yq4x6Z6Xq-dl3WhtJFY/view', type: 'video', size: '88.4 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm10_3', name: 'EDREMIT LAND VIDEO.MP4 (Arsa & Deniz Manzarası Drone Çekimi)', url: 'https://drive.google.com/file/d/12z6e9MOLR3wP01ze6fizzWY5tFDaPkce/view', type: 'video', size: '62.0 MB', category: 'Sosyal Medya & Tanıtım Videoları', drive_synced: true },
        { id: 'm10_4', name: 'Floor Plan — Edremit Villas Kat Planları Klasörü', url: 'https://drive.google.com/drive/folders/1Q72rSqPg8QlafmgP_c-ekcekWFpsrk4K', type: 'masterplan', size: 'Klasör', category: 'Masterplan & Kat Planları', drive_synced: true },
        { id: 'm10_5', name: '3d Visuals — Edremit 3D Render Klasörü', url: 'https://drive.google.com/drive/folders/1G9J77BbHkSJzcwv5eCss6XzJfx698QUz', type: 'photos', size: 'Klasör', category: '4K Görsel & Render Paketi', drive_synced: true }
      ]
    }
  ];

  const existingProjsRes = await pool.query('SELECT id, project_code FROM developer_projects WHERE store_id = $1', [storeId]);
  const insertedProjectIds: Record<string, number> = {};
  for (const row of existingProjsRes.rows) {
    insertedProjectIds[row.project_code] = row.id;
  }

  for (const p of projectsSeed) {
    if (insertedProjectIds[p.project_code]) {
      // Upgrade existing project with real Google Drive folder ID, thumbnail cover, and exact Drive media vault links
      await pool.query(
        `UPDATE developer_projects
         SET folder_prefix = $1,
             drive_folder_id = $2,
             drive_folder_url = $3,
             cover_image = $4,
             media_vault = $5::jsonb
         WHERE id = $6`,
        [
          p.folder_prefix,
          p.drive_folder_id,
          p.drive_folder_url,
          p.cover_image,
          JSON.stringify(p.media_vault),
          insertedProjectIds[p.project_code]
        ]
      );
    } else {
      const res = await pool.query(
        `INSERT INTO developer_projects (
          store_id, project_code, folder_prefix, drive_folder_id, drive_folder_url, name, region, sub_region, concept_tagline,
          status, completion_date, construction_progress, total_units, available_units,
          optioned_units, sold_units, starting_price, currency, default_commission_rate,
          cover_image, architectural_specs, lifestyle_facilities, payment_plan, investment_metrics, media_vault
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) RETURNING id`,
        [
          storeId, p.project_code, p.folder_prefix, p.drive_folder_id, p.drive_folder_url, p.name, p.region, p.sub_region, p.concept_tagline,
          p.status, p.completion_date, p.construction_progress, p.total_units, p.available_units,
          p.optioned_units, p.sold_units, p.starting_price, p.currency, p.default_commission_rate,
          p.cover_image, JSON.stringify(p.architectural_specs), JSON.stringify(p.lifestyle_facilities),
          JSON.stringify(p.payment_plan), JSON.stringify(p.investment_metrics), JSON.stringify(p.media_vault)
        ]
      );
      insertedProjectIds[p.project_code] = res.rows[0].id;
    }
  }

  // Seed Live Unit Inventory across all 10 projects (only insert units that don't exist yet)
  const existingUnitsRes = await pool.query('SELECT unit_number, block_name FROM developer_project_units WHERE store_id = $1', [storeId]);
  const existingUnitKeys = new Set(existingUnitsRes.rows.map((u: any) => `${u.block_name}::${u.unit_number}`));

  const unitsSeed = [
    { code: 'CC-PRJ-01', block: 'A Blok (Lagün)', floor: 'Zemin (Bahçe)', unit_no: 'A-04', type: '1+1 Garden Suite', gross: 78, net: 62, terrace: 16, view: 'Lagün Havuz & Deniz', price: 189000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-01', block: 'B Blok (Sahil)', floor: '1. Kat (Penthouse)', unit_no: 'B-12', type: '2+1 Penthouse + Roof', gross: 145, net: 95, terrace: 50, view: 'Panoramik Akdeniz', price: 295000, status: 'optioned', agency: 'Kuzey Prestige Realty (Girne)', client: 'M. Lindqvist (İsveç)' },
    { code: 'CC-PRJ-01', block: 'VIP Villa Etabı', floor: 'Müstakil', unit_no: 'V-03', type: '3+1 Özel Havuzlu Villa', gross: 240, net: 175, terrace: 65, view: 'Denize Sıfır Ön Cephe', price: 625000, status: 'sold', agency: 'Thames Global Property (Londra)', client: 'R. Sterling (UK)' },
    { code: 'CC-PRJ-02', block: 'IDYLL A Blok', floor: 'Zemin (Bahçe)', unit_no: 'ID-A02', type: '1+1 Garden Duplex', gross: 84, net: 66, terrace: 18, view: 'Havuz & Cali Pub Meydanı', price: 165000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-02', block: 'IDYLL B Blok', floor: '1. Kat (Penthouse)', unit_no: 'ID-B08', type: '2+1 Penthouse + Roof', gross: 138, net: 92, terrace: 46, view: 'Panoramik Deniz & Dağ', price: 229000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-03', block: 'Mykonos C Blok', floor: 'Zemin (Swim-Up)', unit_no: 'C-02', type: '1+1 Swim-Up Suite', gross: 82, net: 65, terrace: 17, view: 'Sonsuzluk Havuzu & Deniz', price: 215000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-03', block: 'Mykonos A Blok', floor: '1. Kat (Loft)', unit_no: 'A-08', type: '2+1 Loft Penthouse', gross: 158, net: 102, terrace: 56, view: 'Full Deniz & Gün Batımı', price: 340000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-03', block: 'Santorini Villa', floor: 'Müstakil', unit_no: 'SV-02', type: '3+1 Signature Villa', gross: 260, net: 185, terrace: 75, view: 'Kesintisiz Kıyı & Koy', price: 680000, status: 'optioned', agency: 'Rheinland Invest GmbH (Berlin)', client: 'Dr. H. Weber (Almanya)' },
    { code: 'CC-PRJ-04', block: 'Pearl A Blok', floor: 'Zemin (Ada Havuz)', unit_no: 'PI-A06', type: 'Studio Island Suite', gross: 52, net: 41, terrace: 11, view: 'Merkezi Ada Havuzu', price: 135000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-04', block: 'Pearl C Blok', floor: '1. Kat (Penthouse)', unit_no: 'PI-C11', type: '1+1 Roof Penthouse', gross: 96, net: 64, terrace: 32, view: 'Panoramik Akdeniz', price: 175000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-05', block: 'MoonLight VIP', floor: 'Müstakil', unit_no: 'ML-V04', type: '3+1 Infinity Pool Villa', gross: 255, net: 185, terrace: 70, view: 'Kesintisiz Deniz & Koy', price: 545000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-05', block: 'MoonLight VIP', floor: 'Müstakil', unit_no: 'ML-V07', type: '4+1 Signature Cliff Villa', gross: 310, net: 225, terrace: 85, view: '360° Deniz & Dağ Panoraması', price: 690000, status: 'optioned', agency: 'Eurasia Prime Overseas (Moskova)', client: 'A. Sokolov (CIS)' },
    { code: 'CC-PRJ-06', block: 'Bahamas Phase II', floor: 'Zemin (Swim-Up)', unit_no: 'BH-B09', type: '1+1 Lagoon Garden', gross: 80, net: 63, terrace: 17, view: 'Lagün Havuz & Plaj', price: 169000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-06', block: 'Bahamas Phase III', floor: '1. Kat (Loft)', unit_no: 'BH-C14', type: '2+1 Seafront Loft', gross: 148, net: 98, terrace: 50, view: 'Denize Sıfır Kumsal', price: 285000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-06', block: 'Bahamas Beach Villa', floor: 'Müstakil', unit_no: 'BH-V02', type: '3+1 Beachfront Villa', gross: 245, net: 180, terrace: 65, view: 'Özel Kumsal Ön Cephe', price: 595000, status: 'sold', agency: 'Gulf Horizon Wealth (Dubai)', client: 'Al-Mansoor Fund (BAE)' },
    { code: 'CC-PRJ-07', block: 'Ohana D Blok', floor: 'Zemin', unit_no: 'D-09', type: 'Studio Resort Suite', gross: 54, net: 42, terrace: 12, view: 'Tropikal Nehir Havuzu', price: 155000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-07', block: 'Maui B Blok', floor: '1. Kat (Loft)', unit_no: 'B-15', type: '1+1 Loft Penthouse', gross: 108, net: 72, terrace: 36, view: 'Deniz & Palmiye Adası', price: 210000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-08', block: 'Aloha E Blok', floor: 'Zemin', unit_no: 'E-11', type: 'Studio Garden', gross: 52, net: 40, terrace: 12, view: 'Ana Resort Havuzu', price: 139000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-08', block: 'Aloha C Blok', floor: '1. Kat', unit_no: 'C-21', type: '1+1 Deluxe Suite', gross: 84, net: 64, terrace: 20, view: 'Akdeniz & Beach Club', price: 179000, status: 'optioned', agency: 'Bosphorus Luxury Estates (İstanbul)', client: 'K. Demirsoy (TR)' },
    { code: 'CC-PRJ-09', block: 'Zen A Blok', floor: 'Zemin (Bahçe)', unit_no: 'Z-05', type: '1+1 Wellness Garden', gross: 80, net: 64, terrace: 16, view: 'Botanik Zen Bahçesi & Deniz', price: 169000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-09', block: 'Lotus B Blok', floor: '1. Kat', unit_no: 'L-14', type: '2+1 Wellness Loft', gross: 135, net: 92, terrace: 43, view: 'Panoramik Deniz & Dağ', price: 248000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-10', block: 'Edremit Etabı', floor: 'Müstakil', unit_no: 'ED-V03', type: '4+1 Panoramik Havuzlu Villa', gross: 320, net: 245, terrace: 75, view: 'Girne Koyu & Karmi Dağları', price: 695000, status: 'available', agency: null, client: null },
    { code: 'CC-PRJ-10', block: 'Edremit VIP', floor: 'Müstakil', unit_no: 'ED-V08', type: '5+1 Signature Malikane Villa', gross: 410, net: 315, terrace: 95, view: 'Kesintisiz Girne & Akdeniz', price: 890000, status: 'available', agency: null, client: null }
  ];

  for (const u of unitsSeed) {
    const pid = insertedProjectIds[u.code];
    if (!pid) continue;
    const uKey = `${u.block}::${u.unit_no}`;
    if (existingUnitKeys.has(uKey)) continue;
    await pool.query(
      `INSERT INTO developer_project_units (
        store_id, project_id, block_name, floor_level, unit_number, unit_type,
        gross_sqm, net_sqm, terrace_sqm, view_direction, price, currency, status,
        optioned_by_agency_name, optioned_client_name, option_expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'GBP',$12,$13,$14, CURRENT_TIMESTAMP + INTERVAL '72 hours')`,
      [storeId, pid, u.block, u.floor, u.unit_no, u.type, u.gross, u.net, u.terrace, u.view, u.price, u.status, u.agency, u.client]
    );
  }

  // Ensure Internal Company Team (Yönetim, Teknik & Mimari, Satış, PR & Pazarlama) is seeded with granular permissions
  const internalStaffSeed = [
    {
      name: 'Salih Kayım',
      role: 'Yönetim Kurulu Başkanı & Proje Direktörü',
      dept: 'Yönetim',
      email: 'salih.kayim@cyprusconstructions.com',
      phone: '+90 548 860 00 01',
      regions: 'Tüm Projeler, Fiyat & Ekip Yetkileri',
      permissions: { can_manage_projects: true, can_upload_media: true, can_manage_prices: true, can_manage_users: true }
    },
    {
      name: 'Mimar Sinan Soylu',
      role: 'Baş Mimar & Teknik Proje Koordinatörü',
      dept: 'Teknik & Mimari',
      email: 'mimari@cyprusconstructions.com',
      phone: '+90 548 860 00 02',
      regions: 'Masterplan, Kat Planları, Vaziyet Planı & Teknik Şartname',
      permissions: { can_manage_projects: true, can_upload_media: true, can_manage_prices: false, can_manage_users: false }
    },
    {
      name: 'İnş. Müh. Kerem Arslan',
      role: 'Şantiye & İlerleme Raporlama Şefi',
      dept: 'Teknik & Mimari',
      email: 'santiye@cyprusconstructions.com',
      phone: '+90 548 860 00 03',
      regions: 'Şantiye İlerleme Oranları & Teknik Çizimler',
      permissions: { can_manage_projects: true, can_upload_media: true, can_manage_prices: false, can_manage_users: false }
    },
    {
      name: 'Cenk Soydan',
      role: 'Satış & Envanter Direktörü',
      dept: 'Satış',
      email: 'satis@cyprusconstructions.com',
      phone: '+90 548 860 00 04',
      regions: 'Tüm Projeler Fiyat Listesi, Ödeme Planları & Stok Matrisi',
      permissions: { can_manage_projects: false, can_upload_media: true, can_manage_prices: true, can_manage_users: false }
    },
    {
      name: 'Selin Aksoy',
      role: 'Ünite Stok, Opsiyon & Fiyatlandırma Uzmanı',
      dept: 'Satış',
      email: 'stok@cyprusconstructions.com',
      phone: '+90 548 860 00 05',
      regions: 'Müsait / Opsiyonlu / Satılan Ünite Takibi',
      permissions: { can_manage_projects: false, can_upload_media: false, can_manage_prices: true, can_manage_users: false }
    },
    {
      name: 'Burak Tekin',
      role: 'PR, Kurumsal İletişim & Medya Yöneticisi',
      dept: 'PR & Pazarlama',
      email: 'pr@cyprusconstructions.com',
      phone: '+90 548 860 00 06',
      regions: '3D Render, 4K Drone Videoları, Katalog & Lansman Medyaları',
      permissions: { can_manage_projects: false, can_upload_media: true, can_manage_prices: false, can_manage_users: false }
    },
    {
      name: 'Zeynep Aydın',
      role: 'Dijital Katalog & Görsel Arşiv Uzmanı',
      dept: 'PR & Pazarlama',
      email: 'medya@cyprusconstructions.com',
      phone: '+90 548 860 00 07',
      regions: 'Proje E-Broşürleri, Sosyal Medya Kiti & Etkinlik Arşivi',
      permissions: { can_manage_projects: false, can_upload_media: true, can_manage_prices: false, can_manage_users: false }
    },
    {
      name: 'Av. Derin Özkan',
      role: 'Hukuk Müşaviri & Sözleşme Yöneticisi',
      dept: 'Yönetim',
      email: 'hukuk@cyprusconstructions.com',
      phone: '+90 548 860 00 08',
      regions: 'Satış Sözleşmesi Şablonları, Tapu & Koçan Dokümanları',
      permissions: { can_manage_projects: false, can_upload_media: true, can_manage_prices: false, can_manage_users: true }
    }
  ];

  const existingStaffRes = await pool.query('SELECT id, department FROM developer_internal_staff WHERE store_id = $1', [storeId]);
  const hasLegacyB2BStaff = existingStaffRes.rows.some((r: any) => /acente|drive sync|super admin/i.test(String(r.department || '')));
  if (existingStaffRes.rows.length === 0 || hasLegacyB2BStaff) {
    if (hasLegacyB2BStaff) {
      await pool.query('DELETE FROM developer_internal_staff WHERE store_id = $1', [storeId]);
    }
    for (const s of internalStaffSeed) {
      await pool.query(
        `INSERT INTO developer_internal_staff (store_id, full_name, title_role, department, email, phone, assigned_regions, permissions)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [storeId, s.name, s.role, s.dept, s.email, s.phone, s.regions, JSON.stringify(s.permissions)]
      );
    }
  }

  if (existingProjsRes.rows.length > 0) {
    return;
  }

  // Seed External B2B Partner Agencies
  const agenciesSeed = [
    { code: 'AG-KKTC-101', pin: '2026', name: 'Kuzey Prestige Realty & Investment', broker: 'Kemal Arhun', email: 'info@kuzeyprestige.com', phone: '+90 548 881 20 30', country: 'KKTC', city: 'Girne & Esentepe', tier: 'VIP', comm: 10, bonus: 2, status: 'signed', downloads: 148, leads: 19, sales: 11, vol: 2480000 },
    { code: 'AG-KKTC-104', pin: '2026', name: 'İskele Golden Coast Estates', broker: 'Tuğba Soylu', email: 'tugba@goldencoastkktc.com', phone: '+90 533 870 44 10', country: 'KKTC', city: 'İskele & Gazimağusa', tier: 'Gold', comm: 8, bonus: 2, status: 'signed', downloads: 92, leads: 12, sales: 6, vol: 1190000 },
    { code: 'AG-UK-201', pin: '2026', name: 'Thames Global Property Advisors Ltd.', broker: 'Oliver Thornton', email: 'o.thornton@thamesproperty.co.uk', phone: '+44 20 7946 0821', country: 'İngiltere (UK)', city: 'Londra & Manchester', tier: 'VIP', comm: 10, bonus: 2, status: 'signed', downloads: 215, leads: 27, sales: 14, vol: 3650000 },
    { code: 'AG-DE-305', pin: '2026', name: 'Rheinland Mediterranean Invest GmbH', broker: 'Markus Becker', email: 'becker@rheinland-invest.de', phone: '+49 172 449 1020', country: 'Almanya (DACH)', city: 'Berlin & Münih', tier: 'Gold', comm: 8, bonus: 2, status: 'signed', downloads: 114, leads: 15, sales: 7, vol: 1680000 },
    { code: 'AG-TR-402', pin: '2026', name: 'Bosphorus Luxury Estates & Brokerage', broker: 'Serkan Yalçınkaya', email: 'serkan@bosphorusestates.com.tr', phone: '+90 532 410 88 90', country: 'Türkiye', city: 'İstanbul & İzmir', tier: 'Gold', comm: 8, bonus: 1.5, status: 'signed', downloads: 136, leads: 18, sales: 8, vol: 1750000 },
    { code: 'AG-RU-509', pin: '2026', name: 'Eurasia Prime Overseas Realty', broker: 'Dmitry Volkov', email: 'd.volkov@eurasiaprime.ru', phone: '+7 916 550 19 88', country: 'Rusya & CIS', city: 'Moskova & Almatı', tier: 'VIP', comm: 10, bonus: 2, status: 'signed', downloads: 189, leads: 24, sales: 12, vol: 2890000 },
    { code: 'AG-SE-601', pin: '2026', name: 'Nordic Sun & Sea Homes AB', broker: 'Astrid Lindholm', email: 'astrid@nordicsunhomes.se', phone: '+46 70 882 41 10', country: 'İskandinavya', city: 'Stockholm & Oslo', tier: 'Silver', comm: 7, bonus: 1, status: 'signed', downloads: 64, leads: 8, sales: 3, vol: 720000 },
    { code: 'AG-AE-703', pin: '2026', name: 'Gulf Horizon Wealth & Real Estate', broker: 'Tariq Al-Mansoor', email: 'tariq@gulfhorizon.ae', phone: '+971 50 912 4400', country: 'BAE & Orta Doğu', city: 'Dubai & Abu Dabi', tier: 'Gold', comm: 8, bonus: 2, status: 'pending', downloads: 28, leads: 4, sales: 0, vol: 0 }
  ];

  for (const a of agenciesSeed) {
    const deskMeta = resolveCountryDeskAndManager(a.country);
    await pool.query(
      `INSERT INTO developer_b2b_agencies (
        store_id, agency_code, access_pin, portal_token, company_name, broker_name,
        email, phone, country, city_region, tier, commission_rate, bonus_commission_rate,
        contract_status, contract_signed_at, total_downloads, active_leads_count,
        closed_sales_count, total_sales_volume_gbp, spoken_languages, assigned_desk,
        assigned_crm_manager, crm_stage, preferred_contract_lang, source_origin
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, CURRENT_TIMESTAMP - INTERVAL '14 days', $15,$16,$17,$18,$19,$20,$21,$22,$23,'master_pool')`,
      [
        storeId, a.code, a.pin, `b2b_tok_${a.code.toLowerCase()}`, a.name, a.broker,
        a.email, a.phone, a.country, a.city, a.tier, a.comm, a.bonus,
        a.status, a.downloads, a.leads, a.sales, a.vol,
        ['TR', 'EN'], deskMeta.desk, deskMeta.manager,
        a.status === 'signed' ? 'active_partner' : 'visit_scheduled',
        deskMeta.contractLang
      ]
    );
  }
  await syncGlobalPoolToStore(storeId);

  // Seed B2B Lead Protection & Unit Option Requests
  const requestsSeed = [
    { agency_name: 'Kuzey Prestige Realty & Investment', country: 'KKTC (Girne)', type: 'unit_option', proj: 'Maldives Homes', unit: 'B-12 (2+1 Penthouse)', inv: 'Magnus Lindqvist', nat: 'İsveç', phone: '+46 70 *** ** 84', budget: 295000, notes: '72 Saatlik resmi opsiyon talebi. £5,000 depozito SWIFT dekontu hazır.', status: 'approved' },
    { agency_name: 'Rheinland Mediterranean Invest GmbH', country: 'Almanya (Berlin)', type: 'unit_option', proj: 'Mykonos Homes', unit: 'SV-02 (3+1 Signature Villa)', inv: 'Dr. Heinrich Weber', nat: 'Almanya', phone: '+49 172 *** ** 19', budget: 680000, notes: 'Yatırımcı Cuma günü KKTC Inspection Trip ile şantiyeyi ziyaret edecek.', status: 'approved' },
    { agency_name: 'Bosphorus Luxury Estates & Brokerage', country: 'Türkiye (İstanbul)', type: 'lead_protection', proj: 'Aloha Beach Resort', unit: 'C-21 & C-22 (2 Adet 1+1)', inv: 'Kerem Demirsoy', nat: 'Türkiye', phone: '+90 532 *** ** 41', budget: 358000, notes: '60 Günlük Müşteri Zimmetleme (Lead Lock) kaydı. 48 ay faizsiz ödeme planı sunuldu.', status: 'approved' },
    { agency_name: 'Thames Global Property Advisors Ltd.', country: 'İngiltere (Londra)', type: 'inspection_trip', proj: 'Phuket Health & Wellness Resort', unit: 'L-14 (2+1 Wellness Loft)', inv: 'Charlotte Vance', nat: 'İngiltere', phone: '+44 7700 *** 912', budget: 248000, notes: 'Londra Roadshow görüşmesi sonrası 3 günlük VIP Maldives Homes konaklamalı Inspection Trip talebi.', status: 'pending' }
  ];

  for (const r of requestsSeed) {
    await pool.query(
      `INSERT INTO developer_b2b_requests (
        store_id, agency_name, agency_country, request_type, project_name, unit_code,
        investor_name, investor_nationality, investor_phone_masked, budget_gbp, notes, status,
        protection_expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, CURRENT_TIMESTAMP + INTERVAL '60 days')`,
      [storeId, r.agency_name, r.country, r.type, r.proj, r.unit, r.inv, r.nat, r.phone, r.budget, r.notes, r.status]
    );
  }

  // Seed Developer Launch Events & Inspection Trips
  const eventsSeed = [
    {
      title: 'Cumhurbaşkanı Ersin Tatar Katılımıyla — HAWAII HOMES Grand Opening & Broker Gala Night',
      type: 'launch_party',
      project: 'Hawaii Homes',
      date: '2026-06-18 19:30',
      location: 'Tatlısu Sahil — Hawaii Homes Beach Club, KKTC',
      regions: 'Tüm Global Partner Acenteler & VIP Yatırımcılar',
      media: 'Cumhurbaşkanı Ersin Tatar - HAWAII OPENING PARTY.mp4',
      registered: 142,
      capacity: 200,
      desc: 'Hawaii Homes lansman gecesi, şantiye turu ve en çok satış yapan ilk 10 acenteye ekstra %2 bonus komisyon ödül töreni.'
    },
    {
      title: 'Phuket Health & Wellness + 6 Devam Eden Proje — Global B2B Yatırımcı Turu (Inspection Trip)',
      type: 'inspection_trip',
      project: 'Phuket Health & Wellness Resort',
      date: '2026-05-22 10:00',
      location: 'Esentepe / Tatlısu Merkez Satış Ofisi & Maldives Homes Konaklama',
      regions: 'İngiltere, Almanya, İskandinavya, Rusya & Türkiye Acenteleri',
      media: '6 Ongoing Projects.mp4',
      registered: 48,
      capacity: 60,
      desc: '3 Günlük VIP Konaklamalı KKTC Proje Keşif Turu. 10 projenin yerinde incelenmesi, hukuk/koçan brifingi ve ödeme planı çalıştayı.'
    },
    {
      title: 'Mykonos, Bahamas & Aloha — Yatırım Getirisi (ROI) & 48 Ay Ödeme Planı Canlı Webinarı',
      type: 'webinar',
      project: 'Mykonos Homes, Bahamas Homes & Aloha Beach Resort',
      date: '2026-05-10 15:00',
      location: 'Zoom Enterprise (TR / EN / RU / DE Eşzamanlı Tercüme)',
      regions: 'Tüm Kayıtlı B2B Emlak Ofisleri (1.000+ Danışman Kapasiteli)',
      media: 'CC Reel 2.mp4',
      registered: 312,
      capacity: 1000,
      desc: 'Acentelerin yatırımcılara sunum yaparken kullanabileceği Mykonos, Bahamas ve Aloha karşılaştırma argümanları ve Google Drive medya paketi tanıtımı.'
    }
  ];

  for (const ev of eventsSeed) {
    await pool.query(
      `INSERT INTO developer_launch_events (
        store_id, title, event_type, project_name, event_date, location,
        target_regions, media_preview_url, registered_agencies_count, max_capacity, description
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [storeId, ev.title, ev.type, ev.project, ev.date, ev.location, ev.regions, ev.media, ev.registered, ev.capacity, ev.desc]
    );
  }
}

// ============================================================================
// 1. INTERNAL DEVELOPER STAFF ROUTES (Protected by `authenticate` middleware)
// ============================================================================

// GET /api/developer-projects/overview
router.get('/overview', authenticate, async (req: any, res) => {
  const callerStoreId = Number(getAuthorizedStoreId(req, req.query.store_id || req.query.storeId) || req.user?.store_id || 1);
  const requestedDeveloperStoreId = req.query.developer_store_id ? Number(req.query.developer_store_id) : null;

  try {
    if (!schemaReadyPromise) {
      schemaReadyPromise = initDeveloperProjectsSchema();
    }
    await schemaReadyPromise;

    // Fetch all standalone projectLP (store_type = 'developer_project') accounts opened in SuperAdmin
    const networkStoresRes = await pool.query(`
      SELECT id, name, slug, address, contact_person, phone, email, default_currency, plan, status
      FROM stores
      WHERE store_type = 'developer_project'
      ORDER BY CASE WHEN slug = 'cyprus-constructions' THEN 0 ELSE 1 END, id ASC
    `);

    const isCallerDevStore = networkStoresRes.rows.some((s: any) => Number(s.id) === callerStoreId);
    const cyprusStore = networkStoresRes.rows.find((s: any) => s.slug === 'cyprus-constructions') || networkStoresRes.rows[0];
    const activeDeveloperStoreId = requestedDeveloperStoreId || (isCallerDevStore ? callerStoreId : (cyprusStore?.id || callerStoreId));

    await ensureSeedDataForStore(activeDeveloperStoreId);

    const [companiesRes, projectsRes, unitsRes, agenciesRes, staffRes, requestsRes, eventsRes, globalPoolRes] = await Promise.all([
      pool.query('SELECT * FROM developer_companies WHERE store_id = $1 ORDER BY id ASC', [activeDeveloperStoreId]),
      pool.query(`
        SELECT * FROM developer_projects
        WHERE store_id = $1
        ORDER BY NULLIF( regexp_replace(project_code, '[^0-9]', '', 'g'), '' )::INT ASC NULLS LAST, id ASC
      `, [activeDeveloperStoreId]),
      pool.query(`
        SELECT u.*, p.name as project_name, p.project_code
        FROM developer_project_units u
        LEFT JOIN developer_projects p ON u.project_id = p.id
        WHERE u.store_id = $1
        ORDER BY u.project_id ASC, u.unit_number ASC
      `, [activeDeveloperStoreId]),
      pool.query('SELECT * FROM developer_b2b_agencies WHERE store_id = $1 ORDER BY total_sales_volume_gbp DESC, id ASC', [activeDeveloperStoreId]),
      pool.query('SELECT * FROM developer_internal_staff WHERE store_id = $1 ORDER BY id ASC', [activeDeveloperStoreId]),
      pool.query('SELECT * FROM developer_b2b_requests WHERE store_id = $1 ORDER BY created_at DESC', [activeDeveloperStoreId]),
      pool.query('SELECT * FROM developer_launch_events WHERE store_id = $1 ORDER BY id ASC', [activeDeveloperStoreId]),
      pool.query('SELECT * FROM global_agency_pool ORDER BY id DESC')
    ]);

    const primaryCompany = companiesRes.rows[0];

    res.json({
      activeDeveloperStoreId,
      networkDeveloperStores: networkStoresRes.rows,
      companies: companiesRes.rows,
      projects: projectsRes.rows,
      units: unitsRes.rows,
      agencies: agenciesRes.rows,
      globalAgencyPool: globalPoolRes.rows,
      internalStaff: staffRes.rows,
      requests: requestsRes.rows,
      events: eventsRes.rows,
      driveSyncMeta: {
        folderId: primaryCompany?.drive_folder_id || '1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM',
        folderUrl: primaryCompany?.drive_folder_url || 'https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM',
        backupMode: 'Bidirectional Mirror & Automated Cloud Backup (10 Proje Klasörü Aktif)',
        syncedFolders: projectsRes.rows.map((p: any) => p.folder_prefix || p.name),
        salesOfficeImage: 'https://drive.google.com/thumbnail?id=1bHq40srfUMn8exQUGUDz6EB8cnaKZyZc&sz=w1000',
        masterMapImage: 'https://drive.google.com/thumbnail?id=12hVM_oRM_irEFbk57JDZmbyUIoE0OQhq&sz=w1200',
        rootMediaFiles: [
          { name: 'Cumhurbaşkanı Ersin Tatar - HAWAII OPENING PARTY.mp4', size: '299.8 MB', url: 'https://drive.google.com/file/d/1S-voP7vN7ciN52agBq4iuWHSoP0yfRCW/view', type: 'video' },
          { name: 'Maldives Cinema.mp4', size: '358.8 MB', url: 'https://drive.google.com/file/d/1XZIDqmaxkHd1m59EPrLE0oNsHWZj_qi3/view', type: 'video' },
          { name: '6 Ongoing Projects.mp4', size: '214.8 MB', url: 'https://drive.google.com/file/d/1ymjz_OSdRddH1yFKBC5eDHFTAAPVFwGU/view', type: 'video' },
          { name: 'KKTC_Tanitim_Filmi_30--.mp4', size: '206.3 MB', url: 'https://drive.google.com/file/d/1binjGx6Y1FVCAvWgNOYyyO9MSTHAtVGV/view', type: 'video' },
          { name: 'CC Reel 2.mp4', size: '76.5 MB', url: 'https://drive.google.com/file/d/18rVtoH5Ft08Rd2mYwJfSxV9utQ1SgAXc/view', type: 'video' },
          { name: 'Cyprus Constructıons Reel.mp4', size: '44.2 MB', url: 'https://drive.google.com/file/d/1iRkHtpZ__brR0AWyIMSMPkLVf6uktEsB/view', type: 'video' },
          { name: 'MAP.png (Cyprus Constructions Sahil Projeleri Haritası)', size: '6.9 MB', url: 'https://drive.google.com/file/d/12hVM_oRM_irEFbk57JDZmbyUIoE0OQhq/view', type: 'image' },
          { name: 'CYPRUS CONSTRUCTIONS SALES OFFICE.jpeg', size: '6.4 MB', url: 'https://drive.google.com/file/d/1bHq40srfUMn8exQUGUDz6EB8cnaKZyZc/view', type: 'image' },
          { name: 'office.jpg (Esentepe Merkez Satış Ofisi)', size: '6.2 MB', url: 'https://drive.google.com/file/d/1E_HT6DKmZ2EAgCuiowm-QP_MRieN7f86/view', type: 'image' }
        ]
      }
    });
  } catch (err: any) {
    console.error('Error loading developer projects overview:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// POST /api/developer-projects/companies (Create a Construction Developer Company)
router.post('/companies', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const b = req.body;
  try {
    const cleanUrl = b.drive_folder_url || 'https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM';
    const matchId = cleanUrl.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1] || '1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM';
    const result = await pool.query(
      `INSERT INTO developer_companies (
        store_id, company_code, company_name, headquarters_region, license_grade,
        contact_director, phone, email, website, drive_folder_id, drive_folder_url,
        default_commission_rate, lead_protection_days, option_hold_hours, active_projects_count
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        storeId,
        b.company_code || `DEV-${Math.floor(10 + Math.random() * 89)}`,
        b.company_name,
        b.headquarters_region || 'Girne, KKTC',
        b.license_grade || '1. Sınıf Müteahhitlik & Proje Geliştirme',
        b.contact_director || '',
        b.phone || '',
        b.email || '',
        b.website || '',
        matchId,
        cleanUrl,
        Number(b.default_commission_rate) || 8,
        Number(b.lead_protection_days) || 60,
        Number(b.option_hold_hours) || 72,
        Number(b.active_projects_count) || 1
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/developer-projects/companies/:id (Update Construction Developer Company & Drive Settings)
router.put('/companies/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const { id } = req.params;
  const b = req.body;
  try {
    const cleanUrl = b.drive_folder_url || 'https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM';
    const matchId = cleanUrl.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1] || '1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM';
    const result = await pool.query(
      `UPDATE developer_companies
       SET company_name = COALESCE($1, company_name),
           headquarters_region = COALESCE($2, headquarters_region),
           license_grade = COALESCE($3, license_grade),
           contact_director = COALESCE($4, contact_director),
           phone = COALESCE($5, phone),
           email = COALESCE($6, email),
           website = COALESCE($7, website),
           drive_folder_id = $8,
           drive_folder_url = $9,
           default_commission_rate = COALESCE($10, default_commission_rate),
           lead_protection_days = COALESCE($11, lead_protection_days),
           option_hold_hours = COALESCE($12, option_hold_hours)
       WHERE id = $13 AND store_id = $14 RETURNING *`,
      [
        b.company_name,
        b.headquarters_region,
        b.license_grade,
        b.contact_director,
        b.phone,
        b.email,
        b.website,
        matchId,
        cleanUrl,
        b.default_commission_rate ? Number(b.default_commission_rate) : null,
        b.lead_protection_days ? Number(b.lead_protection_days) : null,
        b.option_hold_hours ? Number(b.option_hold_hours) : null,
        id,
        storeId
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/developer-projects/companies/:id
router.delete('/companies/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.query.store_id) || req.user?.store_id || 1);
  try {
    await pool.query('DELETE FROM developer_companies WHERE id = $1 AND store_id = $2', [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/sync-drive
router.post('/sync-drive', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const { driveFolderUrl } = req.body;
  try {
    await ensureSeedDataForStore(storeId);
    const cleanUrl = driveFolderUrl || 'https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM';
    const matchId = cleanUrl.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1] || '1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM';

    await pool.query(
      `UPDATE developer_projects
       SET drive_folder_id = $1, drive_folder_url = $2, last_drive_sync = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE store_id = $3`,
      [matchId, cleanUrl, storeId]
    );
    await pool.query(
      `UPDATE developer_companies
       SET drive_folder_id = $1, drive_folder_url = $2
       WHERE store_id = $3`,
      [matchId, cleanUrl, storeId]
    );

    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      folderId: matchId,
      message: 'Google Drive klasör yapısı, proje veri odaları ve 4K medya yedekleri senkronize edildi.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/projects (Create a new Developer Project)
router.post('/projects', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const b = req.body;
  try {
    const specs = Array.isArray(b.architectural_specs)
      ? b.architectural_specs
      : typeof b.architectural_specs === 'string' && b.architectural_specs.trim()
      ? b.architectural_specs.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : ['Panoramik Akdeniz ve Dağ Manzarası', 'Özel Tasarım Havuz & Geniş Teras Mimarisi', 'Yüksek Isı/Ses Yalıtımlı Alüminyum Doğrama & VRF Altyapısı'];

    const result = await pool.query(
      `INSERT INTO developer_projects (
        store_id, project_code, folder_prefix, name, region, sub_region, concept_tagline,
        status, completion_date, construction_progress, total_units, available_units,
        optioned_units, sold_units, starting_price, currency, default_commission_rate,
        cover_image, architectural_specs, lifestyle_facilities, payment_plan, investment_metrics, media_vault
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,0,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [
        storeId,
        b.project_code || `CC-PRJ-${Math.floor(10 + Math.random() * 89)}`,
        b.folder_prefix || `${b.name}`,
        b.name,
        b.region || 'Girne',
        b.sub_region || 'Esentepe Sahil',
        b.concept_tagline || 'Yeni Nesil Akdeniz Sahil & Yatırım Projesi',
        b.status || 'off_plan',
        b.completion_date || 'Q4 2027',
        Number(b.construction_progress) || 20,
        Number(b.total_units) || 120,
        Number(b.available_units || b.total_units) || 120,
        Number(b.starting_price) || 149000,
        b.currency || 'GBP',
        Number(b.default_commission_rate) || 8,
        b.cover_image || 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85',
        JSON.stringify(specs),
        JSON.stringify(b.lifestyle_facilities || {
          beach_marina: ['Özel Plaj & Beach Club', 'Güneşlenme İskelesi'],
          wellness_spa: ['Isıtmalı Kapalı Havuz', 'Spa, Sauna, Hamam & Fitness'],
          entertainment: ['Açık Hava Sineması & Lounge'],
          gastronomy: ['Fine-Dining Restoran & Pool Bar'],
          family_sports: ['Tenis Kortu & Çocuk Kulübü']
        }),
        JSON.stringify({
          plan_name: b.plan_name || `${b.name} Lansman Ödeme Planı`,
          down_payment_percent: Number(b.down_payment_percent) || 35,
          during_construction_percent: Number(b.during_construction_percent) || 45,
          installment_percent: Number(b.installment_percent) || 20,
          installment_months: Number(b.installment_months) || 36,
          interest_rate: 0,
          reservation_deposit_gbp: 5000,
          notes: b.payment_notes || `%${Number(b.down_payment_percent) || 35} Peşinat, kalan tutar için ${Number(b.installment_months) || 36} ay %0 faiz şirket içi vade.`
        }),
        JSON.stringify({
          annual_rental_yield_percent: Number(b.annual_rental_yield_percent) || 10.0,
          capital_appreciation_percent: Number(b.capital_appreciation_percent) || 45,
          short_term_occupancy_percent: 85,
          management_service: 'Profesyonel Kiralama & Site Yönetimi (Rental Pool)',
          target_buyer_profile: 'Döviz Kira Geliri ve Sermaye Artışı Hedefleyen Yatırımcılar'
        }),
        JSON.stringify(b.media_vault || [
          {
            id: `m_${Date.now()}`,
            name: `${b.name} - Masterplan & Kat Planları.pdf`,
            url: 'https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM',
            type: 'masterplan',
            size: '15.4 MB',
            category: 'Masterplan & Kat Planları',
            drive_synced: true
          }
        ])
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/developer-projects/projects/:id (Update Project Details, Pricing, Progress & Payment Plan)
router.put('/projects/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const { id } = req.params;
  const b = req.body;
  try {
    const existingRes = await pool.query('SELECT * FROM developer_projects WHERE id = $1 AND store_id = $2', [id, storeId]);
    if (existingRes.rowCount === 0) return res.status(404).json({ error: 'Proje bulunamadı' });
    const cur = existingRes.rows[0];

    const updatedPaymentPlan = {
      ...(cur.payment_plan || {}),
      ...(b.payment_plan || {}),
      ...(b.down_payment_percent !== undefined ? { down_payment_percent: Number(b.down_payment_percent) } : {}),
      ...(b.installment_months !== undefined ? { installment_months: Number(b.installment_months) } : {}),
      ...(b.payment_notes !== undefined ? { notes: b.payment_notes } : {})
    };

    const updatedMetrics = {
      ...(cur.investment_metrics || {}),
      ...(b.investment_metrics || {}),
      ...(b.annual_rental_yield_percent !== undefined ? { annual_rental_yield_percent: Number(b.annual_rental_yield_percent) } : {}),
      ...(b.capital_appreciation_percent !== undefined ? { capital_appreciation_percent: Number(b.capital_appreciation_percent) } : {})
    };

    const result = await pool.query(
      `UPDATE developer_projects
       SET name = COALESCE($1, name),
           folder_prefix = COALESCE($2, folder_prefix),
           region = COALESCE($3, region),
           sub_region = COALESCE($4, sub_region),
           concept_tagline = COALESCE($5, concept_tagline),
           completion_date = COALESCE($6, completion_date),
           construction_progress = COALESCE($7, construction_progress),
           starting_price = COALESCE($8, starting_price),
           default_commission_rate = COALESCE($9, default_commission_rate),
           cover_image = COALESCE($10, cover_image),
           total_units = COALESCE($11, total_units),
           available_units = COALESCE($12, available_units),
           payment_plan = $13,
           investment_metrics = $14,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $15 AND store_id = $16 RETURNING *`,
      [
        b.name || null,
        b.folder_prefix || null,
        b.region || null,
        b.sub_region || null,
        b.concept_tagline || null,
        b.completion_date || null,
        b.construction_progress !== undefined ? Number(b.construction_progress) : null,
        b.starting_price !== undefined ? Number(b.starting_price) : null,
        b.default_commission_rate !== undefined ? Number(b.default_commission_rate) : null,
        b.cover_image || null,
        b.total_units !== undefined ? Number(b.total_units) : null,
        b.available_units !== undefined ? Number(b.available_units) : null,
        JSON.stringify(updatedPaymentPlan),
        JSON.stringify(updatedMetrics),
        id,
        storeId
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/developer-projects/projects/:id
router.delete('/projects/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.query.store_id) || req.user?.store_id || 1);
  try {
    await pool.query('DELETE FROM developer_projects WHERE id = $1 AND store_id = $2', [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/projects/:id/media (Add Media/Document to Project Data Room)
router.post('/projects/:id/media', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const { id } = req.params;
  const { name, type, size, category, url } = req.body;
  try {
    const existingRes = await pool.query('SELECT media_vault FROM developer_projects WHERE id = $1 AND store_id = $2', [id, storeId]);
    if (existingRes.rowCount === 0) return res.status(404).json({ error: 'Proje bulunamadı' });

    const currentMedia = Array.isArray(existingRes.rows[0].media_vault) ? existingRes.rows[0].media_vault : [];
    const newMediaItem = {
      id: `media_${Date.now()}`,
      name: name || 'Yeni Proje Dosyası.pdf',
      type: type || 'masterplan',
      size: size || '12.5 MB',
      category: category || 'Masterplan & Kat Planları',
      url: url || 'https://drive.google.com/drive/folders/1oZDbLanKWW2ZkfF6WQkfRU2rlDyn0fDM',
      drive_synced: true
    };
    const nextMedia = [newMediaItem, ...currentMedia];

    const updated = await pool.query(
      'UPDATE developer_projects SET media_vault = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND store_id = $3 RETURNING *',
      [JSON.stringify(nextMedia), id, storeId]
    );
    res.json(updated.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/developer-projects/projects/:id/media/:mediaId (Remove Media/Document from Project Data Room)
router.delete('/projects/:id/media/:mediaId', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.query.store_id) || req.user?.store_id || 1);
  const { id, mediaId } = req.params;
  try {
    const existingRes = await pool.query('SELECT media_vault FROM developer_projects WHERE id = $1 AND store_id = $2', [id, storeId]);
    if (existingRes.rowCount === 0) return res.status(404).json({ error: 'Proje bulunamadı' });

    const currentMedia = Array.isArray(existingRes.rows[0].media_vault) ? existingRes.rows[0].media_vault : [];
    const nextMedia = currentMedia.filter((m: any) => String(m.id) !== String(mediaId));

    const updated = await pool.query(
      'UPDATE developer_projects SET media_vault = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND store_id = $3 RETURNING *',
      [JSON.stringify(nextMedia), id, storeId]
    );
    res.json(updated.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/developer-projects/units/:id (Update unit status/price/option)
router.patch('/units/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const { id } = req.params;
  const { status, price, optioned_by_agency_name, optioned_client_name, block_name, unit_number, unit_type } = req.body;
  try {
    const result = await pool.query(
      `UPDATE developer_project_units
       SET status = COALESCE($1, status),
           price = COALESCE($2, price),
           optioned_by_agency_name = COALESCE($3, optioned_by_agency_name),
           optioned_client_name = COALESCE($4, optioned_client_name),
           block_name = COALESCE($5, block_name),
           unit_number = COALESCE($6, unit_number),
           unit_type = COALESCE($7, unit_type),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND store_id = $9 RETURNING *`,
      [
        status || null,
        price !== undefined ? Number(price) : null,
        optioned_by_agency_name,
        optioned_client_name,
        block_name || null,
        unit_number || null,
        unit_type || null,
        id,
        storeId
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/developer-projects/units/:id
router.delete('/units/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.query.store_id) || req.user?.store_id || 1);
  try {
    await pool.query('DELETE FROM developer_project_units WHERE id = $1 AND store_id = $2', [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/units/bulk-price-update (Bulk % or fixed price update for available units)
router.post('/units/bulk-price-update', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const { projectId, percentageChange, onlyAvailable = true } = req.body;
  const pct = Number(percentageChange) || 0;
  if (pct === 0) return res.status(400).json({ error: 'Yüzde değişim oranı 0 olamaz.' });

  try {
    const multiplier = 1 + pct / 100;
    let query = `
      UPDATE developer_project_units
      SET price = ROUND((price * $1) / 100) * 100,
          updated_at = CURRENT_TIMESTAMP
      WHERE store_id = $2
    `;
    const params: any[] = [multiplier, storeId];

    if (projectId && projectId !== 'all') {
      params.push(Number(projectId));
      query += ` AND project_id = $${params.length}`;
    }
    if (onlyAvailable) {
      query += ` AND status = 'available'`;
    }
    query += ' RETURNING *';

    const updatedUnits = await pool.query(query, params);

    // Also update project starting_price to reflect new minimum available unit price
    await pool.query(
      `UPDATE developer_projects p
       SET starting_price = COALESCE(
         (SELECT MIN(u.price) FROM developer_project_units u WHERE u.project_id = p.id AND u.status = 'available'),
         ROUND((p.starting_price * $1) / 100) * 100
       )
       WHERE p.store_id = $2 ${projectId && projectId !== 'all' ? 'AND p.id = $3' : ''}`,
      projectId && projectId !== 'all' ? [multiplier, storeId, Number(projectId)] : [multiplier, storeId]
    );

    res.json({
      success: true,
      updatedCount: updatedUnits.rowCount,
      message: `${updatedUnits.rowCount} ünitenin fiyatı %${pct > 0 ? `+${pct}` : pct} oranında güncellendi.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/units (Add new unit to matrix)
router.post('/units', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const b = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO developer_project_units (
        store_id, project_id, block_name, floor_level, unit_number, unit_type,
        gross_sqm, net_sqm, terrace_sqm, view_direction, price, currency, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        storeId,
        Number(b.project_id),
        b.block_name || 'A Blok',
        b.floor_level || 'Zemin',
        b.unit_number || 'A-10',
        b.unit_type || '1+1 Garden Suite',
        Number(b.gross_sqm) || 80,
        Number(b.net_sqm) || 64,
        Number(b.terrace_sqm) || 16,
        b.view_direction || 'Tam Deniz & Havuz',
        Number(b.price) || 175000,
        b.currency || 'GBP',
        b.status || 'available'
      ]
    );
    const projRes = await pool.query('SELECT name, project_code FROM developer_projects WHERE id = $1', [Number(b.project_id)]);
    res.json({
      ...result.rows[0],
      project_name: projRes.rows[0]?.name || '',
      project_code: projRes.rows[0]?.project_code || ''
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/internal-staff (Add new Internal Company Staff Member with Permissions)
router.post('/internal-staff', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const b = req.body;
  try {
    const defaultPerms = b.permissions || {
      can_manage_projects: b.department === 'Yönetim' || b.department === 'Teknik & Mimari',
      can_upload_media: true,
      can_manage_prices: b.department === 'Yönetim' || b.department === 'Satış',
      can_manage_users: b.department === 'Yönetim'
    };
    const result = await pool.query(
      `INSERT INTO developer_internal_staff (store_id, full_name, title_role, department, email, phone, assigned_regions, permissions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        storeId,
        b.full_name,
        b.title_role || 'Proje Uzmanı',
        b.department || 'Teknik & Mimari',
        b.email || 'ekip@cyprusconstructions.com',
        b.phone || '+90 548 860 00 00',
        b.assigned_regions || 'Tüm Projeler',
        JSON.stringify(defaultPerms)
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/developer-projects/internal-staff/:id (Update Internal Staff Role, Department & Permissions)
router.patch('/internal-staff/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const { id } = req.params;
  const b = req.body;
  try {
    const result = await pool.query(
      `UPDATE developer_internal_staff
       SET full_name = COALESCE($1, full_name),
           title_role = COALESCE($2, title_role),
           department = COALESCE($3, department),
           email = COALESCE($4, email),
           phone = COALESCE($5, phone),
           assigned_regions = COALESCE($6, assigned_regions),
           permissions = COALESCE($7, permissions),
           active_status = COALESCE($8, active_status)
       WHERE id = $9 AND store_id = $10 RETURNING *`,
      [
        b.full_name || null,
        b.title_role || null,
        b.department || null,
        b.email || null,
        b.phone || null,
        b.assigned_regions || null,
        b.permissions ? JSON.stringify(b.permissions) : null,
        b.active_status !== undefined ? Boolean(b.active_status) : null,
        id,
        storeId
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/developer-projects/internal-staff/:id
router.delete('/internal-staff/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.query.store_id) || req.user?.store_id || 1);
  try {
    await pool.query('DELETE FROM developer_internal_staff WHERE id = $1 AND store_id = $2', [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/agencies (Onboard a new External B2B Agency + Reverse-Feed to Central Global Agency Pool)
router.post('/agencies', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const b = req.body;
  try {
    const code = b.agency_code || `AG-${(b.country || 'GLB').slice(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Math.floor(100 + Math.random() * 899)}`;
    const pin = b.access_pin || String(Math.floor(1000 + Math.random() * 9000));
    const deskMeta = resolveCountryDeskAndManager(b.country || 'KKTC');
    const langs = Array.isArray(b.spoken_languages) && b.spoken_languages.length > 0
      ? b.spoken_languages
      : ['TR', 'EN'];

    // 1. Reverse-Feed Check: If this agency is not in the Central Global Agency Pool, automatically add it!
    let globalPoolId: number | null = null;
    let reverseFedToGlobalPool = false;

    const existingPoolRes = await pool.query(
      `SELECT id FROM global_agency_pool
       WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) OR LOWER(TRIM(company_name)) = LOWER(TRIM($2))
       LIMIT 1`,
      [b.email || '', b.company_name || '']
    );

    if (existingPoolRes.rows.length > 0) {
      globalPoolId = existingPoolRes.rows[0].id;
    } else {
      const storeNameRes = await pool.query('SELECT name FROM stores WHERE id = $1', [storeId]);
      const contributorName = storeNameRes.rows[0]?.name || `Proje Firması #${storeId} (Operatör Geri Beslemesi)`;

      const insertPoolRes = await pool.query(
        `INSERT INTO global_agency_pool (
          agency_code, company_name, broker_name, email, phone, whatsapp_phone, website,
          country, city_region, spoken_languages, specialization, agent_count, tier,
          default_commission_rate, bonus_commission_rate, restatelp_status,
          source_type, contributed_by_store_id, contributed_by_store_name, verified, notes
        ) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'prospect','operator_reverse_feed',$15,$16,true,$17)
        ON CONFLICT (agency_code) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        RETURNING id`,
        [
          code,
          b.company_name,
          b.broker_name,
          b.email || 'broker@agency.com',
          b.phone || '+90 548 000 00 00',
          b.website || '',
          b.country || 'KKTC',
          b.city_region || 'Girne',
          langs,
          b.specialization || 'Uluslararası Gayrimenkul & Proje Satışı',
          Number(b.agent_count) || 10,
          b.tier || 'Gold',
          Number(b.commission_rate) || 8,
          Number(b.bonus_commission_rate) || 2,
          storeId,
          contributorName,
          b.last_meeting_note || `${contributorName} operatörü tarafından saha/CRM görüşmesiyle eklendi ve merkezi havuza geri beslendi.`
        ]
      );
      globalPoolId = insertPoolRes.rows[0]?.id || null;
      reverseFedToGlobalPool = true;
    }

    // 2. Insert into the current projectLP store's developer_b2b_agencies
    const result = await pool.query(
      `INSERT INTO developer_b2b_agencies (
        store_id, global_pool_id, agency_code, access_pin, portal_token, company_name, broker_name,
        email, phone, country, city_region, tier, commission_rate, bonus_commission_rate,
        contract_status, contract_signed_at, spoken_languages, assigned_desk, assigned_crm_manager,
        crm_stage, last_meeting_note, next_visit_date, preferred_contract_lang, source_origin
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
        CASE WHEN $15 = 'signed' THEN CURRENT_TIMESTAMP ELSE NULL END,
        $16,$17,$18,$19,$20,$21,$22,'operator_reverse_feed'
      ) RETURNING *`,
      [
        storeId,
        globalPoolId,
        code,
        pin,
        `b2b_tok_${code.toLowerCase()}_${Date.now()}`,
        b.company_name,
        b.broker_name,
        b.email || 'broker@agency.com',
        b.phone || '+90 548 000 00 00',
        b.country || 'KKTC',
        b.city_region || 'Girne',
        b.tier || 'Gold',
        Number(b.commission_rate) || 8,
        Number(b.bonus_commission_rate) || 2,
        b.contract_status || 'signed',
        langs,
        b.assigned_desk || deskMeta.desk,
        b.assigned_crm_manager || deskMeta.manager,
        b.crm_stage || (b.contract_status === 'pending' ? 'visit_scheduled' : 'active_partner'),
        b.last_meeting_note || 'Operatör tarafından eklendi ve Merkezi Global Emlakçı Havuzuna geri beslendi.',
        b.next_visit_date || '2026-06-05 14:00',
        b.preferred_contract_lang || deskMeta.contractLang
      ]
    );

    // 3. Also propagate the newly discovered agency to all other projectLP developer stores in the background
    if (reverseFedToGlobalPool) {
      const devStoresRes = await pool.query(`SELECT id FROM stores WHERE store_type = 'developer_project' AND id != $1`, [storeId]);
      for (const ds of devStoresRes.rows) {
        await syncGlobalPoolToStore(Number(ds.id));
      }
    }

    res.json({
      ...result.rows[0],
      reverseFedToGlobalPool
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/developer-projects/agencies/:id (Update tier, commission, contract status, CRM stage, Country Desk, notes)
router.patch('/agencies/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const { id } = req.params;
  const {
    tier, commission_rate, bonus_commission_rate, contract_status, access_pin,
    crm_stage, assigned_desk, assigned_crm_manager, spoken_languages,
    last_meeting_note, next_visit_date, preferred_contract_lang
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE developer_b2b_agencies
       SET tier = COALESCE($1, tier),
           commission_rate = COALESCE($2, commission_rate),
           bonus_commission_rate = COALESCE($3, bonus_commission_rate),
           contract_status = COALESCE($4, contract_status),
           access_pin = COALESCE($5, access_pin),
           crm_stage = COALESCE($6, crm_stage),
           assigned_desk = COALESCE($7, assigned_desk),
           assigned_crm_manager = COALESCE($8, assigned_crm_manager),
           spoken_languages = COALESCE($9, spoken_languages),
           last_meeting_note = COALESCE($10, last_meeting_note),
           next_visit_date = COALESCE($11, next_visit_date),
           preferred_contract_lang = COALESCE($12, preferred_contract_lang),
           contract_signed_at = CASE WHEN $4 = 'signed' THEN CURRENT_TIMESTAMP ELSE contract_signed_at END
       WHERE id = $13 AND store_id = $14 RETURNING *`,
      [
        tier || null,
        commission_rate !== undefined ? Number(commission_rate) : null,
        bonus_commission_rate !== undefined ? Number(bonus_commission_rate) : null,
        contract_status || null,
        access_pin || null,
        crm_stage || null,
        assigned_desk || null,
        assigned_crm_manager || null,
        Array.isArray(spoken_languages) ? spoken_languages : null,
        last_meeting_note !== undefined ? last_meeting_note : null,
        next_visit_date !== undefined ? next_visit_date : null,
        preferred_contract_lang || null,
        id,
        storeId
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 3. SUPERADMIN CENTRAL GLOBAL AGENCY POOL ROUTES (/api/developer-projects/global-pool)
// ============================================================================

// GET /api/developer-projects/global-pool
router.get('/global-pool', authenticate, async (_req: any, res) => {
  try {
    if (!schemaReadyPromise) {
      schemaReadyPromise = initDeveloperProjectsSchema();
    }
    await schemaReadyPromise;

    const [poolRes, devStoresRes] = await Promise.all([
      pool.query('SELECT * FROM global_agency_pool ORDER BY id DESC'),
      pool.query(`SELECT id, name, slug, address, contact_person, status FROM stores WHERE store_type = 'developer_project' ORDER BY id ASC`)
    ]);

    res.json({
      agencies: poolRes.rows,
      developerStores: devStoresRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/global-pool (SuperAdmin adds a new agency to Central Pool & auto-syncs to all projectLP stores)
router.post('/global-pool', authenticate, async (req: any, res) => {
  const b = req.body;
  try {
    const code = b.agency_code || `GLB-${(b.country || 'INT').slice(0, 2).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Math.floor(100 + Math.random() * 899)}`;
    const langs = Array.isArray(b.spoken_languages) && b.spoken_languages.length > 0
      ? b.spoken_languages
      : String(b.spoken_languages || 'TR,EN').split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean);

    const insertRes = await pool.query(
      `INSERT INTO global_agency_pool (
        agency_code, company_name, broker_name, email, phone, whatsapp_phone, website,
        country, city_region, spoken_languages, specialization, agent_count, tier,
        default_commission_rate, bonus_commission_rate, restatelp_status, restatelp_store_slug,
        source_type, contributed_by_store_name, verified, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'superadmin_master','LookPrice SuperAdmin Havuzu',true,$18)
      RETURNING *`,
      [
        code,
        b.company_name,
        b.broker_name,
        b.email || 'info@agency.com',
        b.phone || '+90 548 000 00 00',
        b.whatsapp_phone || b.phone || '+90 548 000 00 00',
        b.website || '',
        b.country || 'KKTC',
        b.city_region || 'Girne',
        langs,
        b.specialization || 'Kıyı Yatırım, Rezidans & Lüks Villa',
        Number(b.agent_count) || 12,
        b.tier || 'Gold',
        Number(b.default_commission_rate) || 8,
        Number(b.bonus_commission_rate) || 2,
        b.restatelp_status || 'prospect',
        b.restatelp_store_slug || '',
        b.notes || 'SuperAdmin tarafından Merkezi Global Emlakçı Havuzuna eklendi.'
      ]
    );

    // Automatically provision into all active projectLP stores
    const devStoresRes = await pool.query(`SELECT id FROM stores WHERE store_type = 'developer_project'`);
    let syncedStoresCount = 0;
    for (const ds of devStoresRes.rows) {
      await syncGlobalPoolToStore(Number(ds.id));
      syncedStoresCount++;
    }

    res.json({
      agency: insertRes.rows[0],
      syncedStoresCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/developer-projects/global-pool/:id
router.patch('/global-pool/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const b = req.body;
  try {
    const langs = Array.isArray(b.spoken_languages)
      ? b.spoken_languages
      : typeof b.spoken_languages === 'string'
      ? b.spoken_languages.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean)
      : null;

    const result = await pool.query(
      `UPDATE global_agency_pool
       SET company_name = COALESCE($1, company_name),
           broker_name = COALESCE($2, broker_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           country = COALESCE($5, country),
           city_region = COALESCE($6, city_region),
           spoken_languages = COALESCE($7, spoken_languages),
           specialization = COALESCE($8, specialization),
           tier = COALESCE($9, tier),
           default_commission_rate = COALESCE($10, default_commission_rate),
           bonus_commission_rate = COALESCE($11, bonus_commission_rate),
           restatelp_status = COALESCE($12, restatelp_status),
           verified = COALESCE($13, verified),
           notes = COALESCE($14, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $15 RETURNING *`,
      [
        b.company_name || null,
        b.broker_name || null,
        b.email || null,
        b.phone || null,
        b.country || null,
        b.city_region || null,
        langs,
        b.specialization || null,
        b.tier || null,
        b.default_commission_rate !== undefined ? Number(b.default_commission_rate) : null,
        b.bonus_commission_rate !== undefined ? Number(b.bonus_commission_rate) : null,
        b.restatelp_status || null,
        b.verified !== undefined ? Boolean(b.verified) : null,
        b.notes !== undefined ? b.notes : null,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/developer-projects/global-pool/:id
router.delete('/global-pool/:id', authenticate, async (req: any, res) => {
  try {
    await pool.query('DELETE FROM global_agency_pool WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/global-pool/sync-all (SuperAdmin triggers full pool distribution to all projectLP stores)
router.post('/global-pool/sync-all', authenticate, async (_req: any, res) => {
  try {
    const devStoresRes = await pool.query(`SELECT id, name FROM stores WHERE store_type = 'developer_project'`);
    let totalInserted = 0;
    for (const ds of devStoresRes.rows) {
      totalInserted += await syncGlobalPoolToStore(Number(ds.id));
    }
    res.json({
      success: true,
      syncedStoresCount: devStoresRes.rows.length,
      totalNewLinksCreated: totalInserted
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/developer-projects/agencies/:id
router.delete('/agencies/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.query.store_id) || req.user?.store_id || 1);
  try {
    await pool.query('DELETE FROM developer_b2b_agencies WHERE id = $1 AND store_id = $2', [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/events (Create Launch Event / Inspection Trip)
router.post('/events', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const b = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO developer_launch_events (
        store_id, title, event_type, project_name, event_date, location,
        target_regions, media_preview_url, registered_agencies_count, max_capacity, description
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        storeId,
        b.title,
        b.event_type || 'launch_party',
        b.project_name || 'Tüm Projeler',
        b.event_date || '2026-07-15 19:00',
        b.location || 'Girne / Esentepe Satış Ofisi',
        b.target_regions || 'Tüm Global B2B Acenteler',
        b.media_preview_url || 'HAWAII OPENING PARTY.mp4',
        Number(b.registered_agencies_count) || 1,
        Number(b.max_capacity) || 150,
        b.description || ''
      ]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/developer-projects/requests/:id (Approve/Reject Lead Protection or Unit Option)
router.patch('/requests/:id', authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body.store_id || req.query.store_id) || req.user?.store_id || 1);
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE developer_b2b_requests SET status = $1 WHERE id = $2 AND store_id = $3 RETURNING *`,
      [status, id, storeId]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 2. EXTERNAL B2B AGENCY PORTAL ROUTES (Separate Auth for 1,000+ External Agencies)
// ============================================================================

// POST /api/developer-projects/b2b-portal/login
router.post('/b2b-portal/login', async (req, res) => {
  const { agencyCode, accessPin, storeId = 1 } = req.body;
  try {
    await ensureSeedDataForStore(Number(storeId));
    const agencyRes = await pool.query(
      `SELECT * FROM developer_b2b_agencies
       WHERE store_id = $1 AND UPPER(TRIM(agency_code)) = UPPER(TRIM($2)) AND TRIM(access_pin) = TRIM($3)`,
      [Number(storeId), String(agencyCode || ''), String(accessPin || '')]
    );

    if (agencyRes.rowCount === 0) {
      return res.status(401).json({ error: 'Geçersiz Acente Kodu veya Erişim PIN numarası.' });
    }

    const agency = agencyRes.rows[0];
    await pool.query(
      `UPDATE developer_b2b_agencies SET last_portal_visit = CURRENT_TIMESTAMP WHERE id = $1`,
      [agency.id]
    );

    const [projectsRes, unitsRes, eventsRes] = await Promise.all([
      pool.query('SELECT * FROM developer_projects WHERE store_id = $1 ORDER BY project_code ASC', [Number(storeId)]),
      pool.query('SELECT * FROM developer_project_units WHERE store_id = $1 ORDER BY project_id ASC, unit_number ASC', [Number(storeId)]),
      pool.query('SELECT * FROM developer_launch_events WHERE store_id = $1 ORDER BY id ASC', [Number(storeId)])
    ]);

    res.json({
      agency,
      projects: projectsRes.rows,
      units: unitsRes.rows,
      events: eventsRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/developer-projects/b2b-portal/submit-request (External agency submits Lead Protection or Unit Option)
router.post('/b2b-portal/submit-request', async (req, res) => {
  const b = req.body;
  const storeId = Number(b.store_id || 1);
  try {
    const result = await pool.query(
      `INSERT INTO developer_b2b_requests (
        store_id, agency_id, agency_name, agency_country, request_type,
        project_name, unit_code, investor_name, investor_nationality,
        investor_phone_masked, budget_gbp, notes, status, protection_expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending', CURRENT_TIMESTAMP + INTERVAL '60 days') RETURNING *`,
      [
        storeId,
        b.agency_id || null,
        b.agency_name || 'Partner Emlak Ofisi',
        b.agency_country || 'KKTC',
        b.request_type || 'lead_protection',
        b.project_name || 'Mykonos Homes',
        b.unit_code || 'Genel Proje İlgisi',
        b.investor_name,
        b.investor_nationality || 'İngiltere',
        b.investor_phone_masked || '+44 7700 *** 000',
        Number(b.budget_gbp) || 215000,
        b.notes || 'B2B Acente Portalı üzerinden müşteri zimmetleme / opsiyon talebi.'
      ]
    );

    if (b.agency_id) {
      await pool.query(
        `UPDATE developer_b2b_agencies SET active_leads_count = active_leads_count + 1 WHERE id = $1`,
        [b.agency_id]
      );
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

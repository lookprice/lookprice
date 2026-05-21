import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
});

// Initialize Database
export async function initDb() {
  console.log("Initializing database...");
  try {
    const client = await pool.connect();
    console.log("Database connected successfully.");
    try {
      console.log("Running schema queries...");
      await client.query(`
      -- Update existing columns to REAL if they are INTEGER
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock_quantity' AND data_type='integer') THEN
          ALTER TABLE products ALTER COLUMN stock_quantity TYPE REAL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='min_stock_level' AND data_type='integer') THEN
          ALTER TABLE products ALTER COLUMN min_stock_level TYPE REAL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='quantity' AND data_type='integer') THEN
          ALTER TABLE stock_movements ALTER COLUMN quantity TYPE REAL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoice_items' AND column_name='quantity' AND data_type='integer') THEN
          ALTER TABLE purchase_invoice_items ALTER COLUMN quantity TYPE REAL;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        address TEXT,
        contact_person TEXT,
        phone TEXT,
        country TEXT,
        email TEXT,
        api_key TEXT UNIQUE,
        subscription_end DATE,
        logo_url TEXT,
        favicon_url TEXT,
        primary_color TEXT DEFAULT '#4f46e5',
        default_currency TEXT DEFAULT 'TRY',
        language TEXT DEFAULT 'tr',
        plan TEXT DEFAULT 'free',
        background_image_url TEXT,
        fiscal_brand TEXT,
        fiscal_terminal_id TEXT,
        fiscal_active BOOLEAN DEFAULT FALSE,
        default_tax_rate INTEGER DEFAULT 20,
        currency_rates JSONB DEFAULT '{"USD": 1, "EUR": 1, "GBP": 1}',
        branding JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE stores ADD COLUMN IF NOT EXISTS default_tax_rate INTEGER DEFAULT 20;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS category_tax_rules JSONB DEFAULT '[]';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS custom_domain_status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS custom_domain_verification_code VARCHAR(255);
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS cf_hostname_id VARCHAR(255);
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS cf_zone_id VARCHAR(255);
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS cf_name_servers JSONB;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS page_layout JSONB DEFAULT '[]';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS menu_links JSONB DEFAULT '[]';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS shipping_profiles JSONB DEFAULT '[]';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS emails JSONB DEFAULT '[]';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS einvoice_settings JSONB DEFAULT '{"is_active": false, "provider": "none"}'::jsonb;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS footer_links JSONB DEFAULT '[]';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS cf_api_token TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS cf_account_id TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS cf_api_email TEXT;

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        barcode TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'TRY',
        cost_price REAL DEFAULT 0,
        cost_currency TEXT DEFAULT 'TRY',
        tax_rate REAL DEFAULT 20,
        description TEXT,
        stock_quantity REAL DEFAULT 0,
        min_stock_level REAL DEFAULT 5,
        shipping_profile_id TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        UNIQUE(store_id, barcode)
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price REAL DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_currency TEXT DEFAULT 'TRY';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate REAL DEFAULT 20;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_profile_id TEXT;

      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        image_url TEXT,
        status TEXT DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        store_id INTEGER,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('superadmin', 'storeadmin', 'editor', 'viewer')) NOT NULL,
        reset_token TEXT,
        reset_token_expiry TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        store_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        status TEXT DEFAULT 'Yeni',
        probability TEXT DEFAULT 'Ilık',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_title TEXT,
        tax_number TEXT,
        tax_office TEXT,
        total_amount DECIMAL(12,2) DEFAULT 0,
        currency TEXT DEFAULT 'TRY',
        status TEXT DEFAULT 'pending',
        notes TEXT,
        service_id INTEGER,
        company_id INTEGER,
        customer_id INTEGER,
        expiry_date DATE,
        due_date DATE,
        payment_method TEXT,
        is_sale BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      );

      ALTER TABLE quotations ADD COLUMN IF NOT EXISTS service_id INTEGER;

      CREATE TABLE IF NOT EXISTS quotation_items (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity INTEGER DEFAULT 1,
        unit_code TEXT DEFAULT 'Adet',
        unit_price DECIMAL(12,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 20,
        total_price DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
      );

      ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS unit_code TEXT DEFAULT 'Adet';

      ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 20;

      CREATE TABLE IF NOT EXISTS registration_requests (
        id SERIAL PRIMARY KEY,
        store_name TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        company_title TEXT,
        address TEXT,
        phone TEXT,
        country TEXT DEFAULT 'TR',
        language TEXT,
        currency TEXT,
        plan TEXT,
        upload_method TEXT,
        excel_data JSONB,
        mapping JSONB,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        tax_office TEXT,
        tax_number TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        contact_person TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS current_account_transactions (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        quotation_id INTEGER,
        type TEXT CHECK(type IN ('debt', 'credit')) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency TEXT DEFAULT 'TRY',
        exchange_rate DECIMAL(12,4) DEFAULT 1,
        description TEXT,
        payment_method TEXT,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
      );

      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='current_account_transactions' AND column_name='currency') THEN
          ALTER TABLE current_account_transactions ADD COLUMN currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='current_account_transactions' AND column_name='exchange_rate') THEN
          ALTER TABLE current_account_transactions ADD COLUMN exchange_rate DECIMAL(12,4) DEFAULT 1;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('in', 'out')) NOT NULL,
        quantity REAL NOT NULL,
        source TEXT DEFAULT 'manual',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='source') THEN
          ALTER TABLE stock_movements ADD COLUMN source TEXT DEFAULT 'manual';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='unit_price') THEN
          ALTER TABLE stock_movements ADD COLUMN unit_price DECIMAL(12,2);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='customer_info') THEN
          ALTER TABLE stock_movements ADD COLUMN customer_info TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='currency') THEN
          ALTER TABLE stock_movements ADD COLUMN currency TEXT DEFAULT 'TRY';
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        currency TEXT DEFAULT 'TRY',
        status TEXT CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned')) DEFAULT 'pending',
        customer_name TEXT,
        customer_phone TEXT,
        customer_address TEXT,
        payment_method TEXT,
        notes TEXT,
        due_date DATE,
        quotation_id INTEGER,
        company_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity REAL DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 20,
        tax_amount DECIMAL(12,2) DEFAULT 0,
        total_price DECIMAL(12,2) NOT NULL,
        currency TEXT DEFAULT 'TRY',
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      );

      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 20;
      ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0;
      ALTER TABLE sale_items ALTER COLUMN quantity TYPE REAL;

      CREATE TABLE IF NOT EXISTS sale_payments (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS supplier_apis (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        api_url TEXT NOT NULL,
        api_key TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS procurements (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        sale_id INTEGER,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
        supplier_id INTEGER,
        supplier_stock REAL,
        supplier_price REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        FOREIGN KEY (supplier_id) REFERENCES supplier_apis(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS service_records (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        device_model TEXT NOT NULL,
        device_serial TEXT,
        issue_description TEXT,
        status TEXT DEFAULT 'received' CHECK (status IN ('received', 'diagnosing', 'waiting_approval', 'repairing', 'ready', 'delivered', 'cancelled', 'converted_to_sale')),
        notes TEXT,
        total_amount DECIMAL(12,2) DEFAULT 0,
        currency TEXT DEFAULT 'TRY',
        quotation_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      ALTER TABLE service_records ADD COLUMN IF NOT EXISTS quotation_id INTEGER;
      ALTER TABLE service_records ADD COLUMN IF NOT EXISTS is_converted_to_sale BOOLEAN DEFAULT FALSE;

      -- Update service_records status check constraint
      DO $$ 
      BEGIN 
        ALTER TABLE service_records DROP CONSTRAINT IF EXISTS service_records_status_check;
        ALTER TABLE service_records ADD CONSTRAINT service_records_status_check CHECK (status IN ('received', 'diagnosing', 'waiting_approval', 'repairing', 'ready', 'delivered', 'cancelled', 'converted_to_sale'));
      END $$;

      -- Update sales status check constraint
      DO $$ 
      BEGIN 
        ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;
        ALTER TABLE sales ADD CONSTRAINT sales_status_check CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned'));
      END $$;

      CREATE TABLE IF NOT EXISTS service_items (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL,
        product_id INTEGER,
        item_name TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 20,
        total_price DECIMAL(12,2) NOT NULL,
        type TEXT DEFAULT 'part' CHECK (type IN ('part', 'labor')),
        FOREIGN KEY (service_id) REFERENCES service_records(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        company_id INTEGER,
        invoice_number TEXT NOT NULL,
        waybill_number TEXT,
        tax_number TEXT,
        tax_office TEXT,
        address TEXT,
        invoice_date DATE NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        tax_amount DECIMAL(12,2) DEFAULT 0,
        grand_total DECIMAL(12,2) DEFAULT 0,
        currency TEXT DEFAULT 'TRY',
        exchange_rate DECIMAL(12,4) DEFAULT 1,
        notes TEXT,
        supplier_name TEXT,
        status TEXT DEFAULT 'pending',
        integration_status TEXT,
        integration_message TEXT,
        ettn TEXT,
        document_number TEXT,
        e_document_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
      );

      ALTER TABLE purchase_invoices ALTER COLUMN company_id DROP NOT NULL;
      ALTER TABLE purchase_invoices ALTER COLUMN tax_amount DROP NOT NULL;
      ALTER TABLE purchase_invoices ALTER COLUMN grand_total DROP NOT NULL;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS supplier_name TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS grand_total DECIMAL(12,2) DEFAULT 0;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TRY';
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(12,4) DEFAULT 1;
      
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS ettn TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS document_number TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS e_document_type TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS integration_status TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS integration_message TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS tax_number TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS is_expense BOOLEAN DEFAULT FALSE;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS expense_category TEXT;
      
      -- Update foreign key to SET NULL
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='purchase_invoices_company_id_fkey') THEN
          ALTER TABLE purchase_invoices DROP CONSTRAINT purchase_invoices_company_id_fkey;
        END IF;
        ALTER TABLE purchase_invoices ADD CONSTRAINT purchase_invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
      END $$;

      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoices' AND column_name='exchange_rate') THEN
          ALTER TABLE purchase_invoices ADD COLUMN exchange_rate DECIMAL(12,4) DEFAULT 1;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS purchase_invoice_items (
        id SERIAL PRIMARY KEY,
        purchase_invoice_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity REAL NOT NULL,
        unit_code TEXT DEFAULT 'Adet',
        unit_price DECIMAL(12,2) NOT NULL,
        tax_rate DECIMAL(5,2) NOT NULL,
        tax_amount DECIMAL(12,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      );

      ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS unit_code TEXT DEFAULT 'Adet';

      CREATE TABLE IF NOT EXISTS sales_invoices (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        sale_id INTEGER,
        company_id INTEGER,
        customer_id INTEGER,
        invoice_number TEXT NOT NULL,
        waybill_number TEXT,
        tax_number TEXT,
        tax_office TEXT,
        address TEXT,
        invoice_date DATE NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        tax_amount DECIMAL(12,2) NOT NULL,
        grand_total DECIMAL(12,2) NOT NULL,
        currency TEXT DEFAULT 'TRY',
        exchange_rate DECIMAL(12,4) DEFAULT 1,
        notes TEXT,
        payment_method TEXT,
        invoice_type TEXT DEFAULT 'manual',
        status TEXT DEFAULT 'draft',
        quotation_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      );

      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_invoices' AND column_name='exchange_rate') THEN
          ALTER TABLE sales_invoices ADD COLUMN exchange_rate DECIMAL(12,4) DEFAULT 1;
        END IF;
      END $$;

      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS quotation_id INTEGER;

      CREATE TABLE IF NOT EXISTS sales_invoice_items (
        id SERIAL PRIMARY KEY,
        sales_invoice_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity REAL NOT NULL,
        unit_code TEXT DEFAULT 'Adet',
        unit_price DECIMAL(12,2) NOT NULL,
        tax_rate DECIMAL(5,2) NOT NULL,
        tax_amount DECIMAL(12,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      );

      ALTER TABLE sales_invoice_items ADD COLUMN IF NOT EXISTS unit_code TEXT DEFAULT 'Adet';

      -- Update stores table if needed
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS is_tax_inclusive BOOLEAN DEFAULT TRUE;
      ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_tax_inclusive BOOLEAN DEFAULT TRUE;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS is_tax_inclusive BOOLEAN DEFAULT TRUE;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS country TEXT;
      ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'TR';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS favicon_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS background_image_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS fiscal_brand TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS fiscal_terminal_id TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS fiscal_active BOOLEAN DEFAULT FALSE;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS sale_id INTEGER;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS gi_invoice_type TEXT DEFAULT 'SATIS';
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS customer_email TEXT;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS company_id INTEGER;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS gi_exemption_reason_code TEXT;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS gi_withholding_tax_code TEXT;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS waybill_number TEXT;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS ettn TEXT;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS document_number TEXT;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS e_document_type TEXT;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS invoice_profile TEXT DEFAULT 'TICARIFATURA';
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS integration_status TEXT;
      ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS integration_message TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS waybill_number TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS ettn TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS document_number TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS e_document_type TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS integration_status TEXT;
      ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS integration_message TEXT;
      ALTER TABLE sales_invoices DROP CONSTRAINT IF EXISTS fk_invoice_sale;
      ALTER TABLE sales_invoices ADD CONSTRAINT fk_invoice_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS currency_rates JSONB DEFAULT '{"USD": 1, "EUR": 1, "GBP": 1}';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'tr';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS hero_title TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS instagram_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS facebook_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS twitter_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS about_text TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES stores(id) ON DELETE SET NULL;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_settings JSONB DEFAULT '{}';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS amazon_settings JSONB DEFAULT '{}';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS n11_settings JSONB DEFAULT '{}';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS hepsiburada_settings JSONB DEFAULT '{}';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS trendyol_settings JSONB DEFAULT '{}';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS pazarama_settings JSONB DEFAULT '{}';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS meta_settings JSONB DEFAULT '{"enabled": false, "pixel_id": "", "catalog_id": ""}';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS google_merchant_settings JSONB DEFAULT '{"enabled": false, "merchant_id": ""}';

      CREATE TABLE IF NOT EXISTS amazon_orders (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        amazon_order_id TEXT NOT NULL,
        sale_id INTEGER,
        sales_invoice_id INTEGER,
        status TEXT,
        order_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
        FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoices(id) ON DELETE SET NULL,
        UNIQUE(store_id, amazon_order_id)
      );

      CREATE TABLE IF NOT EXISTS n11_orders (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        n11_order_id TEXT NOT NULL,
        sale_id INTEGER,
        sales_invoice_id INTEGER,
        status TEXT,
        order_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
        FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoices(id) ON DELETE SET NULL,
        UNIQUE(store_id, n11_order_id)
      );

      CREATE TABLE IF NOT EXISTS hepsiburada_orders (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        hepsiburada_order_id TEXT NOT NULL,
        sale_id INTEGER,
        sales_invoice_id INTEGER,
        status TEXT,
        order_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
        FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoices(id) ON DELETE SET NULL,
        UNIQUE(store_id, hepsiburada_order_id)
      );

      CREATE TABLE IF NOT EXISTS trendyol_orders (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        trendyol_order_id TEXT NOT NULL,
        sale_id INTEGER,
        sales_invoice_id INTEGER,
        status TEXT,
        order_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
        FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoices(id) ON DELETE SET NULL,
        UNIQUE(store_id, trendyol_order_id)
      );

      CREATE TABLE IF NOT EXISTS pazarama_orders (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        pazarama_order_id TEXT NOT NULL,
        sale_id INTEGER,
        sales_invoice_id INTEGER,
        status TEXT,
        order_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
        FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoices(id) ON DELETE SET NULL,
        UNIQUE(store_id, pazarama_order_id)
      );

      -- Add columns if tables already existed
      ALTER TABLE amazon_orders ADD COLUMN IF NOT EXISTS sales_invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE SET NULL;
      ALTER TABLE n11_orders ADD COLUMN IF NOT EXISTS sales_invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE SET NULL;
      ALTER TABLE hepsiburada_orders ADD COLUMN IF NOT EXISTS sales_invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE SET NULL;
      ALTER TABLE trendyol_orders ADD COLUMN IF NOT EXISTS sales_invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE SET NULL;
      ALTER TABLE pazarama_orders ADD COLUMN IF NOT EXISTS sales_invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE SET NULL;

      CREATE TABLE IF NOT EXISTS stock_transfers (
        id SERIAL PRIMARY KEY,
        from_store_id INTEGER NOT NULL,
        to_store_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'shipped', 'completed', 'cancelled')),
        notes TEXT,
        created_by INTEGER,
        prepared_by INTEGER,
        shipped_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (to_store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (prepared_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (shipped_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS stock_transfer_items (
        id SERIAL PRIMARY KEY,
        transfer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        barcode TEXT,
        product_name TEXT,
        FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      -- Update quotations table if needed
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='status') THEN
          ALTER TABLE quotations ADD COLUMN status TEXT DEFAULT 'pending';
        END IF;

        -- Update any existing NULL or empty statuses to 'pending' BEFORE adding constraint
        UPDATE quotations SET status = 'pending' WHERE status IS NULL OR status = '';
        
        -- Ensure status has correct check constraint
        ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
        ALTER TABLE quotations ADD CONSTRAINT quotations_status_check CHECK (status IN ('pending', 'approved', 'cancelled'));
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='payment_method') THEN
          ALTER TABLE quotations ADD COLUMN payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='due_date') THEN
          ALTER TABLE quotations ADD COLUMN due_date DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='is_sale') THEN
          ALTER TABLE quotations ADD COLUMN is_sale BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='company_id') THEN
          ALTER TABLE quotations ADD COLUMN company_id INTEGER;
          ALTER TABLE quotations ADD CONSTRAINT fk_quotation_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='customer_id') THEN
          ALTER TABLE quotations ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='service_id') THEN
          ALTER TABLE quotations ADD COLUMN service_id INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='expiry_date') THEN
          ALTER TABLE quotations ADD COLUMN expiry_date DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='currency') THEN
          ALTER TABLE quotations ADD COLUMN currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='exchange_rate') THEN
          ALTER TABLE quotations ADD COLUMN exchange_rate DECIMAL(12,4) DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='tax_number') THEN
          ALTER TABLE quotations ADD COLUMN tax_number TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='tax_office') THEN
          ALTER TABLE quotations ADD COLUMN tax_office TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='address') THEN
          ALTER TABLE quotations ADD COLUMN address TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_invoices' AND column_name='tax_number') THEN
          ALTER TABLE sales_invoices ADD COLUMN tax_number TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_invoices' AND column_name='tax_office') THEN
          ALTER TABLE sales_invoices ADD COLUMN tax_office TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_invoices' AND column_name='address') THEN
          ALTER TABLE sales_invoices ADD COLUMN address TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoices' AND column_name='tax_number') THEN
          ALTER TABLE purchase_invoices ADD COLUMN tax_number TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoices' AND column_name='tax_office') THEN
          ALTER TABLE purchase_invoices ADD COLUMN tax_office TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoices' AND column_name='address') THEN
          ALTER TABLE purchase_invoices ADD COLUMN address TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_transfers' AND column_name='prepared_by') THEN
          ALTER TABLE stock_transfers ADD COLUMN prepared_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_transfers' AND column_name='shipped_by') THEN
          ALTER TABLE stock_transfers ADD COLUMN shipped_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        license_number TEXT,
        license_class TEXT,
        blood_type TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS driver_documents (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- ehliyet, src, psikoteknik, etc.
        document_url TEXT,
        expiry_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
      );

      -- Fleet Management Tables
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        plate TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER,
        type TEXT CHECK (type IN ('personal', 'company')) DEFAULT 'company',
        chassis_number TEXT,
        engine_number TEXT,
        current_mileage REAL DEFAULT 0,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_service', 'broken', 'sold')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE(store_id, plate)
      );

      CREATE TABLE IF NOT EXISTS vehicle_documents (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- insurance, kasko, inspection, tax, permit, registration, etc.
        document_url TEXT,
        expiry_date DATE,
        is_recurring BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      );

      -- Add recurring fields to documents if they don't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicle_documents' AND column_name='recurrence_period') THEN
          ALTER TABLE vehicle_documents ADD COLUMN recurrence_period TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_documents' AND column_name='is_recurring') THEN
          ALTER TABLE driver_documents ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver_documents' AND column_name='recurrence_period') THEN
          ALTER TABLE driver_documents ADD COLUMN recurrence_period TEXT;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS vehicle_maintenance (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- periodic, repair, tire, etc.
        date DATE NOT NULL,
        mileage REAL,
        cost DECIMAL(12,2) DEFAULT 0,
        currency TEXT DEFAULT 'TRY',
        provider_name TEXT,
        description TEXT,
        status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
        next_maintenance_date DATE,
        next_maintenance_mileage REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS vehicle_assignments (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        user_id INTEGER,
        driver_id INTEGER,
        start_date DATE NOT NULL,
        end_date DATE,
        start_mileage REAL,
        end_mileage REAL,
        notes TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
        CONSTRAINT assignment_target_check CHECK (user_id IS NOT NULL OR driver_id IS NOT NULL)
      );

      CREATE TABLE IF NOT EXISTS vehicle_mileage_logs (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        mileage REAL NOT NULL,
        user_id INTEGER,
        driver_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
      );

      -- Update vehicle_assignments if it already exists
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicle_assignments' AND column_name='user_id' AND is_nullable='NO') THEN
          ALTER TABLE vehicle_assignments ALTER COLUMN user_id DROP NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicle_assignments' AND column_name='driver_id') THEN
          ALTER TABLE vehicle_assignments ADD COLUMN driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicle_mileage_logs' AND column_name='driver_id') THEN
          ALTER TABLE vehicle_mileage_logs ADD COLUMN driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS vehicle_incidents (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        type TEXT CHECK (type IN ('accident', 'breakdown')) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        cost DECIMAL(12,2) DEFAULT 0,
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'repaired', 'totaled')),
        report_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        user_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        details TEXT,
        old_value JSONB,
        new_value JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      -- Update stock_transfers status constraint
      ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_status_check;
      ALTER TABLE stock_transfers ADD CONSTRAINT stock_transfers_status_check CHECK (status IN ('pending', 'accepted', 'preparing', 'shipped', 'completed', 'cancelled'));
    `);
    console.log("Schema queries completed.");

    // Ensure columns exist
    console.log("Ensuring columns exist...");
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='default_currency') THEN
          ALTER TABLE stores ADD COLUMN default_currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='language') THEN
          ALTER TABLE stores ADD COLUMN language TEXT DEFAULT 'tr';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='plan') THEN
          ALTER TABLE stores ADD COLUMN plan TEXT DEFAULT 'free';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='background_image_url') THEN
          ALTER TABLE stores ADD COLUMN background_image_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoices' AND column_name='currency') THEN
          ALTER TABLE purchase_invoices ADD COLUMN currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoices' AND column_name='payment_method') THEN
          ALTER TABLE purchase_invoices ADD COLUMN payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='contact_person') THEN
          ALTER TABLE companies ADD COLUMN contact_person TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicle_documents' AND column_name='is_recurring') THEN
          ALTER TABLE vehicle_documents ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);
    console.log("Columns checked.");

    console.log("Running additional updates...");
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token') THEN
          ALTER TABLE users ADD COLUMN reset_token TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token_expiry') THEN
          ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='updated_at') THEN
          ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock_quantity') THEN
          ALTER TABLE products ADD COLUMN stock_quantity REAL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='min_stock_level') THEN
          ALTER TABLE products ADD COLUMN min_stock_level REAL DEFAULT 5;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='unit') THEN
          ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'Adet';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category') THEN
          ALTER TABLE products ADD COLUMN category TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='image_url') THEN
          ALTER TABLE products ADD COLUMN image_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sub_category') THEN
          ALTER TABLE products ADD COLUMN sub_category TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='brand') THEN
          ALTER TABLE products ADD COLUMN brand TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='author') THEN
          ALTER TABLE products ADD COLUMN author TEXT;
        END IF;

        -- Marketplace Columns
        ALTER TABLE products ADD COLUMN IF NOT EXISTS pazarama_id TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_pazarama_active BOOLEAN DEFAULT FALSE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS pazarama_last_error TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS trendyol_id TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_trendyol_active BOOLEAN DEFAULT FALSE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS trendyol_last_error TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS hepsiburada_sku TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hepsiburada_active BOOLEAN DEFAULT FALSE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS hepsiburada_last_error TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS n11_id TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_n11_active BOOLEAN DEFAULT FALSE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS n11_last_error TEXT;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='labels') THEN
          ALTER TABLE products ADD COLUMN labels JSONB DEFAULT '[]';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='faq') THEN
          ALTER TABLE stores ADD COLUMN faq JSONB DEFAULT '[]';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='blog_posts') THEN
          ALTER TABLE stores ADD COLUMN blog_posts JSONB DEFAULT '[]';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='legal_pages') THEN
          ALTER TABLE stores ADD COLUMN legal_pages JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='custom_domain') THEN
          ALTER TABLE stores ADD COLUMN custom_domain TEXT UNIQUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='social_links') THEN
          ALTER TABLE stores ADD COLUMN social_links JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='due_date') THEN
          ALTER TABLE sales ADD COLUMN due_date DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='quotation_id') THEN
          ALTER TABLE sales ADD COLUMN quotation_id INTEGER;
          ALTER TABLE sales ADD CONSTRAINT fk_sale_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='notes') THEN
          ALTER TABLE sales ADD COLUMN notes TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='company_id') THEN
          ALTER TABLE sales ADD COLUMN company_id INTEGER;
          ALTER TABLE sales ADD CONSTRAINT fk_sale_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_name') THEN
          ALTER TABLE sales ADD COLUMN customer_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='currency') THEN
          ALTER TABLE sales ADD COLUMN currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='exchange_rate') THEN
          ALTER TABLE sales ADD COLUMN exchange_rate DECIMAL(12,4) DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_phone') THEN
          ALTER TABLE sales ADD COLUMN customer_phone TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_address') THEN
          ALTER TABLE sales ADD COLUMN customer_address TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='payment_method') THEN
          ALTER TABLE sales ADD COLUMN payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='current_account_transactions' AND column_name='sale_id') THEN
          ALTER TABLE current_account_transactions ADD COLUMN sale_id INTEGER;
          ALTER TABLE current_account_transactions ADD CONSTRAINT fk_transaction_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='current_account_transactions' AND column_name='purchase_invoice_id') THEN
          ALTER TABLE current_account_transactions ADD COLUMN purchase_invoice_id INTEGER;
          ALTER TABLE current_account_transactions ADD CONSTRAINT fk_transaction_purchase_invoice FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='current_account_transactions' AND column_name='sales_invoice_id') THEN
          ALTER TABLE current_account_transactions ADD COLUMN sales_invoice_id INTEGER;
          ALTER TABLE current_account_transactions ADD CONSTRAINT fk_transaction_sales_invoice FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoices(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='current_account_transactions' AND column_name='payment_method') THEN
          ALTER TABLE current_account_transactions ADD COLUMN payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='product_name') THEN
          ALTER TABLE sale_items ADD COLUMN product_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='barcode') THEN
          ALTER TABLE sale_items ADD COLUMN barcode TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='currency') THEN
          ALTER TABLE sale_items ADD COLUMN currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotation_items' AND column_name='product_name') THEN
          ALTER TABLE quotation_items ADD COLUMN product_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotation_items' AND column_name='barcode') THEN
          ALTER TABLE quotation_items ADD COLUMN barcode TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='branch_id') THEN
          ALTER TABLE sale_items ADD COLUMN branch_id INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='branch_name') THEN
          ALTER TABLE sale_items ADD COLUMN branch_name TEXT;
        END IF;
      END $$;
    `);
    console.log("Additional updates completed.");

    console.log("Running duplicate company cleanup...");
    await client.query(`
      DO $$ 
      BEGIN 
        -- 1. Update transactions to point to the first instance of a company
        UPDATE current_account_transactions t
        SET company_id = sub.min_id
        FROM (
          SELECT c1.id as old_id, (
            SELECT MIN(c2.id) 
            FROM companies c2 
            WHERE c2.store_id = c1.store_id 
            AND LOWER(TRIM(c2.title)) = LOWER(TRIM(c1.title))
          ) as min_id
          FROM companies c1
        ) sub
        WHERE t.company_id = sub.old_id AND t.company_id != sub.min_id;

        -- 2. Update quotations to point to the first instance of a company
        UPDATE quotations q
        SET company_id = sub.min_id
        FROM (
          SELECT c1.id as old_id, (
            SELECT MIN(c2.id) 
            FROM companies c2 
            WHERE c2.store_id = c1.store_id 
            AND LOWER(TRIM(c2.title)) = LOWER(TRIM(c1.title))
          ) as min_id
          FROM companies c1
        ) sub
        WHERE q.company_id = sub.old_id AND q.company_id != sub.min_id;

        -- 3. Delete duplicate companies (keep the one with the smallest ID)
        DELETE FROM companies
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM companies
          GROUP BY store_id, LOWER(TRIM(title))
        );

        -- 4. Ensure unique index for case-insensitive uniqueness
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_companies_store_title_lower') THEN
          CREATE UNIQUE INDEX idx_companies_store_title_lower ON companies (store_id, LOWER(TRIM(title)));
        END IF;

        -- 5. Remove incorrect unique constraint for transactions that was preventing multiple entries per quotation
        ALTER TABLE current_account_transactions DROP CONSTRAINT IF EXISTS current_account_transactions_quotation_id_key;
      END $$;
    `);
    console.log("Duplicate company cleanup completed.");

    // Ensure cascades for foreign keys to prevent 502 errors on deletion
    console.log("Ensuring foreign key cascades...");
    await client.query(`
      DO $$ 
      BEGIN 
        -- scan_logs -> products
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='scan_logs' AND constraint_type='FOREIGN KEY' AND (constraint_name='scan_logs_product_id_fkey' OR constraint_name LIKE '%product_id_fkey%')) THEN
          -- We'll try to drop by name if we can find it, or just drop and recreate
          ALTER TABLE scan_logs DROP CONSTRAINT IF EXISTS scan_logs_product_id_fkey;
        END IF;
        ALTER TABLE scan_logs ADD CONSTRAINT scan_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

        -- scan_logs -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='scan_logs' AND constraint_type='FOREIGN KEY' AND (constraint_name='scan_logs_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE scan_logs DROP CONSTRAINT IF EXISTS scan_logs_store_id_fkey;
        END IF;
        ALTER TABLE scan_logs ADD CONSTRAINT scan_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

        -- products -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='products' AND constraint_type='FOREIGN KEY' AND (constraint_name='products_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE products DROP CONSTRAINT IF EXISTS products_store_id_fkey;
        END IF;
        ALTER TABLE products ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

        -- users -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='users' AND constraint_type='FOREIGN KEY' AND (constraint_name='users_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE users DROP CONSTRAINT IF EXISTS users_store_id_fkey;
        END IF;
        ALTER TABLE users ADD CONSTRAINT users_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

        -- tickets -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='tickets' AND constraint_type='FOREIGN KEY' AND (constraint_name='tickets_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_store_id_fkey;
        END IF;
        ALTER TABLE tickets ADD CONSTRAINT tickets_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

        -- customers table
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          store_id INTEGER NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          full_name TEXT,
          name TEXT,
          tax_number TEXT,
          tax_office TEXT,
          phone TEXT,
          address TEXT,
          social_id TEXT,
          social_provider TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
          UNIQUE(store_id, email)
        );

        ALTER TABLE customers ADD COLUMN IF NOT EXISTS name TEXT;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_number TEXT;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_office TEXT;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS surname TEXT;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS country TEXT;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS tc_id TEXT;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_corporate BOOLEAN DEFAULT FALSE;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS marketing_email BOOLEAN DEFAULT FALSE;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS marketing_sms BOOLEAN DEFAULT FALSE;

        -- return_requests table
        CREATE TABLE IF NOT EXISTS return_requests (
          id SERIAL PRIMARY KEY,
          store_id INTEGER NOT NULL,
          sale_id INTEGER NOT NULL,
          customer_id INTEGER NOT NULL,
          reason TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
          FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        );

        -- link sales to customers
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_id') THEN
          ALTER TABLE sales ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='shipping_carrier') THEN
          ALTER TABLE sales ADD COLUMN shipping_carrier TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='tracking_number') THEN
          ALTER TABLE sales ADD COLUMN tracking_number TEXT;
        END IF;
      END $$;
    `);
    console.log("Foreign key cascades checked.");

    // Seed Super Admin if not exists
    console.log("Seeding super admin...");
    const adminEmail = "admin@pricecheck.com";
    const existingAdmin = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await client.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3)", [adminEmail, hashedPassword, "superadmin"]);
    }
    console.log("Super admin seeded.");
    } finally {
      client.release();
      console.log("Database initialization finished.");
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

export async function logAction(
  storeId: number, 
  userId: number | null, 
  action: string, 
  entityType?: string, 
  entityId?: number, 
  details?: string, 
  oldValue?: any, 
  newValue?: any
) {
  try {
    await pool.query(
      "INSERT INTO audit_logs (store_id, user_id, action, entity_type, entity_id, details, old_value, new_value) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [storeId, userId, action, entityType, entityId, details, oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null]
    );
  } catch (e) {
    console.error("Audit Log Error:", e);
  }
}

export async function addStockMovement(client: any, storeId: number, productId: number, type: 'in' | 'out', quantity: number, source: string, description: string, unitPrice: any = null, customerInfo: any = null, currency: any = 'TRY') {
  const price = unitPrice !== null && unitPrice !== undefined ? Number(unitPrice) : null;
  const info = customerInfo !== null && customerInfo !== undefined ? String(customerInfo) : null;
  const curr = currency !== null && currency !== undefined ? String(currency) : 'TRY';
  await client.query(
    "INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [storeId, productId, type, quantity, source, description, price, info, curr]
  );
}

export async function processSaleAutomation(client: any, saleId: number, storeId: number) {
  try {
    // 1. Fetch sale and items
    const saleRes = await client.query("SELECT * FROM sales WHERE id = $1 AND store_id = $2 FOR UPDATE", [saleId, storeId]);
    if (saleRes.rows.length === 0) return;
    const sale = saleRes.rows[0];

    const itemsRes = await client.query("SELECT * FROM sale_items WHERE sale_id = $1", [saleId]);
    const items = itemsRes.rows;

    // 2. Deduct Stock and Log Movements
    for (const item of items) {
      if (item.product_id) {
        const productRes = await client.query("SELECT product_type, tax_rate FROM products WHERE id = $1", [item.product_id]);
        const product = productRes.rows[0];
        const productType = product?.product_type || 'product';

        if (productType !== 'service') {
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
            [item.quantity, item.product_id, storeId]
          );
          await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'web', `Web Satışı #${saleId}`, item.unit_price, sale.customer_name);
        }
      }
    }

    // 3. Create Sales Invoice
    const prefix = 'WEB';
    const year = new Date().getFullYear();
    const countRes = await client.query("SELECT COUNT(*) FROM sales_invoices WHERE store_id = $1 AND invoice_number LIKE $2", [storeId, `${prefix}${year}%`]);
    const invoiceNumber = `${prefix}${year}${(Number(countRes.rows[0].count) + 1).toString().padStart(6, '0')}`;

    let totalAmount = 0;
    let totalTax = 0;

    for (const item of items) {
       const itemTotal = Number(item.total_price);
       const taxRate = Number(item.tax_rate || 20);
       const taxAmount = itemTotal - (itemTotal / (1 + taxRate / 100));
       totalAmount += (itemTotal - taxAmount);
       totalTax += taxAmount;
    }

    const invoiceRes = await client.query(
      `INSERT INTO sales_invoices 
       (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, status, payment_method, invoice_type) 
       VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, 'final', $9, 'automatic') RETURNING id`,
      [storeId, saleId, sale.customer_id || null, invoiceNumber, totalAmount, totalTax, Number(sale.total_amount), sale.currency || 'TRY', sale.payment_method || 'iyzico']
    );
    const invoiceId = invoiceRes.rows[0].id;

    // 4. Create Invoice Items
    for (const item of items) {
      const itemTotal = Number(item.total_price);
      const taxRate = Number(item.tax_rate || 20);
      const taxAmount = itemTotal - (itemTotal / (1 + taxRate / 100));
      const netPrice = itemTotal - taxAmount;

      await client.query(
        `INSERT INTO sales_invoice_items 
         (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [invoiceId, item.product_id, item.product_name, item.barcode || '', item.quantity, (netPrice / item.quantity), taxRate, taxAmount, itemTotal]
      );
    }

    // 5. Create Sale Payment record
    const paymentCheck = await client.query("SELECT id FROM sale_payments WHERE sale_id = $1", [saleId]);
    if (paymentCheck.rows.length === 0) {
      await client.query(
        "INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES ($1, $2, $3)",
        [saleId, sale.payment_method || 'iyzico', sale.total_amount]
      );
    }

    await logAction(storeId, null, "sale_automation", "sales", saleId, `Web siparişi otomatik işlendi: Stok düşüldü, fatura #${invoiceNumber} oluşturuldu.`);

  } catch (error) {
    console.error("Sale Automation Error:", error);
    throw error;
  }
}

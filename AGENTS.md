# System & Branding Guidelines

This file outlines strict engineering, performance, and naming directives that must be followed by all development agents modifying the **LookPrice/Otomotiv/Emlak** workspace ecosystem.

---

## 1. Strict Naming & Corporate Mapping Rules

- **Display Names Over Slugs ("Firma Adı" over "Slug")**:
  - Always resolve and display the human-readable company/store name (e.g., `branding?.store_name` or `branding?.name` or fallback titles like `"Seçkin Emlak"`, `"Seçkin Otomotiv"`, `"Seçkin Mağaza"`) rather than printing raw technical slugs (e.g., `urlSlug`, `activeSlug`, `branding?.slug`).
  - Raw strings containing the term `"lookprice"` should have high-confidence fallback mappings to Turkish equivalents of premium service agencies (e.g. `"Premium VIP Emlak"`, `"Seçkin Mağaza"`, `"Seçkin Emlak"`) unless specifically requested.

- **Dynamic Contract Templates & Legal Documents**:
  - All contracts generated under `/src/components/AutoContractModal.tsx`, `/src/components/LegalContractModal.tsx` must accurately inherit settings-level objects:
    - **Firma Adı**: Dynamically bind to `branding?.store_name` or `branding?.name`. Fallbacks must reflect premium names (`"Seçkin Emlak"` or `"Seçkin Otomotiv"`), never hardcoded platform indicators.
    - **Detaylı İletişim & Telefon**: Strictly use `branding?.phone`, `branding?.whatsapp_number`, or other sectoral profile options configures in settings.
    - **Suites & Services Footer**: Standardized to dynamically computed store identifiers.

- **Zero Manual Post-Copy Correction ("Kopyala-Yapıştır Hazır")**:
  - Social media share modals (Real Estate, Automotive, and Product variants) must generate fully complete and accurate caption texts.
  - Clipboard copy operations (`getCaptionText`) must never output generic, static mockup data or dummy phone numbers (such as `+90 (548) 000 0000`) if any valid phone parameters exist in `branding`.
  - All hashtags and brand labels should dynamically sanitize special characters from the exact customer store's name.

---

## 2. Startup & Performance Optimization Rules

- **Bypass Flash Loadings & Blocking Splashes**:
  - Never default initial check states (e.g. `isCheckingDomain`) to `true` if they can be evaluated synchronously based on initial client-side metadata (e.g., matching known local or system hostnames synchronously).
  - Keeps initial loading visual transitions elegant and free of unnecessary layout shifts.

- **Asset Chunks and Lazy Loading (code split)**:
  - All lazy-loaded components in `/src/App.tsx` must be retained to maintain minimal initial asset sizes.
  - Large external bundles (utility worksheets, PDF generators, charts) must be designated inside the Vite config under target vendor chunks to avoid bundle bloat.

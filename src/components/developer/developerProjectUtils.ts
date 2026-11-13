import { toast } from "sonner";

export type SuiteTab =
  | "showcase"
  | "inventory"
  | "compare"
  | "agencies"
  | "leads_contracts"
  | "events"
  | "b2b_portal_preview";

export type InventoryViewMode = "grouped_types" | "block_matrix" | "table_list";
export type ProjectSubTab = "property_types" | "common_areas" | "folders";

export interface DeveloperProjectSuiteProps {
  storeId?: number;
  branding?: any;
  user?: any;
  initialSection?: SuiteTab;
  isStandaloneDeveloperStore?: boolean;
  onBackToPortfolio?: () => void;
  onConvertUnitToProperty?: (unitPayload: any) => void;
}

export const DEFAULT_FOLDER_CATEGORIES = [
  "Teknik & Mimari Planlar",
  "Masterplan & Kat Planları",
  "Fiyat Listesi & Ödeme Planı",
  "4K Görsel & Render Paketi",
  "Sosyal Medya & Tanıtım Videoları",
  "Ruhsat & Hukuki Belgeler",
  "Ortak Alanlar & Sosyal Tesisler"
];

export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  quality = 0.84
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          resolve(new File([blob], file.name, { type: file.type || "image/jpeg" }));
        },
        file.type || "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

export function extractFacilityItems(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.flatMap((item) => extractFacilityItems(item));
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        return extractFacilityItems(JSON.parse(trimmed));
      } catch {
        // ignore JSON parse error
      }
    }
    return [trimmed];
  }
  if (typeof val === "object") {
    return Object.values(val).flatMap((v) => extractFacilityItems(v));
  }
  return [String(val)];
}

export function formatGbp(val: number | string): string {
  const n = Number(val) || 0;
  return `£${new Intl.NumberFormat("tr-TR").format(n)}`;
}

export type ShowcaseSectionRole =
  | "exterior"
  | "interior"
  | "floorplan"
  | "lifestyle"
  | "masterplan";

export type MediaRoleType =
  | ShowcaseSectionRole
  | "photo"
  | "video"
  | "document";

export const UNIT_SHOWCASE_SECTIONS: Array<{
  role: "exterior" | "interior" | "floorplan" | "lifestyle";
  label: string;
  shortDesc: string;
  defaultCategory: string;
}> = [
  {
    role: "exterior",
    label: "Dış Cephe",
    shortDesc: "Dış cephe, blok silüeti & çevre mimarisi",
    defaultCategory: "4K Görsel & Render Paketi"
  },
  {
    role: "interior",
    label: "İç Mekan",
    shortDesc: "Salon, mutfak, yatak odası & teras görünümü",
    defaultCategory: "4K Görsel & Render Paketi"
  },
  {
    role: "floorplan",
    label: "3B Kat Planı",
    shortDesc: "3B izometrik kat kesiti & yerleşim planı",
    defaultCategory: "Masterplan & Kat Planları"
  },
  {
    role: "lifestyle",
    label: "Sahil & Havuz",
    shortDesc: "Lagün havuz, özel plaj & sosyal yaşam alanı",
    defaultCategory: "Ortak Alanlar & Sosyal Tesisler"
  }
];

export function extractYouTubeVideoId(url?: string): string | null {
  const raw = String(url || "").trim();
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const seg = parsed.pathname.split("/").filter(Boolean)[0];
      return seg && /^[a-zA-Z0-9_-]{6,20}$/.test(seg) ? seg : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
      const vParam = parsed.searchParams.get("v");
      if (vParam && /^[a-zA-Z0-9_-]{6,20}$/.test(vParam)) return vParam;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && ["embed", "shorts", "live", "v"].includes(parts[0])) {
        return /^[a-zA-Z0-9_-]{6,20}$/.test(parts[1]) ? parts[1] : null;
      }
    }
  } catch {
    const match = raw.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,20})/i);
    if (match && match[1]) return match[1];
  }
  return null;
}

export function isYouTubeUrl(url?: string): boolean {
  return Boolean(extractYouTubeVideoId(url));
}

export function getYouTubeEmbedUrl(url?: string, autoplay = true): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}`;
}

export function getYouTubeThumbnailUrl(url?: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getGoogleDrivePreviewUrl(url?: string): string | null {
  const raw = String(url || "").trim();
  if (!raw || !raw.toLowerCase().includes("drive.google.com")) return null;
  if (raw.toLowerCase().includes("/drive/folders/")) return null;
  const match = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return null;
}

export function isDirectVideoFileUrl(url?: string): boolean {
  const raw = String(url || "").trim().toLowerCase();
  if (!raw || isYouTubeUrl(raw)) return false;
  return /\.(mp4|mov|webm|mkv|m4v)(\?|$)/i.test(raw);
}

export function isDownloadableAssetUrl(url?: string): boolean {
  const raw = String(url || "").trim();
  if (!raw) return false;
  if (isYouTubeUrl(raw)) return false;
  const lower = raw.toLowerCase();
  if (lower.includes("drive.google.com/drive/folders/")) return false;
  if (lower.includes("vimeo.com/")) return false;
  return true;
}

export function isRenderableImageUrl(itemUrl?: string): boolean {
  const raw = String(itemUrl || "").trim();
  if (!raw) return false;
  if (isYouTubeUrl(raw)) return false;
  const lower = raw.toLowerCase();
  if (lower.includes("drive.google.com/drive/folders/")) return false;
  if (lower.match(/\.(mp4|mov|webm|avi|mkv|pdf|dwg|xlsx|xls|doc|docx|zip)(\?|$)/i)) return false;
  return (
    raw.startsWith("/api/storage/") ||
    raw.startsWith("/uploads/") ||
    raw.startsWith("/assets/") ||
    raw.startsWith("data:image/") ||
    raw.startsWith("http://") ||
    raw.startsWith("https://")
  );
}

export function inferMediaType(
  fileName: string,
  folderCategory: string,
  mediaRole?: string,
  itemUrl?: string
) {
  if (mediaRole === "video" || isYouTubeUrl(itemUrl) || isYouTubeUrl(fileName)) return "video";
  if (
    mediaRole === "photo" ||
    mediaRole === "exterior" ||
    mediaRole === "interior" ||
    mediaRole === "lifestyle" ||
    mediaRole === "masterplan"
  ) {
    const lowerCheck = fileName.toLowerCase();
    if (lowerCheck.endsWith(".pdf") || lowerCheck.endsWith(".dwg")) return "masterplan";
    return "photos";
  }
  if (mediaRole === "floorplan") {
    const lowerCheck = fileName.toLowerCase();
    if (lowerCheck.match(/\.(jpg|jpeg|png|webp)$/)) return "photos";
    return "masterplan";
  }
  const lower = fileName.toLowerCase();
  const lowerUrl = String(itemUrl || "").toLowerCase();
  if (
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".webm") ||
    lowerUrl.match(/\.(mp4|mov|webm)(\?|$)/i) ||
    folderCategory.toLowerCase().includes("video")
  ) {
    return "video";
  }
  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    folderCategory.toLowerCase().includes("görsel") ||
    folderCategory.toLowerCase().includes("render")
  ) {
    return "photos";
  }
  if (folderCategory.toLowerCase().includes("fiyat") || lower.includes("price")) {
    return "pricelist";
  }
  if (folderCategory.toLowerCase().includes("ruhsat") || folderCategory.toLowerCase().includes("hukuk")) {
    return "legal";
  }
  return "masterplan";
}

export function resolveDisplayImageUrl(itemUrl?: string, fallbackCover?: string): string {
  const raw = String(itemUrl || "").trim();
  const fallback = fallbackCover || "";
  if (!raw) return fallback;
  const ytThumb = getYouTubeThumbnailUrl(raw);
  if (ytThumb) return ytThumb;
  const lower = raw.toLowerCase();
  if (
    lower.includes("drive.google.com/drive/folders/") ||
    lower.match(/\.(mp4|mov|webm|pdf|dwg|xlsx|xls|doc|docx|zip)(\?|$)/i)
  ) {
    return fallback;
  }
  if (
    raw.startsWith("/api/storage/") ||
    raw.startsWith("/uploads/") ||
    raw.startsWith("/assets/") ||
    raw.startsWith("data:image/")
  ) {
    return raw;
  }
  const driveMatch =
    raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1400`;
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return fallback;
}

export function getStatusBadgeMeta(status: string) {
  if (status === "available") {
    return {
      label: "MÜSAİT",
      chipBg: "bg-emerald-500 text-slate-950 border-emerald-400",
      pillBg: "bg-emerald-100 text-emerald-800 border-emerald-300"
    };
  }
  if (status === "negotiation") {
    return {
      label: "SONUÇLANMAKTA",
      chipBg: "bg-sky-400 text-slate-950 border-sky-300",
      pillBg: "bg-sky-100 text-sky-900 border-sky-300"
    };
  }
  if (status === "optioned") {
    return {
      label: "OPSİYONLU",
      chipBg: "bg-amber-400 text-slate-950 border-amber-300",
      pillBg: "bg-amber-100 text-amber-900 border-amber-300"
    };
  }
  return {
    label: "SATILDI",
    chipBg: "bg-rose-500 text-white border-rose-400",
    pillBg: "bg-rose-100 text-rose-800 border-rose-300"
  };
}

export const SECTION_BAND_THEMES = [
  {
    name: "slate",
    cardBg: "bg-white border-slate-200 border-l-4 border-l-slate-800 shadow-2xs",
    headerBg: "bg-slate-50 border-b border-slate-200 text-slate-950",
    badgeBg: "bg-slate-900 text-white",
    subBadgeBg: "bg-white text-slate-900 border-slate-300",
    innerBoxBg: "bg-slate-50/70 border-slate-200",
    footerBg: "bg-slate-50 border-t border-slate-200",
    rowBg: "bg-white hover:bg-slate-50 border-l-4 border-l-slate-700"
  },
  {
    name: "indigo",
    cardBg: "bg-indigo-50/35 border-indigo-200 border-l-4 border-l-indigo-600 shadow-2xs",
    headerBg: "bg-indigo-50/70 border-b border-indigo-200 text-slate-950",
    badgeBg: "bg-indigo-600 text-white",
    subBadgeBg: "bg-white text-indigo-950 border-indigo-200",
    innerBoxBg: "bg-white border-indigo-100",
    footerBg: "bg-indigo-50/40 border-t border-indigo-200",
    rowBg: "bg-indigo-50/30 hover:bg-indigo-50/70 border-l-4 border-l-indigo-500"
  },
  {
    name: "emerald",
    cardBg: "bg-emerald-50/35 border-emerald-200 border-l-4 border-l-emerald-600 shadow-2xs",
    headerBg: "bg-emerald-50/70 border-b border-emerald-200 text-slate-950",
    badgeBg: "bg-emerald-600 text-white",
    subBadgeBg: "bg-white text-emerald-950 border-emerald-200",
    innerBoxBg: "bg-white border-emerald-100",
    footerBg: "bg-emerald-50/40 border-t border-emerald-200",
    rowBg: "bg-emerald-50/30 hover:bg-emerald-50/70 border-l-4 border-l-emerald-500"
  },
  {
    name: "sky",
    cardBg: "bg-sky-50/35 border-sky-200 border-l-4 border-l-sky-600 shadow-2xs",
    headerBg: "bg-sky-50/70 border-b border-sky-200 text-slate-950",
    badgeBg: "bg-sky-600 text-white",
    subBadgeBg: "bg-white text-sky-950 border-sky-200",
    innerBoxBg: "bg-white border-sky-100",
    footerBg: "bg-sky-50/40 border-t border-sky-200",
    rowBg: "bg-sky-50/30 hover:bg-sky-50/70 border-l-4 border-l-sky-500"
  }
];

export const getSectionBandTheme = (index: number) =>
  SECTION_BAND_THEMES[Math.abs(index) % SECTION_BAND_THEMES.length];

export function printProjectSheet(
  project: any,
  companyDisplayName: string,
  activeCompany: any
) {
  if (!project) return;
  const plan = project.payment_plan || {};
  const specs: string[] = Array.isArray(project.architectural_specs) ? project.architectural_specs : [];
  const printWin = window.open("", "_blank", "width=950,height=1100");
  if (!printWin) {
    toast.error("Lütfen tarayıcı açılır pencere (pop-up) iznini aktif edin.");
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>${project.name} — Proje Bilgi & Fiyat Özeti</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { margin: 0; padding: 0; color: #0f172a; background: #fff; }
    .sheet { border: 2px solid #0f172a; padding: 8mm; height: 275mm; display: flex; flex-direction: column; justify-content: space-between; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 4mm; }
    .brand { font-size: 18pt; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; }
    .sub { font-size: 9pt; color: #475569; font-weight: 600; }
    .hero { position: relative; height: 82mm; border-radius: 8px; overflow: hidden; margin: 4mm 0; border: 1px solid #cbd5e1; }
    .hero img { width: 100%; height: 100%; object-fit: cover; }
    .price-badge { position: absolute; bottom: 10px; right: 10px; background: #0f172a; color: #f8fafc; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 14pt; }
    .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin-bottom: 4mm; }
    .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3mm; }
    .box-lbl { font-size: 7.5pt; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .box-val { font-size: 11pt; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
    .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 3.5mm; }
    .card h4 { margin: 0 0 2mm 0; font-size: 9.5pt; text-transform: uppercase; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5mm; }
    ul { margin: 0; padding-left: 14px; font-size: 8.5pt; line-height: 1.45; color: #334155; }
    .ftr { background: #0f172a; color: #fff; padding: 4mm; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 8.5pt; }
  </style>
</head>
<body>
  <div class="sheet">
    <div>
      <div class="hdr">
        <div>
          <div class="brand">${companyDisplayName}</div>
          <div class="sub">Proje Teknik & Satış Bilgi Formu</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;font-size:10pt;">${project.region} / ${project.sub_region || ""}</div>
          <div class="sub">Tarih: ${new Date().toLocaleDateString("tr-TR")}</div>
        </div>
      </div>

      <div style="margin-top:3mm; display:flex; justify-content:space-between; align-items:baseline;">
        <h1 style="margin:0; font-size:16pt; font-weight:800;">${project.name}</h1>
        <span style="font-size:9pt; font-weight:700; color:#047857;">Teslim: ${project.completion_date} (İnşaat: %${project.construction_progress})</span>
      </div>
      <p style="margin:1mm 0 2mm 0; font-size:9pt; color:#475569;">${project.concept_tagline || ""}</p>

      <div class="hero">
        <img src="${project.cover_image}" alt="${project.name}" />
        <div class="price-badge">Başlangıç: ${formatGbp(project.starting_price)}</div>
      </div>

      <div class="grid4">
        <div class="box">
          <div class="box-lbl">Peşinat Oranı</div>
          <div class="box-val">%${plan.down_payment_percent || 35}</div>
        </div>
        <div class="box">
          <div class="box-lbl">Faizsiz Taksit</div>
          <div class="box-val">${plan.installment_months || 36} Ay (%0 Faiz)</div>
        </div>
        <div class="box">
          <div class="box-lbl">Müsait / Toplam Ünite</div>
          <div class="box-val">${project.available_units} / ${project.total_units}</div>
        </div>
        <div class="box">
          <div class="box-lbl">Rezervasyon Depozitosu</div>
          <div class="box-val">${formatGbp(plan.reservation_deposit_gbp || 5000)}</div>
        </div>
      </div>

      <div class="cols">
        <div class="card">
          <h4>Teknik & Mimari Özellikler</h4>
          <ul>
            ${specs.slice(0, 5).map((s) => `<li>${s}</li>`).join("")}
          </ul>
        </div>
        <div class="card">
          <h4>Ödeme Planı Notları</h4>
          <ul>
            <li><strong>Plan:</strong> ${plan.plan_name || "Standart Ödeme Planı"}</li>
            <li><strong>Not:</strong> ${plan.notes || ""}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="ftr">
      <div>
        <div style="font-weight:800; font-size:10pt; color:#fbbf24;">${companyDisplayName}</div>
        <div>Merkez: ${activeCompany?.headquarters_region || "Girne, KKTC"}</div>
      </div>
      <div style="text-align:right;">
        <div><strong>İletişim:</strong> ${activeCompany?.phone || "+90 548 860 00 01"}</div>
        <div><strong>E-Posta:</strong> ${activeCompany?.email || "info@cyprusconstructions.com"}</div>
      </div>
    </div>
  </div>
  <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
</body>
</html>`;
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}

/**
 * Next-Gen Segment-Aware Creative Studio, Multi-Image Centered Collage & Multi-Scene Storyboard Video Engine
 *
 * Capabilities:
 * 1. Smart Subject Bounding-Box Detection (`getSmartSubjectBounds`) — finds the true visual center of any product photo
 *    so that single frames and multi-image collages are ALWAYS dead-center focused (`drawCenteredFocalImage`).
 * 2. Segment-Specific Contextual Staging (`desk_setup`, `user_lifestyle`, `closet_organizer`, `studio_macro`) —
 *    stages products inside realistic visual environments (modern office desk, user lifestyle context, wardrobe/closet shelves).
 * 3. Multi-Image Collage Layouts (`single`, `collage_2`, `collage_3`, `collage_4`) — uses all product images (or smart focal crops)
 *    with balanced margins and centered focal points.
 * 4. 4-Scene Commercial Storyboard Video Reel (`recordPosterReel`) — creates a 6-second multi-scene video commercial
 *    combining contextual staging, multi-image angle transitions, feature highlights, and sales CTA.
 */

export type SceneType = 'desk_setup' | 'user_lifestyle' | 'closet_organizer' | 'studio_macro';
export type CollageLayout = 'single' | 'collage_2' | 'collage_3' | 'collage_4';
export type ImageFitMode = 'smart_center' | 'contain_center' | 'cover_center';

export interface StorySceneItem {
  phase: string;
  subtitle: string;
  highlight: string;
}

export interface PosterConfig {
  width?: number;
  height?: number;
  aspectRatio: 'square' | 'story';
  template: 'modern_commerce' | 'futuristic_studio' | 'luxury_editorial' | 'vibrant_sale';
  sceneType?: SceneType;
  collageLayout?: CollageLayout;
  imageFitMode?: ImageFitMode;
  focalZoom?: number; // 0.85 to 1.35
  storeName: string;
  kicker: string;
  headline: string;
  badge: string;
  title: string;
  price: string;
  oldPrice?: string | null;
  currencySymbol?: string;
  imageElement?: HTMLImageElement | null;
  imageElements?: HTMLImageElement[];
  brand?: string;
  category?: string;
  phone?: string;
  scenarioTitle?: string;
  scenarioDescription?: string;
  storyScenes?: StorySceneItem[];
  specs?: Array<{ label: string; value: string }>;
  animationProgress?: number; // undefined for static poster, 0.0 to 1.0 for multi-scene video reel
}

interface SubjectBounds {
  x: number;
  y: number;
  w: number;
  h: number;
  centerX: number;
  centerY: number;
  hasWhiteBg: boolean;
}

/**
 * Loads an image safely with cross-origin handling and proxy fallback
 */
export const loadPosterImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!url) {
      return reject(new Error("Empty image URL"));
    }
    if (url.startsWith('data:')) {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = "anonymous";
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = (e) => reject(e);
      fallbackImg.src = proxyUrl;
    };
    img.src = url;
  });
};

/**
 * Analyzes an image's pixels to find the true visual bounding box & center of gravity of the product
 * (trims uneven white or transparent borders so the product is always dead-center in collages and outputs)
 */
export function getSmartSubjectBounds(img: HTMLImageElement): SubjectBounds {
  const cached = (img as any).__subjectBounds as SubjectBounds | undefined;
  if (cached) return cached;

  const nw = img.naturalWidth || img.width || 500;
  const nh = img.naturalHeight || img.height || 500;
  const defaultBounds: SubjectBounds = {
    x: 0,
    y: 0,
    w: nw,
    h: nh,
    centerX: nw / 2,
    centerY: nh / 2,
    hasWhiteBg: false
  };

  try {
    const sampleSize = 120;
    const off = document.createElement('canvas');
    off.width = sampleSize;
    off.height = sampleSize;
    const octx = off.getContext('2d');
    if (!octx) return defaultBounds;

    octx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const imgData = octx.getImageData(0, 0, sampleSize, sampleSize).data;

    let minX = sampleSize;
    let minY = sampleSize;
    let maxX = 0;
    let maxY = 0;
    let whiteCorners = 0;

    // Check 4 corners to see if studio white background
    const cornerIndices = [
      0,
      (sampleSize - 1) * 4,
      (sampleSize * (sampleSize - 1)) * 4,
      (sampleSize * sampleSize - 1) * 4
    ];
    for (const idx of cornerIndices) {
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      const a = imgData[idx + 3];
      if (a < 20 || (r > 240 && g > 240 && b > 240)) {
        whiteCorners++;
      }
    }

    const hasWhiteBg = whiteCorners >= 3;

    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const i = (y * sampleSize + x) * 4;
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        // Consider pixel part of subject if not transparent and not near-pure white
        const isSubject = a > 35 && !(r > 243 && g > 243 && b > 243);
        if (isSubject) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX > minX + 8 && maxY > minY + 8) {
      const scaleX = nw / sampleSize;
      const scaleY = nh / sampleSize;
      // Add a small breathing margin around detected subject
      const padX = (maxX - minX) * 0.06;
      const padY = (maxY - minY) * 0.06;
      const sx = Math.max(0, (minX - padX) * scaleX);
      const sy = Math.max(0, (minY - padY) * scaleY);
      const sw = Math.min(nw - sx, (maxX - minX + padX * 2) * scaleX);
      const sh = Math.min(nh - sy, (maxY - minY + padY * 2) * scaleY);

      const result: SubjectBounds = {
        x: sx,
        y: sy,
        w: sw,
        h: sh,
        centerX: sx + sw / 2,
        centerY: sy + sh / 2,
        hasWhiteBg
      };
      (img as any).__subjectBounds = result;
      return result;
    }
  } catch (e) {
    // Ignore CORS pixel read issues if any, use geometric center
  }

  (img as any).__subjectBounds = defaultBounds;
  return defaultBounds;
}

/**
 * Helper to draw rounded rectangle
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | number[]
) {
  const r = typeof radius === 'number' ? [radius, radius, radius, radius] : radius;
  ctx.beginPath();
  ctx.moveTo(x + r[0], y);
  ctx.lineTo(x + width - r[1], y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r[1]);
  ctx.lineTo(x + width, y + height - r[2]);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r[2], y + height);
  ctx.lineTo(x + r[3], y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r[3]);
  ctx.lineTo(x, y + r[0]);
  ctx.quadraticCurveTo(x, y, x + r[0], y);
  ctx.closePath();
}

/**
 * Draws an image into a target box with its TRUE SUBJECT FOCAL POINT dead-centered!
 */
function drawCenteredFocalImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  options: {
    fitMode?: ImageFitMode;
    zoom?: number;
    panX?: number;
    panY?: number;
    radius?: number;
    badgeLabel?: string;
    blendOnStage?: boolean;
  } = {}
) {
  const {
    fitMode = 'smart_center',
    zoom = 1.0,
    panX = 0,
    panY = 0,
    radius = 22,
    badgeLabel,
    blendOnStage = false
  } = options;

  const bounds = getSmartSubjectBounds(img);

  ctx.save();
  roundRect(ctx, boxX, boxY, boxW, boxH, radius);
  ctx.clip();

  // Fill clean background inside cell if needed
  if (!blendOnStage) {
    ctx.fillStyle = bounds.hasWhiteBg ? '#ffffff' : '#0f172a';
    ctx.fillRect(boxX, boxY, boxW, boxH);
  }

  if (fitMode === 'contain_center' || (fitMode === 'smart_center' && bounds.hasWhiteBg)) {
    // Center the detected subject bounding box inside the target frame without cutting off any part of the product!
    const subjectRatio = bounds.w / bounds.h;
    const targetRatio = boxW / boxH;

    const paddingFactor = 0.88 * zoom;
    let drawW = boxW * paddingFactor;
    let drawH = boxH * paddingFactor;

    if (subjectRatio > targetRatio) {
      drawH = drawW / subjectRatio;
    } else {
      drawW = drawH * subjectRatio;
    }

    const destX = boxX + (boxW - drawW) / 2 + panX;
    const destY = boxY + (boxH - drawH) / 2 + panY;

    if (bounds.hasWhiteBg && !blendOnStage) {
      // Soft radial studio pedestal behind white-background product
      const rad = ctx.createRadialGradient(
        boxX + boxW / 2,
        boxY + boxH / 2,
        Math.min(boxW, boxH) * 0.1,
        boxX + boxW / 2,
        boxY + boxH / 2,
        Math.max(boxW, boxH) * 0.65
      );
      rad.addColorStop(0, '#ffffff');
      rad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = rad;
      ctx.fillRect(boxX, boxY, boxW, boxH);
    }

    // Subtle ground contact shadow
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.beginPath();
    ctx.ellipse(
      boxX + boxW / 2,
      destY + drawH - 4,
      drawW * 0.36,
      Math.max(6, drawH * 0.035),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    ctx.drawImage(img, bounds.x, bounds.y, bounds.w, bounds.h, destX, destY, drawW, drawH);
  } else {
    // Cover mode centered strictly on `bounds.centerX, bounds.centerY`
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;
    const targetRatio = boxW / boxH;
    const imgRatio = nw / nh;

    let sWidth = nw / zoom;
    let sHeight = nh / zoom;

    if (imgRatio > targetRatio) {
      sWidth = sHeight * targetRatio;
    } else {
      sHeight = sWidth / targetRatio;
    }

    // Center crop around the detected subject center!
    let sX = bounds.centerX - sWidth / 2 - panX;
    let sY = bounds.centerY - sHeight / 2 - panY;

    // Clamp to image boundaries
    sX = Math.max(0, Math.min(nw - sWidth, sX));
    sY = Math.max(0, Math.min(nh - sHeight, sY));

    ctx.drawImage(img, sX, sY, sWidth, sHeight, boxX, boxY, boxW, boxH);
  }

  // Optional corner focus label (e.g. "Açı 1", "Yakın Plan", "Detay")
  if (badgeLabel) {
    ctx.save();
    ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const tw = ctx.measureText(badgeLabel).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    roundRect(ctx, boxX + 14, boxY + boxH - 38, tw + 22, 26, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(badgeLabel, boxX + 25, boxY + boxH - 20);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renders the Segment-Specific Contextual Environment Stage inside a stage box
 * (`desk_setup` | `user_lifestyle` | `closet_organizer` | `studio_macro`)
 */
function renderContextualScenarioStage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  stageX: number,
  stageY: number,
  stageW: number,
  stageH: number,
  sceneType: SceneType,
  config: PosterConfig,
  animT: number = 0
) {
  ctx.save();
  roundRect(ctx, stageX, stageY, stageW, stageH, 26);
  ctx.clip();

  const bounds = getSmartSubjectBounds(img);
  const pulse = Math.sin(animT * Math.PI * 2);

  if (sceneType === 'desk_setup') {
    // 1. MODERN ERGONOMIC OFFICE / GAMING DESK SETUP ENVIRONMENT
    // Upper architectural studio wall with ambient monitor/lamp glow
    const wallGrad = ctx.createLinearGradient(stageX, stageY, stageX, stageY + stageH * 0.68);
    wallGrad.addColorStop(0, '#0f172a');
    wallGrad.addColorStop(0.6, '#1e293b');
    wallGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(stageX, stageY, stageW, stageH);

    // Subtle acoustic wall panels in background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 2;
    const panelStep = 42;
    for (let px = stageX; px < stageX + stageW; px += panelStep) {
      ctx.beginPath();
      ctx.moveTo(px, stageY);
      ctx.lineTo(px, stageY + stageH * 0.68);
      ctx.stroke();
    }

    // Ambient Dual-Tone Backlight (Warm Key Light + Cyan/Indigo Monitor Glow)
    const monitorGlow = ctx.createRadialGradient(
      stageX + stageW * 0.5 + pulse * 25,
      stageY + stageH * 0.42,
      20,
      stageX + stageW * 0.5,
      stageY + stageH * 0.42,
      stageW * 0.55
    );
    monitorGlow.addColorStop(0, 'rgba(56, 189, 248, 0.32)');
    monitorGlow.addColorStop(0.5, 'rgba(99, 102, 241, 0.16)');
    monitorGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = monitorGlow;
    ctx.fillRect(stageX, stageY, stageW, stageH);

    // Perspective Walnut / Matte Carbon Desk Surface at bottom 34%
    const deskTopY = stageY + stageH * 0.66;
    const deskGrad = ctx.createLinearGradient(stageX, deskTopY, stageX, stageY + stageH);
    deskGrad.addColorStop(0, '#27201c'); // warm dark walnut edge
    deskGrad.addColorStop(0.12, '#1c1917');
    deskGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = deskGrad;
    ctx.fillRect(stageX, deskTopY, stageW, stageH * 0.34);

    // Desk edge LED strip highlight
    const ledGrad = ctx.createLinearGradient(stageX, deskTopY, stageX + stageW, deskTopY);
    ledGrad.addColorStop(0, 'rgba(56, 189, 248, 0.1)');
    ledGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.75)');
    ledGrad.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
    ctx.fillStyle = ledGrad;
    ctx.fillRect(stageX, deskTopY, stageW, 3);

    // Desk Mat perspective trapezoid
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.moveTo(stageX + stageW * 0.18, deskTopY + 14);
    ctx.lineTo(stageX + stageW * 0.82, deskTopY + 14);
    ctx.lineTo(stageX + stageW * 0.92, stageY + stageH - 12);
    ctx.lineTo(stageX + stageW * 0.08, stageY + stageH - 12);
    ctx.closePath();
    ctx.fill();
  } else if (sceneType === 'closet_organizer') {
    // 2. WARDROBE / CLOSET INTERIOR & HUMAN ORGANIZATION STAGE
    const closetGrad = ctx.createLinearGradient(stageX, stageY, stageX, stageY + stageH);
    closetGrad.addColorStop(0, '#f5ebe0'); // Warm Scandinavian oak/linen
    closetGrad.addColorStop(0.65, '#e3d5ca');
    closetGrad.addColorStop(1, '#d5bdaf');
    ctx.fillStyle = closetGrad;
    ctx.fillRect(stageX, stageY, stageW, stageH);

    // Wardrobe side cabinet panels (3D interior perspective)
    ctx.fillStyle = 'rgba(180, 145, 115, 0.25)';
    ctx.fillRect(stageX, stageY, 38, stageH);
    ctx.fillRect(stageX + stageW - 38, stageY, 38, stageH);

    // Upper & Lower Wardrobe Shelf Beams
    ctx.fillStyle = '#c89f7c';
    ctx.fillRect(stageX, stageY + 22, stageW, 14);
    ctx.fillRect(stageX, stageY + stageH * 0.74, stageW, 18);

    // Warm recessed LED closet light from top shelf
    const shelfGlow = ctx.createRadialGradient(
      stageX + stageW * 0.5,
      stageY + 36,
      20,
      stageX + stageW * 0.5,
      stageY + stageH * 0.45,
      stageW * 0.65
    );
    shelfGlow.addColorStop(0, 'rgba(255, 251, 235, 0.85)');
    shelfGlow.addColorStop(1, 'rgba(255, 251, 235, 0)');
    ctx.fillStyle = shelfGlow;
    ctx.fillRect(stageX, stageY + 36, stageW, stageH * 0.7);
  } else if (sceneType === 'user_lifestyle') {
    // 3. ON-USER / LIFESTYLE EXPERIENCE ATMOSPHERE
    const lifeGrad = ctx.createLinearGradient(stageX, stageY, stageX + stageW, stageY + stageH);
    lifeGrad.addColorStop(0, '#1e1b4b');
    lifeGrad.addColorStop(0.5, '#312e81');
    lifeGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = lifeGrad;
    ctx.fillRect(stageX, stageY, stageW, stageH);

    // Golden-hour bokeh lifestyle orbs
    const bokehPositions = [
      { x: 0.2, y: 0.25, r: 90, color: 'rgba(251, 191, 36, 0.22)' },
      { x: 0.8, y: 0.3, r: 120, color: 'rgba(244, 114, 182, 0.18)' },
      { x: 0.35, y: 0.75, r: 110, color: 'rgba(56, 189, 248, 0.20)' },
      { x: 0.75, y: 0.7, r: 85, color: 'rgba(167, 139, 250, 0.22)' }
    ];
    for (const b of bokehPositions) {
      const bx = stageX + stageW * b.x + pulse * 15;
      const by = stageY + stageH * b.y;
      const rg = ctx.createRadialGradient(bx, by, 5, bx, by, b.r);
      rg.addColorStop(0, b.color);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // 4. STUDIO MACRO PODIUM
    const studioGrad = ctx.createRadialGradient(
      stageX + stageW / 2,
      stageY + stageH / 2,
      30,
      stageX + stageW / 2,
      stageY + stageH / 2,
      stageW * 0.7
    );
    studioGrad.addColorStop(0, '#1e293b');
    studioGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = studioGrad;
    ctx.fillRect(stageX, stageY, stageW, stageH);
  }

  // Place the centered product onto the stage!
  const zoom = (config.focalZoom || 1.0) * (1.0 + animT * 0.04);
  const floatY = Math.sin(animT * Math.PI * 2) * 6;

  if (bounds.hasWhiteBg) {
    // Draw an elevated luxury studio frame / floating showcase card on the stage so white-bg product looks intentionally staged
    const prodBoxW = stageW * 0.78;
    const prodBoxH = stageH * 0.76;
    const prodBoxX = stageX + (stageW - prodBoxW) / 2;
    const prodBoxY = stageY + (stageH - prodBoxH) / 2 + floatY;

    // Contact shadow on desk/shelf
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(
      stageX + stageW / 2,
      prodBoxY + prodBoxH + 6,
      prodBoxW * 0.42,
      14,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    drawCenteredFocalImage(ctx, img, prodBoxX, prodBoxY, prodBoxW, prodBoxH, {
      fitMode: config.imageFitMode || 'smart_center',
      zoom,
      radius: 24
    });
    ctx.restore();
  } else {
    // Full-bleed centered focal crop for lifestyle/full-frame photos
    drawCenteredFocalImage(ctx, img, stageX, stageY, stageW, stageH, {
      fitMode: config.imageFitMode || 'cover_center',
      zoom,
      radius: 26,
      blendOnStage: true
    });
  }

  // Scenario Context Tag at top-left of stage
  const sceneBadges: Record<SceneType, string> = {
    desk_setup: '💻 MASAÜSTÜ & OFİS KURULUM SENARYOSU',
    user_lifestyle: '🎧 KULLANICI ÜZERİNDE CANLI DENEYİM',
    closet_organizer: '🧺 DOLAP İÇİ YERLEŞİM & DÜZEN SENARYOSU',
    studio_macro: '✨ MERKEZ ODAK & DETAY VİTRİNİ'
  };
  const label = config.scenarioTitle
    ? `✨ ${config.scenarioTitle.toUpperCase()}`
    : sceneBadges[sceneType];

  ctx.save();
  ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const lw = Math.min(stageW - 48, ctx.measureText(label).width + 28);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  roundRect(ctx, stageX + 18, stageY + 18, lw, 32, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.fillText(label.slice(0, 48), stageX + 32, stageY + 39);
  ctx.restore();

  ctx.restore();
}

/**
 * Generates virtual multi-angle focal views if the product has fewer images than the requested collage count,
 * or uses all actual product images when multiple images exist!
 */
function buildCollageFrames(images: HTMLImageElement[], targetCount: number): Array<{
  img: HTMLImageElement;
  zoom: number;
  panX: number;
  panY: number;
  label: string;
}> {
  if (images.length === 0) return [];

  const result: Array<{ img: HTMLImageElement; zoom: number; panX: number; panY: number; label: string }> = [];
  const angleLabels = ['Ana Sahne & Odak', 'Yakın Plan Detay', 'Perspektif & Doku', 'Kullanım & Form'];

  for (let i = 0; i < targetCount; i++) {
    if (i < images.length) {
      // Actual distinct image from product.images
      result.push({
        img: images[i],
        zoom: 1.0,
        panX: 0,
        panY: 0,
        label: images.length > 1 ? `Görsel ${i + 1} • Odak` : angleLabels[i]
      });
    } else {
      // Create a smart focal detail view from existing product image so collage is always rich
      const baseImg = images[i % images.length];
      const presets = [
        { zoom: 1.0, panX: 0, panY: 0, label: 'Merkez Odak' },
        { zoom: 1.28, panX: 0, panY: -15, label: 'Makro Detay' },
        { zoom: 1.22, panX: 15, panY: 15, label: 'Doku & İşçilik' },
        { zoom: 1.15, panX: -12, panY: 0, label: 'Tam Profil' }
      ];
      const p = presets[i % presets.length];
      result.push({
        img: baseImg,
        zoom: p.zoom,
        panX: p.panX,
        panY: p.panY,
        label: p.label
      });
    }
  }
  return result;
}

/**
 * Renders the visual stage either as Single Scenario Stage or Multi-Image Centered Collage (2, 3, or 4 images)
 */
function renderVisualStageOrCollage(
  ctx: CanvasRenderingContext2D,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  config: PosterConfig,
  animT: number = 0
) {
  const allImages =
    config.imageElements && config.imageElements.length > 0
      ? config.imageElements
      : config.imageElement
      ? [config.imageElement]
      : [];

  if (allImages.length === 0) {
    ctx.save();
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, boxX, boxY, boxW, boxH, 26);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ürün Görseli Yükleniyor...', boxX + boxW / 2, boxY + boxH / 2);
    ctx.restore();
    return;
  }

  const layout = config.collageLayout || 'single';
  const sceneType = config.sceneType || 'desk_setup';
  const gap = 14;

  if (layout === 'single') {
    renderContextualScenarioStage(ctx, allImages[0], boxX, boxY, boxW, boxH, sceneType, config, animT);

    // If product has multiple images even in single mode, show a sleek floating secondary angle PIP in bottom-right
    if (allImages.length > 1) {
      const pipSize = Math.min(boxW, boxH) * 0.28;
      const pipX = boxX + boxW - pipSize - 20;
      const pipY = boxY + boxH - pipSize - 20;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 18;
      drawCenteredFocalImage(ctx, allImages[1], pipX, pipY, pipSize, pipSize, {
        fitMode: config.imageFitMode || 'smart_center',
        zoom: 1.05,
        radius: 18,
        badgeLabel: '2. Açı'
      });
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      roundRect(ctx, pipX, pipY, pipSize, pipSize, 18);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  if (layout === 'collage_2') {
    const frames = buildCollageFrames(allImages, 2);
    const isStory = config.aspectRatio === 'story';
    if (isStory) {
      const cellH = (boxH - gap) / 2;
      renderContextualScenarioStage(ctx, frames[0].img, boxX, boxY, boxW, cellH, sceneType, config, animT);
      drawCenteredFocalImage(ctx, frames[1].img, boxX, boxY + cellH + gap, boxW, cellH, {
        fitMode: config.imageFitMode || 'smart_center',
        zoom: frames[1].zoom * (config.focalZoom || 1),
        panX: frames[1].panX,
        panY: frames[1].panY,
        radius: 22,
        badgeLabel: frames[1].label
      });
    } else {
      const cellW = (boxW - gap) / 2;
      renderContextualScenarioStage(ctx, frames[0].img, boxX, boxY, cellW, boxH, sceneType, config, animT);
      drawCenteredFocalImage(ctx, frames[1].img, boxX + cellW + gap, boxY, cellW, boxH, {
        fitMode: config.imageFitMode || 'smart_center',
        zoom: frames[1].zoom * (config.focalZoom || 1),
        panX: frames[1].panX,
        panY: frames[1].panY,
        radius: 22,
        badgeLabel: frames[1].label
      });
    }
    return;
  }

  if (layout === 'collage_3') {
    // 3-Image Bento Showcase: Left 58% Main Scenario Stage + Right 42% Two Stacked Centered Detail Frames
    const frames = buildCollageFrames(allImages, 3);
    const leftW = Math.round((boxW - gap) * 0.58);
    const rightW = boxW - leftW - gap;
    const rightCellH = (boxH - gap) / 2;

    renderContextualScenarioStage(ctx, frames[0].img, boxX, boxY, leftW, boxH, sceneType, config, animT);

    drawCenteredFocalImage(ctx, frames[1].img, boxX + leftW + gap, boxY, rightW, rightCellH, {
      fitMode: config.imageFitMode || 'smart_center',
      zoom: frames[1].zoom * (config.focalZoom || 1),
      panX: frames[1].panX,
      panY: frames[1].panY,
      radius: 20,
      badgeLabel: frames[1].label
    });

    drawCenteredFocalImage(ctx, frames[2].img, boxX + leftW + gap, boxY + rightCellH + gap, rightW, rightCellH, {
      fitMode: config.imageFitMode || 'smart_center',
      zoom: frames[2].zoom * (config.focalZoom || 1),
      panX: frames[2].panX,
      panY: frames[2].panY,
      radius: 20,
      badgeLabel: frames[2].label
    });
    return;
  }

  // collage_4: 2x2 Symmetrical Centered Matrix
  const frames = buildCollageFrames(allImages, 4);
  const cellW = (boxW - gap) / 2;
  const cellH = (boxH - gap) / 2;

  // Top-left: Contextual Stage
  renderContextualScenarioStage(ctx, frames[0].img, boxX, boxY, cellW, cellH, sceneType, config, animT);

  // Top-right, Bottom-left, Bottom-right: Centered Focal Views
  const positions = [
    { x: boxX + cellW + gap, y: boxY, f: frames[1] },
    { x: boxX, y: boxY + cellH + gap, f: frames[2] },
    { x: boxX + cellW + gap, y: boxY + cellH + gap, f: frames[3] }
  ];

  for (const pos of positions) {
    drawCenteredFocalImage(ctx, pos.f.img, pos.x, pos.y, cellW, cellH, {
      fitMode: config.imageFitMode || 'smart_center',
      zoom: pos.f.zoom * (config.focalZoom || 1),
      panX: pos.f.panX,
      panY: pos.f.panY,
      radius: 20,
      badgeLabel: pos.f.label
    });
  }

  // Central floating emblem uniting the 4-grid collage
  const centerBadgeW = 190;
  const centerBadgeH = 40;
  const cbx = boxX + (boxW - centerBadgeW) / 2;
  const cby = boxY + (boxH - centerBadgeH) / 2;
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 14;
  roundRect(ctx, cbx, cby, centerBadgeW, centerBadgeH, 20);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('360° MERKEZ ODAK', boxX + boxW / 2, cby + 25);
  ctx.restore();
}

/**
 * Renders the Multi-Scene Storyboard Video Frame when `animationProgress` is active!
 * Divides the video into 4 dynamic commercial scenes:
 * - Scene 1 (0.00 - 0.27): Scenario & Real-Life Environment Stage Opening
 * - Scene 2 (0.27 - 0.54): Multi-Angle / Usage Interaction Split Transition
 * - Scene 3 (0.54 - 0.80): Multi-Image Bento Collage & Feature Callouts
 * - Scene 4 (0.80 - 1.00): Sales Conversion Finale & Offer Lockup
 */
function renderStoryboardVideoStage(
  ctx: CanvasRenderingContext2D,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  config: PosterConfig,
  progress: number
) {
  const allImages =
    config.imageElements && config.imageElements.length > 0
      ? config.imageElements
      : config.imageElement
      ? [config.imageElement]
      : [];

  if (allImages.length === 0) return;

  const sceneType = config.sceneType || 'desk_setup';
  const scenes = config.storyScenes && config.storyScenes.length >= 4
    ? config.storyScenes
    : [
        { phase: 'Sahne 1: Senaryo & Mekân Canlandırması', subtitle: config.scenarioTitle || 'Gerçek Yaşam Kullanım Kurulumu', highlight: 'Doğal Ortamında Üstün Performans' },
        { phase: 'Sahne 2: Kullanım & Çoklu Açı Deneyimi', subtitle: 'Ergonomik tasarım ve pratik etkileşim', highlight: 'Maksimum Konfor & İşlevsellik' },
        { phase: 'Sahne 3: 360° Çoklu Görsel & Detay Kolajı', subtitle: 'Merkeze odaklanmış kusursuz işçilik detayları', highlight: 'Üst Segment Malzeme Kalitesi' },
        { phase: 'Sahne 4: Satış & Kampanya Finali', subtitle: `${config.storeName} Güvencesiyle`, highlight: config.badge || 'Hemen Sipariş Verin' }
      ];

  let activeSceneIdx = 0;
  let localT = 0;

  if (progress < 0.27) {
    activeSceneIdx = 0;
    localT = progress / 0.27;
  } else if (progress < 0.54) {
    activeSceneIdx = 1;
    localT = (progress - 0.27) / 0.27;
  } else if (progress < 0.80) {
    activeSceneIdx = 2;
    localT = (progress - 0.54) / 0.26;
  } else {
    activeSceneIdx = 3;
    localT = (progress - 0.80) / 0.20;
  }

  const currentStory = scenes[activeSceneIdx] || scenes[0];

  if (activeSceneIdx === 0) {
    // SCENE 1: Full Contextual Scenario Stage with smooth camera glide
    renderContextualScenarioStage(ctx, allImages[0], boxX, boxY, boxW, boxH, sceneType, {
      ...config,
      focalZoom: (config.focalZoom || 1) * (0.96 + localT * 0.1)
    }, localT);
  } else if (activeSceneIdx === 1) {
    // SCENE 2: Dynamic 2-Image Usage & Angle Split
    renderVisualStageOrCollage(ctx, boxX, boxY, boxW, boxH, {
      ...config,
      collageLayout: 'collage_2',
      focalZoom: (config.focalZoom || 1) * (1.0 + localT * 0.06)
    }, localT);
  } else if (activeSceneIdx === 2) {
    // SCENE 3: Multi-Image Bento / 4-Grid Showcase
    renderVisualStageOrCollage(ctx, boxX, boxY, boxW, boxH, {
      ...config,
      collageLayout: allImages.length >= 4 ? 'collage_4' : 'collage_3',
      focalZoom: config.focalZoom || 1
    }, localT);
  } else {
    // SCENE 4: Hero Conversion Finale
    renderVisualStageOrCollage(ctx, boxX, boxY, boxW, boxH, {
      ...config,
      collageLayout: config.collageLayout || 'single',
      focalZoom: (config.focalZoom || 1) * 1.04
    }, localT);
  }

  // Animated Storyboard Director Overlay Banner at bottom of stage
  ctx.save();
  const bannerW = boxW - 36;
  const bannerH = 82;
  const bannerX = boxX + 18;
  const bannerY = boxY + boxH - bannerH - 16;

  ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
  roundRect(ctx, bannerX, bannerY, bannerW, bannerH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Scene indicator dots (1 - 2 - 3 - 4)
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i === activeSceneIdx ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)';
    roundRect(ctx, bannerX + bannerW - 110 + i * 22, bannerY + 18, i === activeSceneIdx ? 18 : 10, 6, 3);
    ctx.fill();
  }

  // Phase Kicker
  ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(currentStory.phase.toUpperCase(), bannerX + 20, bannerY + 26);

  // Subtitle
  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(currentStory.subtitle.slice(0, 56), bannerX + 20, bannerY + 50);

  // Highlight Callout
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`★ ${currentStory.highlight}`, bannerX + 20, bannerY + 70);
  ctx.restore();
}

/**
 * Renders the complete poster or video frame on an HTML5 canvas at native 1080p resolution
 */
export const renderPosterToCanvas = (
  canvas: HTMLCanvasElement,
  config: PosterConfig
) => {
  const isStory = config.aspectRatio === 'story';
  const width = config.width || 1080;
  const height = config.height || (isStory ? 1920 : 1080);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const isVideoFrame = config.animationProgress !== undefined && config.animationProgress > 0;
  const t = config.animationProgress || 0;
  const tSin = Math.sin(t * Math.PI * 2);

  // 1. CANVAS ATMOSPHERE BACKGROUND
  if (config.template === 'modern_commerce') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const radial = ctx.createRadialGradient(
      width * 0.8 + tSin * 20,
      height * 0.25,
      40,
      width * 0.8,
      height * 0.25,
      width * 0.75
    );
    radial.addColorStop(0, 'rgba(224, 242, 254, 0.85)');
    radial.addColorStop(0.5, 'rgba(254, 243, 199, 0.4)');
    radial.addColorStop(1, 'rgba(248, 250, 252, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  } else if (config.template === 'futuristic_studio') {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    const cyanRadial = ctx.createRadialGradient(
      width * 0.2 + tSin * 30,
      height * 0.35,
      40,
      width * 0.2,
      height * 0.35,
      width * 0.65
    );
    cyanRadial.addColorStop(0, 'rgba(6, 182, 212, 0.24)');
    cyanRadial.addColorStop(1, 'rgba(6, 10, 18, 0)');
    ctx.fillStyle = cyanRadial;
    ctx.fillRect(0, 0, width, height);
  } else if (config.template === 'luxury_editorial') {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    const goldRadial = ctx.createRadialGradient(
      width * 0.5,
      height * 0.35,
      50,
      width * 0.5,
      height * 0.35,
      width * 0.7
    );
    goldRadial.addColorStop(0, 'rgba(217, 119, 6, 0.16)');
    goldRadial.addColorStop(1, 'rgba(9, 9, 11, 0)');
    ctx.fillStyle = goldRadial;
    ctx.fillRect(0, 0, width, height);
  } else {
    const sunset = ctx.createLinearGradient(0, 0, width, height);
    sunset.addColorStop(0, '#180702');
    sunset.addColorStop(0.5, '#0c0401');
    sunset.addColorStop(1, '#050200');
    ctx.fillStyle = sunset;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. HEADER: STORE BRAND & SCENARIO BADGE
  const paddingX = 56;
  let cursorY = isStory ? 88 : 68;

  ctx.save();
  const storeDisplay = (config.storeName || "SEÇKİN MAĞAZA").toUpperCase();
  ctx.font = '900 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = config.template === 'modern_commerce' ? '#0f172a' : '#ffffff';
  ctx.fillText(storeDisplay, paddingX, cursorY);

  // Right side category / brand pill
  const catText = (config.category || config.brand || "ORİJİNAL PORTFÖY").toUpperCase().slice(0, 28);
  ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const catW = ctx.measureText(catText).width + 28;
  ctx.fillStyle = config.template === 'modern_commerce' ? '#e2e8f0' : 'rgba(255,255,255,0.08)';
  roundRect(ctx, width - paddingX - catW, cursorY - 24, catW, 32, 16);
  ctx.fill();
  ctx.fillStyle = config.template === 'modern_commerce' ? '#334155' : '#cbd5e1';
  ctx.fillText(catText, width - paddingX - catW + 14, cursorY - 3);
  ctx.restore();

  // 3. KICKER & HEADLINE (Compact & Clean)
  cursorY += isStory ? 54 : 46;
  ctx.save();
  const kickerText = (config.kicker || "ÖZEL SENARYO & VİTRİN").toUpperCase();
  ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = config.template === 'modern_commerce' ? '#475569' : '#38bdf8';
  ctx.fillText(kickerText, paddingX, cursorY);

  cursorY += isStory ? 62 : 54;
  const headlineText = (config.headline || "GERÇEK DENEYİM").toUpperCase();
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = config.template === 'modern_commerce' ? '#0f172a' : '#ffffff';
  ctx.fillText(headlineText.slice(0, 26), paddingX, cursorY);
  ctx.restore();

  // 4. CENTRAL STAGE: MULTI-IMAGE CENTERED COLLAGE OR CONTEXTUAL SCENARIO STAGE
  const cardMargin = 48;
  const cardTop = cursorY + (isStory ? 34 : 26);
  const infoHeight = isStory ? 168 : 132;
  const cardHeight = height - cardTop - infoHeight - (isStory ? 82 : 62);
  const cardWidth = width - cardMargin * 2;

  if (isVideoFrame) {
    renderStoryboardVideoStage(ctx, cardMargin, cardTop, cardWidth, cardHeight, config, t);
  } else {
    renderVisualStageOrCollage(ctx, cardMargin, cardTop, cardWidth, cardHeight, config, 0);
  }

  // 5. BOTTOM PRODUCT TITLE, BENEFIT BADGE & PRICE CARD
  ctx.save();
  const infoY = height - infoHeight - (isStory ? 44 : 28);
  ctx.fillStyle = config.template === 'modern_commerce' ? '#0f172a' : 'rgba(15, 23, 42, 0.95)';
  roundRect(ctx, cardMargin, infoY, cardWidth, infoHeight, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Product Name
  const displayTitle = config.title && config.title.length > 42
    ? config.title.substring(0, 42) + "..."
    : (config.title || "Seçkin Ürün");

  ctx.font = '800 25px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(displayTitle, cardMargin + 28, infoY + 46);

  // Promo / Benefit Badge inside bottom card
  const badgeStr = config.badge || "Aynı Gün Hızlı Kargo & Orijinal Garanti";
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`✦ ${badgeStr.slice(0, 48)}`, cardMargin + 28, infoY + 80);

  if (config.phone) {
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`İletişim & Sipariş: ${config.phone}`, cardMargin + 28, infoY + 108);
  }

  // Price on Right
  ctx.textAlign = 'right';
  const rightEdge = cardMargin + cardWidth - 28;

  if (config.oldPrice) {
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f87171';
    ctx.fillText(config.oldPrice, rightEdge, infoY + 42);
    const oldW = ctx.measureText(config.oldPrice).width;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rightEdge - oldW, infoY + 36);
    ctx.lineTo(rightEdge, infoY + 36);
    ctx.stroke();
  }

  ctx.font = '900 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(config.price, rightEdge, infoY + (config.oldPrice ? 86 : 70));

  ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('HEMEN KEŞFET • GÜVENLİ ALIŞVERİŞ', rightEdge, infoY + (isStory ? 130 : 110));
  ctx.restore();

  ctx.restore();
};

/**
 * Generates a standalone contextual lifestyle scene image (1080x1080 data URL)
 * so the user can generate and add new staged scenes directly into the product's multi-image pool!
 */
export const createContextualSceneDataUrl = (
  img: HTMLImageElement,
  sceneType: SceneType,
  scenarioTitle: string
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  renderContextualScenarioStage(
    ctx,
    img,
    0,
    0,
    1080,
    1080,
    sceneType,
    {
      aspectRatio: 'square',
      template: 'futuristic_studio',
      storeName: '',
      kicker: '',
      headline: '',
      badge: '',
      title: '',
      price: '',
      scenarioTitle,
      focalZoom: 1.05
    },
    0.25
  );

  return canvas.toDataURL('image/png', 0.95);
};

/**
 * Exports current canvas as high-resolution PNG blob and triggers instant download
 */
export const downloadPosterImage = async (
  canvas: HTMLCanvasElement,
  filename: string = "afis_tasarimi.png"
): Promise<void> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png', 1.0);
  });
};

/**
 * Records a 6-second Multi-Scene Storyboard Video Reel (30 fps) directly from canvas stream
 * Combines segment scenario staging, multi-image transitions, centered collages, and sales finale!
 */
export const recordPosterReel = async (
  config: PosterConfig,
  onProgress?: (percent: number) => void
): Promise<Blob> => {
  const isStory = config.aspectRatio === 'story';
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;

  const stream = offscreen.captureStream(30);

  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8000000
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(chunks, { type: mimeType });
      resolve(videoBlob);
    };

    mediaRecorder.onerror = (e) => reject(e);

    mediaRecorder.start();

    const totalFrames = 180; // 6 seconds * 30fps (4 distinct storyboard scenes)
    let currentFrame = 0;

    const renderFrame = () => {
      const progress = Math.max(0.001, currentFrame / totalFrames);
      renderPosterToCanvas(offscreen, {
        ...config,
        animationProgress: progress
      });

      if (onProgress) {
        onProgress(Math.round(progress * 100));
      }

      currentFrame++;
      if (currentFrame <= totalFrames) {
        setTimeout(renderFrame, 1000 / 30);
      } else {
        setTimeout(() => {
          mediaRecorder.stop();
        }, 150);
      }
    };

    renderFrame();
  });
};

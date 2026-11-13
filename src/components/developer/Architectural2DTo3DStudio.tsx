import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  Box,
  Camera,
  ChevronDown,
  ChevronUp,
  Compass,
  Download,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Upload
} from "lucide-react";
import { toast } from "sonner";

export interface Architectural2DTo3DStudioProps {
  project?: any;
  selectedUnit?: any;
  units?: any[];
  onSelectUnit?: (unit: any) => void;
  onSaveRenderToVault?: (dataUrl: string, name: string, unitType?: string) => Promise<void> | void;
  compactMode?: boolean;
  darkTheme?: boolean;
}

type ConversionEngineMode = "floorplan_extrusion" | "image_depth_relief";
type MaterialPreset = "textured_pbr" | "architectural_white" | "champagne_gold" | "cad_wireframe";
type CameraPreset = "isometric" | "top_plan" | "sea_terrace" | "interior_angle";

const isSoftwareGl = (() => {
  if (typeof document === "undefined") return false;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
})();

// Pre-allocated math helpers outside render loop (Zero GC)
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

function createProceduralBlueprintTexture(
  renderer: THREE.WebGLRenderer,
  unitNumber: string,
  unitType: string,
  grossSqm: number,
  netSqm: number,
  terraceSqm: number
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;

  // Warm travertine / architectural blueprint base
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle architectural grid
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // North Sea / Pool Terrace zone
  ctx.fillStyle = "#e0f2fe";
  ctx.fillRect(64, 48, 896, 160);
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 4;
  ctx.strokeRect(64, 48, 896, 160);

  // Living Room + Kitchen zone
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(64, 208, 460, 496);

  // Master Bedroom zone
  ctx.fillStyle = "#eef2ff";
  ctx.fillRect(524, 208, 280, 310);

  // Bathroom zone
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(804, 208, 156, 310);

  // Second Room / Hallway
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(524, 518, 260, 186);

  // Independent Entry Door Zone
  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(784, 518, 176, 186);

  // Thick structural walls (Dark high-contrast for 2D-to-3D relief extrusion too)
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 14;
  ctx.strokeRect(64, 208, 896, 496);
  ctx.strokeRect(524, 208, 280, 310);
  ctx.strokeRect(804, 208, 156, 310);
  ctx.strokeRect(524, 518, 260, 186);
  ctx.strokeRect(784, 518, 176, 186);

  // Labels on floor slab
  ctx.fillStyle = "#0369a1";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`PANORAMİK TERAS & BALKON (${terraceSqm} m²)`, 512, 125);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("SALON & AÇIK MUTFAK", 294, 430);
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#475569";
  ctx.fillText(`${Math.round(netSqm * 0.48)} m² Net`, 294, 465);

  ctx.fillStyle = "#1e1b4b";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("EBEVEYN YATAK ODASI", 664, 355);
  ctx.font = "bold 18px monospace";
  ctx.fillText(`${Math.round(netSqm * 0.3)} m²`, 664, 385);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("BANYO", 882, 360);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("ODA / HOL", 654, 605);

  ctx.fillStyle = "#92400e";
  ctx.font = "bold 20px monospace";
  ctx.fillText(`KAPI: ${unitNumber}`, 872, 610);

  ctx.fillStyle = "#334155";
  ctx.font = "bold 18px monospace";
  ctx.fillText(`${unitType} • ${grossSqm} m² Brüt / ${netSqm} m² Net`, 512, 742);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}

export const Architectural2DTo3DStudio: React.FC<Architectural2DTo3DStudioProps> = ({
  project,
  selectedUnit,
  units = [],
  onSelectUnit,
  onSaveRenderToVault,
  compactMode = false,
  darkTheme = true
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [engineMode, setEngineMode] = useState<ConversionEngineMode>("floorplan_extrusion");
  const [materialPreset, setMaterialPreset] = useState<MaterialPreset>("textured_pbr");
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("isometric");
  const [wallHeightScale, setWallHeightScale] = useState<number>(1.0);
  const [depthReliefStrength, setDepthReliefStrength] = useState<number>(1.35);
  const [invertDepthMap, setInvertDepthMap] = useState<boolean>(true);
  const [showFurnitureVolumes, setShowFurnitureVolumes] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [custom2DImageUrl, setCustom2DImageUrl] = useState<string>("");
  const [custom2DImageName, setCustom2DImageName] = useState<string>("");
  const [savingSnapshot, setSavingSnapshot] = useState<boolean>(false);

  const activeUnit = selectedUnit || units[0] || {
    id: 1,
    unit_number: "A-101",
    block_name: "Blok A",
    unit_type: "2+1 Penthouse Loft",
    floor_level: "1. Kat",
    gross_sqm: 105,
    net_sqm: 82,
    terrace_sqm: 23,
    price: 245000,
    view_direction: "Panoramik Akdeniz & Lagün Havuz",
    status: "available"
  };

  // Store mutable refs for the WebGL scene
  const sceneRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    rootGroup?: THREE.Group;
    extrudedWallsGroup?: THREE.Group;
    furnitureGroup?: THREE.Group;
    reliefMesh?: THREE.Mesh;
    requestRender?: () => void;
    desiredCameraPos: THREE.Vector3;
    desiredLookAt: THREE.Vector3;
    cameraTransitioning: boolean;
    currentWallScale: number;
    targetWallScale: number;
  }>({
    desiredCameraPos: new THREE.Vector3(9.5, 9.2, 10.5),
    desiredLookAt: new THREE.Vector3(0, 0.4, 0),
    cameraTransitioning: false,
    currentWallScale: 1.0,
    targetWallScale: 1.0
  });

  // Build or rebuild the 3D scene contents
  const rebuildSceneContent = useCallback(() => {
    const ctx = sceneRef.current;
    if (!ctx.scene || !ctx.renderer || !ctx.rootGroup) return;

    // Dispose old children cleanly
    while (ctx.rootGroup.children.length > 0) {
      const child = ctx.rootGroup.children[0];
      ctx.rootGroup.remove(child);
      child.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const grossSqm = Number(activeUnit.gross_sqm) || 95;
    const netSqm = Number(activeUnit.net_sqm) || 75;
    const terraceSqm = Number(activeUnit.terrace_sqm) || 20;
    const unitNum = String(activeUnit.unit_number || "A-101");
    const unitType = String(activeUnit.unit_type || "2+1 Residence");

    const blueprintTex = createProceduralBlueprintTexture(
      ctx.renderer,
      unitNum,
      unitType,
      grossSqm,
      netSqm,
      terraceSqm
    );

    if (engineMode === "floorplan_extrusion") {
      // =====================================================================
      // MODE 1: AGENT3DIFY PROCEDURAL 2D-TO-3D ARCHITECTURAL EXTRUSION
      // Composite 10-part THREE.Group with extruded walls, glass terrace & furniture
      // =====================================================================
      const baseGroup = new THREE.Group();

      // 1. Ground Contact Shadow & Architectural Plinth
      const plinthGeo = new THREE.BoxGeometry(11.2, 0.28, 8.6);
      const plinthMat = new THREE.MeshStandardMaterial({
        color: darkTheme ? 0x1e293b : 0xcbd5e1,
        roughness: 0.75,
        metalness: 0.15
      });
      const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
      plinthMesh.position.set(0, -0.16, 0);
      plinthMesh.receiveShadow = true;
      baseGroup.add(plinthMesh);

      // 2. Floor Slab with High-Contrast 2D Architectural Plan Texture
      const slabGeo = new THREE.BoxGeometry(10.0, 0.12, 7.5);
      const slabTopMat = new THREE.MeshStandardMaterial({
        map: materialPreset === "architectural_white" ? null : blueprintTex,
        color:
          materialPreset === "champagne_gold"
            ? 0xfef3c7
            : materialPreset === "architectural_white"
            ? 0xf8fafc
            : 0xffffff,
        roughness: 0.4,
        metalness: materialPreset === "champagne_gold" ? 0.35 : 0.05,
        wireframe: materialPreset === "cad_wireframe"
      });
      const slabSideMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.6,
        metalness: 0.1
      });
      const slabMesh = new THREE.Mesh(slabGeo, [
        slabSideMat,
        slabSideMat,
        slabTopMat,
        slabSideMat,
        slabSideMat,
        slabSideMat
      ]);
      slabMesh.position.set(0, 0.04, 0);
      slabMesh.receiveShadow = true;
      baseGroup.add(slabMesh);

      // 3. Extruded Architectural Walls Group (Animated by wallHeightScale)
      const wallsGroup = new THREE.Group();
      wallsGroup.position.set(0, 0.1, 0);

      const wallColor =
        materialPreset === "champagne_gold"
          ? 0xd4af37
          : materialPreset === "architectural_white"
          ? 0xffffff
          : 0xf1f5f9;
      const wallMat = new THREE.MeshStandardMaterial({
        color: wallColor,
        roughness: materialPreset === "champagne_gold" ? 0.25 : 0.55,
        metalness: materialPreset === "champagne_gold" ? 0.75 : 0.08,
        wireframe: materialPreset === "cad_wireframe"
      });

      const wallCapMat = new THREE.MeshStandardMaterial({
        color: materialPreset === "champagne_gold" ? 0x92400e : 0x0f172a,
        roughness: 0.35,
        metalness: 0.3
      });

      const addWallSegment = (
        x: number,
        z: number,
        w: number,
        d: number,
        h = 1.65
      ) => {
        const segGroup = new THREE.Group();
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, wallMat);
        mesh.position.set(x, h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        segGroup.add(mesh);

        // Architectural dark top cap (like professional CAD cut-away)
        const capGeo = new THREE.BoxGeometry(w + 0.01, 0.05, d + 0.01);
        const capMesh = new THREE.Mesh(capGeo, wallCapMat);
        capMesh.position.set(x, h + 0.025, z);
        segGroup.add(capMesh);

        wallsGroup.add(segGroup);
      };

      // Outer structural walls (South, West, East, and North sliding glass piers)
      addWallSegment(0, 3.25, 8.8, 0.22, 1.7); // South outer wall
      addWallSegment(-4.3, 0.75, 0.22, 5.1, 1.7); // West outer wall
      addWallSegment(4.3, 0.75, 0.22, 5.1, 1.7); // East outer wall
      // North wall piers (with wide panoramic terrace sliding door openings)
      addWallSegment(-3.6, -1.7, 1.6, 0.22, 1.7);
      addWallSegment(0.2, -1.7, 1.4, 0.22, 1.7);
      addWallSegment(3.5, -1.7, 1.8, 0.22, 1.7);

      // Interior Partition Walls (Living vs Master Bedroom, Bathroom, Study/Hall, Entry)
      addWallSegment(0.2, 0.75, 0.16, 4.9, 1.65); // Central N-S spine
      addWallSegment(2.8, -0.2, 0.16, 3.0, 1.65); // Master vs Bathroom divider
      addWallSegment(2.25, 1.3, 4.1, 0.16, 1.65); // E-W corridor divider
      addWallSegment(2.6, 2.3, 0.16, 1.9, 1.65); // Entry foyer divider

      // 4. Panoramic Sea Terrace Glass Balustrade & Infinity Pool Edge
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: isSoftwareGl ? 0.38 : 0.55,
        transmission: isSoftwareGl ? 0 : 0.75,
        roughness: 0.1,
        metalness: 0.1,
        depthWrite: false
      });
      const northGlassRail = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.65, 0.06), glassMat);
      northGlassRail.position.set(0, 0.33, -3.25);
      northGlassRail.renderOrder = 10;
      wallsGroup.add(northGlassRail);

      const westGlassRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 1.55), glassMat);
      westGlassRail.position.set(-4.35, 0.33, -2.48);
      westGlassRail.renderOrder = 10;
      wallsGroup.add(westGlassRail);

      const eastGlassRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 1.55), glassMat);
      eastGlassRail.position.set(4.35, 0.33, -2.48);
      eastGlassRail.renderOrder = 10;
      wallsGroup.add(eastGlassRail);

      // Terrace Plunge Pool / Water Feature
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.12,
        metalness: 0.25
      });
      const poolWater = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 1.05), waterMat);
      poolWater.position.set(-2.3, 0.05, -2.5);
      wallsGroup.add(poolWater);

      // 5. 3D Interior Architectural Furniture & Volumes
      const furnitureGroup = new THREE.Group();
      furnitureGroup.visible = showFurnitureVolumes;

      const marbleMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.2,
        metalness: 0.15
      });
      const oakWoodMat = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.65,
        metalness: 0.05
      });
      const fabricMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.85,
        metalness: 0.02
      });
      const accentGoldMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.25,
        metalness: 0.85
      });

      // Kitchen Island + Countertop in Living Zone
      const islandBase = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 0.75), oakWoodMat);
      islandBase.position.set(-2.4, 0.28, 2.35);
      islandBase.castShadow = true;
      furnitureGroup.add(islandBase);

      const islandTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.85), marbleMat);
      islandTop.position.set(-2.4, 0.58, 2.35);
      furnitureGroup.add(islandTop);

      // L-Shaped Designer Sofa in Living Room
      const sofaMain = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.38, 0.85), fabricMat);
      sofaMain.position.set(-2.1, 0.19, 0.15);
      sofaMain.castShadow = true;
      furnitureGroup.add(sofaMain);

      const sofaChaise = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.38, 1.65), fabricMat);
      sofaChaise.position.set(-3.2, 0.19, -0.25);
      sofaChaise.castShadow = true;
      furnitureGroup.add(sofaChaise);

      // Master Bed in Master Suite
      const masterBedBase = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.32, 1.85), oakWoodMat);
      masterBedBase.position.set(1.5, 0.16, -0.45);
      masterBedBase.castShadow = true;
      furnitureGroup.add(masterBedBase);

      const masterMattress = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.18, 1.72), marbleMat);
      masterMattress.position.set(1.5, 0.38, -0.45);
      furnitureGroup.add(masterMattress);

      // Independent Door Number 3D Marker Beacon at Entry
      const doorPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.55, 24), accentGoldMat);
      doorPlinth.position.set(3.45, 0.28, 2.35);
      doorPlinth.castShadow = true;
      furnitureGroup.add(doorPlinth);

      wallsGroup.add(furnitureGroup);
      ctx.furnitureGroup = furnitureGroup;
      ctx.extrudedWallsGroup = wallsGroup;
      ctx.extrudedWallsGroup.scale.set(1, ctx.currentWallScale, 1);

      baseGroup.add(wallsGroup);
      ctx.rootGroup.add(baseGroup);
      ctx.requestRender?.();
    } else {
      // =====================================================================
      // MODE 2: 2D-TO-3D IMAGE DEPTH & SOBEL EDGE RELIEF CONVERTER
      // Converts any 2D floorplan / render image into a 3D displaced relief mesh
      // =====================================================================
      const sourceUrl =
        custom2DImageUrl ||
        project?.cover_image ||
        "";

      const buildReliefFromCanvas = (imgCanvas: HTMLCanvasElement, colorTexture: THREE.Texture) => {
        if (!ctx.rootGroup) return;
        const w = 160;
        const h = 112;
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = w;
        sampleCanvas.height = h;
        const sCtx = sampleCanvas.getContext("2d")!;
        sCtx.drawImage(imgCanvas, 0, 0, w, h);
        const imgData = sCtx.getImageData(0, 0, w, h).data;

        const geo = new THREE.PlaneGeometry(10.0, 7.2, w - 1, h - 1);
        geo.rotateX(-Math.PI / 2);

        const posAttr = geo.attributes.position;
        const colors = new Float32Array(posAttr.count * 3);

        for (let i = 0; i < posAttr.count; i++) {
          const ix = i % w;
          const iy = Math.floor(i / w);
          const pIdx = (iy * w + ix) * 4;
          const r = imgData[pIdx] / 255;
          const g = imgData[pIdx + 1] / 255;
          const b = imgData[pIdx + 2] / 255;

          // Perceived luminance
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Compute Sobel gradient magnitude for sharp architectural lines/walls
          let edge = 0;
          if (ix > 0 && ix < w - 1 && iy > 0 && iy < h - 1) {
            const leftIdx = (iy * w + (ix - 1)) * 4;
            const rightIdx = (iy * w + (ix + 1)) * 4;
            const upIdx = ((iy - 1) * w + ix) * 4;
            const downIdx = ((iy + 1) * w + ix) * 4;
            const lumL = (imgData[leftIdx] + imgData[leftIdx + 1] + imgData[leftIdx + 2]) / (3 * 255);
            const lumR = (imgData[rightIdx] + imgData[rightIdx + 1] + imgData[rightIdx + 2]) / (3 * 255);
            const lumU = (imgData[upIdx] + imgData[upIdx + 1] + imgData[upIdx + 2]) / (3 * 255);
            const lumD = (imgData[downIdx] + imgData[downIdx + 1] + imgData[downIdx + 2]) / (3 * 255);
            edge = Math.min(1, Math.hypot(lumR - lumL, lumD - lumU) * 2.4);
          }

          // In floorplan mode (invertDepthMap=true), dark ink lines extrude UP as 3D walls!
          const baseHeight = invertDepthMap ? 1.0 - lum : lum;
          const heightVal = (baseHeight * 0.75 + edge * 0.45) * depthReliefStrength;

          posAttr.setY(i, heightVal);

          colors[i * 3] = r;
          colors[i * 3 + 1] = g;
          colors[i * 3 + 2] = b;
        }

        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        const reliefMat = new THREE.MeshStandardMaterial({
          map: materialPreset === "textured_pbr" ? colorTexture : null,
          vertexColors: materialPreset === "architectural_white" ? false : materialPreset !== "textured_pbr",
          color:
            materialPreset === "champagne_gold"
              ? 0xd4af37
              : materialPreset === "architectural_white"
              ? 0xf8fafc
              : 0xffffff,
          roughness: materialPreset === "champagne_gold" ? 0.28 : 0.5,
          metalness: materialPreset === "champagne_gold" ? 0.75 : 0.1,
          wireframe: materialPreset === "cad_wireframe"
        });

        const reliefMesh = new THREE.Mesh(geo, reliefMat);
        reliefMesh.position.set(0, 0.08, 0);
        reliefMesh.castShadow = true;
        reliefMesh.receiveShadow = true;

        // Add architectural frame base below relief
        const frameGeo = new THREE.BoxGeometry(10.4, 0.22, 7.6);
        const frameMat = new THREE.MeshStandardMaterial({
          color: darkTheme ? 0x0f172a : 0xcbd5e1,
          roughness: 0.7,
          metalness: 0.2
        });
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.set(0, -0.06, 0);
        frameMesh.receiveShadow = true;

        ctx.rootGroup.add(frameMesh);
        ctx.rootGroup.add(reliefMesh);
        ctx.reliefMesh = reliefMesh;
        ctx.requestRender?.();
      };

      if (sourceUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const offCanvas = document.createElement("canvas");
          offCanvas.width = 1024;
          offCanvas.height = 768;
          const oCtx = offCanvas.getContext("2d")!;
          oCtx.drawImage(img, 0, 0, 1024, 768);
          const cTex = new THREE.CanvasTexture(offCanvas);
          cTex.colorSpace = THREE.SRGBColorSpace;
          if (ctx.renderer) {
            cTex.anisotropy = ctx.renderer.capabilities.getMaxAnisotropy();
          }
          buildReliefFromCanvas(offCanvas, cTex);
        };
        img.onerror = () => {
          // Graceful fallback to procedural blueprint canvas
          buildReliefFromCanvas(blueprintTex.image as HTMLCanvasElement, blueprintTex);
        };
        img.src = sourceUrl;
      } else {
        buildReliefFromCanvas(blueprintTex.image as HTMLCanvasElement, blueprintTex);
      }
    }
  }, [
    activeUnit,
    engineMode,
    materialPreset,
    depthReliefStrength,
    invertDepthMap,
    showFurnitureVolumes,
    custom2DImageUrl,
    project?.cover_image,
    darkTheme
  ]);

  // Initialize WebGLRenderer & Scene once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 480;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = darkTheme ? 0x0b1120 : 0xf1f5f9;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.022);

    // Studio Environment Map (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(9.5, 9.2, 10.5);
    camera.lookAt(0, 0.4, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 4.0;
    controls.maxDistance = 24.0;
    controls.target.set(0, 0.4, 0);

    // 3-Point Architectural Studio Lighting Rig + Warm/Cool Contrast
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.65);
    keyLight.position.set(10, 16, 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    const d = 9;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    rimLight.position.set(-10, 8, -10);
    scene.add(rimLight);

    // Architectural Coordinate Grid on Ground (Offset on Y to avoid Z-fighting)
    const gridHelper = new THREE.GridHelper(
      26,
      26,
      darkTheme ? 0x334155 : 0x94a3b8,
      darkTheme ? 0x1e293b : 0xcbd5e1
    );
    gridHelper.position.y = -0.31;
    scene.add(gridHelper);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;
        const dt = Math.min(clock.getDelta(), 0.1);
        const st = sceneRef.current;

        // Smooth exponential damping on wall height extrusion
        if (Math.abs(st.currentWallScale - st.targetWallScale) > 0.004) {
          st.currentWallScale = THREE.MathUtils.damp(
            st.currentWallScale,
            st.targetWallScale,
            8,
            dt || 0.016
          );
          if (st.extrudedWallsGroup) {
            st.extrudedWallsGroup.scale.set(1, st.currentWallScale, 1);
          }
          renderDirty = true;
        }

        // Smooth camera preset transition
        if (st.cameraTransitioning) {
          camera.position.lerp(st.desiredCameraPos, 0.14);
          controls.target.lerp(st.desiredLookAt, 0.14);
          if (camera.position.distanceTo(st.desiredCameraPos) < 0.08) {
            st.cameraTransitioning = false;
          } else {
            renderDirty = true;
          }
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    controls.addEventListener("start", () => {
      sceneRef.current.cameraTransitioning = false;
    });
    controls.addEventListener("change", () => {
      requestRender();
    });

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 800;
      const nh = container.clientHeight || 480;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      requestRender();
    };
    window.addEventListener("resize", handleResize);

    sceneRef.current.renderer = renderer;
    sceneRef.current.scene = scene;
    sceneRef.current.camera = camera;
    sceneRef.current.controls = controls;
    sceneRef.current.rootGroup = rootGroup;
    sceneRef.current.requestRender = requestRender;

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      renderer.dispose();
    };
  }, [darkTheme]);

  // Trigger scene rebuild when unit, mode, or material changes
  useEffect(() => {
    rebuildSceneContent();
  }, [rebuildSceneContent]);

  // Smoothly animate wall extrusion height scale
  useEffect(() => {
    sceneRef.current.targetWallScale = wallHeightScale;
    sceneRef.current.requestRender?.();
  }, [wallHeightScale]);

  // Toggle furniture visibility without full rebuild
  useEffect(() => {
    if (sceneRef.current.furnitureGroup) {
      sceneRef.current.furnitureGroup.visible = showFurnitureVolumes;
      sceneRef.current.requestRender?.();
    }
  }, [showFurnitureVolumes]);

  const applyCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    const st = sceneRef.current;
    if (preset === "isometric") {
      _targetPos.set(9.5, 9.2, 10.5);
      _targetLook.set(0, 0.3, 0);
    } else if (preset === "top_plan") {
      _targetPos.set(0, 14.5, 0.01);
      _targetLook.set(0, 0, 0);
    } else if (preset === "sea_terrace") {
      _targetPos.set(-4.5, 4.2, -10.5);
      _targetLook.set(0, 0.5, 0);
    } else {
      _targetPos.set(0.2, 3.4, 7.8);
      _targetLook.set(-0.5, 0.4, -1.2);
    }
    st.desiredCameraPos.copy(_targetPos);
    st.desiredLookAt.copy(_targetLook);
    st.cameraTransitioning = true;
    st.requestRender?.();
  };

  const handleUploadCustom2DPlan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustom2DImageUrl(reader.result);
        setCustom2DImageName(file.name);
        setEngineMode("image_depth_relief");
        toast.success(`"${file.name}" 2D kat planı / görseli 3D derinlik motoruna yüklendi.`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleExport3DSnapshot = async (saveToVault: boolean) => {
    const st = sceneRef.current;
    if (!st.renderer || !st.scene || !st.camera) return;
    setSavingSnapshot(true);
    try {
      st.renderer.render(st.scene, st.camera);
      const dataUrl = st.renderer.domElement.toDataURL("image/png");
      const filename = `${project?.name || "Proje"}_${activeUnit.unit_number}_3D_Mimari_Plan.png`;

      if (saveToVault && onSaveRenderToVault) {
        await onSaveRenderToVault(dataUrl, filename, activeUnit.unit_type);
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename.replace(/\s+/g, "_");
        a.click();
        toast.success("3D Mimari Görsel yüksek çözünürlüklü PNG olarak indirildi.");
      }
    } catch {
      toast.error("3D görsel dışa aktarılamadı.");
    } finally {
      setSavingSnapshot(false);
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border transition-all ${
        isFullscreen
          ? "fixed inset-3 z-50 shadow-2xl"
          : compactMode
          ? "h-[460px]"
          : "h-[560px]"
      } ${
        darkTheme
          ? "bg-slate-950 border-slate-800 text-white"
          : "bg-slate-100 border-slate-300 text-slate-900"
      }`}
    >
      {/* Hidden 2D Floorplan / Image File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadCustom2DPlan}
        className="hidden"
      />

      {/* ISOLATED THREE.JS WEBGL CANVAS CONTAINER */}
      <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP-LEFT MINIMAL SPEC BADGE (Semantic DOM Overlay) */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        <div
          className={`pointer-events-auto px-3 py-2 rounded-xl border flex flex-wrap items-center gap-2.5 shadow-lg ${
            darkTheme
              ? "bg-slate-900/95 border-slate-700/80 text-white"
              : "bg-white/95 border-slate-200 text-slate-950"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Box className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-black tracking-tight whitespace-nowrap">
              2D → 3D Mimari Kütle & Kat Planı Stüdyosu
            </span>
          </div>
          <span className="text-slate-400">·</span>
          <span className="text-xs font-bold text-amber-500 whitespace-nowrap font-mono">
            Kapı No: {activeUnit.unit_number}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-xs font-semibold whitespace-nowrap">
            {activeUnit.unit_type} ({activeUnit.gross_sqm} m² Brüt / {activeUnit.net_sqm} m² Net)
          </span>
        </div>

        {/* Top-Right Quick Actions (2D Image Upload + Snapshot Export + Fullscreen) */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md transition-colors"
            title="Bilgisayar veya mobilden 2D kat planı / mimari görsel yükleyerek 3D modele dönüştürün"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>2D Plan / Görsel Yükle → 3D Yap</span>
          </button>

          <button
            type="button"
            onClick={() => handleExport3DSnapshot(false)}
            disabled={savingSnapshot}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900/95 hover:bg-slate-800 text-white border border-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-md"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>3D PNG İndir</span>
          </button>

          {onSaveRenderToVault && (
            <button
              type="button"
              onClick={() => handleExport3DSnapshot(true)}
              disabled={savingSnapshot}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Medya Havuzuna Kaydet</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-1.5 rounded-lg bg-slate-900/95 hover:bg-slate-800 text-white border border-slate-700 cursor-pointer"
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran 3D İnceleme"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Zero Viewport Occlusion) */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[96%] max-w-[920px] pointer-events-auto transition-transform duration-200"
      >
        {/* Collapse / Expand Handle */}
        <div className="flex justify-center mb-1">
          <button
            type="button"
            onClick={() => setIsDockCollapsed(prev => !prev)}
            className={`px-3 py-1 rounded-t-lg border border-b-0 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
              darkTheme
                ? "bg-slate-900/95 border-slate-700 text-slate-200 hover:text-white"
                : "bg-white/95 border-slate-300 text-slate-800 hover:text-slate-950"
            }`}
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
                <span>3D Stüdyo Kontrollerini Göster</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
                <span>Kontrolleri Gizle (Sinema Modu)</span>
              </>
            )}
          </button>
        </div>

        {!isDockCollapsed && (
          <div
            className={`rounded-xl border p-2.5 shadow-2xl space-y-2 ${
              darkTheme
                ? "bg-slate-900/95 border-slate-700 text-white"
                : "bg-white/95 border-slate-300 text-slate-900"
            }`}
          >
            {/* Row 1: Conversion Engine Switcher + Camera Presets + Material Finishes */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Engine Mode Switch */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEngineMode("floorplan_extrusion")}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black cursor-pointer whitespace-nowrap transition-colors ${
                    engineMode === "floorplan_extrusion"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  1. Parametrik 3D Oda & Duvar Kütle (Agent3Dify)
                </button>
                <button
                  type="button"
                  onClick={() => setEngineMode("image_depth_relief")}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black cursor-pointer whitespace-nowrap transition-colors ${
                    engineMode === "image_depth_relief"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  2. 2D Görsel → 3D Derinlik Rölyefi (2D-to-3D)
                </button>
              </div>

              {/* Camera Angle Presets */}
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: "isometric", label: "İzometrik 3D" },
                    { id: "top_plan", label: "Üst Kat Planı" },
                    { id: "sea_terrace", label: "Deniz & Teras" },
                    { id: "interior_angle", label: "İç Mekan Açısı" }
                  ] as { id: CameraPreset; label: string }[]
                ).map(cam => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => applyCameraPreset(cam.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap border transition-colors ${
                      cameraPreset === cam.id
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : darkTheme
                        ? "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-950"
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>

              {/* Material Finish Switcher */}
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: "textured_pbr", label: "Dokulu PBR" },
                    { id: "architectural_white", label: "Mimari Maket" },
                    { id: "champagne_gold", label: "Lüks Altın" },
                    { id: "cad_wireframe", label: "Telkafes CAD" }
                  ] as { id: MaterialPreset; label: string }[]
                ).map(mat => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => setMaterialPreset(mat.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap border transition-colors ${
                      materialPreset === mat.id
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : darkTheme
                        ? "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-950"
                    }`}
                  >
                    {mat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Interactive Sliders (2D-to-3D Extrusion Height, Furniture Toggle, or Relief Depth) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1.5 border-t border-slate-700/50 text-[11px]">
              {engineMode === "floorplan_extrusion" ? (
                <>
                  <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                    <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="font-bold whitespace-nowrap">2D → 3D Duvar Yüksekliği:</span>
                    <input
                      type="range"
                      min={0.05}
                      max={1.75}
                      step={0.05}
                      value={wallHeightScale}
                      onChange={e => setWallHeightScale(Number(e.target.value))}
                      className="w-32 accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono text-[10px] font-bold text-amber-400">
                      %{Math.round(wallHeightScale * 100)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setWallHeightScale(wallHeightScale < 0.2 ? 1.0 : 0.08)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer whitespace-nowrap"
                    >
                      {wallHeightScale < 0.2 ? "3D Yükselt" : "2D Düzleştir"}
                    </button>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-[10px]">
                    <input
                      type="checkbox"
                      checked={showFurnitureVolumes}
                      onChange={e => setShowFurnitureVolumes(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>3D Mutfak Ada, Mobilya & Kapı No Hacimlerini Göster</span>
                  </label>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                    <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="font-bold whitespace-nowrap">3D Rölyef & Duvar Kabartma:</span>
                    <input
                      type="range"
                      min={0.2}
                      max={2.6}
                      step={0.1}
                      value={depthReliefStrength}
                      onChange={e => setDepthReliefStrength(Number(e.target.value))}
                      className="w-32 accent-amber-500 cursor-pointer"
                    />
                    <span className="font-mono text-[10px] font-bold text-amber-400">
                      {depthReliefStrength.toFixed(1)}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-[10px]">
                      <input
                        type="checkbox"
                        checked={invertDepthMap}
                        onChange={e => setInvertDepthMap(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>Kat Planı Modu (Koyu Duvar Çizgilerini 3D Yükselt)</span>
                    </label>
                    {custom2DImageName && (
                      <span className="text-[10px] font-mono text-emerald-400 truncate max-w-[160px]">
                        Aktif: {custom2DImageName}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Quick Unit Switcher inside 3D Dock if multiple units passed */}
              {units.length > 1 && onSelectUnit && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400">Kapı No:</span>
                  <select
                    value={activeUnit.id}
                    onChange={e => {
                      const found = units.find(u => Number(u.id) === Number(e.target.value));
                      if (found) onSelectUnit(found);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    {units.slice(0, 40).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.unit_number} — {u.unit_type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Architectural2DTo3DStudio;

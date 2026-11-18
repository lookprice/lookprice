import express from "express";
import http from "http";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import AdmZip from "adm-zip";
import { WebSocketServer, WebSocket } from "ws";
import { pool, logAction } from "../models/db";
import { authenticate, JWT_SECRET } from "../middleware/auth";
import { getAuthorizedStoreId } from "./store/utils";
import {
  UNIVERSAL_POS_DEVICES,
  USB_VCP_DRIVERS,
  getPosDeviceById,
  normalizeDepartments,
  resolveDepartmentForTaxRate,
  auditProductVatMappings
} from "../src/data/posDevices";
import { buildGmp3CommandPacket, Gmp3CommandType } from "../src/lib/gmp3Protocol";

const router = express.Router();

// Active WebSocket agent connections per storeId
const activeWsAgents = new Map<number, Set<WebSocket>>();

// Active long-poll HTTP waiters per storeId
const activePollWaiters = new Map<number, Array<(cmd: any | null) => void>>();

// Pending command completion Promises keyed by command DB id
const pendingCommandResolvers = new Map<number, {
  resolve: (val: any) => void;
  timer: ReturnType<typeof setTimeout>;
}>();

function safeJsonParse<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return val as T;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

async function resolveStoreByBridgeToken(token: string) {
  if (!token || typeof token !== "string") return null;
  const clean = token.trim();
  if (!clean) return null;
  const res = await pool.query(
    `SELECT id, name, slug, fiscal_brand, fiscal_terminal_id, fiscal_active, fiscal_ip, fiscal_port, fiscal_departments, pos_bridge_token, pos_bridge_settings
     FROM stores WHERE pos_bridge_token = $1 LIMIT 1`,
    [clean]
  );
  return res.rows[0] || null;
}

async function resolveAuthFromQueryOrHeader(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authenticate(req, res, next);
  }
  const qToken = req.query.jwt || req.query.authToken;
  if (qToken && typeof qToken === "string") {
    try {
      req.user = jwt.verify(qToken, JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  }
  return res.status(401).json({ error: "Unauthorized" });
}

async function authenticateAgentToken(req: any, res: any, next: any) {
  const headerToken = req.headers["x-bridge-token"] || req.query.token || req.body?.token;
  const store = await resolveStoreByBridgeToken(String(headerToken || ""));
  if (!store) {
    return res.status(401).json({ error: "Geçersiz POS Bridge token (X-Bridge-Token)." });
  }
  req.bridgeStore = store;
  next();
}

function notifyPollWaiters(storeId: number, commandRow: any) {
  const waiters = activePollWaiters.get(storeId);
  if (waiters && waiters.length > 0) {
    const cb = waiters.shift();
    if (waiters.length === 0) activePollWaiters.delete(storeId);
    if (cb) cb(commandRow);
    return true;
  }
  return false;
}

async function upsertAgentHeartbeat(storeId: number, data: {
  agentVersion?: string;
  transport?: string;
  hostname?: string;
  osPlatform?: string;
  deviceBrand?: string;
  deviceIp?: string;
  devicePort?: number;
  online?: boolean;
  pcMode?: boolean;
  paperOk?: boolean;
  fiscalReady?: boolean;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  telemetry?: any;
}) {
  await pool.query(
    `INSERT INTO pos_bridge_agents (
      store_id, agent_version, transport, hostname, os_platform, device_brand, device_ip, device_port,
      online, pc_mode, paper_ok, fiscal_ready, last_error_code, last_error_message, telemetry, last_seen_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,NOW(),NOW())
    ON CONFLICT (store_id) DO UPDATE SET
      agent_version = COALESCE(EXCLUDED.agent_version, pos_bridge_agents.agent_version),
      transport = COALESCE(EXCLUDED.transport, pos_bridge_agents.transport),
      hostname = COALESCE(EXCLUDED.hostname, pos_bridge_agents.hostname),
      os_platform = COALESCE(EXCLUDED.os_platform, pos_bridge_agents.os_platform),
      device_brand = COALESCE(EXCLUDED.device_brand, pos_bridge_agents.device_brand),
      device_ip = COALESCE(EXCLUDED.device_ip, pos_bridge_agents.device_ip),
      device_port = COALESCE(EXCLUDED.device_port, pos_bridge_agents.device_port),
      online = EXCLUDED.online,
      pc_mode = COALESCE(EXCLUDED.pc_mode, pos_bridge_agents.pc_mode),
      paper_ok = COALESCE(EXCLUDED.paper_ok, pos_bridge_agents.paper_ok),
      fiscal_ready = COALESCE(EXCLUDED.fiscal_ready, pos_bridge_agents.fiscal_ready),
      last_error_code = EXCLUDED.last_error_code,
      last_error_message = EXCLUDED.last_error_message,
      telemetry = COALESCE(EXCLUDED.telemetry, pos_bridge_agents.telemetry),
      last_seen_at = NOW(),
      updated_at = NOW()`,
    [
      storeId,
      data.agentVersion || "1.0.0",
      data.transport || "long_poll",
      data.hostname || null,
      data.osPlatform || null,
      data.deviceBrand || null,
      data.deviceIp || null,
      data.devicePort || 4444,
      data.online !== undefined ? data.online : true,
      data.pcMode !== undefined ? data.pcMode : true,
      data.paperOk !== undefined ? data.paperOk : true,
      data.fiscalReady !== undefined ? data.fiscalReady : true,
      data.lastErrorCode || null,
      data.lastErrorMessage || null,
      JSON.stringify(data.telemetry || {})
    ]
  );
}

async function applyCommandResult(storeId: number, commandId: number, body: any) {
  const isSuccess = body?.status === "completed" || body?.success === true || body?.ack === true;
  const finalStatus = isSuccess ? "completed" : "failed";
  const receiptNo = body?.receiptNo || body?.receipt_no || null;
  const zNo = body?.zNo || body?.z_no || null;
  const ekuNo = body?.ekuNo || body?.eku_no || null;
  const authCode = body?.authCode || body?.auth_code || null;
  const errorCode = isSuccess ? null : (body?.errorCode || body?.error_code || "OKC_ERROR");
  const errorMessage = isSuccess ? null : (body?.errorMessage || body?.error_message || body?.message || "ÖKC cihaz hatası");

  const updatedRes = await pool.query(
    `UPDATE pos_bridge_commands SET
      status = $1,
      result = $2::jsonb,
      receipt_no = COALESCE($3, receipt_no),
      z_no = COALESCE($4, z_no),
      eku_no = COALESCE($5, eku_no),
      auth_code = COALESCE($6, auth_code),
      error_code = $7,
      error_message = $8,
      updated_at = NOW(),
      completed_at = NOW()
     WHERE id = $9 AND store_id = $10
     RETURNING *`,
    [
      finalStatus,
      JSON.stringify(body || {}),
      receiptNo,
      zNo,
      ekuNo,
      authCode,
      errorCode,
      errorMessage,
      commandId,
      storeId
    ]
  );

  const row = updatedRes.rows[0];

  // Also refresh agent telemetry if device status payload included
  if (body?.telemetry && typeof body.telemetry === "object") {
    await upsertAgentHeartbeat(storeId, {
      online: true,
      pcMode: body.telemetry.pcMode ?? body.telemetry.pc_mode,
      paperOk: body.telemetry.paperOk ?? body.telemetry.paper_ok,
      fiscalReady: body.telemetry.fiscalReady ?? body.telemetry.fiscal_ready,
      lastErrorCode: isSuccess ? null : errorCode,
      lastErrorMessage: isSuccess ? null : errorMessage,
      telemetry: body.telemetry
    }).catch(() => {});
  }

  const waiter = pendingCommandResolvers.get(commandId);
  if (waiter) {
    clearTimeout(waiter.timer);
    pendingCommandResolvers.delete(commandId);
    waiter.resolve(row);
  }
  return row;
}

export function attachPosBridgeWebSocket(httpServer: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", async (request, socket, head) => {
    try {
      const reqUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
      if (reqUrl.pathname !== "/ws/pos-bridge") {
        return; // Allow other upgrade handlers if any (e.g. non-POS paths)
      }

      wss.handleUpgrade(request, socket, head, async (ws) => {
        let storeId: number | null = null;
        const queryToken = reqUrl.searchParams.get("token") || String(request.headers["x-bridge-token"] || "");

        if (queryToken) {
          const store = await resolveStoreByBridgeToken(queryToken);
          if (store) {
            storeId = Number(store.id);
            let set = activeWsAgents.get(storeId);
            if (!set) {
              set = new Set();
              activeWsAgents.set(storeId, set);
            }
            set.add(ws);
            await upsertAgentHeartbeat(storeId, {
              transport: "websocket",
              online: true,
              deviceBrand: store.fiscal_brand,
              deviceIp: store.fiscal_ip,
              devicePort: Number(store.fiscal_port || 4444)
            }).catch(() => {});
            ws.send(JSON.stringify({ type: "auth_ok", storeId, storeName: store.name }));
          }
        }

        ws.on("message", async (rawData) => {
          try {
            const msg = JSON.parse(rawData.toString());
            if (msg.type === "auth") {
              const store = await resolveStoreByBridgeToken(String(msg.token || ""));
              if (!store) {
                ws.send(JSON.stringify({ type: "auth_error", error: "Invalid bridge token" }));
                ws.close(4001, "Invalid bridge token");
                return;
              }
              storeId = Number(store.id);
              let set = activeWsAgents.get(storeId);
              if (!set) {
                set = new Set();
                activeWsAgents.set(storeId, set);
              }
              set.add(ws);
              await upsertAgentHeartbeat(storeId, {
                transport: "websocket",
                agentVersion: msg.agentVersion,
                hostname: msg.hostname,
                osPlatform: msg.osPlatform,
                deviceBrand: msg.deviceBrand || store.fiscal_brand,
                deviceIp: msg.deviceIp || store.fiscal_ip,
                devicePort: Number(msg.devicePort || store.fiscal_port || 4444),
                online: true,
                pcMode: msg.pcMode ?? true,
                paperOk: msg.paperOk ?? true,
                fiscalReady: msg.fiscalReady ?? true,
                telemetry: msg.telemetry || {}
              }).catch(() => {});
              ws.send(JSON.stringify({ type: "auth_ok", storeId, storeName: store.name }));
              return;
            }

            if (!storeId) {
              ws.send(JSON.stringify({ type: "error", error: "Unauthenticated bridge socket" }));
              return;
            }

            if (msg.type === "heartbeat" || msg.type === "status") {
              await upsertAgentHeartbeat(storeId, {
                transport: "websocket",
                agentVersion: msg.agentVersion,
                hostname: msg.hostname,
                osPlatform: msg.osPlatform,
                deviceBrand: msg.deviceBrand,
                deviceIp: msg.deviceIp,
                devicePort: msg.devicePort ? Number(msg.devicePort) : undefined,
                online: true,
                pcMode: msg.pcMode ?? true,
                paperOk: msg.paperOk ?? true,
                fiscalReady: msg.fiscalReady ?? true,
                lastErrorCode: msg.lastErrorCode || null,
                lastErrorMessage: msg.lastErrorMessage || null,
                telemetry: msg.telemetry || msg
              });
              ws.send(JSON.stringify({ type: "heartbeat_ack", serverTime: new Date().toISOString() }));
              return;
            }

            if (msg.type === "command_result" && msg.commandId) {
              await applyCommandResult(storeId, Number(msg.commandId), msg);
            }
          } catch (err) {
            console.error("[POS-Bridge WS] Message error:", err);
          }
        });

        ws.on("close", async () => {
          if (storeId) {
            const set = activeWsAgents.get(storeId);
            if (set) {
              set.delete(ws);
              if (set.size === 0) {
                activeWsAgents.delete(storeId);
                await pool.query(
                  "UPDATE pos_bridge_agents SET online = FALSE, updated_at = NOW() WHERE store_id = $1",
                  [storeId]
                ).catch(() => {});
              }
            }
          }
        });
      });
    } catch (err) {
      console.error("[POS-Bridge WS] Upgrade error:", err);
      socket.destroy();
    }
  });

  console.log("[POS-Bridge] WebSocket endpoint attached on /ws/pos-bridge");
}

function getStoreAgentStatusSummary(storeId: number, agentRow: any) {
  const wsSet = activeWsAgents.get(storeId);
  const wsConnected = Boolean(wsSet && wsSet.size > 0);
  const lastSeenMs = agentRow?.last_seen_at ? new Date(agentRow.last_seen_at).getTime() : 0;
  const recentlySeen = lastSeenMs > 0 && (Date.now() - lastSeenMs) < 35000;
  const online = wsConnected || (Boolean(agentRow?.online) && recentlySeen);

  return {
    online,
    transport: wsConnected ? "websocket" : (recentlySeen ? (agentRow?.transport || "long_poll") : "offline"),
    wsConnections: wsSet?.size || 0,
    agentVersion: agentRow?.agent_version || null,
    hostname: agentRow?.hostname || null,
    osPlatform: agentRow?.os_platform || null,
    pcMode: online ? Boolean(agentRow?.pc_mode ?? true) : false,
    paperOk: online ? Boolean(agentRow?.paper_ok ?? true) : true,
    fiscalReady: online ? Boolean(agentRow?.fiscal_ready ?? true) : false,
    lastErrorCode: agentRow?.last_error_code || null,
    lastErrorMessage: agentRow?.last_error_message || null,
    lastSeenAt: agentRow?.last_seen_at || null,
    telemetry: safeJsonParse(agentRow?.telemetry, {})
  };
}

// ---------------------------------------------------------------------------
// OPERATOR ENDPOINTS (JWT Authenticated)
// ---------------------------------------------------------------------------

// GET /api/pos-bridge/catalog -> public/authenticated catalog of supported OKC brands & drivers
router.get("/catalog", (_req, res) => {
  res.json({
    devices: UNIVERSAL_POS_DEVICES,
    usbVcpDrivers: USB_VCP_DRIVERS
  });
});

// GET /api/pos-bridge/status
router.get("/status", authenticate, async (req: any, res) => {
  try {
    const reqStoreId = req.query.storeId ? parseInt(String(req.query.storeId), 10) : undefined;
    const storeId = await getAuthorizedStoreId(req, reqStoreId);
    if (!storeId) return res.status(403).json({ error: "Unauthorized store access" });

    const storeRes = await pool.query(
      `SELECT id, name, fiscal_brand, fiscal_terminal_id, fiscal_active, fiscal_ip, fiscal_port, fiscal_departments, pos_bridge_token, pos_bridge_settings, default_tax_rate
       FROM stores WHERE id = $1`,
      [storeId]
    );
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    const store = storeRes.rows[0];

    // Ensure pairing token exists
    let pairingToken = store.pos_bridge_token;
    if (!pairingToken) {
      pairingToken = `lpb_${storeId}_${crypto.randomBytes(16).toString("hex")}`;
      await pool.query("UPDATE stores SET pos_bridge_token = $1 WHERE id = $2", [pairingToken, storeId]);
    }

    const agentRes = await pool.query("SELECT * FROM pos_bridge_agents WHERE store_id = $1 LIMIT 1", [storeId]);
    const agentStatus = getStoreAgentStatusSummary(storeId, agentRes.rows[0]);

    const cmdsRes = await pool.query(
      `SELECT id, client_tx_id, command, device_brand, protocol, status, receipt_no, z_no, eku_no, auth_code, error_code, error_message, created_at, completed_at
       FROM pos_bridge_commands WHERE store_id = $1 ORDER BY created_at DESC LIMIT 15`,
      [storeId]
    );

    const departments = normalizeDepartments(safeJsonParse(store.fiscal_departments, []));
    const prodRatesRes = await pool.query(
      "SELECT DISTINCT COALESCE(tax_rate, $2) AS vat_rate FROM products WHERE store_id = $1",
      [storeId, Number(store.default_tax_rate ?? 20)]
    );
    const vatAudit = auditProductVatMappings(prodRatesRes.rows.map((r: any) => r.vat_rate), departments);

    res.json({
      storeId,
      storeName: store.name,
      pairingToken,
      fiscal: {
        active: Boolean(store.fiscal_active),
        brand: store.fiscal_brand || "hugin_t300_spectra",
        terminalId: store.fiscal_terminal_id || "",
        ip: store.fiscal_ip || "",
        port: Number(store.fiscal_port || 4444),
        departments
      },
      bridgeSettings: safeJsonParse(store.pos_bridge_settings, {}),
      cardOkcMode: (() => {
        const bs = safeJsonParse<any>(store.pos_bridge_settings, {});
        if (bs?.card_okc_mode) return bs.card_okc_mode;
        return bs?.fiscal_on_card === false ? "no_fiscal_on_card" : "integrated_eft_pos";
      })(),
      agent: agentStatus,
      recentCommands: cmdsRes.rows,
      vatAudit
    });
  } catch (err: any) {
    console.error("[POS-Bridge] Status error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pos-bridge/pairing-token/regenerate
router.post("/pairing-token/regenerate", authenticate, async (req: any, res) => {
  try {
    const reqStoreId = req.query.storeId || req.body?.storeId;
    const storeId = await getAuthorizedStoreId(req, reqStoreId);
    if (!storeId) return res.status(403).json({ error: "Unauthorized store access" });

    const newToken = `lpb_${storeId}_${crypto.randomBytes(16).toString("hex")}`;
    await pool.query("UPDATE stores SET pos_bridge_token = $1 WHERE id = $2", [newToken, storeId]);
    await pool.query("UPDATE pos_bridge_agents SET online = FALSE WHERE store_id = $1", [storeId]).catch(() => {});

    // Close existing WS sockets for old token
    const wsSet = activeWsAgents.get(storeId);
    if (wsSet) {
      wsSet.forEach(s => {
        try { s.close(4002, "Token regenerated"); } catch {}
      });
      activeWsAgents.delete(storeId);
    }

    res.json({ success: true, pairingToken: newToken });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pos-bridge/kdv-audit
router.post("/kdv-audit", authenticate, async (req: any, res) => {
  try {
    const reqStoreId = req.query.storeId || req.body?.storeId;
    const storeId = await getAuthorizedStoreId(req, reqStoreId);
    if (!storeId) return res.status(403).json({ error: "Unauthorized store access" });

    const storeRes = await pool.query(
      "SELECT fiscal_departments, default_tax_rate FROM stores WHERE id = $1",
      [storeId]
    );
    const departments = normalizeDepartments(
      req.body?.departments || safeJsonParse(storeRes.rows[0]?.fiscal_departments, [])
    );
    const fallbackVat = Number(storeRes.rows[0]?.default_tax_rate ?? 20);
    const prodRatesRes = await pool.query(
      "SELECT DISTINCT COALESCE(tax_rate, $2) AS vat_rate, COUNT(*)::INT AS product_count FROM products WHERE store_id = $1 GROUP BY COALESCE(tax_rate, $2) ORDER BY vat_rate",
      [storeId, fallbackVat]
    );
    const audit = auditProductVatMappings(prodRatesRes.rows.map((r: any) => r.vat_rate), departments);
    res.json({
      success: true,
      audit,
      productTaxBreakdown: prodRatesRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pos-bridge/command
router.post("/command", authenticate, async (req: any, res) => {
  try {
    const reqStoreId = req.query.storeId || req.body?.storeId;
    const storeId = await getAuthorizedStoreId(req, reqStoreId);
    if (!storeId) return res.status(403).json({ error: "Unauthorized store access" });

    const {
      command,
      clientTxId,
      items = [],
      payments = [],
      totalAmount,
      currency = "TRY",
      tableNumber = null,
      saleId = null,
      cardMode = null,
      simulate = false,
      simulateScenario = null,
      timeoutMs = 20000
    } = req.body || {};

    const cmdType = String(command || "PING_STATUS").toUpperCase() as Gmp3CommandType;

    const storeRes = await pool.query(
      `SELECT id, name, fiscal_brand, fiscal_terminal_id, fiscal_active, fiscal_ip, fiscal_port, fiscal_departments, pos_bridge_settings
       FROM stores WHERE id = $1`,
      [storeId]
    );
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    const store = storeRes.rows[0];
    const deviceSpec = getPosDeviceById(store.fiscal_brand);
    const bridgeSettings = safeJsonParse<any>(store.pos_bridge_settings, {});
    const departments = normalizeDepartments(safeJsonParse(store.fiscal_departments, []));

    // 1. Idempotency check for SALE / PARTIAL_PAYMENT & LAST_TX recovery
    if (clientTxId && (cmdType === "SALE" || cmdType === "PARTIAL_PAYMENT")) {
      const existingCmdRes = await pool.query(
        `SELECT * FROM pos_bridge_commands
         WHERE store_id = $1 AND client_tx_id = $2 AND status = 'completed'
         ORDER BY completed_at DESC LIMIT 1`,
        [storeId, String(clientTxId)]
      );
      if (existingCmdRes.rows.length > 0) {
        const existing = existingCmdRes.rows[0];
        return res.json({
          success: true,
          idempotent: true,
          commandId: existing.id,
          command: existing.command,
          status: "completed",
          fiscal: {
            success: true,
            receiptNo: existing.receipt_no,
            zNo: existing.z_no,
            ekuNo: existing.eku_no,
            authCode: existing.auth_code,
            brand: deviceSpec.brand,
            model: deviceSpec.model,
            terminal: store.fiscal_terminal_id || deviceSpec.id,
            clientTxId,
            timestamp: existing.completed_at || existing.created_at
          }
        });
      }
    }

    // 2. LAST_TX query: check live agent first, fallback to verified DB record if requested with clientTxId
    if (cmdType === "LAST_TX" && clientTxId) {
      const prevRes = await pool.query(
        `SELECT * FROM pos_bridge_commands
         WHERE store_id = $1 AND client_tx_id = $2
         ORDER BY id DESC LIMIT 1`,
        [storeId, String(clientTxId)]
      );
      if (prevRes.rows.length > 0 && prevRes.rows[0].status === "completed") {
        const prev = prevRes.rows[0];
        return res.json({
          success: true,
          recovered: true,
          commandId: prev.id,
          command: "LAST_TX",
          status: "completed",
          fiscal: {
            success: true,
            receiptNo: prev.receipt_no,
            zNo: prev.z_no,
            ekuNo: prev.eku_no,
            authCode: prev.auth_code,
            brand: deviceSpec.brand,
            model: deviceSpec.model,
            terminal: store.fiscal_terminal_id || deviceSpec.id,
            clientTxId,
            timestamp: prev.completed_at || prev.created_at
          }
        });
      }
    }

    // 3. Map LookPrice cart items to OKC Department 1-8 & build GMP3 binary/hex frame
    const mappedItems = (Array.isArray(items) ? items : []).map((item: any) => {
      const vatRate = item.tax_rate !== undefined && item.tax_rate !== null
        ? Number(item.tax_rate)
        : (item.vatRate !== undefined ? Number(item.vatRate) : 20);
      const dept = resolveDepartmentForTaxRate(vatRate, departments, item.category || item.name);
      return {
        name: String(item.name || item.product_name || "URUN"),
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.price !== undefined ? item.price : (item.unit_price || 0)),
        vatRate: dept.vatRate,
        deptId: Number(item.deptId || dept.dept),
        barcode: item.barcode || ""
      };
    });

    const effectiveCardMode = String(
      cardMode ||
      bridgeSettings?.card_okc_mode ||
      (bridgeSettings?.fiscal_on_card === false ? "no_fiscal_on_card" : "integrated_eft_pos")
    );
    const cardFlowMode: 'integrated_eft_pos' | 'fiscal_only_external_card' =
      effectiveCardMode === "fiscal_only_external_card" ? "fiscal_only_external_card" : "integrated_eft_pos";

    const resolvedPayments = (Array.isArray(payments) && payments.length > 0)
      ? payments.map((p: any) => {
          const isCard = p.method === "credit_card" || p.method === "card" || p.method === "credit_external";
          return {
            method: p.method || "cash",
            amount: Number(p.amount || 0),
            installments: p.installments ? Number(p.installments) : 0,
            fiscalOnly: Boolean(p.fiscalOnly || (isCard && cardFlowMode === "fiscal_only_external_card"))
          };
        })
      : (typeof totalAmount === "number" ? [{ method: req.body?.paymentMethod || "cash", amount: Number(totalAmount), installments: 0, fiscalOnly: false }] : []);

    const computedTotal = typeof totalAmount === "number"
      ? Number(totalAmount)
      : mappedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    const gmp3Frame = buildGmp3CommandPacket({
      command: cmdType,
      clientTxId: clientTxId || undefined,
      seqNo: Math.floor(Date.now() / 1000) % 250 + 1,
      terminalId: store.fiscal_terminal_id || `LP-${storeId}`,
      currency,
      totalAmount: computedTotal,
      tableNumber: tableNumber ? String(tableNumber) : null,
      cardFlowMode,
      items: mappedItems,
      payments: resolvedPayments
    });

    const targetDeviceIp = req.body?.deviceIp || store.fiscal_ip || "127.0.0.1";
    const targetDevicePort = Number(req.body?.devicePort || store.fiscal_port || deviceSpec.defaultPort || 4444);

    // 4. Insert command audit record
    const insertRes = await pool.query(
      `INSERT INTO pos_bridge_commands (
        store_id, client_tx_id, command, device_brand, device_ip, device_port, protocol, payload, gmp3_hex, status, sale_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, 'pending', $10)
      RETURNING *`,
      [
        storeId,
        clientTxId || null,
        cmdType,
        deviceSpec.id,
        targetDeviceIp,
        targetDevicePort,
        deviceSpec.protocol,
        JSON.stringify({
          items: mappedItems,
          payments: resolvedPayments,
          totalAmount: computedTotal,
          currency,
          tableNumber,
          terminalId: store.fiscal_terminal_id || ""
        }),
        gmp3Frame.fullFrameHex,
        saleId
      ]
    );
    const cmdRow = insertRes.rows[0];
    const commandId = Number(cmdRow.id);

    // 5. Determine live transport availability
    const wsSet = activeWsAgents.get(storeId);
    const hasWsAgent = Boolean(wsSet && wsSet.size > 0);
    const agentRes = await pool.query("SELECT * FROM pos_bridge_agents WHERE store_id = $1 LIMIT 1", [storeId]);
    const agentSummary = getStoreAgentStatusSummary(storeId, agentRes.rows[0]);
    const hasLiveAgent = hasWsAgent || agentSummary.online;

    const simulationAllowed = Boolean(simulate) || Boolean(bridgeSettings?.allow_simulation);

    if (hasLiveAgent && !simulateScenario && !simulate) {
      const outgoingEnvelope = {
        type: "command",
        commandId,
        clientTxId: clientTxId || null,
        command: cmdType,
        device: {
          id: deviceSpec.id,
          brand: deviceSpec.brand,
          model: deviceSpec.model,
          protocol: deviceSpec.protocol,
          ip: targetDeviceIp,
          port: targetDevicePort,
          terminalId: store.fiscal_terminal_id || "",
          cardFlowMode
        },
        gmp3Hex: gmp3Frame.fullFrameHex,
        payload: safeJsonParse(cmdRow.payload, {})
      };

      // Dispatch over WebSocket if connected, otherwise wake HTTP long-poll waiter
      if (hasWsAgent && wsSet) {
        for (const ws of wsSet) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(outgoingEnvelope));
            break;
          }
        }
      } else {
        notifyPollWaiters(storeId, outgoingEnvelope);
      }

      const effectiveTimeout = Math.min(Math.max(Number(timeoutMs) || 20000, 2000), 45000);
      const completedRow: any = await new Promise((resolve) => {
        const timer = setTimeout(async () => {
          pendingCommandResolvers.delete(commandId);
          await pool.query(
            `UPDATE pos_bridge_commands
             SET status = 'timeout', error_code = 'TIMEOUT', error_message = 'ÖKC cihazından veya yerel ajandan zamanında yanıt alınamadı (Zaman Aşımı). Mükerrer fişi önlemek için Son İşlem Sorgula (LAST_TX) kullanın.', updated_at = NOW()
             WHERE id = $1 AND status = 'pending'`,
            [commandId]
          ).catch(() => {});
          resolve(null);
        }, effectiveTimeout);

        pendingCommandResolvers.set(commandId, { resolve, timer });
      });

      if (!completedRow) {
        return res.status(504).json({
          success: false,
          commandId,
          command: cmdType,
          status: "timeout",
          error_code: "TIMEOUT",
          message: "ÖKC cihazı yanıt vermedi (Zaman Aşımı). Ağ kesintisi olduysa adisyonu kapatmadan 'Son İşlemi Sorgula' ile fişin kesilip kesilmediğini doğrulayın.",
          gmp3Hex: gmp3Frame.fullFrameHex
        });
      }

      if (completedRow.status !== "completed") {
        return res.status(422).json({
          success: false,
          commandId,
          command: cmdType,
          status: completedRow.status,
          error_code: completedRow.error_code || "OKC_REJECTED",
          message: completedRow.error_message || "ÖKC işlemi reddetti.",
          gmp3Hex: gmp3Frame.fullFrameHex
        });
      }

      return res.json({
        success: true,
        commandId,
        command: cmdType,
        status: "completed",
        gmp3Hex: gmp3Frame.fullFrameHex,
        telemetry: getStoreAgentStatusSummary(storeId, (await pool.query("SELECT * FROM pos_bridge_agents WHERE store_id = $1", [storeId])).rows[0]),
        fiscal: {
          success: true,
          receiptNo: completedRow.receipt_no,
          zNo: completedRow.z_no,
          ekuNo: completedRow.eku_no,
          authCode: completedRow.auth_code,
          brand: deviceSpec.brand,
          model: deviceSpec.model,
          terminal: store.fiscal_terminal_id || deviceSpec.id,
          clientTxId: clientTxId || null,
          timestamp: completedRow.completed_at || new Date().toISOString()
        }
      });
    }

    // 6. No live agent connected — ONLY simulate if store explicitly enabled allow_simulation or test request set simulate=true
    if (!simulationAllowed) {
      await pool.query(
        `UPDATE pos_bridge_commands
         SET status = 'failed', error_code = 'BRIDGE_OFFLINE', error_message = 'LP-Hardware-Bridge yerel ajanı çevrimdışı.', updated_at = NOW(), completed_at = NOW()
         WHERE id = $1`,
        [commandId]
      );
      return res.status(503).json({
        success: false,
        commandId,
        command: cmdType,
        status: "failed",
        error_code: "BRIDGE_OFFLINE",
        message: "LP-Hardware-Bridge yerel köprü ajanı bağlı değil. Ayarlar > POS Köprüsü bölümünden ajanı kurun veya test için 'Simülasyon Modu'nu etkinleştirin.",
        gmp3Hex: gmp3Frame.fullFrameHex
      });
    }

    // Explicit simulation mode (for hardware-free staging / validation / explicit error testing)
    if (simulateScenario === "PAPER_OUT") {
      const failRow = await applyCommandResult(storeId, commandId, {
        success: false,
        errorCode: "PAPER_OUT",
        errorMessage: `${deviceSpec.model}: Mali kağıt rulosu bitti veya kapak açık! Lütfen yeni rulo takıp kapağı kapatın.`,
        telemetry: { pcMode: true, paperOk: false, fiscalReady: false }
      });
      return res.status(422).json({
        success: false,
        simulated: true,
        commandId,
        command: cmdType,
        status: "failed",
        error_code: failRow.error_code,
        message: failRow.error_message,
        gmp3Hex: gmp3Frame.fullFrameHex
      });
    }

    if (simulateScenario === "CARD_DECLINED") {
      const failRow = await applyCommandResult(storeId, commandId, {
        success: false,
        errorCode: "CARD_DECLINED",
        errorMessage: `${deviceSpec.model}: Kart reddedildi (Yetersiz bakiye veya hatalı PIN).`,
        telemetry: { pcMode: true, paperOk: true, fiscalReady: true }
      });
      return res.status(422).json({
        success: false,
        simulated: true,
        commandId,
        command: cmdType,
        status: "failed",
        error_code: failRow.error_code,
        message: failRow.error_message,
        gmp3Hex: gmp3Frame.fullFrameHex
      });
    }

    if (simulateScenario === "NOT_PC_MODE") {
      const failRow = await applyCommandResult(storeId, commandId, {
        success: false,
        errorCode: "NOT_PC_MODE",
        errorMessage: `${deviceSpec.model}: Cihaz PC modunda değil! Cihaz üzerinden F > Harici Satış / PC Modu açın.`,
        telemetry: { pcMode: false, paperOk: true, fiscalReady: false }
      });
      return res.status(422).json({
        success: false,
        simulated: true,
        commandId,
        command: cmdType,
        status: "failed",
        error_code: failRow.error_code,
        message: failRow.error_message,
        gmp3Hex: gmp3Frame.fullFrameHex
      });
    }

    const zNo = `Z-${String(commandId % 9999).padStart(4, "0")}`;
    const receiptNo = cmdType === "Z_REPORT"
      ? `ZR-${String(commandId).padStart(6, "0")}`
      : cmdType === "X_REPORT"
      ? `XR-${String(commandId).padStart(6, "0")}`
      : `F-${String(commandId).padStart(6, "0")}`;
    const ekuNo = `EKU-${String(Math.floor(commandId / 50) + 1).padStart(4, "0")}`;
    const authCode = resolvedPayments.some(p => p.method === "credit_card")
      ? `AUTH-${String(commandId).padStart(6, "0")}`
      : null;

    await applyCommandResult(storeId, commandId, {
      success: true,
      simulated: true,
      receiptNo,
      zNo,
      ekuNo,
      authCode,
      telemetry: { pcMode: true, paperOk: true, fiscalReady: true }
    });

    await logAction(
      storeId,
      req.user?.id || null,
      "pos_bridge_command",
      "pos_bridge",
      commandId,
      `ÖKC Komutu (${cmdType}) tamamlandı: ${receiptNo}`,
      null,
      { command: cmdType, receiptNo, zNo, device: deviceSpec.id, simulated: true }
    ).catch(() => {});

    return res.json({
      success: true,
      simulated: true,
      commandId,
      command: cmdType,
      status: "completed",
      gmp3Hex: gmp3Frame.fullFrameHex,
      telemetry: {
        online: false,
        transport: "simulation",
        pcMode: true,
        paperOk: true,
        fiscalReady: true
      },
      fiscal: {
        success: true,
        simulated: true,
        receiptNo,
        zNo,
        ekuNo,
        authCode,
        brand: deviceSpec.brand,
        model: deviceSpec.model,
        terminal: store.fiscal_terminal_id || deviceSpec.id,
        clientTxId: clientTxId || null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error("[POS-Bridge] Command error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// EDGE AGENT LONG-POLLING FALLBACK ENDPOINTS (X-Bridge-Token Authenticated)
// ---------------------------------------------------------------------------

// POST /api/pos-bridge/agent/heartbeat
router.post("/agent/heartbeat", authenticateAgentToken, async (req: any, res) => {
  try {
    const store = req.bridgeStore;
    const body = req.body || {};
    await upsertAgentHeartbeat(Number(store.id), {
      agentVersion: body.agentVersion || "1.0.0",
      transport: body.transport || "long_poll",
      hostname: body.hostname,
      osPlatform: body.osPlatform,
      deviceBrand: body.deviceBrand || store.fiscal_brand,
      deviceIp: body.deviceIp || store.fiscal_ip,
      devicePort: Number(body.devicePort || store.fiscal_port || 4444),
      online: true,
      pcMode: body.pcMode ?? true,
      paperOk: body.paperOk ?? true,
      fiscalReady: body.fiscalReady ?? true,
      lastErrorCode: body.lastErrorCode || null,
      lastErrorMessage: body.lastErrorMessage || null,
      telemetry: body.telemetry || body
    });
    res.json({
      success: true,
      storeId: Number(store.id),
      storeName: store.name,
      device: {
        brand: store.fiscal_brand || "hugin_t300_spectra",
        ip: store.fiscal_ip || "127.0.0.1",
        port: Number(store.fiscal_port || 4444),
        terminalId: store.fiscal_terminal_id || ""
      },
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pos-bridge/agent/poll
router.get("/agent/poll", authenticateAgentToken, async (req: any, res) => {
  try {
    const store = req.bridgeStore;
    const storeId = Number(store.id);
    await upsertAgentHeartbeat(storeId, {
      transport: "long_poll",
      online: true,
      deviceBrand: store.fiscal_brand,
      deviceIp: store.fiscal_ip,
      devicePort: Number(store.fiscal_port || 4444)
    }).catch(() => {});

    // Check immediately for oldest pending command created within last 2 minutes
    const pendingRes = await pool.query(
      `SELECT * FROM pos_bridge_commands
       WHERE store_id = $1 AND status = 'pending' AND created_at > NOW() - INTERVAL '2 minutes'
       ORDER BY id ASC LIMIT 1`,
      [storeId]
    );

    if (pendingRes.rows.length > 0) {
      const cmd = pendingRes.rows[0];
      const spec = getPosDeviceById(cmd.device_brand || store.fiscal_brand);
      return res.json({
        command: {
          commandId: cmd.id,
          clientTxId: cmd.client_tx_id,
          command: cmd.command,
          device: {
            id: spec.id,
            brand: spec.brand,
            model: spec.model,
            protocol: cmd.protocol || spec.protocol,
            ip: cmd.device_ip || store.fiscal_ip || "127.0.0.1",
            port: Number(cmd.device_port || store.fiscal_port || spec.defaultPort || 4444),
            terminalId: store.fiscal_terminal_id || ""
          },
          gmp3Hex: cmd.gmp3_hex,
          payload: safeJsonParse(cmd.payload, {})
        }
      });
    }

    // Long-poll wait up to 18 seconds
    const result = await new Promise<any>((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        const list = activePollWaiters.get(storeId);
        if (list) {
          const filtered = list.filter(fn => fn !== waiterFn);
          if (filtered.length > 0) activePollWaiters.set(storeId, filtered);
          else activePollWaiters.delete(storeId);
        }
        resolve(null);
      }, 18000);

      const waiterFn = (cmdObj: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve(cmdObj);
      };

      const existing = activePollWaiters.get(storeId) || [];
      existing.push(waiterFn);
      activePollWaiters.set(storeId, existing);

      req.on("close", () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        const list = activePollWaiters.get(storeId);
        if (list) {
          const filtered = list.filter(fn => fn !== waiterFn);
          if (filtered.length > 0) activePollWaiters.set(storeId, filtered);
          else activePollWaiters.delete(storeId);
        }
      });
    });

    res.json({ command: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pos-bridge/agent/result
router.post("/agent/result", authenticateAgentToken, async (req: any, res) => {
  try {
    const store = req.bridgeStore;
    const commandId = Number(req.body?.commandId);
    if (!commandId) return res.status(400).json({ error: "commandId zorunludur." });
    const row = await applyCommandResult(Number(store.id), commandId, req.body);
    if (!row) return res.status(404).json({ error: "Command not found" });
    res.json({ success: true, command: row });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PRE-CONFIGURED EDGE AGENT ZIP PACKAGE GENERATOR (adm-zip)
// ---------------------------------------------------------------------------

// GET /api/pos-bridge/download-agent
router.get("/download-agent", resolveAuthFromQueryOrHeader, async (req: any, res) => {
  try {
    const reqStoreId = req.query.storeId ? parseInt(String(req.query.storeId), 10) : undefined;
    const storeId = await getAuthorizedStoreId(req, reqStoreId);
    if (!storeId) return res.status(403).json({ error: "Unauthorized store access" });

    const storeRes = await pool.query(
      `SELECT id, name, slug, fiscal_brand, fiscal_terminal_id, fiscal_ip, fiscal_port, fiscal_departments, pos_bridge_token, pos_bridge_settings
       FROM stores WHERE id = $1`,
      [storeId]
    );
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    const store = storeRes.rows[0];

    let pairingToken = store.pos_bridge_token;
    if (!pairingToken) {
      pairingToken = `lpb_${storeId}_${crypto.randomBytes(16).toString("hex")}`;
      await pool.query("UPDATE stores SET pos_bridge_token = $1 WHERE id = $2", [pairingToken, storeId]);
    }

    const deviceSpec = getPosDeviceById(store.fiscal_brand);
    const bridgeSettings = safeJsonParse<any>(store.pos_bridge_settings, {});
    const proto = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const host = req.get("host") || `127.0.0.1:${process.env.PORT || 3000}`;
    const cloudUrl = `${proto}://${host}`;
    const wsUrl = `${proto === "https" ? "wss" : "ws"}://${host}/ws/pos-bridge`;

    const bridgeConfig = {
      storeId: Number(store.id),
      storeName: store.name,
      cloudUrl,
      wsUrl,
      bridgeToken: pairingToken,
      localHttpPort: Number(bridgeSettings.bridge_port || 1616),
      device: {
        id: deviceSpec.id,
        brand: deviceSpec.brand,
        model: deviceSpec.model,
        protocol: deviceSpec.protocol,
        ip: store.fiscal_ip || "192.168.1.55",
        port: Number(store.fiscal_port || deviceSpec.defaultPort || 4444),
        terminalId: store.fiscal_terminal_id || "",
        cardFlowMode: bridgeSettings?.card_okc_mode || (bridgeSettings?.fiscal_on_card === false ? "no_fiscal_on_card" : "integrated_eft_pos")
      },
      departments: normalizeDepartments(safeJsonParse(store.fiscal_departments, [])),
      tcpTimeoutMs: 18000,
      dryRunSimulateTcp: false
    };

    const agentScript = `#!/usr/bin/env node
/**
 * LP-Hardware-Bridge v1.0.0
 * Universal YN OKC (Hugin T300 Spectra GMP3 TCP / Ingenico / Beko / Pavo / ESC-POS) Edge Service
 * Zero external npm dependencies required (Node.js 18+ LTS).
 */
import fs from "fs";
import path from "path";
import net from "net";
import http from "http";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, "bridge-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const VERSION = "1.0.0";
let seqCounter = 1;
let lastTxRecord = null;
let cachedDeviceHealth = {
  pcMode: false,
  paperOk: true,
  fiscalReady: false,
  lastCheckedAt: null,
  lastErrorCode: null,
  lastErrorMessage: null
};

function log(...args) {
  console.log(\`[\${new Date().toISOString()}] [LP-Bridge]\`, ...args);
}

function hexToBuffer(hexStr) {
  const clean = String(hexStr || "").replace(/[^0-9A-Fa-f]/g, "");
  return Buffer.from(clean, "hex");
}

function parseGmp3Response(buf) {
  if (!buf || buf.length === 0) {
    return { ok: false, errorCode: "EMPTY_RESPONSE", errorMessage: "Cihazdan bos yanit dondu." };
  }
  const hex = buf.toString("hex").toUpperCase();
  const ascii = buf.toString("ascii").replace(/[\\x00-\\x1F]/g, " ").trim();
  const hasNak = buf.includes(0x15) || ascii.includes("NAK") || ascii.includes("ERR");
  const paperOut = ascii.includes("PAPER_OUT") || ascii.includes("KAGIT") || buf.includes(0xE1);
  const notPcMode = ascii.includes("NOT_PC") || ascii.includes("PC_MODE_OFF");
  const declined = ascii.includes("DECLINE") || ascii.includes("RED");

  if (paperOut) {
    return { ok: false, errorCode: "PAPER_OUT", errorMessage: "OKC kagit rulosu bitti veya kapak acik!", rawHex: hex };
  }
  if (notPcMode) {
    return { ok: false, errorCode: "NOT_PC_MODE", errorMessage: "OKC cihazi PC modunda degil!", rawHex: hex };
  }
  if (declined) {
    return { ok: false, errorCode: "CARD_DECLINED", errorMessage: "Kart islemi reddedildi.", rawHex: hex };
  }
  if (hasNak && !buf.includes(0x06)) {
    return { ok: false, errorCode: "NAK_ERROR", errorMessage: "Cihaz komutu reddetti (NAK).", rawHex: hex };
  }

  const receiptMatch = ascii.match(/RCPT[:=\\s]+([A-Z0-9-]+)/i);
  const zMatch = ascii.match(/ZNO[:=\\s]+([A-Z0-9-]+)/i);
  const ekuMatch = ascii.match(/EKU[:=\\s]+([A-Z0-9-]+)/i);
  const authMatch = ascii.match(/AUTH[:=\\s]+([A-Z0-9-]+)/i);

  const idSuffix = String(Date.now()).slice(-6);
  return {
    ok: true,
    receiptNo: receiptMatch ? receiptMatch[1] : \`F-\${idSuffix}\`,
    zNo: zMatch ? zMatch[1] : \`Z-\${String(seqCounter).padStart(4, "0")}\`,
    ekuNo: ekuMatch ? ekuMatch[1] : \`EKU-0001\`,
    authCode: authMatch ? authMatch[1] : null,
    rawHex: hex,
    rawAscii: ascii
  };
}

function sendTcpGmp3(ip, port, gmp3Hex, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const chunks = [];
    let settled = false;

    const finish = (res) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch {}
      resolve(res);
    };

    socket.setTimeout(timeoutMs);
    socket.connect(port, ip, () => {
      const frame = hexToBuffer(gmp3Hex);
      socket.write(frame);
    });

    socket.on("data", (data) => {
      chunks.push(data);
      // ETX (0x03) or ACK (0x06) or NAK (0x15)
      if (data.includes(0x03) || data.includes(0x06) || data.includes(0x15)) {
        const fullBuf = Buffer.concat(chunks);
        finish(parseGmp3Response(fullBuf));
      }
    });

    socket.on("timeout", () => {
      finish({ ok: false, errorCode: "TIMEOUT", errorMessage: \`\${ip}:\${port} zaman asimi (\${timeoutMs}ms).\` });
    });

    socket.on("error", (err) => {
      finish({ ok: false, errorCode: "TCP_UNREACHABLE", errorMessage: \`Cihaza erisilemedi (\${ip}:\${port}): \${err.message}\` });
    });
  });
}

async function executeDeviceCommand(cmdObj) {
  const commandName = String(cmdObj.command || "PING_STATUS").toUpperCase();
  const deviceIp = cmdObj.device?.ip || config.device.ip;
  const devicePort = Number(cmdObj.device?.port || config.device.port || 4444);
  const flowMode = cmdObj.device?.cardFlowMode || config.device.cardFlowMode || "integrated_eft_pos";

  log(\`Executing \${commandName} [\${flowMode}] -> \${deviceIp}:\${devicePort}\`);

  if (commandName === "LAST_TX" && cmdObj.clientTxId && lastTxRecord?.clientTxId === cmdObj.clientTxId) {
    return {
      success: true,
      status: "completed",
      ...lastTxRecord,
      telemetry: { pcMode: true, paperOk: true, fiscalReady: true }
    };
  }

  let hwResult;
  if (config.dryRunSimulateTcp) {
    hwResult = {
      ok: true,
      receiptNo: commandName === "Z_REPORT" ? \`ZR-\${Date.now().toString().slice(-6)}\` : \`F-\${Date.now().toString().slice(-6)}\`,
      zNo: \`Z-\${String(seqCounter++).padStart(4, "0")}\`,
      ekuNo: "EKU-0001",
      authCode: "SIM-OK"
    };
  } else {
    hwResult = await sendTcpGmp3(deviceIp, devicePort, cmdObj.gmp3Hex || "", config.tcpTimeoutMs || 18000);
  }

  if (!hwResult.ok) {
    cachedDeviceHealth = {
      pcMode: hwResult.errorCode !== "NOT_PC_MODE" && hwResult.errorCode !== "TCP_UNREACHABLE",
      paperOk: hwResult.errorCode !== "PAPER_OUT",
      fiscalReady: false,
      lastCheckedAt: new Date().toISOString(),
      lastErrorCode: hwResult.errorCode,
      lastErrorMessage: hwResult.errorMessage
    };
    return {
      success: false,
      status: "failed",
      errorCode: hwResult.errorCode,
      errorMessage: hwResult.errorMessage,
      telemetry: cachedDeviceHealth
    };
  }

  cachedDeviceHealth = {
    pcMode: true,
    paperOk: true,
    fiscalReady: true,
    lastCheckedAt: new Date().toISOString(),
    lastErrorCode: null,
    lastErrorMessage: null
  };

  const payload = {
    success: true,
    status: "completed",
    receiptNo: hwResult.receiptNo,
    zNo: hwResult.zNo,
    ekuNo: hwResult.ekuNo,
    authCode: hwResult.authCode,
    telemetry: cachedDeviceHealth
  };

  if (commandName === "SALE" || commandName === "PARTIAL_PAYMENT") {
    lastTxRecord = { clientTxId: cmdObj.clientTxId, ...payload };
  }

  return payload;
}

async function sendHeartbeat(transport = "long_poll") {
  try {
    await fetch(\`\${config.cloudUrl}/api/pos-bridge/agent/heartbeat\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bridge-Token": config.bridgeToken
      },
      body: JSON.stringify({
        agentVersion: VERSION,
        transport,
        hostname: os.hostname(),
        osPlatform: os.platform(),
        deviceBrand: config.device.id,
        deviceIp: config.device.ip,
        devicePort: config.device.port,
        pcMode: cachedDeviceHealth.pcMode,
        paperOk: cachedDeviceHealth.paperOk,
        fiscalReady: cachedDeviceHealth.fiscalReady,
        telemetry: cachedDeviceHealth
      })
    });
  } catch (err) {
    log("Heartbeat error:", err.message);
  }
}

async function startLongPollLoop() {
  log("Starting Cloud HTTP Long-Polling loop ->", config.cloudUrl);
  await sendHeartbeat("long_poll");
  setInterval(() => sendHeartbeat("long_poll"), 15000);

  while (true) {
    try {
      const res = await fetch(\`\${config.cloudUrl}/api/pos-bridge/agent/poll\`, {
        headers: { "X-Bridge-Token": config.bridgeToken }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.command) {
          const result = await executeDeviceCommand(data.command);
          await fetch(\`\${config.cloudUrl}/api/pos-bridge/agent/result\`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Bridge-Token": config.bridgeToken
            },
            body: JSON.stringify({
              commandId: data.command.commandId,
              ...result
            })
          });
        }
      } else {
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      log("Poll error:", err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

// Also start WebSocket connection if globalThis.WebSocket exists (Node 22+)
function tryStartWebSocket() {
  if (typeof globalThis.WebSocket !== "function") {
    return false;
  }
  const connect = () => {
    try {
      const ws = new globalThis.WebSocket(\`\${config.wsUrl}?token=\${encodeURIComponent(config.bridgeToken)}\`);
      ws.addEventListener("open", () => {
        log("WebSocket connected ->", config.wsUrl);
        ws.send(JSON.stringify({
          type: "auth",
          token: config.bridgeToken,
          agentVersion: VERSION,
          hostname: os.hostname(),
          osPlatform: os.platform(),
          deviceBrand: config.device.id,
          deviceIp: config.device.ip,
          devicePort: config.device.port,
          pcMode: cachedDeviceHealth.pcMode,
          paperOk: cachedDeviceHealth.paperOk,
          fiscalReady: cachedDeviceHealth.fiscalReady
        }));
      });
      ws.addEventListener("message", async (event) => {
        try {
          const msg = JSON.parse(String(event.data));
          if (msg.type === "command" && msg.commandId) {
            const result = await executeDeviceCommand(msg);
            ws.send(JSON.stringify({
              type: "command_result",
              commandId: msg.commandId,
              ...result
            }));
          }
        } catch (err) {
          log("WS message error:", err.message);
        }
      });
      ws.addEventListener("close", () => {
        setTimeout(connect, 5000);
      });
      ws.addEventListener("error", () => {});
    } catch {
      setTimeout(connect, 5000);
    }
  };
  connect();
  return true;
}

// Local HTTP endpoint for instant LAN browser communication (http://127.0.0.1:1616)
const localServer = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/health" || req.url === "/pos/ping") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, version: VERSION, storeId: config.storeId, device: config.device, telemetry: cachedDeviceHealth }));
    return;
  }

  if (req.method === "POST" && req.url?.startsWith("/pos/")) {
    let raw = "";
    req.on("data", chunk => raw += chunk);
    req.on("end", async () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const cmdMap = {
          "/pos/sale": "SALE",
          "/pos/ping": "PING_STATUS",
          "/pos/z-report": "Z_REPORT",
          "/pos/last-tx": "LAST_TX"
        };
        const result = await executeDeviceCommand({
          command: cmdMap[req.url] || body.command || "SALE",
          clientTxId: body.clientTxId,
          device: { ...config.device, ip: body.ip || config.device.ip, port: body.port || config.device.port },
          gmp3Hex: body.gmp3Hex || "",
          payload: body
        });
        res.writeHead(result.success ? 200 : 422, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: result.success ? "approved" : "failed", ...result }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "failed", message: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const localPort = Number(config.localHttpPort || 1616);
localServer.listen(localPort, "127.0.0.1", () => {
  log(\`Local HTTP Server listening on http://127.0.0.1:\${localPort}\`);
});

tryStartWebSocket();
startLongPollLoop();
`;

    const batFile = `@echo off\r\necho LookPrice LP-Hardware-Bridge Baslatiliyor (${store.name})...\r\nnode "%~dp0lp-hardware-bridge.mjs"\r\npause\r\n`;
    const shFile = `#!/usr/bin/env bash\necho "LookPrice LP-Hardware-Bridge Baslatiliyor (${store.name})..."\nnode "$(dirname "$0")/lp-hardware-bridge.mjs"\n`;
    const readmeText = [
      `LOOKPRICE LP-HARDWARE-BRIDGE KURULUM REHBERİ`,
      `==========================================`,
      `Mağaza: ${store.name} (#${store.id})`,
      `Seçili Cihaz: ${deviceSpec.model} (${deviceSpec.protocol})`,
      `Hedef Cihaz IP/Port: ${bridgeConfig.device.ip}:${bridgeConfig.device.port}`,
      `Resmi Sürücü / SDK Sayfası: ${deviceSpec.driverUrl}`,
      `USB-VCP Sürücü Linki: ${deviceSpec.usbVcpDriverUrl}`,
      ``,
      `ADIMLAR:`,
      `1. Kasa bilgisayarında Node.js LTS (v18 veya üzeri) yüklü olduğundan emin olun: https://nodejs.org/tr/download`,
      `2. USB kablo ile bağlıyorsanız yukarıdaki USB-VCP sürücüsünü kurun; LAN/Wi-Fi kullanıyorsanız cihazda TCP ${bridgeConfig.device.port} & PC Modunu açın.`,
      `3. Windows'ta 'start-bridge.bat' dosyasına çift tıklayın (macOS/Linux: 'chmod +x start-bridge.sh && ./start-bridge.sh').`,
      `4. Terminalde "WebSocket connected" veya "Long-Polling" mesajını gördükten sonra LookPrice panelinden 'PING / STATUS' testini çalıştırın.`,
      ``,
      `Cihaz Kurulum Notları:`,
      ...deviceSpec.setupSteps.map((s, idx) => `  - ${idx + 1}. ${s}`)
    ].join("\r\n");

    const zip = new AdmZip();
    zip.addFile("bridge-config.json", Buffer.from(JSON.stringify(bridgeConfig, null, 2), "utf-8"));
    zip.addFile("lp-hardware-bridge.mjs", Buffer.from(agentScript, "utf-8"));
    zip.addFile("start-bridge.bat", Buffer.from(batFile, "utf-8"));
    zip.addFile("start-bridge.sh", Buffer.from(shFile, "utf-8"));
    zip.addFile("KURULUM-REHBERI.txt", Buffer.from(readmeText, "utf-8"));

    const zipBuffer = zip.toBuffer();
    const safeSlug = String(store.slug || `store_${store.id}`).replace(/[^a-zA-Z0-9_-]/g, "_");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="LP-Hardware-Bridge-${safeSlug}.zip"`);
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("[POS-Bridge] ZIP download error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

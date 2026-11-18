export type Gmp3CommandType =
  | 'PING_STATUS'
  | 'SALE'
  | 'PARTIAL_PAYMENT'
  | 'LAST_TX'
  | 'X_REPORT'
  | 'Z_REPORT'
  | 'VOID';

export interface Gmp3ItemPayload {
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  deptId: number;
  barcode?: string;
}

export type CardOkcFlowMode = 'integrated_eft_pos' | 'fiscal_only_external_card' | 'no_fiscal_on_card';

export interface Gmp3PaymentPayload {
  method: 'cash' | 'credit_card' | 'credit_external' | string;
  amount: number;
  installments?: number;
  fiscalOnly?: boolean;
}

export interface Gmp3PacketInput {
  command: Gmp3CommandType;
  clientTxId?: string;
  seqNo?: number;
  terminalId?: string;
  currency?: string;
  totalAmount?: number;
  tableNumber?: string | null;
  cardFlowMode?: 'integrated_eft_pos' | 'fiscal_only_external_card';
  items?: Gmp3ItemPayload[];
  payments?: Gmp3PaymentPayload[];
}

export interface Gmp3EncodedFrame {
  command: Gmp3CommandType;
  cmdCodeHex: string;
  seqNo: number;
  payloadHex: string;
  lrcHex: string;
  crc16Hex: string;
  fullFrameHex: string;
  byteLength: number;
  rawBytes: number[];
  humanSummary: string;
}

const CMD_CODE_MAP: Record<Gmp3CommandType, [number, number]> = {
  PING_STATUS: [0xdf, 0x01],
  SALE: [0xdf, 0x20],
  PARTIAL_PAYMENT: [0xdf, 0x24],
  VOID: [0xdf, 0x29],
  LAST_TX: [0xdf, 0x30],
  Z_REPORT: [0xdf, 0x40],
  X_REPORT: [0xdf, 0x41]
};

function toHexByte(n: number): string {
  return (n & 0xff).toString(16).toUpperCase().padStart(2, '0');
}

function encodeAsciiBytes(text: string, maxLen = 48): number[] {
  const normalized = String(text || '')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .slice(0, maxLen);
  const bytes: number[] = [];
  for (let i = 0; i < normalized.length; i++) {
    bytes.push(normalized.charCodeAt(i) & 0x7f);
  }
  return bytes;
}

function encodeAmountKurusBcd(amount: number): number[] {
  const kurus = Math.max(0, Math.round((Number(amount) || 0) * 100));
  const padded = String(kurus).padStart(12, '0').slice(-12);
  const bytes: number[] = [];
  for (let i = 0; i < padded.length; i += 2) {
    const high = parseInt(padded[i], 10);
    const low = parseInt(padded[i + 1], 10);
    bytes.push(((high & 0x0f) << 4) | (low & 0x0f));
  }
  return bytes;
}

function appendTlv(target: number[], tag: number, valueBytes: number[]) {
  const safeVal = valueBytes.slice(0, 250);
  target.push(tag & 0xff, safeVal.length & 0xff, ...safeVal);
}

export function calculateLrc(bytes: number[]): number {
  let lrc = 0;
  for (const b of bytes) {
    lrc ^= b & 0xff;
  }
  return lrc & 0xff;
}

export function calculateCrc16Ccitt(bytes: number[]): number {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= (b & 0xff) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc & 0xffff;
}

export function buildGmp3CommandPacket(input: Gmp3PacketInput): Gmp3EncodedFrame {
  const seqNo = (Number(input.seqNo) || 1) & 0xff;
  const cmdBytes = CMD_CODE_MAP[input.command] || [0xdf, 0x01];
  const payload: number[] = [];
  const isFiscalOnlyCard = input.cardFlowMode === 'fiscal_only_external_card';

  if (input.clientTxId) {
    appendTlv(payload, 0x01, encodeAsciiBytes(input.clientTxId, 32));
  }
  if (input.terminalId) {
    appendTlv(payload, 0x02, encodeAsciiBytes(input.terminalId, 16));
  }
  if (input.tableNumber) {
    appendTlv(payload, 0x03, encodeAsciiBytes(String(input.tableNumber), 16));
  }
  if (input.command === 'SALE' || input.command === 'PARTIAL_PAYMENT') {
    // Tag 0x04: 0x01 = Fiscal-only / External Bank POS (skip EFT-POS card swipe/PIN), 0x00 = Standard 2-in-1 EFT-POS
    appendTlv(payload, 0x04, [isFiscalOnlyCard ? 0x01 : 0x00]);
  }

  if (input.command === 'SALE' || input.command === 'PARTIAL_PAYMENT') {
    const items = Array.isArray(input.items) ? input.items : [];
    for (const item of items) {
      const itemBytes: number[] = [];
      const dept = Math.min(8, Math.max(1, Math.round(Number(item.deptId) || 4)));
      const vat = Math.max(0, Math.min(99, Math.round(Number(item.vatRate) || 20)));
      const qtyMilli = Math.max(1, Math.round((Number(item.quantity) || 1) * 1000));
      itemBytes.push(dept & 0xff, vat & 0xff);
      itemBytes.push((qtyMilli >> 16) & 0xff, (qtyMilli >> 8) & 0xff, qtyMilli & 0xff);
      itemBytes.push(...encodeAmountKurusBcd(item.unitPrice || 0));
      itemBytes.push(...encodeAsciiBytes(item.name || 'URUN', 24));
      appendTlv(payload, 0x21, itemBytes);
    }

    const payments = Array.isArray(input.payments) ? input.payments : [];
    if (payments.length > 0) {
      for (const p of payments) {
        const isCard = p.method === 'credit_card' || p.method === 'card' || p.method === 'credit_external';
        // 0x01 = Cash, 0x02 = Integrated EFT-POS Card (NFC/Chip), 0x03 = External POS Credit (Fiscal-only, no card read)
        const payCode = isCard ? (p.fiscalOnly || isFiscalOnlyCard || p.method === 'credit_external' ? 0x03 : 0x02) : 0x01;
        const payBytes = [payCode, p.installments ? (p.installments & 0xff) : 0x00, ...encodeAmountKurusBcd(p.amount)];
        appendTlv(payload, 0x24, payBytes);
      }
    } else if (typeof input.totalAmount === 'number') {
      appendTlv(payload, 0x24, [0x01, 0x00, ...encodeAmountKurusBcd(input.totalAmount)]);
    }
  }

  // Frame: STX(0x02) | LEN_HI | LEN_LO | SEQ | CMD_HI | CMD_LO | PAYLOAD | ETX(0x03) | LRC | CRC16_HI | CRC16_LO
  const body = [seqNo, cmdBytes[0], cmdBytes[1], ...payload];
  const len = body.length;
  const lenHi = (len >> 8) & 0xff;
  const lenLo = len & 0xff;
  const frameCore = [lenHi, lenLo, ...body, 0x03];
  const lrc = calculateLrc(frameCore);
  const crc16 = calculateCrc16Ccitt(frameCore);
  const rawBytes = [0x02, ...frameCore, lrc, (crc16 >> 8) & 0xff, crc16 & 0xff];

  const payloadHex = payload.map(toHexByte).join(' ');
  const fullFrameHex = rawBytes.map(toHexByte).join(' ');
  const cmdCodeHex = cmdBytes.map(toHexByte).join(' ');
  const crc16Hex = `${toHexByte((crc16 >> 8) & 0xff)}${toHexByte(crc16 & 0xff)}`;

  const summaryParts = [
    `CMD=${input.command} (0x${cmdCodeHex})`,
    isFiscalOnlyCard ? `CARD_MODE=FISCAL_ONLY_EXTERNAL` : '',
    input.items?.length ? `ITEMS=${input.items.length}` : '',
    input.payments?.length ? `PAYMENTS=${input.payments.map(p => `${p.method}${p.fiscalOnly || isFiscalOnlyCard ? '(EXT)' : ''}:${Number(p.amount).toFixed(2)}`).join('+')}` : '',
    typeof input.totalAmount === 'number' ? `TOTAL=${Number(input.totalAmount).toFixed(2)}` : ''
  ].filter(Boolean);

  return {
    command: input.command,
    cmdCodeHex,
    seqNo,
    payloadHex,
    lrcHex: toHexByte(lrc),
    crc16Hex,
    fullFrameHex,
    byteLength: rawBytes.length,
    rawBytes,
    humanSummary: summaryParts.join(' | ')
  };
}

export function buildGmp3CommandHex(input: Gmp3PacketInput): string {
  return buildGmp3CommandPacket(input).fullFrameHex;
}

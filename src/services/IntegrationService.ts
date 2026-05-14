import { pool } from "../../models/db";
import { logAction } from "../../models/db";

export class IntegrationService {
  /**
   * Logs integration errors to the audit_logs table
   */
  static async logIntegrationError(
    storeId: number,
    integrationName: string,
    action: string,
    error: any,
    details?: string
  ) {
    console.error(`[${integrationName}] ${action} failed:`, error);
    try {
      await logAction(
        storeId,
        null,
        `${integrationName}_error`,
        "integration",
        null,
        `Action: ${action}, Error: ${error.message || error}, Details: ${details || ''}`
      );
    } catch (logErr) {
      console.error("Failed to log integration error to DB:", logErr);
    }
  }

  /**
   * Helper to check if an order is already synced
   */
  static async isOrderSynced(
    client: any,
    tableName: string,
    storeId: number,
    orderIdField: string,
    orderId: string
  ): Promise<boolean> {
    const query = `SELECT id FROM ${tableName} WHERE store_id = $1 AND ${orderIdField} = $2`;
    const res = await client.query(query, [storeId, orderId]);
    return res.rows.length > 0;
  }
}

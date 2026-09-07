import { pool } from "../../../models/db";

export const logAudit = async (
  storeId: number,
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number | null = null,
  details: string = "",
  oldValue: any = null,
  newValue: any = null
) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (store_id, user_id, action, entity_type, entity_id, details, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        storeId,
        userId,
        action,
        entityType,
        entityId,
        details,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
      ]
    );
  } catch (error) {
    console.error("Failed to insert audit log:", error);
  }
};

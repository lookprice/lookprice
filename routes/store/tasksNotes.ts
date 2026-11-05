import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "../../middleware/auth";

const router = express.Router();

let schemaInitialized = false;

export const DEFAULT_WORKFLOW_STATES = [
  {
    state_key: "not_started",
    label_tr: "Başlamadı",
    label_en: "Not Started",
    color: "slate",
    default_completion: 0,
    is_terminal: false,
    is_system: true,
    sort_order: 10,
    allowed_transitions: ["in_progress", "waiting", "deferred", "completed"]
  },
  {
    state_key: "in_progress",
    label_tr: "Devam Ediyor",
    label_en: "In Progress",
    color: "blue",
    default_completion: 25,
    is_terminal: false,
    is_system: true,
    sort_order: 20,
    allowed_transitions: ["not_started", "waiting", "deferred", "completed"]
  },
  {
    state_key: "waiting",
    label_tr: "Başkasını Bekliyor",
    label_en: "Waiting on Someone Else",
    color: "amber",
    default_completion: 50,
    is_terminal: false,
    is_system: true,
    sort_order: 30,
    allowed_transitions: ["in_progress", "deferred", "completed", "not_started"]
  },
  {
    state_key: "deferred",
    label_tr: "Ertelendi",
    label_en: "Deferred",
    color: "purple",
    default_completion: 0,
    is_terminal: false,
    is_system: true,
    sort_order: 40,
    allowed_transitions: ["not_started", "in_progress", "waiting", "completed"]
  },
  {
    state_key: "completed",
    label_tr: "Tamamlandı",
    label_en: "Completed",
    color: "emerald",
    default_completion: 100,
    is_terminal: true,
    is_system: true,
    sort_order: 50,
    allowed_transitions: ["not_started", "in_progress"]
  }
];

export async function initTasksNotesSchema() {
  if (schemaInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_workflow_states (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        state_key TEXT NOT NULL,
        label_tr TEXT NOT NULL,
        label_en TEXT NOT NULL,
        color TEXT DEFAULT 'slate',
        default_completion INTEGER DEFAULT 0,
        is_terminal BOOLEAN DEFAULT FALSE,
        is_system BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        allowed_transitions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, state_key)
      );

      CREATE TABLE IF NOT EXISTS operator_tasks (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        branch_id INTEGER,
        user_id INTEGER NOT NULL,
        assigned_to_user_id INTEGER,
        visibility TEXT DEFAULT 'personal',
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        state_key TEXT NOT NULL DEFAULT 'not_started',
        priority TEXT NOT NULL DEFAULT 'normal',
        completion_percent INTEGER NOT NULL DEFAULT 0,
        due_date TIMESTAMP,
        reminder_at TIMESTAMP,
        reminder_notified BOOLEAN DEFAULT FALSE,
        category TEXT DEFAULT 'Genel',
        source_note_id INTEGER,
        entity_type TEXT,
        entity_id TEXT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS operator_notes (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        branch_id INTEGER,
        user_id INTEGER NOT NULL,
        visibility TEXT DEFAULT 'personal',
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        color TEXT DEFAULT 'yellow',
        folder_name TEXT DEFAULT 'Genel',
        is_pinned BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        linked_task_id INTEGER,
        entity_type TEXT,
        entity_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_operator_tasks_store_user ON operator_tasks(store_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_operator_tasks_due ON operator_tasks(store_id, due_date);
      CREATE INDEX IF NOT EXISTS idx_operator_notes_store_user ON operator_notes(store_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_operator_notes_linked_task ON operator_notes(linked_task_id);
    `);
    schemaInitialized = true;
  } catch (err: any) {
    console.error("[TasksNotesSchema] Initialization warning:", err?.message || err);
  }
}

async function ensureStoreWorkflowStates(storeId: number) {
  await initTasksNotesSchema();
  const existing = await pool.query(
    "SELECT * FROM task_workflow_states WHERE store_id = $1 ORDER BY sort_order ASC, id ASC",
    [storeId]
  );
  if (existing.rows.length > 0) {
    return existing.rows;
  }

  for (const st of DEFAULT_WORKFLOW_STATES) {
    await pool.query(
      `INSERT INTO task_workflow_states 
        (store_id, state_key, label_tr, label_en, color, default_completion, is_terminal, is_system, sort_order, allowed_transitions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (store_id, state_key) DO NOTHING`,
      [
        storeId,
        st.state_key,
        st.label_tr,
        st.label_en,
        st.color,
        st.default_completion,
        st.is_terminal,
        st.is_system,
        st.sort_order,
        JSON.stringify(st.allowed_transitions)
      ]
    );
  }

  const seeded = await pool.query(
    "SELECT * FROM task_workflow_states WHERE store_id = $1 ORDER BY sort_order ASC, id ASC",
    [storeId]
  );
  return seeded.rows;
}

function resolveUserId(req: any): number {
  return Number(req.user?.id || req.user?.userId || 1);
}

// 1. BOOTSTRAP: Fetch States, Tasks (with attached notes), Sticky Notes (with linked task), and Folders
router.get("/bootstrap", async (req: any, res) => {
  try {
    await initTasksNotesSchema();
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const userId = resolveUserId(req);
    const branchId = req.query.branchId ? Number(req.query.branchId) : null;
    const scope = String(req.query.scope || "all"); // 'personal' | 'shared' | 'all'

    const states = await ensureStoreWorkflowStates(storeId);

    // Fetch visible tasks for this user (Personal tasks owned/assigned to user + shared branch/store tasks)
    let taskFilterSql = `(t.user_id = $2 OR t.assigned_to_user_id = $2 OR t.visibility IN ('branch', 'store'))`;
    const taskParams: any[] = [storeId, userId];

    if (scope === "personal") {
      taskFilterSql = `(t.user_id = $2 OR t.assigned_to_user_id = $2)`;
    } else if (scope === "shared") {
      taskFilterSql = `t.visibility IN ('branch', 'store')`;
    }

    if (branchId && !isNaN(branchId)) {
      taskParams.push(branchId);
      taskFilterSql += ` AND (t.branch_id = $${taskParams.length} OR t.branch_id IS NULL)`;
    }

    const tasksRes = await pool.query(
      `SELECT t.*,
              u.email as owner_email,
              au.email as assignee_email
       FROM operator_tasks t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users au ON t.assigned_to_user_id = au.id
       WHERE t.store_id = $1 AND ${taskFilterSql}
       ORDER BY 
         CASE WHEN t.state_key = 'completed' THEN 1 ELSE 0 END ASC,
         CASE WHEN t.priority = 'high' THEN 1 WHEN t.priority = 'normal' THEN 2 ELSE 3 END ASC,
         t.due_date ASC NULLS LAST,
         t.created_at DESC`,
      taskParams
    );

    // Fetch visible notes for this user
    let noteFilterSql = `(n.user_id = $2 OR n.visibility IN ('branch', 'store'))`;
    const noteParams: any[] = [storeId, userId];

    if (scope === "personal") {
      noteFilterSql = `n.user_id = $2`;
    } else if (scope === "shared") {
      noteFilterSql = `n.visibility IN ('branch', 'store')`;
    }

    if (branchId && !isNaN(branchId)) {
      noteParams.push(branchId);
      noteFilterSql += ` AND (n.branch_id = $${noteParams.length} OR n.branch_id IS NULL)`;
    }

    const notesRes = await pool.query(
      `SELECT n.*,
              t.title as linked_task_title,
              t.state_key as linked_task_state,
              t.due_date as linked_task_due_date,
              t.completion_percent as linked_task_completion,
              u.email as owner_email
       FROM operator_notes n
       LEFT JOIN operator_tasks t ON n.linked_task_id = t.id
       LEFT JOIN users u ON n.user_id = u.id
       WHERE n.store_id = $1 AND ${noteFilterSql}
       ORDER BY n.is_pinned DESC, n.updated_at DESC, n.created_at DESC`,
      noteParams
    );

    // Group attached notes by linked_task_id for instant relational lookup on tasks
    const notesByTaskId = new Map<number, any[]>();
    for (const note of notesRes.rows) {
      const targetTaskId = note.linked_task_id || (note.entity_type === "task" && note.entity_id ? Number(note.entity_id) : null);
      if (targetTaskId && !isNaN(targetTaskId)) {
        if (!notesByTaskId.has(targetTaskId)) {
          notesByTaskId.set(targetTaskId, []);
        }
        notesByTaskId.get(targetTaskId)!.push(note);
      }
    }

    const enrichedTasks = tasksRes.rows.map((t: any) => ({
      ...t,
      attached_notes: notesByTaskId.get(Number(t.id)) || []
    }));

    // Extract distinct folders
    const folderSet = new Set<string>(["Genel", "Günlük", "Müşteri Notları", "Finans & Kasa", "Acil"]);
    for (const n of notesRes.rows) {
      if (n.folder_name && String(n.folder_name).trim()) {
        folderSet.add(String(n.folder_name).trim());
      }
    }

    // Store users & branches for optional assignment / branch tagging
    let users: any[] = [];
    let branches: any[] = [];
    try {
      const uRes = await pool.query("SELECT id, email, role FROM users WHERE store_id = $1 ORDER BY id ASC", [storeId]);
      users = uRes.rows;
    } catch (_) {}
    try {
      const bRes = await pool.query("SELECT id, name FROM branches WHERE store_id = $1 ORDER BY id ASC", [storeId]);
      branches = bRes.rows;
    } catch (_) {}

    res.json({
      states,
      tasks: enrichedTasks,
      notes: notesRes.rows,
      folders: Array.from(folderSet),
      users,
      branches,
      currentUserId: userId
    });
  } catch (err: any) {
    console.error("[TasksNotes] Bootstrap error:", err);
    res.status(500).json({ error: err.message || "Görev ve not verileri yüklenemedi." });
  }
});

// 2. STATE MACHINE ENDPOINTS
router.get("/states", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const states = await ensureStoreWorkflowStates(storeId);
    res.json(states);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/states", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
    await ensureStoreWorkflowStates(storeId);

    const { label_tr, label_en, color, default_completion, is_terminal, allowed_transitions } = req.body;
    if (!label_tr || !String(label_tr).trim()) {
      return res.status(400).json({ error: "Durum adı (label_tr) zorunludur." });
    }

    const cleanKey = String(req.body.state_key || label_tr)
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const maxOrderRes = await pool.query(
      "SELECT COALESCE(MAX(sort_order), 50) as max_order FROM task_workflow_states WHERE store_id = $1",
      [storeId]
    );
    const nextOrder = Number(maxOrderRes.rows[0]?.max_order || 50) + 10;

    const result = await pool.query(
      `INSERT INTO task_workflow_states 
        (store_id, state_key, label_tr, label_en, color, default_completion, is_terminal, is_system, sort_order, allowed_transitions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8, $9)
       ON CONFLICT (store_id, state_key) DO UPDATE SET
         label_tr = EXCLUDED.label_tr,
         label_en = EXCLUDED.label_en,
         color = EXCLUDED.color,
         default_completion = EXCLUDED.default_completion,
         is_terminal = EXCLUDED.is_terminal,
         allowed_transitions = EXCLUDED.allowed_transitions
       RETURNING *`,
      [
        storeId,
        cleanKey,
        String(label_tr).trim(),
        String(label_en || label_tr).trim(),
        color || "indigo",
        Math.min(100, Math.max(0, Number(default_completion ?? 50))),
        Boolean(is_terminal),
        nextOrder,
        JSON.stringify(Array.isArray(allowed_transitions) ? allowed_transitions : [])
      ]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/states/:stateKey", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const { stateKey } = req.params;

    const checkRes = await pool.query(
      "SELECT * FROM task_workflow_states WHERE store_id = $1 AND state_key = $2",
      [storeId, stateKey]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Durum bulunamadı." });
    }
    if (checkRes.rows[0].is_system) {
      return res.status(400).json({ error: "Sistem ana durumları silinemez." });
    }

    // Reassign tasks in this state to 'in_progress'
    await pool.query(
      "UPDATE operator_tasks SET state_key = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE store_id = $1 AND state_key = $2",
      [storeId, stateKey]
    );
    await pool.query(
      "DELETE FROM task_workflow_states WHERE store_id = $1 AND state_key = $2 AND is_system = FALSE",
      [storeId, stateKey]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. TASKS CRUD & STATE-MACHINE TRANSITIONS
router.post("/tasks", async (req: any, res) => {
  try {
    await initTasksNotesSchema();
    const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
    const userId = resolveUserId(req);
    const states = await ensureStoreWorkflowStates(storeId);

    const {
      title,
      description,
      state_key,
      priority,
      completion_percent,
      due_date,
      reminder_at,
      category,
      branch_id,
      assigned_to_user_id,
      visibility,
      source_note_id,
      entity_type,
      entity_id,
      attached_note_ids
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Görev başlığı zorunludur." });
    }

    let resolvedStateKey = state_key || "not_started";
    const matchedState = states.find((s: any) => s.state_key === resolvedStateKey);
    let resolvedCompletion =
      completion_percent !== undefined && completion_percent !== null
        ? Math.min(100, Math.max(0, Number(completion_percent)))
        : matchedState
        ? Number(matchedState.default_completion || 0)
        : 0;

    if (resolvedCompletion === 100) {
      const terminalState = states.find((s: any) => s.is_terminal) || { state_key: "completed" };
      resolvedStateKey = terminalState.state_key;
    } else if (matchedState?.is_terminal) {
      resolvedCompletion = 100;
    } else if (resolvedCompletion > 0 && resolvedStateKey === "not_started") {
      resolvedStateKey = "in_progress";
    }

    const isCompleted = resolvedCompletion === 100 || Boolean(matchedState?.is_terminal);

    const insertRes = await pool.query(
      `INSERT INTO operator_tasks (
        store_id, branch_id, user_id, assigned_to_user_id, visibility,
        title, description, state_key, priority, completion_percent,
        due_date, reminder_at, reminder_notified, category,
        source_note_id, entity_type, entity_id, completed_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, FALSE, $13,
        $14, $15, $16, $17
      ) RETURNING *`,
      [
        storeId,
        branch_id ? Number(branch_id) : null,
        userId,
        assigned_to_user_id ? Number(assigned_to_user_id) : userId,
        visibility || "personal",
        String(title).trim(),
        String(description || "").trim(),
        resolvedStateKey,
        ["low", "normal", "high"].includes(priority) ? priority : "normal",
        resolvedCompletion,
        due_date ? new Date(due_date).toISOString() : null,
        reminder_at ? new Date(reminder_at).toISOString() : null,
        String(category || "Genel").trim(),
        source_note_id ? Number(source_note_id) : null,
        entity_type || (source_note_id ? "note" : null),
        entity_id ? String(entity_id) : (source_note_id ? String(source_note_id) : null),
        isCompleted ? new Date().toISOString() : null
      ]
    );

    const createdTask = insertRes.rows[0];

    // If source_note_id or attached_note_ids provided, link those notes to this task
    const noteIdsToLink: number[] = [];
    if (source_note_id && !isNaN(Number(source_note_id))) {
      noteIdsToLink.push(Number(source_note_id));
    }
    if (Array.isArray(attached_note_ids)) {
      for (const nid of attached_note_ids) {
        if (!isNaN(Number(nid)) && !noteIdsToLink.includes(Number(nid))) {
          noteIdsToLink.push(Number(nid));
        }
      }
    }

    if (noteIdsToLink.length > 0) {
      await pool.query(
        `UPDATE operator_notes 
         SET linked_task_id = $1, entity_type = 'task', entity_id = $2, updated_at = CURRENT_TIMESTAMP
         WHERE store_id = $3 AND id = ANY($4::int[])`,
        [createdTask.id, String(createdTask.id), storeId, noteIdsToLink]
      );
    }

    const linkedNotesRes = await pool.query(
      "SELECT * FROM operator_notes WHERE store_id = $1 AND linked_task_id = $2 ORDER BY is_pinned DESC, updated_at DESC",
      [storeId, createdTask.id]
    );

    res.json({
      ...createdTask,
      attached_notes: linkedNotesRes.rows
    });
  } catch (err: any) {
    console.error("[TasksNotes] Create task error:", err);
    res.status(500).json({ error: err.message || "Görev oluşturulamadı." });
  }
});

router.put("/tasks/:id", async (req: any, res) => {
  try {
    await initTasksNotesSchema();
    const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
    const taskId = Number(req.params.id);
    const states = await ensureStoreWorkflowStates(storeId);

    const existingRes = await pool.query(
      "SELECT * FROM operator_tasks WHERE id = $1 AND store_id = $2",
      [taskId, storeId]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Görev bulunamadı." });
    }
    const currentTask = existingRes.rows[0];

    const {
      title,
      description,
      state_key,
      priority,
      completion_percent,
      due_date,
      reminder_at,
      reminder_notified,
      category,
      branch_id,
      assigned_to_user_id,
      visibility,
      entity_type,
      entity_id
    } = req.body;

    let nextStateKey = state_key !== undefined ? state_key : currentTask.state_key;
    let nextCompletion =
      completion_percent !== undefined
        ? Math.min(100, Math.max(0, Number(completion_percent)))
        : Number(currentTask.completion_percent || 0);

    // State-Machine Transition Validation & Auto-Sync
    if (state_key !== undefined && state_key !== currentTask.state_key) {
      const fromState = states.find((s: any) => s.state_key === currentTask.state_key);
      const toState = states.find((s: any) => s.state_key === state_key);
      if (fromState && Array.isArray(fromState.allowed_transitions) && fromState.allowed_transitions.length > 0) {
        if (!fromState.allowed_transitions.includes(state_key)) {
          return res.status(400).json({
            error: `Durum makinesi kuralı: '${fromState.label_tr}' durumundan '${toState?.label_tr || state_key}' durumuna doğrudan geçiş yapılamaz.`
          });
        }
      }
      if (toState) {
        if (toState.is_terminal) {
          nextCompletion = 100;
        } else if (state_key === "not_started") {
          nextCompletion = 0;
        } else if (completion_percent === undefined && currentTask.completion_percent === 100) {
          nextCompletion = Number(toState.default_completion || 25);
        } else if (completion_percent === undefined && currentTask.completion_percent === 0 && toState.default_completion > 0) {
          nextCompletion = Number(toState.default_completion);
        }
      }
    } else if (completion_percent !== undefined) {
      if (nextCompletion === 100) {
        const terminalState = states.find((s: any) => s.is_terminal) || { state_key: "completed" };
        nextStateKey = terminalState.state_key;
      } else if (nextCompletion === 0 && nextStateKey === "completed") {
        nextStateKey = "not_started";
      } else if (nextCompletion > 0 && nextCompletion < 100 && (nextStateKey === "not_started" || nextStateKey === "completed")) {
        nextStateKey = "in_progress";
      }
    }

    const targetStateObj = states.find((s: any) => s.state_key === nextStateKey);
    const isNowCompleted = nextCompletion === 100 || Boolean(targetStateObj?.is_terminal);

    // Reset reminder_notified if reminder_at changed
    const nextReminderAt = reminder_at !== undefined ? (reminder_at ? new Date(reminder_at).toISOString() : null) : currentTask.reminder_at;
    const nextReminderNotified =
      reminder_notified !== undefined
        ? Boolean(reminder_notified)
        : reminder_at !== undefined && reminder_at !== currentTask.reminder_at
        ? false
        : Boolean(currentTask.reminder_notified);

    const updateRes = await pool.query(
      `UPDATE operator_tasks SET
        title = $1,
        description = $2,
        state_key = $3,
        priority = $4,
        completion_percent = $5,
        due_date = $6,
        reminder_at = $7,
        reminder_notified = $8,
        category = $9,
        branch_id = $10,
        assigned_to_user_id = $11,
        visibility = $12,
        entity_type = $13,
        entity_id = $14,
        completed_at = $15,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 AND store_id = $17
       RETURNING *`,
      [
        title !== undefined ? String(title).trim() : currentTask.title,
        description !== undefined ? String(description).trim() : currentTask.description,
        nextStateKey,
        priority !== undefined && ["low", "normal", "high"].includes(priority) ? priority : currentTask.priority,
        nextCompletion,
        due_date !== undefined ? (due_date ? new Date(due_date).toISOString() : null) : currentTask.due_date,
        nextReminderAt,
        nextReminderNotified,
        category !== undefined ? String(category).trim() : currentTask.category,
        branch_id !== undefined ? (branch_id ? Number(branch_id) : null) : currentTask.branch_id,
        assigned_to_user_id !== undefined ? (assigned_to_user_id ? Number(assigned_to_user_id) : null) : currentTask.assigned_to_user_id,
        visibility !== undefined ? visibility : currentTask.visibility,
        entity_type !== undefined ? entity_type : currentTask.entity_type,
        entity_id !== undefined ? (entity_id ? String(entity_id) : null) : currentTask.entity_id,
        isNowCompleted ? (currentTask.completed_at || new Date().toISOString()) : null,
        taskId,
        storeId
      ]
    );

    const linkedNotesRes = await pool.query(
      "SELECT * FROM operator_notes WHERE store_id = $1 AND linked_task_id = $2 ORDER BY is_pinned DESC, updated_at DESC",
      [storeId, taskId]
    );

    res.json({
      ...updateRes.rows[0],
      attached_notes: linkedNotesRes.rows
    });
  } catch (err: any) {
    console.error("[TasksNotes] Update task error:", err);
    res.status(500).json({ error: err.message || "Görev güncellenemedi." });
  }
});

// Explicit State-Machine Transition Action
router.post("/tasks/:id/transition", async (req: any, res) => {
  try {
    await initTasksNotesSchema();
    const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
    const taskId = Number(req.params.id);
    const { target_state_key } = req.body;

    if (!target_state_key) {
      return res.status(400).json({ error: "Hedef durum (target_state_key) belirtilmelidir." });
    }

    const states = await ensureStoreWorkflowStates(storeId);
    const existingRes = await pool.query(
      "SELECT * FROM operator_tasks WHERE id = $1 AND store_id = $2",
      [taskId, storeId]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Görev bulunamadı." });
    }

    const currentTask = existingRes.rows[0];
    const fromState = states.find((s: any) => s.state_key === currentTask.state_key);
    const toState = states.find((s: any) => s.state_key === target_state_key);

    if (!toState) {
      return res.status(400).json({ error: "Geçersiz hedef durum." });
    }

    if (fromState && Array.isArray(fromState.allowed_transitions) && fromState.allowed_transitions.length > 0) {
      if (!fromState.allowed_transitions.includes(target_state_key) && currentTask.state_key !== target_state_key) {
        return res.status(400).json({
          error: `'${fromState.label_tr}' durumundan '${toState.label_tr}' durumuna geçişe izin verilmiyor.`
        });
      }
    }

    const nextCompletion = toState.is_terminal
      ? 100
      : target_state_key === "not_started"
      ? 0
      : Number(toState.default_completion ?? currentTask.completion_percent);

    const updated = await pool.query(
      `UPDATE operator_tasks SET
        state_key = $1,
        completion_percent = $2,
        completed_at = $3,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND store_id = $5
       RETURNING *`,
      [
        target_state_key,
        nextCompletion,
        toState.is_terminal ? new Date().toISOString() : null,
        taskId,
        storeId
      ]
    );

    res.json(updated.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Snooze or Dismiss Task Reminder Alarm
router.post("/tasks/:id/snooze", async (req: any, res) => {
  try {
    await initTasksNotesSchema();
    const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
    const taskId = Number(req.params.id);
    const { minutes, dismiss } = req.body;

    if (dismiss) {
      const updated = await pool.query(
        `UPDATE operator_tasks 
         SET reminder_notified = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND store_id = $2 RETURNING *`,
        [taskId, storeId]
      );
      return res.json(updated.rows[0]);
    }

    const snoozeMins = Number(minutes || 15);
    const nextReminder = new Date(Date.now() + snoozeMins * 60 * 1000).toISOString();
    const updated = await pool.query(
      `UPDATE operator_tasks 
       SET reminder_at = $1, reminder_notified = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND store_id = $3 RETURNING *`,
      [nextReminder, taskId, storeId]
    );
    res.json(updated.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/tasks/:id", async (req: any, res) => {
  try {
    await initTasksNotesSchema();
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const taskId = Number(req.params.id);

    // Unlink any attached sticky notes without deleting the notes
    await pool.query(
      "UPDATE operator_notes SET linked_task_id = NULL WHERE store_id = $1 AND linked_task_id = $2",
      [storeId, taskId]
    );
    await pool.query("DELETE FROM operator_tasks WHERE id = $1 AND store_id = $2", [taskId, storeId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. STICKY NOTES CRUD & TASK DERIVATION
router.post("/notes", async (req: any, res) => {
  try {
    await initTasksNotesSchema();
    const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
    const userId = resolveUserId(req);

    const {
      title,
      content,
      color,
      folder_name,
      is_pinned,
      is_archived,
      linked_task_id,
      branch_id,
      visibility,
      entity_type,
      entity_id
    } = req.body;

    const cleanTitle = String(title || content || "Yeni Not").trim().slice(0, 140);

    const insertRes = await pool.query(
      `INSERT INTO operator_notes (
        store_id, branch_id, user_id, visibility,
        title, content, color, folder_name,
        is_pinned, is_archived, linked_task_id, entity_type, entity_id
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12, $13
      ) RETURNING *`,
      [
        storeId,
        branch_id ? Number(branch_id) : null,
        userId,
        visibility || "personal",
        cleanTitle,
        String(content || "").trim(),
        color || "yellow",
        String(folder_name || "Genel").trim(),
        Boolean(is_pinned),
        Boolean(is_archived),
        linked_task_id ? Number(linked_task_id) : null,
        entity_type || (linked_task_id ? "task" : null),
        entity_id ? String(entity_id) : (linked_task_id ? String(linked_task_id) : null)
      ]
    );

    const note = insertRes.rows[0];
    let linkedTask: any = null;
    if (note.linked_task_id) {
      const tRes = await pool.query("SELECT id, title, state_key, due_date, completion_percent FROM operator_tasks WHERE id = $1 AND store_id = $2", [
        note.linked_task_id,
        storeId
      ]);
      linkedTask = tRes.rows[0] || null;
    }

    res.json({
      ...note,
      linked_task_title: linkedTask?.title || null,
      linked_task_state: linkedTask?.state_key || null,
      linked_task_due_date: linkedTask?.due_date || null,
      linked_task_completion: linkedTask?.completion_percent ?? null
    });
  } catch (err: any) {
    console.error("[TasksNotes] Create note error:", err);
    res.status(500).json({ error: err.message || "Not oluşturulamadı." });
  }
});

router.put("/notes/:id", async (req: any, res) => {
  try {
    await initTasksNotesSchema();
    const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
    const noteId = Number(req.params.id);

    const existingRes = await pool.query(
      "SELECT * FROM operator_notes WHERE id = $1 AND store_id = $2",
      [noteId, storeId]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Not bulunamadı." });
    }
    const cur = existingRes.rows[0];

    const {
      title,
      content,
      color,
      folder_name,
      is_pinned,
      is_archived,
      linked_task_id,
      visibility,
      branch_id,
      entity_type,
      entity_id
    } = req.body;

    const resolvedLinkedTaskId =
      linked_task_id !== undefined ? (linked_task_id ? Number(linked_task_id) : null) : cur.linked_task_id;

    const updateRes = await pool.query(
      `UPDATE operator_notes SET
        title = $1,
        content = $2,
        color = $3,
        folder_name = $4,
        is_pinned = $5,
        is_archived = $6,
        linked_task_id = $7,
        visibility = $8,
        branch_id = $9,
        entity_type = $10,
        entity_id = $11,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 AND store_id = $13
       RETURNING *`,
      [
        title !== undefined ? String(title).trim() : cur.title,
        content !== undefined ? String(content).trim() : cur.content,
        color !== undefined ? color : cur.color,
        folder_name !== undefined ? String(folder_name).trim() : cur.folder_name,
        is_pinned !== undefined ? Boolean(is_pinned) : cur.is_pinned,
        is_archived !== undefined ? Boolean(is_archived) : cur.is_archived,
        resolvedLinkedTaskId,
        visibility !== undefined ? visibility : cur.visibility,
        branch_id !== undefined ? (branch_id ? Number(branch_id) : null) : cur.branch_id,
        entity_type !== undefined ? entity_type : (resolvedLinkedTaskId ? "task" : cur.entity_type),
        entity_id !== undefined ? (entity_id ? String(entity_id) : null) : (resolvedLinkedTaskId ? String(resolvedLinkedTaskId) : cur.entity_id),
        noteId,
        storeId
      ]
    );

    const updatedNote = updateRes.rows[0];
    let linkedTask: any = null;
    if (updatedNote.linked_task_id) {
      const tRes = await pool.query("SELECT id, title, state_key, due_date, completion_percent FROM operator_tasks WHERE id = $1 AND store_id = $2", [
        updatedNote.linked_task_id,
        storeId
      ]);
      linkedTask = tRes.rows[0] || null;
    }

    res.json({
      ...updatedNote,
      linked_task_title: linkedTask?.title || null,
      linked_task_state: linkedTask?.state_key || null,
      linked_task_due_date: linkedTask?.due_date || null,
      linked_task_completion: linkedTask?.completion_percent ?? null
    });
  } catch (err: any) {
    console.error("[TasksNotes] Update note error:", err);
    res.status(500).json({ error: err.message || "Not güncellenemedi." });
  }
});

// Convert / Derive a Task directly from a Sticky Note
router.post("/notes/:id/convert-to-task", async (req: any, res) => {
  try {
    await initTasksNotesSchema();
    const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
    const userId = resolveUserId(req);
    const noteId = Number(req.params.id);

    const noteRes = await pool.query(
      "SELECT * FROM operator_notes WHERE id = $1 AND store_id = $2",
      [noteId, storeId]
    );
    if (noteRes.rows.length === 0) {
      return res.status(404).json({ error: "Kaynak not bulunamadı." });
    }
    const note = noteRes.rows[0];

    const { priority, due_date, reminder_at, state_key } = req.body;
    const defaultDue = due_date
      ? new Date(due_date).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const taskInsert = await pool.query(
      `INSERT INTO operator_tasks (
        store_id, branch_id, user_id, assigned_to_user_id, visibility,
        title, description, state_key, priority, completion_percent,
        due_date, reminder_at, reminder_notified, category,
        source_note_id, entity_type, entity_id
      ) VALUES (
        $1, $2, $3, $3, $4,
        $5, $6, $7, $8, 0,
        $9, $10, FALSE, $11,
        $12, 'note', $13
      ) RETURNING *`,
      [
        storeId,
        note.branch_id || null,
        userId,
        note.visibility || "personal",
        note.title || "Nottan Türetilen Görev",
        note.content || "",
        state_key || "not_started",
        ["low", "normal", "high"].includes(priority) ? priority : "high",
        defaultDue,
        reminder_at ? new Date(reminder_at).toISOString() : defaultDue,
        note.folder_name || "Genel",
        note.id,
        String(note.id)
      ]
    );

    const newTask = taskInsert.rows[0];

    const updatedNoteRes = await pool.query(
      `UPDATE operator_notes 
       SET linked_task_id = $1, entity_type = 'task', entity_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND store_id = $4
       RETURNING *`,
      [newTask.id, String(newTask.id), note.id, storeId]
    );

    res.json({
      task: {
        ...newTask,
        attached_notes: [updatedNoteRes.rows[0]]
      },
      note: {
        ...updatedNoteRes.rows[0],
        linked_task_title: newTask.title,
        linked_task_state: newTask.state_key,
        linked_task_due_date: newTask.due_date,
        linked_task_completion: newTask.completion_percent
      }
    });
  } catch (err: any) {
    console.error("[TasksNotes] Convert note to task error:", err);
    res.status(500).json({ error: err.message || "Nottan görev türetilemedi." });
  }
});

router.delete("/notes/:id", async (req: any, res) => {
  try {
    await initTasksNotesSchema();
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const noteId = Number(req.params.id);
    await pool.query("DELETE FROM operator_notes WHERE id = $1 AND store_id = $2", [noteId, storeId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

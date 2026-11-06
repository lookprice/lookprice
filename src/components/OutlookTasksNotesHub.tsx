import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CheckSquare,
  StickyNote,
  Plus,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Folder,
  FolderPlus,
  Archive,
  ArchiveRestore,
  Pin,
  Trash2,
  Link2,
  Unlink,
  ArrowRightCircle,
  BellRing,
  Volume2,
  VolumeX,
  X,
  ChevronUp,
  ChevronDown,
  GitBranch,
  Check,
  Search,
  User,
  Users,
  Building2,
  Calendar,
  SlidersHorizontal,
  RefreshCw
} from "lucide-react";
import { api } from "../services/api";
import { playOutlookTaskReminderSound } from "../utils/taskReminderSound";
import { toast } from "sonner";

export interface WorkflowStateItem {
  id?: number;
  store_id?: number;
  state_key: string;
  label_tr: string;
  label_en: string;
  color: string;
  default_completion: number;
  is_terminal: boolean;
  is_system: boolean;
  sort_order: number;
  allowed_transitions: string[];
}

export interface OperatorNoteItem {
  id: number;
  store_id: number;
  branch_id?: number | null;
  user_id: number;
  visibility: "personal" | "branch" | "store";
  title: string;
  content: string;
  color: "yellow" | "blue" | "green" | "pink" | "white";
  folder_name: string;
  is_pinned: boolean;
  is_archived: boolean;
  linked_task_id?: number | null;
  linked_task_title?: string | null;
  linked_task_state?: string | null;
  linked_task_due_date?: string | null;
  linked_task_completion?: number | null;
  owner_email?: string;
  created_at: string;
  updated_at: string;
}

export interface OperatorTaskItem {
  id: number;
  store_id: number;
  branch_id?: number | null;
  user_id: number;
  assigned_to_user_id?: number | null;
  visibility: "personal" | "branch" | "store";
  title: string;
  description: string;
  state_key: string;
  priority: "low" | "normal" | "high";
  completion_percent: number;
  due_date?: string | null;
  reminder_at?: string | null;
  reminder_notified?: boolean;
  category: string;
  source_note_id?: number | null;
  owner_email?: string;
  assignee_email?: string;
  attached_notes?: OperatorNoteItem[];
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface OutlookTasksNotesHubProps {
  storeId?: number;
  lang?: string;
  onRefreshNotifications?: () => void;
  hideHeaderButton?: boolean;
}

const STATE_COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  slate: { bg: "bg-slate-100", text: "text-slate-900", border: "border-slate-300", dot: "bg-slate-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-950", border: "border-blue-300", dot: "bg-blue-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-950", border: "border-amber-300", dot: "bg-amber-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-950", border: "border-purple-300", dot: "bg-purple-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-950", border: "border-emerald-300", dot: "bg-emerald-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-950", border: "border-rose-300", dot: "bg-rose-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-950", border: "border-indigo-300", dot: "bg-indigo-600" }
};

const STICKY_NOTE_STYLES: Record<string, { card: string; header: string; border: string }> = {
  yellow: {
    card: "bg-[#fef9c3] text-slate-950",
    header: "bg-[#fde047] text-slate-950 border-b border-amber-300",
    border: "border-amber-300"
  },
  blue: {
    card: "bg-sky-100 text-slate-950",
    header: "bg-sky-200 text-slate-950 border-b border-sky-300",
    border: "border-sky-300"
  },
  green: {
    card: "bg-emerald-100 text-slate-950",
    header: "bg-emerald-200 text-slate-950 border-b border-emerald-300",
    border: "border-emerald-300"
  },
  pink: {
    card: "bg-rose-100 text-slate-950",
    header: "bg-rose-200 text-slate-950 border-b border-rose-300",
    border: "border-rose-300"
  },
  white: {
    card: "bg-white text-slate-950",
    header: "bg-slate-100 text-slate-950 border-b border-slate-300",
    border: "border-slate-300"
  }
};

export const OutlookTasksNotesHub: React.FC<OutlookTasksNotesHubProps> = ({
  storeId,
  lang = "tr",
  onRefreshNotifications,
  hideHeaderButton = false
}) => {
  const isTr = lang === "tr";

  // Workspace Drawer & Mini Pull-Tab States
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleCustomOpen = (e: any) => {
      if (e?.detail?.section) setActiveSection(e.detail.section);
      setIsOpen(true);
    };
    window.addEventListener("open-tasks-notes-hub", handleCustomOpen);
    return () => window.removeEventListener("open-tasks-notes-hub", handleCustomOpen);
  }, []);
  const [activeSection, setActiveSection] = useState<"tasks" | "notes" | "workflow">("tasks");
  const [topPullExpanded, setTopPullExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Data States
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<WorkflowStateItem[]>([]);
  const [tasks, setTasks] = useState<OperatorTaskItem[]>([]);
  const [notes, setNotes] = useState<OperatorNoteItem[]>([]);
  const [folders, setFolders] = useState<string[]>(["Genel", "Günlük", "Müşteri Notları", "Finans & Kasa", "Acil"]);
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: number; email: string; role: string }>>([]);

  // Scope & Filters (Default: personal as requested)
  const [scope, setScope] = useState<"all" | "personal" | "shared">("personal");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>("active"); // 'all' | 'active' | 'overdue_today' | 'high' | 'completed' | state_key
  const [taskSearch, setTaskSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Notes Filter & State
  const [selectedFolder, setSelectedFolder] = useState<string>("ALL");
  const [showArchivedNotes, setShowArchivedNotes] = useState<boolean>(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [newFolderInput, setNewFolderInput] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  // Quick-Add Task Form State (Outlook 2007 Top Input Row)
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<"low" | "normal" | "high">("normal");
  const [quickTaskState, setQuickTaskState] = useState<string>("not_started");
  const [quickTaskDueDate, setQuickTaskDueDate] = useState<string>("");
  const [quickTaskReminder, setQuickTaskReminder] = useState<string>("");
  const [quickTaskVisibility, setQuickTaskVisibility] = useState<"personal" | "branch" | "store">("personal");

  // Quick-Add Sticky Note State
  const [showNewNoteComposer, setShowNewNoteComposer] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteColor, setNewNoteColor] = useState<"yellow" | "blue" | "green" | "pink" | "white">("yellow");
  const [newNoteFolder, setNewNoteFolder] = useState("Genel");
  const [newNoteLinkedTaskId, setNewNoteLinkedTaskId] = useState<number | null>(null);
  const [newNoteVisibility, setNewNoteVisibility] = useState<"personal" | "branch" | "store">("personal");

  // Editing Sticky Note State
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");
  const [editNoteFolder, setEditNoteFolder] = useState("Genel");
  const [editNoteColor, setEditNoteColor] = useState<"yellow" | "blue" | "green" | "pink" | "white">("yellow");
  const [editNoteLinkedTaskId, setEditNoteLinkedTaskId] = useState<number | null>(null);

  // State-Machine Custom State Form
  const [newStateLabelTr, setNewStateLabelTr] = useState("");
  const [newStateColor, setNewStateColor] = useState("indigo");
  const [newStateDefaultPct, setNewStateDefaultPct] = useState(50);
  const [newStateTerminal, setNewStateTerminal] = useState(false);
  const [newStateAllowedTransitions, setNewStateAllowedTransitions] = useState<string[]>([]);

  // Acoustic & Visual Reminder Engine
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("outlook_tasks_sound_muted") !== "true";
  });
  const [activeReminderTasks, setActiveReminderTasks] = useState<OperatorTaskItem[]>([]);
  const notifiedTaskIdsRef = useRef<Set<string>>(new Set());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("outlook_tasks_sound_muted", next ? "false" : "true");
    if (next) {
      playOutlookTaskReminderSound(false);
      toast.success(isTr ? "Görev sesli uyarıları aktif edildi" : "Task audio alerts enabled");
    } else {
      toast.info(isTr ? "Görev sesli uyarıları sessize alındı" : "Task audio alerts muted");
    }
  };

  const fetchBootstrap = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await api.getTasksNotesBootstrap(storeId, scope, selectedBranchId);
        if (res) {
          if (Array.isArray(res.states)) setStates(res.states);
          if (Array.isArray(res.tasks)) setTasks(res.tasks);
          if (Array.isArray(res.notes)) setNotes(res.notes);
          if (Array.isArray(res.folders) && res.folders.length > 0) setFolders(res.folders);
          if (Array.isArray(res.branches)) setBranches(res.branches);
          if (Array.isArray(res.users)) setUsers(res.users);
        }
      } catch (err: any) {
        if (!silent) {
          console.warn("Tasks & Notes bootstrap warning:", err?.message || err);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [storeId, scope, selectedBranchId]
  );

  useEffect(() => {
    fetchBootstrap(false);
    const interval = setInterval(() => {
      fetchBootstrap(true);
    }, 25000);
    return () => clearInterval(interval);
  }, [fetchBootstrap]);

  // Listen to custom event from Notification Center or Keyboard Shortcuts
  useEffect(() => {
    const handleOpenEvent = (e: any) => {
      const targetTab = e?.detail?.section || "tasks";
      setActiveSection(targetTab);
      setIsOpen(true);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setActiveSection("tasks");
        setIsOpen((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setActiveSection("notes");
        setIsOpen(true);
        setShowNewNoteComposer(true);
      }
    };
    window.addEventListener("open-outlook-tasks-notes", handleOpenEvent as EventListener);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-outlook-tasks-notes", handleOpenEvent as EventListener);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Check for due reminders & overdue high-priority tasks and trigger Acoustic Alert
  useEffect(() => {
    const now = Date.now();
    const dueAlarms: OperatorTaskItem[] = [];
    let shouldRing = false;

    for (const t of tasks) {
      if (t.state_key === "completed" || t.completion_percent >= 100) continue;

      const reminderTime = t.reminder_at ? new Date(t.reminder_at).getTime() : null;
      const dueTime = t.due_date ? new Date(t.due_date).getTime() : null;

      const isReminderTriggered = reminderTime !== null && reminderTime <= now && !t.reminder_notified;
      const isOverdueTriggered = dueTime !== null && dueTime <= now && !t.reminder_notified;

      if (isReminderTriggered || isOverdueTriggered) {
        dueAlarms.push(t);
        const signature = `${t.id}_${t.reminder_at || t.due_date}`;
        if (!notifiedTaskIdsRef.current.has(signature)) {
          notifiedTaskIdsRef.current.add(signature);
          shouldRing = true;
        }
      }
    }

    setActiveReminderTasks(dueAlarms);

    if (shouldRing && soundEnabled) {
      playOutlookTaskReminderSound(true);
    }
  }, [tasks, soundEnabled]);

  // Derived Counts for Badges
  const activeTasksCount = useMemo(
    () => tasks.filter((t) => t.state_key !== "completed" && t.completion_percent < 100).length,
    [tasks]
  );

  const overdueOrHighCount = useMemo(() => {
    const now = Date.now();
    return tasks.filter((t) => {
      if (t.state_key === "completed" || t.completion_percent >= 100) return false;
      const isOverdue = t.due_date ? new Date(t.due_date).getTime() < now : false;
      const isAlarm = t.reminder_at ? new Date(t.reminder_at).getTime() <= now && !t.reminder_notified : false;
      return isOverdue || isAlarm || t.priority === "high";
    }).length;
  }, [tasks]);

  const activeNotesCount = useMemo(
    () => notes.filter((n) => !n.is_archived).length,
    [notes]
  );

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  const stateMap = useMemo(() => {
    const map = new Map<string, WorkflowStateItem>();
    for (const s of states) {
      map.set(s.state_key, s);
    }
    return map;
  }, [states]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const now = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return tasks.filter((t) => {
      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = (t.description || "").toLowerCase().includes(q);
        const matchCat = (t.category || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      if (taskFilter === "all") return true;
      if (taskFilter === "active") return t.state_key !== "completed" && t.completion_percent < 100;
      if (taskFilter === "completed") return t.state_key === "completed" || t.completion_percent >= 100;
      if (taskFilter === "high") return t.priority === "high" && t.state_key !== "completed";
      if (taskFilter === "overdue_today") {
        if (t.state_key === "completed" || t.completion_percent >= 100) return false;
        if (!t.due_date) return false;
        return new Date(t.due_date).getTime() <= endOfToday.getTime() || new Date(t.due_date).getTime() < now;
      }
      return t.state_key === taskFilter;
    });
  }, [tasks, taskFilter, taskSearch]);

  // Filtered Sticky Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (Boolean(n.is_archived) !== showArchivedNotes) return false;
      if (selectedFolder !== "ALL" && n.folder_name !== selectedFolder) return false;
      if (noteSearch.trim()) {
        const q = noteSearch.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !(n.content || "").toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [notes, showArchivedNotes, selectedFolder, noteSearch]);

  // Handlers: Tasks
  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) {
      toast.error(isTr ? "Lütfen görev başlığı yazın" : "Please enter task title");
      return;
    }
    try {
      const created = await api.createOperatorTask(
        {
          title: quickTaskTitle.trim(),
          priority: quickTaskPriority,
          state_key: quickTaskState,
          due_date: quickTaskDueDate || null,
          reminder_at: quickTaskReminder || quickTaskDueDate || null,
          visibility: quickTaskVisibility,
          branch_id: selectedBranchId
        },
        storeId
      );
      setTasks((prev) => [created, ...prev]);
      setSelectedTaskId(created.id);
      setQuickTaskTitle("");
      setQuickTaskDueDate("");
      setQuickTaskReminder("");
      toast.success(isTr ? "Görev eklendi" : "Task created");
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err: any) {
      toast.error(err?.message || "Görev oluşturulamadı");
    }
  };

  const handleUpdateTask = async (taskId: number, patch: Partial<OperatorTaskItem>) => {
    try {
      const updated = await api.updateOperatorTask(taskId, patch, storeId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)));
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err: any) {
      toast.error(err?.message || "Görev güncellenemedi");
    }
  };

  const handleToggleComplete = async (task: OperatorTaskItem) => {
    const isCurrentlyDone = task.state_key === "completed" || task.completion_percent >= 100;
    const nextState = isCurrentlyDone ? "in_progress" : "completed";
    const nextPct = isCurrentlyDone ? 50 : 100;
    await handleUpdateTask(task.id, {
      state_key: nextState,
      completion_percent: nextPct
    });
    if (!isCurrentlyDone && soundEnabled) {
      playOutlookTaskReminderSound(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.deleteOperatorTask(taskId, storeId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setNotes((prev) =>
        prev.map((n) => (n.linked_task_id === taskId ? { ...n, linked_task_id: null, linked_task_title: null } : n))
      );
      if (selectedTaskId === taskId) setSelectedTaskId(null);
      toast.success(isTr ? "Görev silindi" : "Task deleted");
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err: any) {
      toast.error(err?.message || "Görev silinemedi");
    }
  };

  const handleSnoozeReminder = async (taskId: number, minutes?: number, dismiss?: boolean) => {
    try {
      const updated = await api.snoozeOperatorTaskReminder(taskId, { minutes, dismiss }, storeId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t)));
      setActiveReminderTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success(
        dismiss
          ? isTr
            ? "Görev alarmı kapatıldı"
            : "Reminder dismissed"
          : isTr
          ? `Alarm ${minutes} dakika ertelendi`
          : `Snoozed for ${minutes}m`
      );
    } catch (err: any) {
      toast.error(err?.message || "Alarm güncellenemedi");
    }
  };

  // Handlers: Sticky Notes
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && !newNoteContent.trim()) {
      toast.error(isTr ? "Not başlığı veya metni girin" : "Enter note title or text");
      return;
    }
    try {
      const created = await api.createOperatorNote(
        {
          title: newNoteTitle.trim() || newNoteContent.trim().slice(0, 50),
          content: newNoteContent.trim(),
          color: newNoteColor,
          folder_name: newNoteFolder || "Genel",
          linked_task_id: newNoteLinkedTaskId,
          visibility: newNoteVisibility,
          branch_id: selectedBranchId
        },
        storeId
      );
      setNotes((prev) => [created, ...prev]);
      if (created.linked_task_id) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === created.linked_task_id
              ? { ...t, attached_notes: [created, ...(t.attached_notes || [])] }
              : t
          )
        );
      }
      setNewNoteTitle("");
      setNewNoteContent("");
      setNewNoteLinkedTaskId(null);
      setShowNewNoteComposer(false);
      toast.success(isTr ? "Sarı yapışkan not kaydedildi" : "Sticky note saved");
    } catch (err: any) {
      toast.error(err?.message || "Not kaydedilemedi");
    }
  };

  const handleSaveEditNote = async (noteId: number) => {
    try {
      const updated = await api.updateOperatorNote(
        noteId,
        {
          title: editNoteTitle.trim() || "Not",
          content: editNoteContent,
          folder_name: editNoteFolder,
          color: editNoteColor,
          linked_task_id: editNoteLinkedTaskId
        },
        storeId
      );
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setEditingNoteId(null);
      fetchBootstrap(true);
      toast.success(isTr ? "Not güncellendi" : "Note updated");
    } catch (err: any) {
      toast.error(err?.message || "Not güncellenemedi");
    }
  };

  const handleTogglePinNote = async (note: OperatorNoteItem) => {
    try {
      const updated = await api.updateOperatorNote(note.id, { is_pinned: !note.is_pinned }, storeId);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    } catch (err: any) {
      toast.error("Sabitleme güncellenemedi");
    }
  };

  const handleToggleArchiveNote = async (note: OperatorNoteItem) => {
    try {
      const updated = await api.updateOperatorNote(note.id, { is_archived: !note.is_archived }, storeId);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
      toast.success(
        updated.is_archived
          ? isTr
            ? "Not arşive kaldırıldı"
            : "Note archived"
          : isTr
          ? "Not arşivden çıkarıldı"
          : "Note restored"
      );
    } catch (err: any) {
      toast.error("Arşiv durumu güncellenemedi");
    }
  };

  const handleConvertNoteToTask = async (note: OperatorNoteItem) => {
    try {
      const res = await api.convertNoteToTask(
        note.id,
        {
          priority: "high",
          state_key: "not_started"
        },
        storeId
      );
      if (res?.task && res?.note) {
        setTasks((prev) => [res.task, ...prev]);
        setNotes((prev) => prev.map((n) => (n.id === note.id ? res.note : n)));
        setSelectedTaskId(res.task.id);
        setActiveSection("tasks");
        toast.success(isTr ? "Nottan görev türetildi ve birbirine bağlandı!" : "Task derived from note and linked!");
        if (onRefreshNotifications) onRefreshNotifications();
      }
    } catch (err: any) {
      toast.error(err?.message || "Görev türetilemedi");
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await api.deleteOperatorNote(noteId, storeId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          attached_notes: (t.attached_notes || []).filter((an) => an.id !== noteId)
        }))
      );
      toast.success(isTr ? "Not silindi" : "Note deleted");
    } catch (err: any) {
      toast.error("Not silinemedi");
    }
  };

  // Handlers: Custom State-Machine Workflow
  const handleCreateCustomState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStateLabelTr.trim()) {
      toast.error("Durum adı giriniz");
      return;
    }
    try {
      const created = await api.createTaskWorkflowState(
        {
          label_tr: newStateLabelTr.trim(),
          label_en: newStateLabelTr.trim(),
          color: newStateColor,
          default_completion: newStateDefaultPct,
          is_terminal: newStateTerminal,
          allowed_transitions: newStateAllowedTransitions
        },
        storeId
      );
      setStates((prev) => [...prev.filter((s) => s.state_key !== created.state_key), created]);
      setNewStateLabelTr("");
      setNewStateAllowedTransitions([]);
      toast.success(isTr ? "Yeni iş akışı durumu eklendi" : "Workflow state added");
    } catch (err: any) {
      toast.error(err?.message || "Durum eklenemedi");
    }
  };

  const handleDeleteCustomState = async (stateKey: string) => {
    try {
      await api.deleteTaskWorkflowState(stateKey, storeId);
      setStates((prev) => prev.filter((s) => s.state_key !== stateKey));
      toast.success("Özel durum kaldırıldı");
    } catch (err: any) {
      toast.error(err?.message || "Durum silinemedi");
    }
  };

  return (
    <>
      {/* 1. HEADER QUICK-LAUNCH ICON BUTTON (Only if !hideHeaderButton) */}
      {!hideHeaderButton && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveSection("tasks");
              setIsOpen(true);
            }}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
              isOpen
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : overdueOrHighCount > 0
                ? "bg-amber-50 hover:bg-amber-100 text-slate-950 border-amber-300"
                : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
            }`}
            title={isTr ? "Outlook Görevler & Sarı Yapışkan Notlar (Alt+T / Alt+N)" : "Outlook Tasks & Sticky Notes"}
          >
            <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="hidden md:inline text-xs font-black tracking-tight">
              {isTr ? "Görev & Not" : "Tasks & Notes"}
            </span>
            {(activeTasksCount > 0 || activeNotesCount > 0) && (
              <span
                className={`min-w-[18px] h-4 px-1 rounded-full text-[10px] font-mono font-black flex items-center justify-center ${
                  overdueOrHighCount > 0
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-amber-400 text-slate-950"
                }`}
              >
                {activeTasksCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 2. TOP-RIGHT HIDDEN PULL-TAB MENU (Aligned near Notification Bell, away from Store Name) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed top-0 right-14 sm:right-36 z-[99990] flex flex-col items-end pointer-events-none">
          {topPullExpanded && (
          <div className="pointer-events-auto mt-1 bg-slate-900 text-white border border-slate-700 rounded-xl shadow-2xl px-2.5 py-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              type="button"
              onClick={() => {
                setActiveSection("tasks");
                setIsOpen(true);
                setTopPullExpanded(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>{isTr ? `Görevler (${activeTasksCount})` : `Tasks (${activeTasksCount})`}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSection("notes");
                setIsOpen(true);
                setTopPullExpanded(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fde047] hover:bg-[#fef08a] text-slate-950 text-[11px] font-black cursor-pointer"
            >
              <StickyNote className="w-3.5 h-3.5 text-slate-950" />
              <span>{isTr ? `Sarı Notlar (${activeNotesCount})` : `Notes (${activeNotesCount})`}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSection("notes");
                setIsOpen(true);
                setShowNewNoteComposer(true);
                setTopPullExpanded(false);
              }}
              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              title={isTr ? "Hızlı Sarı Not Oluştur" : "Quick Sticky Note"}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTopPullExpanded(false)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setTopPullExpanded((prev) => !prev)}
          onDoubleClick={() => {
            setTopPullExpanded(false);
            setIsOpen(true);
          }}
          className="pointer-events-auto group flex items-center gap-1 px-3 py-0.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-b-xl border-x border-b border-slate-700/80 shadow-md transition-all cursor-pointer"
          title={isTr ? "Görev & Sarı Not Hızlı Çekmecesi" : "Tasks & Sticky Notes Pull Tab"}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-[9px] font-black tracking-widest uppercase text-slate-200 group-hover:text-amber-300">
            {isTr ? "AJANDA" : "TASKS"}
          </span>
          {overdueOrHighCount > 0 && (
            <span className="px-1 rounded bg-rose-600 text-white text-[9px] font-mono font-black">
              {overdueOrHighCount}
            </span>
          )}
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${topPullExpanded ? "rotate-180" : ""}`} />
        </button>
      </div>,
      document.body
    )}



      {/* 4. REAL-TIME ACOUSTIC TASK REMINDER POPUP (Outlook 2007 Reminder Dialog) */}
      {mounted && typeof document !== "undefined" && activeReminderTasks.length > 0 && createPortal(
        <div className="fixed bottom-4 right-4 z-[99995] w-[92vw] max-w-sm bg-white border-2 border-slate-900 rounded-2xl shadow-2xl overflow-hidden text-slate-950 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="text-xs font-black uppercase tracking-wider">
                {isTr
                  ? `${activeReminderTasks.length} Görev Hatırlatıcı Alarmı`
                  : `${activeReminderTasks.length} Task Reminder Alert`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => playOutlookTaskReminderSound(true)}
                className="p-1 text-amber-400 hover:text-amber-300 cursor-pointer"
                title={isTr ? "Alarm Sesini Tekrar Çal" : "Replay Alert Sound"}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveReminderTasks([])}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-200 p-2.5 space-y-2">
            {activeReminderTasks.slice(0, 3).map((rt) => (
              <div key={rt.id} className="pt-2 first:pt-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-950 truncate">{rt.title}</div>
                    <div className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>
                        {rt.due_date
                          ? new Date(rt.due_date).toLocaleString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : isTr
                          ? "Şimdi"
                          : "Now"}
                      </span>
                      <span>• %{rt.completion_percent}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskId(rt.id);
                      setActiveSection("tasks");
                      setIsOpen(true);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded text-[10px] font-black shrink-0 cursor-pointer"
                  >
                    {isTr ? "Aç" : "Open"}
                  </button>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(rt)}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>{isTr ? "Tamamla" : "Complete"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSnoozeReminder(rt.id, 5, false)}
                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-slate-950 rounded text-[10px] font-bold cursor-pointer"
                  >
                    +5 Dk
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSnoozeReminder(rt.id, 15, false)}
                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-slate-950 rounded text-[10px] font-bold cursor-pointer"
                  >
                    +15 Dk
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSnoozeReminder(rt.id, 60, false)}
                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-slate-950 rounded text-[10px] font-bold cursor-pointer"
                  >
                    +1 Saat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSnoozeReminder(rt.id, undefined, true)}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[10px] font-bold cursor-pointer ml-auto"
                  >
                    {isTr ? "Sustur" : "Dismiss"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* 5. MAIN OUTLOOK 2007 TASKS & STICKY NOTES WORKSPACE MODAL / DRAWER */}
      {mounted && typeof document !== "undefined" && isOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-1 sm:p-3 overflow-hidden pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-6xl h-[98vh] sm:h-[92vh] max-h-[98dvh] sm:max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl text-slate-950 select-none relative z-[100000]">
            {/* TOP CORPORATE BAR (Single Module Header Rule & High Contrast Rule - Single Row Non-Wrapping) */}
            <div className="bg-slate-900 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex items-center justify-between gap-1 sm:gap-2 border-b border-slate-800 shrink-0 flex-nowrap">
              {/* Primary Navigation Icons (Tasks & Notes with Badges, Icon-Only) */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveSection("tasks")}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeSection === "tasks"
                      ? "bg-amber-400 text-slate-950 shadow-xs"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                  title={isTr ? "Görevler (Tasks)" : "Tasks"}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span
                    className={`px-1 py-0.2 rounded text-[10px] font-mono font-black ${
                      activeSection === "tasks" ? "bg-slate-950 text-amber-400" : "bg-slate-700 text-white"
                    }`}
                  >
                    {activeTasksCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("notes")}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeSection === "notes"
                      ? "bg-[#fde047] text-slate-950 shadow-xs"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                  title={isTr ? "Yapışkan Notlar (Notes)" : "Sticky Notes"}
                >
                  <StickyNote className="w-4 h-4 text-slate-950" />
                  <span
                    className={`px-1 py-0.2 rounded text-[10px] font-mono font-black ${
                      activeSection === "notes" ? "bg-slate-950 text-[#fde047]" : "bg-slate-700 text-white"
                    }`}
                  >
                    {activeNotesCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection("workflow")}
                  className={`flex items-center justify-center p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeSection === "workflow"
                      ? "bg-indigo-500 text-white shadow-xs"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  title={isTr ? "Esnek Durum Makinesi (State-Machine) İş Akışı" : "State-Machine Workflow"}
                >
                  <GitBranch className="w-4 h-4" />
                </button>
              </div>

              {/* Multi-User / Multi-Branch Scope & Controls - ALL IN SINGLE ROW */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                {/* Personal / Shared / All Dropdown Select (Default: Kişisel) */}
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="bg-slate-800 text-amber-300 border border-slate-700 rounded-lg px-2 py-1 text-[11px] sm:text-xs font-bold outline-none cursor-pointer"
                  title={isTr ? "Kapsam Seçimi" : "Scope"}
                >
                  <option value="personal">{isTr ? "Bireysel" : "Personal"}</option>
                  <option value="shared">{isTr ? "Grup / Ekip" : "Shared"}</option>
                  <option value="all">{isTr ? "Tümü" : "All"}</option>
                </select>

                {/* Multi-Branch Selector if branches exist */}
                {branches.length > 0 && (
                  <select
                    value={selectedBranchId || ""}
                    onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
                    className="bg-slate-800 text-white border border-slate-700 rounded-lg px-1.5 py-1 text-[11px] font-bold w-20 sm:w-28 outline-none"
                  >
                    <option value="">{isTr ? "Şubeler" : "Branches"}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Audio Reminder Toggle */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    soundEnabled
                      ? "bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700"
                      : "bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300"
                  }`}
                  title={
                    soundEnabled
                      ? isTr
                        ? "Sesli Uyarılar Açık"
                        : "Sound Alerts On"
                      : isTr
                      ? "Sesli Uyarılar Kapalı"
                      : "Sound Alerts Muted"
                  }
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={() => fetchBootstrap(false)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer"
                  title={isTr ? "Yenile" : "Refresh"}
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-slate-800 hover:bg-rose-600 text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  title={isTr ? "Kapat" : "Close"}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* ==================== SECTION 1: OUTLOOK 2007 TASKS (GÖREVLER) ==================== */}
            {activeSection === "tasks" && (
              <div className="flex-1 min-h-0 flex flex-col bg-slate-50 overflow-hidden">
                {/* Outlook 2007 Fast Task Creation Row - Compact & Space-Efficient */}
                <form
                  onSubmit={handleCreateQuickTask}
                  className="bg-white border-b border-slate-200 px-2 sm:px-3 py-1.5 flex flex-wrap items-center gap-1.5 shrink-0"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      placeholder={
                        isTr
                          ? "Yeni görev eklemek için buraya yazın..."
                          : "Type a new task here..."
                      }
                      className="flex-1 min-w-0 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-950 placeholder:text-slate-500 outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {/* Priority Compact Select (Rule 13: compact w-20 to w-24) */}
                    <select
                      value={quickTaskPriority}
                      onChange={(e) => setQuickTaskPriority(e.target.value as any)}
                      className="w-20 sm:w-24 px-1.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[10px] sm:text-xs font-black text-slate-900 outline-none"
                      title={isTr ? "Öncelik Sırası" : "Priority"}
                    >
                      <option value="low">{isTr ? "Düşük" : "Low"}</option>
                      <option value="normal">{isTr ? "Normal" : "Normal"}</option>
                      <option value="high">{isTr ? "Yüksek (!)" : "High (!)"}</option>
                    </select>

                    {/* Initial State Compact Select */}
                    <select
                      value={quickTaskState}
                      onChange={(e) => setQuickTaskState(e.target.value)}
                      className="w-24 sm:w-28 px-1.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[10px] sm:text-xs font-bold text-slate-900 outline-none"
                      title={isTr ? "Başlangıç Durumu" : "Initial State"}
                    >
                      {states.map((st) => (
                        <option key={st.state_key} value={st.state_key}>
                          {isTr ? st.label_tr : st.label_en}
                        </option>
                      ))}
                    </select>

                    {/* Due Date Compact Picker without manual text noise */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-1.5 py-0.5">
                      <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
                      <input
                        type="date"
                        value={quickTaskDueDate ? quickTaskDueDate.slice(0, 10) : ""}
                        onChange={(e) =>
                          setQuickTaskDueDate(
                            e.target.value ? new Date(e.target.value + "T18:00:00").toISOString() : ""
                          )
                        }
                        className="text-[10px] sm:text-[11px] font-bold text-slate-900 bg-transparent outline-none w-24 sm:w-28 py-0.5 cursor-pointer"
                        title={isTr ? "Son Teslim Tarihi" : "Due Date"}
                      />
                    </div>

                    {/* Visibility Compact Select */}
                    <select
                      value={quickTaskVisibility}
                      onChange={(e) => setQuickTaskVisibility(e.target.value as any)}
                      className="w-18 sm:w-22 px-1.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[10px] sm:text-xs font-bold text-slate-900 outline-none"
                      title={isTr ? "Görünürlük (Kişisel / Şube / Mağaza)" : "Visibility"}
                    >
                      <option value="personal">{isTr ? "Kişisel" : "Personal"}</option>
                      <option value="branch">{isTr ? "Şube" : "Branch"}</option>
                      <option value="store">{isTr ? "Mağaza" : "Store"}</option>
                    </select>

                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isTr ? "Ekle" : "Add"}</span>
                    </button>
                  </div>
                </form>

                {/* Filter & Search Sub-Bar (Integrated Single Row for Maximum Mobile Height) */}
                <div className="bg-slate-100 border-b border-slate-200 px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <select
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-black text-slate-900 outline-none w-36 sm:w-48 shrink-0 shadow-2xs"
                  >
                    <option value="active">{isTr ? "Aktif Görevler" : "Active"}</option>
                    <option value="overdue_today">{isTr ? "Bugün & Gecikenler" : "Due Today / Overdue"}</option>
                    <option value="high">{isTr ? "Yüksek Öncelik (!)" : "High Priority"}</option>
                    <option value="completed">{isTr ? "Tamamlananlar" : "Completed"}</option>
                    <option value="all">{isTr ? "Tümü" : "All"}</option>
                    <optgroup label={isTr ? "Durumlar (States)" : "States"}>
                      {states.map((st) => (
                        <option key={st.state_key} value={st.state_key}>
                          {isTr ? st.label_tr : st.label_en}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      placeholder={isTr ? "Görevlerde ara..." : "Search tasks..."}
                      className="w-full pl-6.5 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] sm:text-xs font-semibold text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                {/* Main Split Area: Left Outlook 2007 Task Grid + Right Relational Inspector & Sticky Notes */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                  {/* Task Table / List */}
                  <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200 bg-white">
                    {/* Table Header - Shortened Column Names */}
                    <div className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 px-2 sm:px-3 py-1 grid grid-cols-12 gap-1 sm:gap-2 text-[10px] font-black uppercase tracking-wider text-slate-700">
                      <div className="col-span-5 sm:col-span-5">{isTr ? "GÖREV" : "TASK"}</div>
                      <div className="col-span-3 sm:col-span-2">{isTr ? "DURUM" : "STATE"}</div>
                      <div className="col-span-2 sm:col-span-2">{isTr ? "%" : "%"}</div>
                      <div className="col-span-2 sm:col-span-3 text-right">{isTr ? "TARİH" : "DATE"}</div>
                    </div>

                    {filteredTasks.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 space-y-2">
                        <CheckSquare className="w-8 h-8 mx-auto text-slate-400" />
                        <div className="text-xs font-bold">
                          {isTr ? "Bu görünümde kayıtlı görev bulunmuyor." : "No tasks found in this view."}
                        </div>
                      </div>
                    ) : (
                      filteredTasks.map((task) => {
                        const stObj = stateMap.get(task.state_key);
                        const colorTheme = STATE_COLOR_CLASSES[stObj?.color || "slate"] || STATE_COLOR_CLASSES.slate;
                        const isDone = task.state_key === "completed" || task.completion_percent >= 100;
                        const isOverdue =
                          !isDone && task.due_date ? new Date(task.due_date).getTime() < Date.now() : false;
                        const attachedCount = (task.attached_notes || []).length;
                        const isSelected = selectedTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`px-3 py-2 grid grid-cols-12 gap-2 items-center transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-amber-50/90 border-l-4 border-l-amber-500"
                                : isOverdue
                                ? "bg-rose-50/40 hover:bg-rose-50/80"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            {/* Col 1: Complete Checkbox + Priority + Title + Attached Note Pill */}
                            <div className="col-span-5 sm:col-span-5 flex items-center gap-2 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(task);
                                }}
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                                  isDone
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "bg-white border-slate-400 hover:border-slate-900"
                                }`}
                                title={isDone ? "Tamamlandı" : "Tamamlandı İşaretle"}
                              >
                                {isDone && <Check className="w-3 h-3" />}
                              </button>

                              {/* Priority Icon */}
                              {task.priority === "high" ? (
                                <span
                                  className="px-1 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded text-[9px] font-black flex items-center shrink-0"
                                  title="Yüksek Öncelik"
                                >
                                  <ArrowUp className="w-2.5 h-2.5" />
                                </span>
                              ) : task.priority === "low" ? (
                                <span
                                  className="px-1 py-0.5 bg-sky-100 text-sky-800 border border-sky-300 rounded text-[9px] font-bold flex items-center shrink-0"
                                  title="Düşük Öncelik"
                                >
                                  <ArrowDown className="w-2.5 h-2.5" />
                                </span>
                              ) : (
                                <Minus className="w-3 h-3 text-slate-400 shrink-0" />
                              )}

                              <div className="min-w-0 flex-1">
                                <div
                                  className={`text-xs font-bold truncate ${
                                    isDone ? "line-through text-slate-400" : "text-slate-950"
                                  }`}
                                >
                                  {task.title}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {attachedCount > 0 && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-[#fef08a] text-slate-950 border border-amber-400 rounded text-[9px] font-black">
                                      <StickyNote className="w-2.5 h-2.5" />
                                      <span>{attachedCount} Not</span>
                                    </span>
                                  )}
                                  {task.visibility !== "personal" && (
                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 rounded">
                                      {task.visibility === "branch" ? "Şube" : "Mağaza"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Col 2: Dynamic State-Machine Dropdown */}
                            <div className="col-span-3 sm:col-span-2" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={task.state_key}
                                onChange={(e) => handleUpdateTask(task.id, { state_key: e.target.value })}
                                className={`w-full px-1.5 py-1 rounded-md border text-[10px] font-black outline-none cursor-pointer ${colorTheme.bg} ${colorTheme.text} ${colorTheme.border}`}
                              >
                                {states.map((s) => {
                                  const allowed =
                                    !stObj ||
                                    !Array.isArray(stObj.allowed_transitions) ||
                                    stObj.allowed_transitions.length === 0 ||
                                    stObj.allowed_transitions.includes(s.state_key) ||
                                    s.state_key === task.state_key;
                                  return (
                                    <option key={s.state_key} value={s.state_key} disabled={!allowed}>
                                      {isTr ? s.label_tr : s.label_en}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {/* Col 3: Completion % Bar & Quick Step */}
                            <div className="col-span-2 sm:col-span-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <select
                                  value={task.completion_percent}
                                  onChange={(e) =>
                                    handleUpdateTask(task.id, { completion_percent: Number(e.target.value) })
                                  }
                                  className="w-16 px-1 py-0.5 bg-slate-50 border border-slate-300 rounded text-[10px] font-mono font-black text-slate-900 outline-none cursor-pointer"
                                >
                                  {[0, 10, 25, 50, 75, 90, 100].map((pct) => (
                                    <option key={pct} value={pct}>
                                      %{pct}
                                    </option>
                                  ))}
                                </select>
                                <div className="hidden sm:block flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      task.completion_percent >= 100
                                        ? "bg-emerald-600"
                                        : task.completion_percent >= 50
                                        ? "bg-blue-600"
                                        : "bg-amber-500"
                                    }`}
                                    style={{ width: `${task.completion_percent}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Col 4: Due Date & Reminder Indicator */}
                            <div className="col-span-2 sm:col-span-3 flex items-center justify-end gap-1 text-right">
                              {task.due_date ? (
                                <span
                                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold whitespace-nowrap ${
                                    isOverdue
                                      ? "bg-rose-600 text-white font-black"
                                      : isDone
                                      ? "bg-slate-100 text-slate-500"
                                      : "bg-slate-100 text-slate-900 border border-slate-300"
                                  }`}
                                >
                                  {new Date(task.due_date).toLocaleDateString("tr-TR", {
                                    day: "2-digit",
                                    month: "short"
                                  })}
                                  <span className="hidden sm:inline">
                                    {" "}
                                    {new Date(task.due_date).toLocaleTimeString("tr-TR", {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[9px] sm:text-[10px] text-slate-400">{isTr ? "Tarihsiz" : "No Date"}</span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer shrink-0"
                                title={isTr ? "Görevi Sil" : "Delete Task"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right Inspector: Selected Task Details & Attached Yellow Sticky Notes */}
                  <div
                    className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-300 bg-slate-50 flex flex-col ${
                      selectedTask
                        ? "max-h-[48vh] lg:max-h-none p-2.5 sm:p-3 space-y-2.5"
                        : "hidden lg:flex p-4 space-y-2"
                    } overflow-y-auto shrink-0`}
                  >
                    {selectedTask ? (
                      <>
                        <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              {isTr ? "GÖREV DETAYI & İLİŞKİLİ NOTLAR" : "TASK INSPECTOR & LINKED NOTES"}
                            </span>
                            <h3 className="text-sm font-black text-slate-950 leading-snug mt-0.5">
                              {selectedTask.title}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedTaskId(null)}
                            className="p-1 text-slate-500 hover:text-slate-900"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Compact Edit Controls */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-black text-slate-700 uppercase mb-0.5">
                              {isTr ? "Öncelik" : "Priority"}
                            </label>
                            <select
                              value={selectedTask.priority}
                              onChange={(e) =>
                                handleUpdateTask(selectedTask.id, { priority: e.target.value as any })
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-950"
                            >
                              <option value="low">{isTr ? "Düşük" : "Low"}</option>
                              <option value="normal">{isTr ? "Normal" : "Normal"}</option>
                              <option value="high">{isTr ? "Yüksek (!)" : "High (!)"}</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-700 uppercase mb-0.5">
                              {isTr ? "Tamamlanma (%)" : "Completion (%)"}
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={5}
                              value={selectedTask.completion_percent}
                              onChange={(e) =>
                                handleUpdateTask(selectedTask.id, {
                                  completion_percent: Math.min(100, Math.max(0, Number(e.target.value)))
                                })
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-950"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-black text-slate-700 uppercase mb-0.5">
                              {isTr ? "Son Teslim Tarihi" : "Due Date"}
                            </label>
                            <input
                              type="datetime-local"
                              value={
                                selectedTask.due_date
                                  ? new Date(selectedTask.due_date).toISOString().slice(0, 16)
                                  : ""
                              }
                              onChange={(e) =>
                                handleUpdateTask(selectedTask.id, {
                                  due_date: e.target.value ? new Date(e.target.value).toISOString() : null
                                })
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-mono font-bold text-slate-950"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-700 uppercase mb-0.5">
                              {isTr ? "Sesli Alarm Zamanı" : "Audio Reminder"}
                            </label>
                            <input
                              type="datetime-local"
                              value={
                                selectedTask.reminder_at
                                  ? new Date(selectedTask.reminder_at).toISOString().slice(0, 16)
                                  : ""
                              }
                              onChange={(e) =>
                                handleUpdateTask(selectedTask.id, {
                                  reminder_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                                  reminder_notified: false
                                })
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-mono font-bold text-slate-950"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-700 uppercase mb-0.5">
                            {isTr ? "Görev Açıklaması / Detay" : "Task Description"}
                          </label>
                          <textarea
                            rows={2}
                            value={selectedTask.description || ""}
                            onChange={(e) =>
                              setTasks((prev) =>
                                prev.map((t) =>
                                  t.id === selectedTask.id ? { ...t, description: e.target.value } : t
                                )
                              )
                            }
                            onBlur={(e) => handleUpdateTask(selectedTask.id, { description: e.target.value })}
                            placeholder={isTr ? "Görevle ilgili not veya alt adımlar..." : "Task details..."}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:border-slate-900"
                          />
                        </div>

                        {/* Relational Sticky Notes Attached to this Task */}
                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase text-slate-900 flex items-center gap-1">
                              <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                {isTr
                                  ? `İlişkili Sarı Notlar (${(selectedTask.attached_notes || []).length})`
                                  : `Attached Sticky Notes (${(selectedTask.attached_notes || []).length})`}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setNewNoteLinkedTaskId(selectedTask.id);
                                setNewNoteTitle(`${selectedTask.title} - Not`);
                                setActiveSection("notes");
                                setShowNewNoteComposer(true);
                              }}
                              className="px-2 py-1 bg-[#fde047] hover:bg-[#fef08a] text-slate-950 border border-amber-400 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{isTr ? "Bu Göreve Not İliştir" : "Attach Note"}</span>
                            </button>
                          </div>

                          {(selectedTask.attached_notes || []).length === 0 ? (
                            <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-[11px] text-slate-500 text-center">
                              {isTr
                                ? "Bu göreve henüz yapışkan not iliştirilmemiş."
                                : "No sticky notes attached to this task yet."}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(selectedTask.attached_notes || []).map((an) => (
                                <div
                                  key={an.id}
                                  className="bg-[#fef9c3] border border-amber-300 rounded-xl overflow-hidden shadow-xs text-slate-950"
                                >
                                  <div className="bg-[#fde047] px-2.5 py-1 flex items-center justify-between text-[11px] font-black">
                                    <span className="truncate">{an.title}</span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await api.updateOperatorNote(an.id, { linked_task_id: null }, storeId);
                                        fetchBootstrap(true);
                                        toast.info("Not görev bağlantısı kaldırıldı");
                                      }}
                                      className="p-0.5 text-slate-700 hover:text-rose-700 cursor-pointer"
                                      title={isTr ? "Görev Bağlantısını Kaldır" : "Unlink Note"}
                                    >
                                      <Unlink className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="p-2.5 text-xs whitespace-pre-wrap leading-relaxed">
                                    {an.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-full hidden lg:flex flex-col items-center justify-center text-center text-slate-500 p-4 space-y-1.5">
                        <SlidersHorizontal className="w-5 h-5 text-slate-400" />
                        <div className="text-[11px] font-bold text-slate-600">
                          {isTr
                            ? "Detayları görmek için listeden bir göreve tıklayın."
                            : "Select a task to inspect details."}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SECTION 2: OUTLOOK 2007 YELLOW STICKY NOTES (NOTLAR) ==================== */}
            {activeSection === "notes" && (
              <div className="flex-1 min-h-0 flex flex-col sm:flex-row bg-slate-100 overflow-hidden">
                {/* Left Classic Outlook Folder Tree (Desktop) / Top Dropdown Single-Row (Mobile) */}
                <div className="w-full sm:w-56 bg-white border-b sm:border-b-0 sm:border-r border-slate-300 p-2 sm:p-2.5 flex sm:flex-col gap-1.5 shrink-0 items-center sm:items-stretch">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewNoteComposer(true);
                      setNewNoteFolder(selectedFolder === "ALL" ? "Genel" : selectedFolder);
                    }}
                    className="py-1.5 px-3 sm:py-2 sm:px-3 bg-[#fde047] hover:bg-[#facc15] text-slate-950 border border-amber-400 rounded-xl font-black text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isTr ? "Yeni Not" : "New Note"}</span>
                  </button>

                  {/* Mobile Folder Selector Dropdown (Single Row with New Note Button) */}
                  <div className="flex-1 sm:hidden min-w-0">
                    <select
                      value={showArchivedNotes ? "ARCHIVED" : selectedFolder}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "ARCHIVED") {
                          setShowArchivedNotes(true);
                        } else {
                          setShowArchivedNotes(false);
                          setSelectedFolder(val);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-950 font-bold text-xs rounded-xl px-2 py-1.5 outline-none"
                    >
                      <option value="ALL">
                        {isTr ? `Tüm Notlar (${activeNotesCount})` : `All Notes (${activeNotesCount})`}
                      </option>
                      {folders.map((f) => (
                        <option key={f} value={f}>
                          {f} ({notes.filter((n) => !n.is_archived && n.folder_name === f).length})
                        </option>
                      ))}
                      <option value="ARCHIVED">
                        {isTr
                          ? `Arşivlenenler (${notes.filter((n) => n.is_archived).length})`
                          : `Archived`}
                      </option>
                    </select>
                  </div>

                  {/* Desktop Classic Outlook Folder Tree */}
                  <div className="hidden sm:flex flex-col gap-1 overflow-y-auto pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFolder("ALL");
                        setShowArchivedNotes(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center justify-between gap-2 cursor-pointer whitespace-nowrap ${
                        selectedFolder === "ALL" && !showArchivedNotes
                          ? "bg-slate-900 text-white"
                          : "text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isTr ? "Tüm Notlar" : "All Notes"}</span>
                      </span>
                      <span className="text-[10px] font-mono">{activeNotesCount}</span>
                    </button>

                    {folders.map((folder) => {
                      const count = notes.filter((n) => !n.is_archived && n.folder_name === folder).length;
                      const active = selectedFolder === folder && !showArchivedNotes;
                      return (
                        <button
                          key={folder}
                          type="button"
                          onClick={() => {
                            setSelectedFolder(folder);
                            setShowArchivedNotes(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between gap-2 cursor-pointer whitespace-nowrap ${
                            active ? "bg-slate-900 text-white font-black" : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">{folder}</span>
                          </span>
                          <span className="text-[10px] font-mono">{count}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setShowArchivedNotes(true)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between gap-2 cursor-pointer whitespace-nowrap sm:mt-2 border-t border-slate-200 ${
                        showArchivedNotes ? "bg-slate-900 text-white font-black" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5" />
                        <span>{isTr ? "Arşivlenen Notlar" : "Archived Notes"}</span>
                      </span>
                      <span className="text-[10px] font-mono">
                        {notes.filter((n) => n.is_archived).length}
                      </span>
                    </button>
                  </div>

                  {/* Add Custom Folder */}
                  <div className="mt-auto pt-2 border-t border-slate-200 hidden sm:block">
                    {showNewFolderInput ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newFolderInput}
                          onChange={(e) => setNewFolderInput(e.target.value)}
                          placeholder={isTr ? "Klasör adı..." : "Folder name..."}
                          className="flex-1 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newFolderInput.trim()) {
                              const clean = newFolderInput.trim();
                              if (!folders.includes(clean)) {
                                setFolders((prev) => [...prev, clean]);
                              }
                              setSelectedFolder(clean);
                              setNewFolderInput("");
                              setShowNewFolderInput(false);
                            }
                          }}
                          className="p-1 bg-slate-900 text-white rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowNewFolderInput(true)}
                        className="w-full py-1.5 px-2 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isTr ? "+ Yeni Klasör Oluştur" : "+ New Folder"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Corkboard / Sticky Notes Canvas */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {/* Search & Filter Bar (Label hidden on mobile, search full width) */}
                  <div className="bg-white border-b border-slate-200 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2 shrink-0">
                    <div className="hidden sm:flex text-xs font-black text-slate-900 items-center gap-1.5">
                      <StickyNote className="w-4 h-4 text-amber-500" />
                      <span>
                        {showArchivedNotes
                          ? isTr
                            ? "Arşivlenmiş Yapışkan Notlar"
                            : "Archived Sticky Notes"
                          : selectedFolder === "ALL"
                          ? isTr
                            ? "Tüm Sarı Yapışkan Notlar"
                            : "All Sticky Notes"
                          : `${selectedFolder}`}
                      </span>
                    </div>

                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={noteSearch}
                        onChange={(e) => setNoteSearch(e.target.value)}
                        placeholder={isTr ? "Not başlığı veya metin ara..." : "Search notes..."}
                        className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  {/* Sticky Notes Grid Area */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-3">
                    {/* New Sticky Note Composer Card */}
                    {showNewNoteComposer && (
                      <form
                        onSubmit={handleCreateNote}
                        className={`mb-4 rounded-xl border-2 p-3 shadow-lg ${STICKY_NOTE_STYLES[newNoteColor].card} ${STICKY_NOTE_STYLES[newNoteColor].border}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-amber-300/80">
                          <input
                            type="text"
                            value={newNoteTitle}
                            onChange={(e) => setNewNoteTitle(e.target.value)}
                            placeholder={isTr ? "Not Başlığı..." : "Note Title..."}
                            className="flex-1 min-w-[180px] bg-transparent text-sm font-black text-slate-950 placeholder:text-slate-600 outline-none"
                            autoFocus
                          />

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Color Picker */}
                            {(["yellow", "blue", "green", "pink", "white"] as const).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setNewNoteColor(c)}
                                className={`w-4 h-4 rounded-full border cursor-pointer ${
                                  c === "yellow"
                                    ? "bg-[#fde047] border-amber-500"
                                    : c === "blue"
                                    ? "bg-sky-300 border-sky-500"
                                    : c === "green"
                                    ? "bg-emerald-300 border-emerald-500"
                                    : c === "pink"
                                    ? "bg-rose-300 border-rose-500"
                                    : "bg-white border-slate-400"
                                } ${newNoteColor === c ? "ring-2 ring-slate-900" : ""}`}
                              />
                            ))}

                            <select
                              value={newNoteFolder}
                              onChange={(e) => setNewNoteFolder(e.target.value)}
                              className="px-2 py-0.5 bg-white/80 border border-slate-300 rounded text-[11px] font-bold text-slate-900"
                            >
                              {folders.map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </select>

                            <select
                              value={newNoteLinkedTaskId || ""}
                              onChange={(e) => setNewNoteLinkedTaskId(e.target.value ? Number(e.target.value) : null)}
                              className="px-2 py-0.5 bg-white/80 border border-slate-300 rounded text-[11px] font-bold text-slate-900 max-w-[180px]"
                              title={isTr ? "İsteğe Bağlı: Bir Göreve Bağla" : "Optional: Link to Task"}
                            >
                              <option value="">{isTr ? "— Göreve Bağla (Opsiyonel) —" : "— Link Task —"}</option>
                              {tasks.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <textarea
                          rows={3}
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder={isTr ? "Düz metin notunuzu buraya yazın..." : "Write plain text note..."}
                          className="w-full bg-transparent text-xs font-medium text-slate-950 placeholder:text-slate-600 outline-none resize-none"
                        />

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-300/60">
                          <button
                            type="button"
                            onClick={() => setShowNewNoteComposer(false)}
                            className="px-3 py-1 bg-white/80 hover:bg-white text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            {isTr ? "Vazgeç" : "Cancel"}
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black cursor-pointer"
                          >
                            {isTr ? "Notu Yapıştır" : "Save Sticky Note"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Sticky Notes Cards Grid */}
                    {filteredNotes.length === 0 ? (
                      <div className="p-10 text-center text-slate-500 space-y-2">
                        <StickyNote className="w-8 h-8 mx-auto text-amber-500" />
                        <div className="text-xs font-bold">
                          {isTr
                            ? "Bu klasörde henüz sarı yapışkan not bulunmuyor."
                            : "No sticky notes in this folder yet."}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredNotes.map((note) => {
                          const style = STICKY_NOTE_STYLES[note.color || "yellow"] || STICKY_NOTE_STYLES.yellow;
                          const isEditing = editingNoteId === note.id;

                          return (
                            <div
                              key={note.id}
                              className={`rounded-xl border-2 shadow-md flex flex-col justify-between transition-all ${style.card} ${style.border}`}
                            >
                              {/* Classic Outlook 2007 Top Note Strip */}
                              <div className={`px-3 py-1.5 flex items-center justify-between gap-1.5 ${style.header}`}>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePinNote(note)}
                                    className={`p-0.5 rounded cursor-pointer ${
                                      note.is_pinned ? "text-rose-700 font-black" : "text-slate-600 hover:text-slate-950"
                                    }`}
                                    title={isTr ? "Sabitle" : "Pin Note"}
                                  >
                                    <Pin className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-white/70 rounded text-slate-900 truncate">
                                    {note.folder_name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleConvertNoteToTask(note)}
                                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded text-[10px] font-black flex items-center gap-0.5 cursor-pointer"
                                    title={isTr ? "Bu Nottan Görev Türet" : "Convert Note to Task"}
                                  >
                                    <ArrowRightCircle className="w-3 h-3" />
                                    <span>{isTr ? "Görev Türet" : "To Task"}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleArchiveNote(note)}
                                    className="p-1 text-slate-700 hover:text-slate-950 rounded cursor-pointer"
                                    title={note.is_archived ? "Arşivden Çıkar" : "Arşivle"}
                                  >
                                    {note.is_archived ? (
                                      <ArchiveRestore className="w-3.5 h-3.5" />
                                    ) : (
                                      <Archive className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-1 text-slate-700 hover:text-rose-700 rounded cursor-pointer"
                                    title={isTr ? "Notu Sil" : "Delete Note"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Note Body */}
                              <div
                                className="p-3 flex-1 space-y-1.5 cursor-text"
                                onClick={() => {
                                  if (!isEditing) {
                                    setEditingNoteId(note.id);
                                    setEditNoteTitle(note.title);
                                    setEditNoteContent(note.content);
                                    setEditNoteFolder(note.folder_name);
                                    setEditNoteColor(note.color || "yellow");
                                    setEditNoteLinkedTaskId(note.linked_task_id || null);
                                  }
                                }}
                              >
                                {isEditing ? (
                                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      value={editNoteTitle}
                                      onChange={(e) => setEditNoteTitle(e.target.value)}
                                      className="w-full px-2 py-1 bg-white/90 border border-slate-400 rounded text-xs font-black text-slate-950 outline-none"
                                    />
                                    <textarea
                                      rows={4}
                                      value={editNoteContent}
                                      onChange={(e) => setEditNoteContent(e.target.value)}
                                      className="w-full p-2 bg-white/90 border border-slate-400 rounded text-xs font-medium text-slate-950 outline-none"
                                    />
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <select
                                        value={editNoteFolder}
                                        onChange={(e) => setEditNoteFolder(e.target.value)}
                                        className="px-1.5 py-1 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-900"
                                      >
                                        {folders.map((f) => (
                                          <option key={f} value={f}>
                                            {f}
                                          </option>
                                        ))}
                                      </select>
                                      <select
                                        value={editNoteLinkedTaskId || ""}
                                        onChange={(e) =>
                                          setEditNoteLinkedTaskId(e.target.value ? Number(e.target.value) : null)
                                        }
                                        className="flex-1 min-w-[120px] px-1.5 py-1 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-900"
                                      >
                                        <option value="">{isTr ? "— Görev Bağlantısı Yok —" : "— Unlinked —"}</option>
                                        {tasks.map((t) => (
                                          <option key={t.id} value={t.id}>
                                            {t.title}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex justify-end gap-1.5 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingNoteId(null)}
                                        className="px-2 py-1 bg-white text-slate-800 rounded text-[10px] font-bold"
                                      >
                                        {isTr ? "İptal" : "Cancel"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditNote(note.id)}
                                        className="px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-black"
                                      >
                                        {isTr ? "Kaydet" : "Save"}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="text-xs font-black text-slate-950 leading-snug">{note.title}</h4>
                                    <p className="text-xs text-slate-900 whitespace-pre-wrap leading-relaxed">
                                      {note.content || (
                                        <span className="italic text-slate-500">
                                          {isTr ? "Metin eklemek için dokunun..." : "Tap to edit text..."}
                                        </span>
                                      )}
                                    </p>
                                  </>
                                )}
                              </div>

                              {/* Sticky Note Footer: Linked Task Reference & Timestamp */}
                              <div className="px-3 py-1.5 border-t border-black/10 flex items-center justify-between gap-2 text-[10px] font-bold text-slate-700">
                                {note.linked_task_id ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTaskId(Number(note.linked_task_id));
                                      setActiveSection("tasks");
                                    }}
                                    className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900 text-amber-300 rounded font-black truncate max-w-[70%] cursor-pointer"
                                    title={isTr ? "Bağlı Göreve Git" : "Go to Linked Task"}
                                  >
                                    <Link2 className="w-3 h-3 shrink-0" />
                                    <span className="truncate">
                                      {note.linked_task_title || `Görev #${note.linked_task_id}`}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-slate-600">{isTr ? "Bağımsız Not" : "Standalone"}</span>
                                )}

                                <span className="font-mono text-[9px] shrink-0">
                                  {new Date(note.updated_at || note.created_at).toLocaleDateString("tr-TR", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SECTION 3: STATE-MACHINE WORKFLOW ENGINE ==================== */}
            {activeSection === "workflow" && (
              <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50 space-y-4">
                <div className="bg-white border border-slate-300 rounded-xl p-3.5 space-y-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-950">
                      {isTr
                        ? "Esnek Görev Durum Makinesi (State-Machine İş Akışı Motoru)"
                        : "Flexible Task State-Machine Workflow Engine"}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isTr
                        ? "Görev durumları sabit (hardcoded) değildir. Mağazanızın iş akışına özel yeni durumlar tanımlayabilir, varsayılan tamamlanma yüzdelerini ve geçiş kurallarını yönetebilirsiniz."
                        : "Define custom task workflow states, default completion percentages, and transition rules."}
                    </p>
                  </div>

                  {/* Current Workflow States List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {states.map((st) => {
                      const theme = STATE_COLOR_CLASSES[st.color || "slate"] || STATE_COLOR_CLASSES.slate;
                      return (
                        <div
                          key={st.state_key}
                          className={`p-3 rounded-xl border-2 flex flex-col justify-between gap-2 ${theme.bg} ${theme.border} ${theme.text}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                              <span className="text-xs font-black">{isTr ? st.label_tr : st.label_en}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 bg-white/80 rounded text-[10px] font-mono font-black">
                                %{st.default_completion}
                              </span>
                              {!st.is_system && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomState(st.state_key)}
                                  className="p-1 text-rose-700 hover:bg-rose-200 rounded cursor-pointer"
                                  title="Durumu Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] font-bold opacity-85">
                            {Array.isArray(st.allowed_transitions) && st.allowed_transitions.length > 0 ? (
                              <span>
                                {isTr ? "Geçiş İzinleri: " : "Transitions: "}
                                {st.allowed_transitions
                                  .map((k) => stateMap.get(k)?.label_tr || k)
                                  .join(" → ")}
                              </span>
                            ) : (
                              <span>{isTr ? "Tüm durumlara serbest geçiş" : "Unrestricted transitions"}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Custom Workflow State Form */}
                  <form
                    onSubmit={handleCreateCustomState}
                    className="pt-3 border-t border-slate-200 flex flex-wrap items-end gap-2"
                  >
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">
                        {isTr ? "Yeni Durum Adı" : "New State Name"}
                      </label>
                      <input
                        type="text"
                        value={newStateLabelTr}
                        onChange={(e) => setNewStateLabelTr(e.target.value)}
                        placeholder={isTr ? "Örn: Müşteri Onayında / Kontrol Ediliyor" : "e.g. Under Review"}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-950 outline-none focus:border-slate-900"
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">
                        {isTr ? "Renk" : "Color"}
                      </label>
                      <select
                        value={newStateColor}
                        onChange={(e) => setNewStateColor(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-950"
                      >
                        <option value="indigo">İndigo</option>
                        <option value="blue">Mavi</option>
                        <option value="amber">Kehribar</option>
                        <option value="purple">Mor</option>
                        <option value="emerald">Zümrüt</option>
                        <option value="rose">Kırmızı</option>
                        <option value="slate">Gri</option>
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="block text-[10px] font-black text-slate-700 uppercase mb-1">
                        {isTr ? "Varsayılan %" : "Default %"}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={5}
                        value={newStateDefaultPct}
                        onChange={(e) => setNewStateDefaultPct(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-black text-slate-950"
                      />
                    </div>

                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStateTerminal}
                        onChange={(e) => setNewStateTerminal(e.target.checked)}
                        className="w-3.5 h-3.5"
                      />
                      <span>{isTr ? "Bitiş Durumu (%100)" : "Terminal State"}</span>
                    </label>

                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isTr ? "Durumu Ekle" : "Add State"}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};


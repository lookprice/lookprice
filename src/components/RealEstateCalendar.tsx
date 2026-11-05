import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Search,
  CheckCircle2,
  X,
  Menu,
  Archive,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  parseISO, 
  isToday,
  subDays,
  startOfDay
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface RealEstateCalendarProps {
  storeId: number;
  properties: any[];
  onClose?: () => void;
  hideHeader?: boolean;
}

export const RealEstateCalendar = ({ storeId, properties, onClose, hideHeader = false }: RealEstateCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  // Default view mode is 'week' (Haftalık) as requested
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("week");
  // List view aging filter: default 'recent' hides completed/old appointments older than 2 days
  const [listFilter, setListFilter] = useState<"recent" | "pending" | "archived" | "all">("recent");
  // Track expanded items in sidebar and list view (collapsible hamburger/accordion rows)
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<number, boolean>>({});

  const toggleTaskExpand = (taskId: number) => {
    setExpandedTaskIds(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks(storeId);
      if (Array.isArray(res)) {
        setTasks(res.filter((t: any) => t.task_type === 'tour' || t.task_type === 'general' || t.due_date));
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Randevular yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [storeId]);

  // Date intervals based on view mode
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const startDate = viewMode === "week" ? weekStart : startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = viewMode === "week" ? weekEnd : endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextPeriod = () => {
    if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const prevPeriod = () => {
    if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const filteredTasks = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    return tasks
      .filter(task => {
        if (!searchLower) return true;
        const property = properties.find(p => Number(p.id) === Number(task.property_id));
        return (
          task.description?.toLowerCase().includes(searchLower) ||
          property?.title?.toLowerCase().includes(searchLower) ||
          property?.reference_no?.toLowerCase().includes(searchLower) ||
          property?.location?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
  }, [tasks, properties, searchQuery]);

  // Smart 2-day aging cutoff: appointments older than 2 days that are completed or past are automatically archived
  const twoDaysAgoCutoff = useMemo(() => subDays(startOfDay(new Date()), 2), []);

  const isTaskAgedArchive = (task: any) => {
    if (!task.due_date) return false;
    const taskDate = parseISO(task.due_date);
    // If older than 2 days AND completed (or past date older than 2 days), move to archive
    return taskDate < twoDaysAgoCutoff;
  };

  const listDisplayedTasks = useMemo(() => {
    return filteredTasks.filter(task => {
      const aged = isTaskAgedArchive(task);
      if (listFilter === "recent") {
        // Keep active/pending upcoming tasks AND any task within the last 2 days
        return !aged || !task.is_completed;
      }
      if (listFilter === "pending") {
        return !task.is_completed;
      }
      if (listFilter === "archived") {
        return aged && task.is_completed;
      }
      return true;
    });
  }, [filteredTasks, listFilter, twoDaysAgoCutoff]);

  const recentCount = useMemo(() => filteredTasks.filter(t => !isTaskAgedArchive(t) || !t.is_completed).length, [filteredTasks, twoDaysAgoCutoff]);
  const pendingCount = useMemo(() => filteredTasks.filter(t => !t.is_completed).length, [filteredTasks]);
  const archivedCount = useMemo(() => filteredTasks.filter(t => isTaskAgedArchive(t) && t.is_completed).length, [filteredTasks, twoDaysAgoCutoff]);

  const getDayTasks = (day: Date) => {
    return filteredTasks
      .filter(task => task.due_date && isSameDay(parseISO(task.due_date), day))
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  };

  const selectedDayTasks = selectedDay ? getDayTasks(selectedDay) : [];

  const handleCompleteTask = async (taskId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.completeTask(taskId, storeId);
      toast.success("Randevu tamamlandı olarak işaretlendi.");
      fetchTasks();
    } catch (err) {
      toast.error("İşlem başarısız.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Controls Toolbar */}
      {!hideHeader ? (
        <div className="px-3.5 py-2.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Gezi & Randevu Takvimi</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider capitalize">
                {viewMode === 'week'
                  ? `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMM yyyy', { locale: tr })}`
                  : format(currentDate, 'MMMM yyyy', { locale: tr })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                onClick={() => setViewMode("week")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${viewMode === "week" ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Haftalık
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${viewMode === "month" ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Aylık
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${viewMode === "list" ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Liste
              </button>
            </div>

            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Randevu veya portföy ara..."
                className="w-full sm:w-44 pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {viewMode !== "list" && (
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={prevPeriod} className="p-1.5 hover:bg-slate-50 border-r border-slate-200 transition-colors cursor-pointer" title="Önceki"><ChevronLeft className="w-3.5 h-3.5 text-slate-600" /></button>
                <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }} className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer">BUGÜN</button>
                <button onClick={nextPeriod} className="p-1.5 hover:bg-slate-50 border-l border-slate-200 transition-colors cursor-pointer" title="Sonraki"><ChevronRight className="w-3.5 h-3.5 text-slate-600" /></button>
              </div>
            )}

            {onClose && (
              <button onClick={onClose} className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg transition-all cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Compact toolbar when parent has navigation header */
        <div className="px-3 py-1.5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-900 capitalize font-mono">
              {viewMode === 'week'
                ? `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMM yyyy', { locale: tr })}`
                : format(currentDate, 'MMMM yyyy', { locale: tr })}
            </span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
              <button onClick={() => setViewMode("week")} className={`px-2 py-0.5 rounded-md cursor-pointer ${viewMode === "week" ? 'bg-white shadow-2xs font-black text-slate-900' : 'text-slate-600'}`}>Haftalık</button>
              <button onClick={() => setViewMode("month")} className={`px-2 py-0.5 rounded-md cursor-pointer ${viewMode === "month" ? 'bg-white shadow-2xs font-black text-slate-900' : 'text-slate-600'}`}>Aylık</button>
              <button onClick={() => setViewMode("list")} className={`px-2 py-0.5 rounded-md cursor-pointer ${viewMode === "list" ? 'bg-white shadow-2xs font-black text-slate-900' : 'text-slate-600'}`}>Liste</button>
            </div>
            {viewMode !== "list" && (
              <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <button onClick={prevPeriod} className="p-1 hover:bg-slate-100 border-r border-slate-200 cursor-pointer"><ChevronLeft className="w-3.5 h-3.5 text-slate-600" /></button>
                <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }} className="px-2 py-0.5 text-[10px] font-black uppercase hover:bg-slate-100 text-slate-700 cursor-pointer">Bugün</button>
                <button onClick={nextPeriod} className="p-1 hover:bg-slate-100 border-l border-slate-200 cursor-pointer"><ChevronRight className="w-3.5 h-3.5 text-slate-600" /></button>
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Randevu veya portföy ara..."
              className="w-full pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === "list" ? (
        /* SINGLE-LINE COMPACT LIST VIEW WITH AUTOMATIC 2-DAY AGING / ARCHIVE */
        <div className="flex-1 p-2.5 sm:p-3 space-y-2 bg-slate-50/40">
          {/* Smart Aging Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setListFilter("recent")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer border transition-all ${
                  listFilter === "recent"
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
                title="Bekleyen randevuları ve son 2 günün kayıtlarını gösterir; eski tamamlananları otomatik gizler"
              >
                <Sparkles className="w-3 h-3" />
                <span>Güncel & Son 2 Gün</span>
                <span className={`px-1 rounded text-[9px] font-mono ${listFilter === "recent" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {recentCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setListFilter("pending")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border transition-all ${
                  listFilter === "pending"
                    ? "bg-amber-500 text-white border-amber-500 shadow-2xs font-black"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Bekleyenler ({pendingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setListFilter("archived")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border transition-all ${
                  listFilter === "archived"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black"
                    : "bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 border-slate-200"
                }`}
                title="2 günden eski tamamlanmış randevu arşivi"
              >
                <Archive className="w-3 h-3" />
                <span>Geçmiş Arşiv ({archivedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setListFilter("all")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${
                  listFilter === "all"
                    ? "bg-slate-800 text-white border-slate-800 font-black"
                    : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                Tümü ({filteredTasks.length})
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-semibold hidden md:inline">
              2 günü geçen tamamlanmış randevular otomatik olarak arşive aktarılır
            </span>
          </div>

          {listDisplayedTasks.length === 0 ? (
            <div className="py-10 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-500">Bu filtrede randevu kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs max-h-[540px] overflow-y-auto custom-scrollbar">
              {listDisplayedTasks.map((task) => {
                const property = properties.find(p => Number(p.id) === Number(task.property_id));
                const taskDate = task.due_date ? parseISO(task.due_date) : new Date();
                const isExpanded = !!expandedTaskIds[task.id];

                return (
                  <div key={task.id} className={`transition-colors ${isExpanded ? 'bg-indigo-50/25' : 'hover:bg-slate-50/90'}`}>
                    {/* Single-Line Horizontal Row */}
                    <div
                      onClick={() => toggleTaskExpand(task.id)}
                      className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          className="p-0.5 text-slate-400 hover:text-indigo-600 shrink-0"
                          title="Detayları Aç / Kapat"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-indigo-600" /> : <Menu className="w-3.5 h-3.5" />}
                        </button>

                        <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                          {format(taskDate, 'd MMM yyyy HH:mm', { locale: tr })}
                        </span>

                        {property?.reference_no && (
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/80 shrink-0 hidden sm:inline">
                            {property.reference_no}
                          </span>
                        )}

                        <span className="text-xs font-bold text-slate-900 truncate">
                          {property?.title || task.description}
                        </span>

                        {property?.title && task.description && (
                          <span className="hidden lg:inline text-[11px] text-slate-500 font-medium truncate max-w-[260px]">
                            • {task.description}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-500 font-semibold max-w-[130px] truncate">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{property?.location || property?.kktc_region || 'KKTC'}</span>
                        </span>

                        {task.is_completed ? (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Tamamlandı</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Bekliyor
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCompleteTask(task.id, e)}
                              className="px-2 py-0.5 bg-slate-900 hover:bg-indigo-600 text-white rounded text-[10px] font-black transition cursor-pointer"
                            >
                              Tamamla
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Detail Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-slate-200/60 bg-slate-50/80"
                        >
                          <div className="px-3.5 py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                            <div>
                              <span className="text-[9px] font-black uppercase text-slate-400 block">Portföy Bilgisi</span>
                              <p className="font-bold text-slate-900">{property?.title || 'Genel Randevu'}</p>
                              <p className="text-[10px] text-slate-500">
                                Ref: {property?.reference_no || '-'} • Konum: {property?.location || property?.kktc_region || 'Belirtilmedi'}
                              </p>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-[9px] font-black uppercase text-slate-400 block">Müşteri & Gezi Detayı</span>
                              <p className="font-semibold text-slate-800">{task.description}</p>
                              {task.completion_note && (
                                <p className="mt-1 text-[10px] text-slate-600 italic bg-white px-2 py-1 rounded border border-slate-200">
                                  Not: {task.completion_note}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* COMPACT CALENDAR GRID (DEFAULT WEEKLY) & COMPACT COLLAPSIBLE SIDEBAR */
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Calendar Grid */}
          <div className="flex-1 p-2.5 sm:p-3 border-b lg:border-b-0 lg:border-r border-slate-200/80">
            <div className="grid grid-cols-7 gap-1 bg-slate-200/70 border border-slate-200 rounded-xl overflow-hidden">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                <div key={day} className="bg-slate-50 py-1.5 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayTasks = getDayTasks(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentMonth = isSameMonth(day, monthStart);
                
                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedDay(day)}
                    className={`${
                      viewMode === 'week' ? 'min-h-[120px] sm:min-h-[145px]' : 'min-h-[64px] sm:min-h-[78px]'
                    } bg-white p-1.5 transition-all cursor-pointer group relative flex flex-col justify-between ${
                      !isCurrentMonth && viewMode === 'month' ? 'bg-slate-50/60 opacity-55' : 'hover:bg-indigo-50/30'
                    } ${isSelected ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/40' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-black w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition-colors ${
                        isToday(day) ? 'bg-indigo-600 text-white shadow-2xs' : 
                        isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayTasks.slice(0, viewMode === 'week' ? 4 : 2).map((task, tidx) => {
                        const property = properties.find(p => Number(p.id) === Number(task.property_id));
                        return (
                          <div
                            key={tidx}
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate border ${
                              task.is_completed
                                ? 'bg-slate-50 text-slate-600 border-slate-200'
                                : 'bg-indigo-50/90 text-indigo-900 border-indigo-100'
                            }`}
                          >
                            <span className="font-mono font-bold text-indigo-600 mr-1">{format(parseISO(task.due_date), 'HH:mm')}</span>
                            <span>{property?.reference_no ? `${property.reference_no} ` : ''}{property?.title || task.description}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length > (viewMode === 'week' ? 4 : 2) && (
                        <div className="text-[8px] font-bold text-slate-400 text-center">
                          + {dayTasks.length - (viewMode === 'week' ? 4 : 2)} daha
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Day Detail Sidebar: Compact Collapsible Hamburger-Style List */}
          <div className="w-full lg:w-80 bg-slate-50/60 p-2.5 sm:p-3 shrink-0 flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {selectedDay ? format(selectedDay, 'd MMMM yyyy', { locale: tr }) : 'Gün Seçiniz'}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {selectedDayTasks.length} Planlanmış Gezi — Detay için satıra tıklayın
                </p>
              </div>
              {selectedDay && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-lg font-black text-[10px]">
                  {format(selectedDay, 'EEEE', { locale: tr })}
                </span>
              )}
            </div>

            <div className="space-y-1.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-0.5">
              {selectedDayTasks.length === 0 ? (
                <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <CalendarIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-slate-400">Bu tarihte randevu yok.</p>
                </div>
              ) : (
                selectedDayTasks.map((task) => {
                  const property = properties.find(p => Number(p.id) === Number(task.property_id));
                  const isExpanded = !!expandedTaskIds[task.id];

                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                    >
                      {/* Compact Single-Line Hamburger Row */}
                      <div
                        onClick={() => toggleTaskExpand(task.id)}
                        className="px-2.5 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Menu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                            {format(parseISO(task.due_date), 'HH:mm')}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-800 truncate">
                            {property?.reference_no ? `[${property.reference_no}] ` : ''}
                            {property?.title || task.description}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {task.is_completed ? (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Bitti</span>
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Aktif
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Hamburger Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-slate-100 bg-slate-50/70"
                          >
                            <div className="p-2.5 space-y-1.5 text-[11px]">
                              <p className="font-bold text-slate-900 leading-snug">
                                {property?.title || 'Randevu & Gezi'}
                              </p>
                              <div className="space-y-1 text-[10px] text-slate-600 font-medium">
                                <div className="flex items-start gap-1.5">
                                  <User className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                  <span className="break-words">{task.description}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span className="truncate">{property?.location || property?.kktc_region || 'Konum Belirtilmedi'}</span>
                                </div>
                              </div>

                              {!task.is_completed && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCompleteTask(task.id, e)}
                                  className="w-full mt-1 bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-black uppercase py-1.5 rounded-lg transition-all cursor-pointer"
                                >
                                  Tamamlandı Olarak İşaretle
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

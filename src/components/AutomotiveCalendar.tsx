import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Car, 
  Search,
  CheckCircle2,
  X,
  Plus,
  Phone,
  MessageCircle
} from 'lucide-react';
import { api } from '../services/api';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, parseISO, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { VehicleAppointmentModal } from './VehicleAppointmentModal';

interface AutomotiveCalendarProps {
  storeId: number;
  vehicles: any[];
  onClose?: () => void;
  hideHeader?: boolean;
}

export const AutomotiveCalendar = ({ storeId, vehicles, onClose, hideHeader = false }: AutomotiveCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks(storeId);
      if (Array.isArray(res)) {
        setTasks(res.filter((t: any) => t.task_type === 'appointment' || t.task_type === 'tour' || t.task_type === 'general' || Boolean(t.due_date)));
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

  const parseCustomerInfo = (description: string) => {
    if (!description) return { name: 'Müşteri', phone: '', note: '' };
    const match = description.match(/Randevu:\s*([^(]+)(?:\(([^)]+)\))?(?:\s*-\s*(.*))?/i);
    if (match) {
      return {
        name: match[1]?.trim() || 'Müşteri',
        phone: match[2]?.trim() || '',
        note: match[3]?.trim() || ''
      };
    }
    return { name: description.split('-')[0]?.trim() || description, phone: '', note: description.split('-')[1]?.trim() || '' };
  };

  const filteredTasks = tasks.filter(task => {
    const vehicle = vehicles.find(v => Number(v.id) === Number(task.vehicle_id) || Number(v.id) === Number(task.property_id));
    const searchLower = searchQuery.toLowerCase();
    return (
      task.description?.toLowerCase().includes(searchLower) ||
      vehicle?.brand?.toLowerCase().includes(searchLower) ||
      vehicle?.model?.toLowerCase().includes(searchLower) ||
      vehicle?.plate?.toLowerCase().includes(searchLower) ||
      vehicle?.title?.toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const getDayTasks = (day: Date) => {
    return filteredTasks.filter(task => {
      try {
        return isSameDay(parseISO(task.due_date), day);
      } catch (e) {
        return false;
      }
    });
  };

  const selectedDayTasks = selectedDay ? getDayTasks(selectedDay) : [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col lg:h-[calc(100vh-180px)] min-h-[560px]">
      {/* Header & Controls Toolbar */}
      {!hideHeader ? (
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-200">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Test Sürüşü & Ekspertiz Randevu Takvimi</h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest capitalize">
                {viewMode === 'week' ? `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMM yyyy', { locale: tr })}` : format(currentDate, 'MMMM yyyy', { locale: tr })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAppointmentModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Yeni Randevu</span>
            </button>

            {/* View Mode Switcher (Month, Week, List) optimized for Mobile & Desktop */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode("month")}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${viewMode === "month" ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Aylık
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${viewMode === "week" ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Haftalık
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Liste
              </button>
            </div>

            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Randevu, plaka veya araç ara..."
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-2xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <button onClick={prevPeriod} className="p-2 hover:bg-slate-50 border-r border-slate-200 transition-colors cursor-pointer" title="Önceki"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer">BUGÜN</button>
              <button onClick={nextPeriod} className="p-2 hover:bg-slate-50 border-l border-slate-200 transition-colors cursor-pointer" title="Sonraki"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
            </div>

            {onClose && (
              <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Compact toolbar when parent (TeamCrmTab) has navigation header */
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-slate-900 capitalize font-mono">
              {viewMode === 'week' ? `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMM yyyy', { locale: tr })}` : format(currentDate, 'MMMM yyyy', { locale: tr })}
            </span>
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
              <button onClick={() => setViewMode("month")} className={`px-2 py-1 rounded-md cursor-pointer ${viewMode === "month" ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'}`}>Aylık</button>
              <button onClick={() => setViewMode("week")} className={`px-2 py-1 rounded-md cursor-pointer ${viewMode === "week" ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'}`}>Haftalık</button>
              <button onClick={() => setViewMode("list")} className={`px-2 py-1 rounded-md cursor-pointer ${viewMode === "list" ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'}`}>Liste</button>
            </div>
            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <button onClick={prevPeriod} className="p-1 hover:bg-slate-100 border-r border-slate-200 cursor-pointer"><ChevronLeft className="w-3.5 h-3.5 text-slate-600" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 py-0.5 text-[10px] font-black uppercase hover:bg-slate-100 text-slate-700 cursor-pointer">Bugün</button>
              <button onClick={nextPeriod} className="p-1 hover:bg-slate-100 border-l border-slate-200 cursor-pointer"><ChevronRight className="w-3.5 h-3.5 text-slate-600" /></button>
            </div>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Randevu, plaka veya araç ara..."
              className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === "list" ? (
        /* LIST VIEW (Optimized for Mobile & Quick Scanning) */
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3 bg-slate-50/40">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Tüm Planlanmış Araç Randevuları ({filteredTasks.length})
            </h3>
            <button
              onClick={() => setIsAppointmentModalOpen(true)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3" /> Yeni Randevu
            </button>
          </div>
          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Hiç araç randevusu bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTasks.map((task) => {
                const vehicle = vehicles.find(v => Number(v.id) === Number(task.vehicle_id) || Number(v.id) === Number(task.property_id));
                const cust = parseCustomerInfo(task.description);
                const taskDate = parseISO(task.due_date);
                return (
                  <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 font-mono">
                        {format(taskDate, 'd MMM yyyy HH:mm', { locale: tr })}
                      </span>
                      {task.is_completed ? (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Tamamlandı
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Bekliyor
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Araç Randevusu'}
                        </h4>
                        {vehicle?.plate && (
                          <span className="text-[9px] font-mono font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            {vehicle.plate}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-bold mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cust.name} {cust.phone ? `(${cust.phone})` : ''}</span>
                      </p>
                      {cust.note && (
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-2">{cust.note}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-1.5">
                        {cust.phone && (
                          <>
                            <a
                              href={`tel:${cust.phone}`}
                              className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg transition-colors"
                              title="Müşteriyi Ara"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${cust.phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Merhaba, ${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'aracımız'} için planlanan randevunuz hakkında bilgi vermek istedik.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                              title="WhatsApp Mesajı Gönder"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                      </div>
                      {!task.is_completed && (
                        <button
                          onClick={async () => {
                            try {
                              await api.completeTask(task.id, storeId);
                              toast.success("Randevu tamamlandı olarak işaretlendi.");
                              fetchTasks();
                            } catch (e) {
                              toast.error("İşlem başarısız.");
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 transition cursor-pointer active:scale-95"
                        >
                          Tamamlandı İşaretle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CALENDAR GRID & MOBILE RESPONSIVE SIDEBAR */
        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 lg:overflow-y-auto p-2.5 sm:p-5 custom-scrollbar border-b lg:border-b-0 lg:border-r border-slate-100 shrink-0 lg:shrink">
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 bg-slate-200/70 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                <div key={day} className="bg-slate-50 py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
                    className={`min-h-[76px] sm:min-h-[105px] bg-white p-1.5 sm:p-2.5 transition-all cursor-pointer group relative flex flex-col justify-between ${
                      !isCurrentMonth && viewMode === 'month' ? 'bg-slate-50/60 opacity-60' : 'hover:bg-indigo-50/30'
                    } ${isSelected ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/60 shadow-xs' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] sm:text-xs font-black w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors ${
                        isToday(day) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 
                        isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded-md border border-emerald-200">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayTasks.slice(0, 2).map((task, tidx) => {
                        const vehicle = vehicles.find(v => Number(v.id) === Number(task.vehicle_id) || Number(v.id) === Number(task.property_id));
                        return (
                          <div key={tidx} className="text-[9px] font-bold bg-indigo-50/80 border border-indigo-100 px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-md truncate text-indigo-900 shadow-2xs">
                            <span className="font-mono text-indigo-600 mr-1">{format(parseISO(task.due_date), 'HH:mm')}</span>
                            {vehicle ? `${vehicle.brand} ${vehicle.model}` : task.description}
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-[8px] font-black text-slate-400 text-center uppercase tracking-tighter">
                          + {dayTasks.length - 2} daha
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Detail Sidebar (Fully Responsive on Mobile & Desktop) */}
          <div className="w-full lg:w-96 bg-slate-50/50 overflow-y-auto p-4 sm:p-5 custom-scrollbar shrink-0 border-t lg:border-t-0">
            <div className="sticky top-0 bg-transparent space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">
                    {selectedDay ? format(selectedDay, 'd MMMM yyyy', { locale: tr }) : 'Gün Seçiniz'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                    {selectedDayTasks.length} Planlanmış Test Sürüşü / Randevu
                  </p>
                </div>
                {selectedDay && (
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-xl font-black text-[10px]">
                    {format(selectedDay, 'EEEE', { locale: tr })}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {selectedDayTasks.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-10 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2"
                    >
                      <CalendarIcon className="w-9 h-9 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">Bu tarih için planlanmış<br/>araç randevusu bulunmuyor.</p>
                      <button
                        onClick={() => setIsAppointmentModalOpen(true)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Yeni Randevu Planla
                      </button>
                    </motion.div>
                  ) : (
                    selectedDayTasks.map((task) => {
                      const vehicle = vehicles.find(v => Number(v.id) === Number(task.vehicle_id) || Number(v.id) === Number(task.property_id));
                      const cust = parseCustomerInfo(task.description);
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all group space-y-2.5"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl border border-indigo-100 font-mono">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-xs font-black">{format(parseISO(task.due_date), 'HH:mm')}</span>
                            </div>
                            {task.is_completed ? (
                              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black">TAMAMLANDI</span>
                              </div>
                            ) : (
                              <div className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                Bekliyor
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug truncate">
                              {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Araç Randevusu'}
                            </h4>
                            {vehicle?.plate && (
                              <span className="text-[9px] font-mono font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                {vehicle.plate}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1.5 text-xs text-slate-500 font-bold">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate text-slate-800">{cust.name} {cust.phone ? `(${cust.phone})` : ''}</span>
                              </div>
                              {cust.phone && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <a
                                    href={`tel:${cust.phone}`}
                                    className="p-1 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 rounded-md transition-colors"
                                    title="Müşteriyi Ara"
                                  >
                                    <Phone className="w-3 h-3" />
                                  </a>
                                  <a
                                    href={`https://wa.me/${cust.phone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Merhaba, ${vehicle ? `${vehicle.brand} ${vehicle.model}` : 'aracımız'} için planlanan randevunuz hakkında bilgi vermek istedik.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-md transition-colors"
                                    title="WhatsApp'tan Yaz"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                            {cust.note && (
                              <p className="text-[11px] text-slate-500 font-medium line-clamp-2 pl-5">
                                {cust.note}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <Car className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate">
                                {vehicle ? `${vehicle.year || ''} • ${vehicle.plate || 'Plaka Belirtilmedi'}` : 'Araç Seçilmedi'}
                              </span>
                            </div>
                          </div>

                          {!task.is_completed && (
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                              <button 
                                onClick={async () => {
                                  try {
                                    await api.completeTask(task.id, storeId);
                                    toast.success("Randevu tamamlandı olarak işaretlendi.");
                                    fetchTasks();
                                  } catch (e) {
                                    toast.error("Hata oluştu.");
                                  }
                                }}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase py-2 rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
                              >
                                Tamamlandı Olarak İşaretle
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      <VehicleAppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        storeId={storeId}
        vehicles={vehicles}
        onSuccess={() => {
          fetchTasks();
        }}
      />
    </div>
  );
};


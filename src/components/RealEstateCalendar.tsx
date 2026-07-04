import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Search,
  Plus,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface RealEstateCalendarProps {
  storeId: number;
  properties: any[];
  onClose?: () => void;
}

export const RealEstateCalendar = ({ storeId, properties, onClose }: RealEstateCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks(storeId);
      if (Array.isArray(res)) {
        // Filter only tours
        setTasks(res.filter((t: any) => t.task_type === 'tour'));
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
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const filteredTasks = tasks.filter(task => {
    const property = properties.find(p => p.id === task.property_id);
    const searchLower = searchQuery.toLowerCase();
    return (
      task.description?.toLowerCase().includes(searchLower) ||
      property?.title?.toLowerCase().includes(searchLower) ||
      property?.reference_no?.toLowerCase().includes(searchLower)
    );
  });

  const getDayTasks = (day: Date) => {
    return filteredTasks.filter(task => isSameDay(parseISO(task.due_date), day));
  };

  const selectedDayTasks = selectedDay ? getDayTasks(selectedDay) : [];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[85vh] max-h-[900px]">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Gezi & Randevu Takvimi</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{format(currentDate, 'MMMM yyyy', { locale: tr })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Randevu veya portföy ara..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-50 border-r border-slate-200 transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors text-slate-700">BUGÜN</button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-50 border-l border-slate-200 transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar border-r border-slate-100">
          <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
              <div key={day} className="bg-slate-50 p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
                  className={`min-h-[100px] bg-white p-2 transition-all cursor-pointer group relative ${
                    !isCurrentMonth ? 'bg-slate-50/50' : 'hover:bg-indigo-50/30'
                  } ${isSelected ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                      isToday(day) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 
                      isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200">
                        {dayTasks.length} İŞ
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 mt-1">
                    {dayTasks.slice(0, 3).map((task, tidx) => {
                      const property = properties.find(p => p.id === task.property_id);
                      return (
                        <div key={tidx} className="text-[9px] font-bold bg-white border border-slate-200 p-1 rounded-lg truncate text-slate-600 shadow-sm group-hover:border-indigo-200 transition-all">
                          {format(parseISO(task.due_date), 'HH:mm')} {property?.title || 'Gezi'}
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div className="text-[8px] font-black text-slate-400 text-center uppercase tracking-tighter">
                        + {dayTasks.length - 3} Diğer
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail Sidebar */}
        <div className="w-96 bg-slate-50/30 overflow-y-auto p-6 custom-scrollbar">
          <div className="sticky top-0 bg-transparent space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">
                {selectedDay ? format(selectedDay, 'd MMMM yyyy', { locale: tr }) : 'Gün Seçiniz'}
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                {selectedDayTasks.length} Planlanmış Görüşme
              </p>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {selectedDayTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200"
                  >
                    <CalendarIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400">Bu tarih için planlanmış<br/>gezi bulunmuyor.</p>
                  </motion.div>
                ) : (
                  selectedDayTasks.map((task) => {
                    const property = properties.find(p => p.id === task.property_id);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs font-black">{format(parseISO(task.due_date), 'HH:mm')}</span>
                          </div>
                          {task.is_completed && (
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-black">TAMAMLANDI</span>
                            </div>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                          {property?.title || 'Gezi Düzenlendi'}
                        </h4>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{task.description.split(': ')[1]?.split(' - ')[0] || 'Müşteri Bilgisi Yok'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{property?.location || 'Konum Belirtilmedi'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                          <button 
                            onClick={async () => {
                              try {
                                await api.completeTask(task.id, storeId);
                                toast.success("Görüşme tamamlandı olarak işaretlendi.");
                                fetchTasks();
                              } catch (e) {
                                toast.error("Hata oluştu.");
                              }
                            }}
                            className="flex-1 bg-slate-900 text-white text-[10px] font-black uppercase py-2 rounded-xl hover:bg-slate-800 transition-all active:scale-95"
                          >
                            Tamamlandı
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

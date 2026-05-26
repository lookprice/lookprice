import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export interface Insight {
  id: number | null;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success';
}

export function ConsultingInsights() {
  const { lang } = useLanguage();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchInsights();
    fetchTasks();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await api.analyzePortfolio();
      setInsights(res.insights || []);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const completeTask = async (id: number) => {
    try {
        await api.completeTask(id);
        fetchTasks();
    } catch (error) {
        console.error("Error completing task:", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-900 border-b pb-4">
        {lang === 'tr' ? 'Danışmanlık İçgörüleri' : 'Consulting Insights'}
      </h3>
      
      <div className="space-y-4">
        {insights.length === 0 && <p className="text-xs text-gray-500 italic">No insights at this time.</p>}
        {insights.map((insight, idx) => (
          <div key={idx} className={`p-4 rounded-xl border ${insight.type === 'warning' ? 'bg-amber-50 border-amber-100' : insight.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-indigo-50 border-indigo-100'}`}>
              <div className="flex justify-between items-start">
                  <p className={`text-sm font-semibold ${insight.type === 'warning' ? 'text-amber-900' : insight.type === 'success' ? 'text-green-900' : 'text-indigo-900'}`}>
                      {insight.title}
                  </p>
                  <button 
                      onClick={async () => {
                          await api.createTask({
                              property_id: insight.id || undefined,
                              task_type: 'CONSULTING_FOLLOWUP',
                              description: insight.title + ': ' + insight.description
                          });
                          fetchTasks();
                          alert(lang === 'tr' ? 'Takip görevi oluşturuldu.' : 'Follow-up task created.');
                      }}
                      className="text-xs px-2 py-1 bg-white/50 rounded-md hover:bg-white text-gray-700"
                  >
                  {lang === 'tr' ? 'Görev Oluştur' : 'Create Task'}
                  </button>
              </div>
              <p className={`text-xs mt-1 ${insight.type === 'warning' ? 'text-amber-700' : insight.type === 'success' ? 'text-green-700' : 'text-indigo-700'}`}>
                  {insight.description}
              </p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-bold text-gray-900 mb-2">Aktif Görevler</h4>
          <div className="space-y-2">
              {tasks.length === 0 && <p className="text-xs text-gray-400 italic">Görev yok.</p>}
              {tasks.map(task => (
                  <div key={task.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-700">{task.description}</p>
                      <button onClick={() => completeTask(task.id)} className="text-emerald-600 hover:text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" />
                      </button>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { School, User, Lock, Loader2, Sparkles, CheckCircle, Database } from 'lucide-react';
import { db } from './lib/database';
import { Registration, GradeSetting } from './types';
import StudentPanel from './components/StudentPanel';
import AdminDashboard from './components/AdminDashboard';
import AdminPasswordModal from './components/AdminPasswordModal';

export default function App() {
  // Navigation: 'student' | 'admin'
  const [interfaceMode, setInterfaceMode] = useState<'student' | 'admin'>('student');
  
  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Big, shared application states
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [gradeSettings, setGradeSettings] = useState<GradeSetting[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all states from the DB controller
  const loadAllData = async () => {
    try {
      const [regsList, settingsSpecs] = await Promise.all([
        db.getRegistrations(),
        db.getGradeSettings()
      ]);
      setRegistrations(regsList);
      setGradeSettings(settingsSpecs);
    } catch (err) {
      console.error("Database initialization failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleAdminAccessTrigger = () => {
    if (isAdminAuthenticated) {
      setInterfaceMode('admin');
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  const handleAdminSuccess = () => {
    setIsAdminAuthenticated(true);
    setInterfaceMode('admin');
  };

  if (loading) {
    return (
      <div id="school-preloader-root" className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 1.5 }}
          className="text-indigo-400"
        >
          <Loader2 size={36} />
        </motion.div>
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
          Connecting to Chercher Secondary School Registry...
        </p>
      </div>
    );
  }

  const isSupabaseLive = db.getIsSupabaseActive();

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between font-sans">
      
      {/* Top Application Header bar */}
      <header className="sticky top-0 z-40 w-full bg-[#1E293B]/80 backdrop-blur-md border-b border-slate-850 shadow-xs select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Institution Logo */}
          <div 
            onClick={() => setInterfaceMode('student')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="bg-[#6366F1] text-white p-2 rounded-xl group-hover:scale-105 transition-transform shadow-xs">
              <School size={16} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-white font-sans tracking-tight">Chercher High-School</span>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Registrar System</p>
            </div>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-2.5">
            {/* Supabase Link badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-medium tracking-wide shadow-xs border ${
              isSupabaseLive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {isSupabaseLive ? <CheckCircle size={11} className="text-emerald-400" /> : <Database size={11} className="text-rose-400" />}
              <span>{isSupabaseLive ? 'SUPABASE CLOUD LIVE' : 'SUPABASE NOT CONFIGURED'}</span>
            </div>

            {/* View selectors */}
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-semibold select-none">
              <button
                id="header-nav-student-btn"
                onClick={() => setInterfaceMode('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  interfaceMode === 'student'
                    ? 'bg-[#6366F1] text-white shadow-xs'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <User size={12} />
                <span>Student Panel</span>
              </button>

              <button
                id="header-nav-admin-btn"
                onClick={handleAdminAccessTrigger}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  interfaceMode === 'admin'
                    ? 'bg-[#6366F1] text-white shadow-xs'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Lock size={12} />
                <span>Admin Panel</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main coordinate view port body */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {interfaceMode === 'student' ? (
            <StudentPanel
              registrations={registrations}
              onRefreshRegistrations={loadAllData}
              onSuccess={loadAllData}
            />
          ) : (
            <AdminDashboard
              registrations={registrations}
              gradeSettings={gradeSettings}
              onRefreshAll={loadAllData}
            />
          )}
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full bg-[#1E293B] border-t border-slate-800 py-4 select-none font-sans text-center text-[10px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 1968-2026 Chercher Secondary School Registrar. All rights reserved.</span>
          <div className="flex items-center gap-3 font-medium">
            <span className="text-slate-500 uppercase font-mono tracking-wide text-[9px] cursor-help" title="Registration platform designed with Google AI Studio and Supabase CJS bundles.">BUILD PIPELINE SECURED</span>
          </div>
        </div>
      </footer>

      {/* Secure Password Authenticator overlay */}
      <AdminPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />

    </div>
  );
}

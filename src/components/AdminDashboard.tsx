import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, CheckCircle2, AlertCircle, XSquare, Search, Filter, 
  Trash2, BookOpen, Calculator, Sparkles, Settings2, Save,
  AlertTriangle, FileSpreadsheet, Play, Eye, X, Send, UserCheck, RefreshCw, BarChart2, ChevronDown
} from 'lucide-react';
import { Registration, GradeSetting, ClassAssignment } from '../types';
import { db } from '../lib/database';
import { runSmartClassAssignment } from '../lib/classAssigner';
import AIAdminAssistant from './AIAdminAssistant';
import ClassDetailsView from './ClassDetailsView';

interface AdminDashboardProps {
  registrations: Registration[];
  gradeSettings: GradeSetting[];
  onRefreshAll: () => Promise<void>;
}

export default function AdminDashboard({ registrations, gradeSettings, onRefreshAll }: AdminDashboardProps) {
  // Views: 'overview' | 'classes' | 'settings' | 'ai'
  const [adminView, setAdminView] = useState<'overview' | 'classes' | 'settings' | 'ai'>('overview');

  // Selected class for Class Details View
  const [inspectedClass, setInspectedClass] = useState<ClassAssignment | null>(null);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Grade settings adjustments
  const [g10Size, setG10Size] = useState<number>(gradeSettings.find(s => s.grade === 10)?.students_per_class || 60);
  const [g11Size, setG11Size] = useState<number>(gradeSettings.find(s => s.grade === 11)?.students_per_class || 45);
  const [g12Size, setG12Size] = useState<number>(gradeSettings.find(s => s.grade === 12)?.students_per_class || 40);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // File previewer modal state
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'Transcript' | 'Receipt' | null>(null);

  // Rejection reason overlay states
  const [actingStudent, setActingStudent] = useState<Registration | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectSubmitLoading, setRejectSubmitLoading] = useState(false);

  // Smart Allocations execution State
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationSuccess, setAllocationSuccess] = useState(false);

  // Pagination for registrations table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Process statistics and analytics metrics
  const stats = useMemo(() => {
    return {
      total: registrations.length,
      pending: registrations.filter(r => r.status === 'Pending Review').length,
      approved: registrations.filter(r => r.status === 'Approved').length,
      rejected: registrations.filter(r => r.status === 'Rejected').length
    };
  }, [registrations]);

  const gradeAnalytics = useMemo(() => {
    const grades: (10 | 11 | 12)[] = [10, 11, 12];
    return grades.map(g => {
      const gStuds = registrations.filter(r => r.promoted_grade === g);
      const approvedStuds = gStuds.filter(r => r.status === 'Approved');
      
      // Calculate active distinct allocated classes
      const distinctClasses = new Set(
        approvedStuds
          .map(s => s.class_assignment)
          .filter(Boolean)
      );

      return {
        grade: g,
        total: gStuds.length,
        approved: approvedStuds.length,
        males: approvedStuds.filter(r => r.sex === 'Male').length,
        females: approvedStuds.filter(r => r.sex === 'Female').length,
        classesCount: distinctClasses.size || 0,
        distinctClassesList: Array.from(distinctClasses).sort()
      };
    });
  }, [registrations]);

  // Handle student actions
  const handleApprove = async (student: Registration) => {
    if (!student.id) return;
    try {
      await db.updateRegistrationStatus(student.id, 'Approved');
      await onRefreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenRejection = (student: Registration) => {
    setActingStudent(student);
    setRejectionReasonInput('');
  };

  const submitRejection = async () => {
    if (!actingStudent || !actingStudent.id || !rejectionReasonInput.trim()) return;
    setRejectSubmitLoading(true);
    try {
      await db.updateRegistrationStatus(actingStudent.id, 'Rejected', rejectionReasonInput.trim());
      setActingStudent(null);
      await onRefreshAll();
    } catch (err) {
      console.error(err);
    } finally {
      setRejectSubmitLoading(false);
    }
  };

  const handleDelete = async (studentId?: string | number) => {
    if (!studentId) return;
    if (confirm("Are you sure you want to permanently delete this student's registration profile? This action is irreversible.")) {
      try {
        await db.deleteRegistration(studentId);
        await onRefreshAll();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Save Config Class sizes
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const updatedSpecs: GradeSetting[] = [
        { id: 1, grade: 10, students_per_class: Number(g10Size) },
        { id: 2, grade: 11, students_per_class: Number(g11Size) },
        { id: 3, grade: 12, students_per_class: Number(g12Size) }
      ];
      await db.updateGradeSettings(updatedSpecs);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      await onRefreshAll();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Run Smart balancing allocation algorithm
  const handleTriggerAllocation = async () => {
    setAllocationLoading(true);
    setAllocationSuccess(false);
    try {
      // Execute the smart class sorter & allocator
      const result = runSmartClassAssignment(registrations, gradeSettings);
      
      // Bulk write updates to student database
      for (const student of result.updatedRegistrations) {
        if (student.id && student.class_assignment !== undefined) {
          await db.saveClassAssignmentToDatabase(student.id, student.class_assignment);
        }
      }

      // Update structural classes lists
      await db.updateClassesSummary(result.classesSummary);
      setAllocationSuccess(true);
      setTimeout(() => setAllocationSuccess(false), 3000);
      await onRefreshAll();
    } catch (err) {
      console.error(err);
    } finally {
      setAllocationLoading(false);
    }
  };

  // Filter registrations list
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(student => {
      const matchesSearch = student.full_name.toLowerCase().includes(search.toLowerCase());
      const matchesGrade = gradeFilter === 'all' ? true : String(student.promoted_grade) === gradeFilter;
      const matchesStatus = statusFilter === 'all' ? true : student.status === statusFilter;
      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [registrations, search, gradeFilter, statusFilter]);

  // Paginated Student items
  const paginatedRegistrations = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredRegistrations.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredRegistrations, currentPage]);

  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage) || 1;

  // View individual classroom details register
  if (inspectedClass) {
    return (
      <ClassDetailsView
        className={inspectedClass.class_name}
        grade={inspectedClass.grade}
        registrations={registrations}
        onBack={() => setInspectedClass(null)}
      />
    );
  }

  return (
    <div className="space-y-6 font-sans select-none text-slate-100">
      
      {/* Top Navbar Menu */}
      <div className="bg-[#1E293B] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-[#6366F1] p-2 text-white rounded-xl">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-none">Registrar Control Dashboard</h2>
            <p className="text-[10px] text-slate-400 mt-1">Manage applications, configure room boundaries, and assign smart classes.</p>
          </div>
        </div>

        {/* View togglers */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 text-xs font-semibold text-slate-400 w-full sm:w-auto">
          {[
            { id: 'overview', label: 'Student Applications', icon: Users },
            { id: 'classes', label: 'Allocated classes', icon: BarChart2 },
            { id: 'settings', label: 'Grade settings', icon: Settings2 },
            { id: 'ai', label: 'AI Assistant Panel', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                id={`admin-tab-toggle-${tab.id}`}
                key={tab.id}
                onClick={() => setAdminView(tab.id as any)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  adminView === tab.id
                    ? 'bg-[#6366F1] text-white shadow-xs'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span className="hidden leading-none sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Core Overview View (Stats, Charts, tables) */}
      {adminView === 'overview' && (
        <div className="space-y-6">
          {/* Dashboard Stats Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total */}
            <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-widest">Enrollments</p>
                <h4 className="text-2xl font-black text-white leading-none">{stats.total}</h4>
                <p className="text-[9px] text-slate-400">Active files in registry</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>

            {/* Pending */}
            <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-widest">Pending Review</p>
                <h4 className="text-2xl font-black text-amber-400 leading-none">{stats.pending}</h4>
                <p className="text-[9px] text-slate-400">Awaiting transcript checks</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <AlertCircle size={18} />
              </div>
            </div>

            {/* Approved */}
            <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-widest">Approved</p>
                <h4 className="text-2xl font-black text-emerald-400 leading-none">{stats.approved}</h4>
                <p className="text-[9px] text-slate-400">Ready for class schedule</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
            </div>

            {/* Rejected */}
            <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-4 flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-widest">Rejected</p>
                <h4 className="text-2xl font-black text-rose-400 leading-none">{stats.rejected}</h4>
                <p className="text-[9px] text-slate-400">Declined file credentials</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#991B1B]/10 text-rose-400 flex items-center justify-center">
                <XSquare size={18} />
              </div>
            </div>
          </div>

          {/* Quick Classroom Allocation Action Panel */}
          <div className="bg-[#1E293B] border border-[#6366F1]/20 bg-gradient-to-r from-indigo-950/30 to-[#1E293B] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans leading-relaxed">
            <div className="space-y-1 max-w-xl">
              <h3 className="font-bold text-[#818CF8] text-sm flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-400" />
                Trigger Smart Class Assignment System
              </h3>
              <p className="text-xs text-slate-350">
                Analyzes only **APPROVED** students, ranks them by average grades descending to populate special &quot;A&quot; classes, and balances subsequent alphabetic divisions round-robin on strict gender balance ratios.
              </p>
            </div>
            <button
              id="run-allocation-trigger"
              onClick={handleTriggerAllocation}
              disabled={allocationLoading || stats.approved === 0}
              className="flex items-center justify-center h-12 px-5 py-2.5 rounded-xl bg-[#6366F1] text-white font-bold text-xs max-w-xs transition-all hover:bg-[#4F46E5] disabled:opacity-40 cursor-pointer shadow-md gap-1.5"
            >
              {allocationLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-white" />
                  <span>Processing Sorters...</span>
                </>
              ) : (
                <>
                  <Play size={12} className="fill-white" />
                  <span>Execute Allocation ({stats.approved} Approved)</span>
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {allocationSuccess && (
              <motion.div
                id="allocation-success-alert"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs font-semibold text-center"
              >
                ✔ Smart Class Assignment completed successfully! Checked approved students rankings and balanced ratios.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analytics Grade Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gradeAnalytics.map((analysis) => (
              <div key={analysis.grade} className="border border-slate-800 bg-[#1E293B] rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="font-bold text-white text-sm">Grade {analysis.grade} Level</h4>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    {analysis.total} Applicants
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-900 rounded-xl leading-snug">
                    <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wide">Approved</span>
                    <strong className="text-white text-sm font-black">{analysis.approved}</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl leading-snug">
                    <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wide">Ratio (M/F)</span>
                    <strong className="text-indigo-400 text-xs font-black">{analysis.males} M / {analysis.females} F</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>Classrooms Alotted:</span>
                  <strong className="text-[#818CF8] font-bold">{analysis.classesCount} Classes</strong>
                </div>

                {/* Lists of assigned groups quick shortcuts */}
                {analysis.distinctClassesList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Class Rooms Click:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.distinctClassesList.map((clsName) => (
                        <button
                          id={`class-badge-${clsName}`}
                          key={clsName}
                          onClick={() => setInspectedClass({
                            grade: analysis.grade,
                            class_name: clsName,
                            class_type: clsName.endsWith('A') ? 'Special' : 'Regular',
                            total_students: registrations.filter(r => r.class_assignment === clsName).length
                          })}
                          className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-[#6366F1] border border-indigo-500/20 hover:border-transparent text-indigo-300 hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          {clsName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Student applications table interface */}
          <div className="bg-[#1E293B] rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl font-sans">
            <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Registered Student database</h3>
                <p className="text-xs text-slate-400 mt-1">Review certified transcript certificates and confirm valid fee receipts.</p>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 pointer-events-none">
                    <Search size={12} />
                  </span>
                  <input
                    id="student-applications-search-box"
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search name..."
                    className="rounded-xl border border-slate-800 bg-slate-900 py-2 pl-8 pr-2 text-xs outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-900/45 focus:ring-2 focus:ring-indigo-950 text-white max-w-[120px] sm:max-w-xs"
                  />
                </div>

                {/* Grade filter */}
                <div className="relative">
                  <select
                    id="table-filter-grade"
                    value={gradeFilter}
                    onChange={(e) => {
                      setGradeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-800 bg-slate-900 py-2 pl-2 pr-6 text-xs text-slate-300 outline-none hover:bg-slate-800 cursor-pointer appearance-none font-semibold leading-none"
                  >
                    <option value="all">All Grades</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Status filter */}
                <div className="relative">
                  <select
                    id="table-filter-status"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-800 bg-slate-900 py-2 pl-2 pr-6 text-xs text-slate-300 outline-none hover:bg-slate-800 cursor-pointer appearance-none font-semibold leading-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Application table list */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 select-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-905 bg-slate-900/80 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                    <th className="py-2.5 px-3">Student Particulars</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3 text-center">Average Score</th>
                    <th className="py-2.5 px-3 text-center">Certified Files</th>
                    <th className="py-2.5 px-3 text-center">Payment</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs sm:text-sm text-slate-300">
                  {paginatedRegistrations.length > 0 ? (
                    paginatedRegistrations.map((student, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-all font-sans border-b border-slate-800">
                        {/* Bio */}
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-100 leading-tight">{student.full_name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{student.age} yrs • {student.sex}</p>
                        </td>

                        {/* Grade */}
                        <td className="py-3 px-3 text-center font-bold text-slate-200">G-{student.promoted_grade}</td>

                        {/* Max Average */}
                        <td className="py-3 px-3 text-center font-mono font-semibold text-white">{student.average.toFixed(1)}%</td>

                        {/* Transcript link */}
                        <td className="py-3 px-3 text-center">
                          {student.transcript_url ? (
                            <button
                              id={`preview-transcript-trigger-${student.id || idx}`}
                              type="button"
                              onClick={() => {
                                setPreviewFileUrl(student.transcript_url);
                                setPreviewType('Transcript');
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-indigo-500/10"
                            >
                              <Eye size={12} />
                              <span>View Transcript</span>
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-600 italic">No File</span>
                          )}
                        </td>

                        {/* Receipt details */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            {student.receipt_url ? (
                              <button
                                id={`preview-receipt-trigger-${student.id || idx}`}
                                type="button"
                                onClick={() => {
                                  setPreviewFileUrl(student.receipt_url);
                                  setPreviewType('Receipt');
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-purple-500/10"
                              >
                                <Eye size={12} />
                                <span>Receipt ({student.payment_method})</span>
                              </button>
                            ) : (
                              <span className="text-[9px] text-slate-600 font-mono italic">No receipt</span>
                            )}
                          </div>
                        </td>

                        {/* State badges */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {student.status === 'Approved' ? (
                            <span className="inline-flex flex-col items-center justify-center">
                              <span className="inline-flex px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 uppercase tracking-wide">
                                Approved
                              </span>
                              {student.class_assignment && (
                                <span className="text-[9px] uppercase font-mono font-bold text-[#818CF8] mt-0.5">
                                  Class: {student.class_assignment}
                                </span>
                              )}
                            </span>
                          ) : student.status === 'Rejected' ? (
                            <span className="inline-flex px-2 py-0.5 text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full uppercase tracking-wide" title={student.rejection_reason || ''}>
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full uppercase tracking-wide">
                              Pending Review
                            </span>
                          )}
                        </td>

                        {/* Record triggers actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {student.status !== 'Approved' && (
                              <button
                                id={`approve-action-btn-${student.id || idx}`}
                                onClick={() => handleApprove(student)}
                                className="p-1 px-1.5 rounded-lg text-[10px] font-bold bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-xs leading-none cursor-pointer"
                                title="Approve candidate"
                              >
                                Approve
                              </button>
                            )}

                            {student.status !== 'Rejected' && (
                              <button
                                id={`reject-action-btn-${student.id || idx}`}
                                onClick={() => handleOpenRejection(student)}
                                className="p-1 px-1.5 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 leading-none cursor-pointer"
                                title="Reject candidate with remarks"
                              >
                                Reject
                              </button>
                            )}

                            <button
                              id={`delete-action-btn-${student.id || idx}`}
                              onClick={() => handleDelete(student.id)}
                              className="p-1 px-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete record profile"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 px-3 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
                        No student registrations found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <div>
                Showing <span className="font-semibold text-slate-200">
                  {filteredRegistrations.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                </span> to <span className="font-semibold text-slate-200">
                  {Math.min(currentPage * itemsPerPage, filteredRegistrations.length)}
                </span> of <span className="font-semibold text-slate-200">{filteredRegistrations.length}</span> results
              </div>

              <div className="flex gap-1">
                <button
                  id="admin-registries-prev"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 px-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <span className="p-1 px-2 font-semibold bg-slate-900 border border-slate-850 rounded-lg text-slate-200 font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  id="admin-registries-next"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 px-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classroom divisions grids view */}
      {adminView === 'classes' && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl font-sans">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">Allocated classrooms blocks</h3>
            <p className="text-xs text-slate-400 mt-1">Select class groups below to inspect students lists or download official rosters report files.</p>
          </div>

          {registrations.filter(r => r.class_assignment && r.status === 'Approved').length === 0 ? (
            <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-xl max-w-md mx-auto p-4 space-y-2">
              <h4 className="font-bold text-slate-300 text-sm">Class allocation registry is empty</h4>
              <p className="text-xs text-slate-500">
                Approved students have not been allocated classes yet. Go back to the student list screen and execute the "Smart Class Assignment System" to auto-group.
              </p>
              <button
                id="tab-redirect-to-overview-action"
                onClick={() => setAdminView('overview')}
                className="inline-flex px-3 py-1.5 rounded-lg bg-[#6366F1] font-semibold text-white text-[10px] transition-colors cursor-pointer"
              >
                Go Approve &amp; Allocate
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from(new Set(
                registrations
                  .filter(r => r.status === 'Approved' && r.class_assignment)
                  .map(s => s.class_assignment)
              )).sort().map((clsName) => {
                const classMembersCount = registrations.filter(r => r.class_assignment === clsName && r.status === 'Approved').length;
                const clsGrade = clsName?.substring(0, 2);
                const isSpecial = clsName?.endsWith('A');

                return (
                  <div
                    id={`classroom-block-card-${clsName}`}
                    key={clsName}
                    onClick={() => setInspectedClass({
                      grade: Number(clsGrade) as 10 | 11 | 12,
                      class_name: clsName || '',
                      class_type: isSpecial ? 'Special' : 'Regular',
                      total_students: classMembersCount
                    })}
                    className="p-4 rounded-xl border border-slate-850 hover:border-indigo-500 bg-slate-900/60 hover:bg-slate-900/95 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between h-[120px]"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold text-white leading-none">{clsName}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        isSpecial ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {isSpecial ? 'Special Class' : 'Regular Class'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between border-t border-slate-800 pt-2 text-xs">
                      <span className="text-slate-500 text-[10px]">Enrollment:</span>
                      <strong className="text-indigo-300 font-extrabold text-sm font-mono">{classMembersCount} Students</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Settings Panel View */}
      {adminView === 'settings' && (
        <div className="bg-[#1E293B] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl font-sans">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">Configure class capacities</h3>
            <p className="text-xs text-slate-400 mt-1">Adjust administrative constraints regarding the target number of students allowed per class for allocation decisions.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-md">
            <div className="space-y-4">
              {/* Size Grade 10 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-sans tracking-wide">
                  Target Grade 10 Class Size (Target students per allocation Block)
                </label>
                <input
                  id="setting-g10-size-input"
                  type="number"
                  required
                  min="20"
                  max="100"
                  value={g10Size}
                  onChange={(e) => setG10Size(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 py-3 px-3.5 outline-none focus:border-indigo-505 focus:border-indigo-500 focus:bg-slate-900/60 text-white"
                />
              </div>

              {/* Size Grade 11 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-sans tracking-wide">
                  Target Grade 11 Class Size
                </label>
                <input
                  id="setting-g11-size-input"
                  type="number"
                  required
                  min="20"
                  max="100"
                  value={g11Size}
                  onChange={(e) => setG11Size(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 py-3 px-3.5 outline-none focus:border-indigo-505 focus:border-indigo-500 focus:bg-slate-900/60 text-white"
                />
              </div>

              {/* Size Grade 12 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-sans tracking-wide">
                  Target Grade 12 Class Size
                </label>
                <input
                  id="setting-g12-size-input"
                  type="number"
                  required
                  min="20"
                  max="100"
                  value={g12Size}
                  onChange={(e) => setG12Size(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 py-3 px-3.5 outline-none focus:border-indigo-505 focus:border-indigo-500 focus:bg-slate-900/60 text-white"
                />
              </div>
            </div>

            <AnimatePresence>
              {settingsSuccess && (
                <motion.div
                  id="settings-saved-success"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-semibold text-center"
                >
                  ✔ Boundaries updated successfully!
                </motion.div>
              )}
            </AnimatePresence>

            <button
              id="save-settings-btn"
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-xs shadow-md disabled:opacity-40 transition-all cursor-pointer"
            >
              {savingSettings ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-white" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Update Class Capacities</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* AI assistant Copilot panel */}
      {adminView === 'ai' && (
        <AIAdminAssistant registrations={registrations} gradeSettings={gradeSettings} />
      )}

      {/* File previewer Fullscreen modal */}
      <AnimatePresence>
        {previewFileUrl && (
          <div id="file-preview-lightbox" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              id="file-preview-lightbox-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setPreviewFileUrl(null);
                setPreviewType(null);
              }}
              className="fixed inset-0 bg-slate-950/90 backdrop-blur-xs"
            />

            {/* Content card */}
            <motion.div
              id="file-preview-lightbox-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl h-[85vh] overflow-hidden rounded-2xl bg-[#1E293B] border border-slate-800 p-4 shadow-2xl flex flex-col"
            >
              {/* Header inside light container */}
              <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between text-white">
                <h4 className="font-bold text-sm tracking-tight">{previewType} Certificate File Proof</h4>
                <button
                  id="close-lightbox-btn"
                  onClick={() => {
                    setPreviewFileUrl(null);
                    setPreviewType(null);
                  }}
                  className="rounded-full p-1.5 hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body viewer viewport */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900 rounded-xl mt-3 relative border border-slate-800">
                {previewFileUrl.endsWith('.pdf') ? (
                  <iframe
                    id="lightbox-pdf-iframe"
                    src={`${previewFileUrl}#view=FitH`}
                    className="w-full h-full rounded-lg border border-slate-800"
                    title="Certified PDF attachments preview"
                  />
                ) : (
                  <img
                    id="lightbox-img-element"
                    src={previewFileUrl}
                    alt="Lightbox upload file preview"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rejection comment input overlay modal */}
      <AnimatePresence>
        {actingStudent && (
          <div id="rejection-remarks-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              id="rejection-remarks-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActingStudent(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            />

            {/* Container */}
            <motion.div
              id="rejection-remarks-container"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#1E293B] p-6 shadow-2xl space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="text-rose-500 border-none shrink-0" size={18} />
                  Reject Admission Application
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">Define a descriptive rejection comment message for <strong className="font-semibold text-slate-200">{actingStudent.full_name}</strong>.</p>
              </div>

              <div className="space-y-1 mt-2">
                <label className="block text-[10px] font-bold text-slate-350 uppercase tracking-widest font-sans">
                  Rejection Remarks Comment
                </label>
                <textarea
                  id="rejection-comment-textbox"
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Payment receipt verification failed: Amount does not match the registration fee of 300 ETB."
                  className="w-full h-24 text-xs p-3 border border-slate-800 rounded-xl bg-slate-900 outline-none focus:border-rose-500 focus:bg-slate-900/40 text-white font-sans placeholder:text-slate-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  id="close-rejection-modal-btn"
                  onClick={() => setActingStudent(null)}
                  type="button"
                  className="flex-1 py-3 text-center text-xs font-semibold rounded-xl border border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors animate-none"
                >
                  Cancel
                </button>
                <button
                  id="submit-rejection-modal-btn"
                  onClick={submitRejection}
                  disabled={rejectSubmitLoading || !rejectionReasonInput.trim()}
                  type="button"
                  className="flex-1 py-3 text-center text-xs font-semibold rounded-xl bg-rose-650 hover:bg-rose-700 text-white disabled:opacity-40 transition-all cursor-pointer shadow-md"
                >
                  {rejectSubmitLoading ? 'Saving...' : 'Decline Candidate'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

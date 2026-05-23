import { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, Share2, SortAsc, Users, GraduationCap, School } from 'lucide-react';
import { Registration } from '../types';

interface ClassDetailsViewProps {
  className: string;
  grade: 10 | 11 | 12;
  registrations: Registration[];
  onBack: () => void;
}

export default function ClassDetailsView({ className, grade, registrations, onBack }: ClassDetailsViewProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);
  const itemsPerPage = 10;

  // Filter approved students in this class
  const classStudents = useMemo(() => {
    return registrations.filter(
      r => r.class_assignment === className && r.status === 'Approved'
    );
  }, [registrations, className]);

  // Handle search and sort
  const filteredAndSorted = useMemo(() => {
    let result = classStudents.filter(s =>
      s.full_name.toLowerCase().includes(search.toLowerCase())
    );

    // Alphabetical sort of name
    result.sort((a, b) => {
      const nameA = a.full_name.toLowerCase();
      const nameB = b.full_name.toLowerCase();
      if (nameA < nameB) return sortAsc ? -1 : 1;
      if (nameA > nameB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [classStudents, search, sortAsc]);

  // Paginated students
  const paginatedStudents = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage) || 1;

  // CSV Exporter helper
  const triggerCsvDownload = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCsvSingleClass = () => {
    const headers = ['Full Name', 'Sex', 'Age', 'Promoted Grade', 'Average', 'Class Assignment', 'Payment Method'];
    const rows = classStudents.map(s => [
      s.full_name,
      s.sex,
      String(s.age),
      String(s.promoted_grade),
      String(s.average),
      s.class_assignment || '',
      s.payment_method
    ]);
    triggerCsvDownload(headers, rows, `css_class_${className}_students.csv`);
  };

  const handleExportCsvWholeGrade = () => {
    const gradeStudents = registrations.filter(r => r.promoted_grade === grade && r.status === 'Approved');
    const headers = ['Full Name', 'Sex', 'Age', 'Promoted Grade', 'Average', 'Class Assignment', 'Payment Method'];
    const rows = gradeStudents.map(s => [
      s.full_name,
      s.sex,
      String(s.age),
      String(s.promoted_grade),
      String(s.average),
      s.class_assignment || 'Unassigned',
      s.payment_method
    ]);
    triggerCsvDownload(headers, rows, `css_grade_${grade}_approved_report.csv`);
  };

  const handleExportCsvEntireSchool = () => {
    const list = registrations.filter(r => r.status === 'Approved');
    const headers = ['Full Name', 'Sex', 'Age', 'Promoted Grade', 'Average', 'Class Assignment', 'Payment Method'];
    const rows = list.map(s => [
      s.full_name,
      s.sex,
      String(s.age),
      String(s.promoted_grade),
      String(s.average),
      s.class_assignment || 'Unassigned',
      s.payment_method
    ]);
    triggerCsvDownload(headers, rows, `css_entire_school_approved_registrations.csv`);
  };

  return (
    <div className="bg-[#1E293B] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl font-sans">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <button
            id="back-to-dashboard-btn"
            onClick={onBack}
            className="text-xs font-medium text-slate-400 hover:text-indigo-400 flex items-center gap-1 mb-2 tracking-wide uppercase transition-colors"
          >
            ← Back to Admin Dashboard
          </button>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-white flex flex-wrap items-center gap-2.5">
            Class {className} Register
            <span className="text-xs font-normal border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {classStudents.length} Students Allocated
            </span>
          </h2>
        </div>

        {/* Exports buttons hub */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class CSV */}
          <button
            id="export-class-csv"
            onClick={handleExportCsvSingleClass}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Export CSV list for this class only"
          >
            <Download size={13} />
            <span>Export Class CSV</span>
          </button>

          {/* Grade Report CSV */}
          <button
            id="export-grade-csv"
            onClick={handleExportCsvWholeGrade}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-800 text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors cursor-pointer"
            title={`Export CSV for all Grade ${grade} approved students`}
          >
            <GraduationCap size={13} />
            <span>Export Grade {grade} CSV</span>
          </button>

          {/* School Report CSV */}
          <button
            id="export-school-csv"
            onClick={handleExportCsvEntireSchool}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-all shadow-md cursor-pointer"
            title="Export CSV for whole school approved students"
          >
            <School size={13} />
            <span>Export Entire School</span>
          </button>
        </div>
      </div>

      {/* Internal statistics summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
          <p className="text-[10px] uppercase font-semibold text-slate-550 text-slate-500 tracking-wider">Gender Balance</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-100">
              {classStudents.filter(s => s.sex === 'Male').length} M
            </span>
            <span className="text-slate-750 text-slate-705 text-slate-700">/</span>
            <span className="text-lg font-bold text-[#818CF8]">
              {classStudents.filter(s => s.sex === 'Female').length} F
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Ratio: {Math.round((classStudents.filter(s => s.sex === 'Female').length / (classStudents.length || 1)) * 100)}% Female
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
          <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Academic Performance</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-100">
              {(classStudents.reduce((acc, c) => acc + c.average, 0) / (classStudents.length || 1)).toFixed(1)}%
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">Average Mean</span>
          </div>
          <p className="text-[10px] text-slate-505 text-slate-500 mt-1">
            Top Score: {classStudents.length > 0 ? Math.max(...classStudents.map(s => s.average)) : 0}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
          <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Age Group Distribution</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-100">
              {(classStudents.reduce((acc, c) => acc + c.age, 0) / (classStudents.length || 1)).toFixed(1)}
            </span>
            <span className="text-[11px] text-slate-400">Years average</span>
          </div>
          <p className="text-[10px] text-slate-505 text-slate-500 mt-1">
            Range: {classStudents.length > 0 ? Math.min(...classStudents.map(s => s.age)) : 0} - {classStudents.length > 0 ? Math.max(...classStudents.map(s => s.age)) : 0} yrs
          </p>
        </div>
      </div>

      {/* Search and Sort layout bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            id="class-student-search-input"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search student by name..."
            className="w-full text-xs rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-3 outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500 focus:bg-slate-900/50 text-slate-200"
          />
        </div>

        {/* Sort button */}
        <button
          id="toggle-alpha-sort-btn"
          onClick={() => setSortAsc(!sortAsc)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl border border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <SortAsc size={14} className="text-slate-500" />
          <span>Sort Alphabetical: {sortAsc ? 'A-Z' : 'Z-A'}</span>
        </button>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 select-none">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-[10px] font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-800">
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Sex</th>
              <th className="py-3 px-4 text-center">Age</th>
              <th className="py-3 px-4 text-center">Previous Avg score</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs sm:text-sm text-slate-300">
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((student, sIdx) => (
                <tr key={sIdx} className="hover:bg-slate-800/40 transition-all border-b border-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-100 leading-snug">
                    {student.full_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      student.sex === 'Male' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-505 border-indigo-500/10' : 'bg-pink-500/10 text-pink-300 border border-pink-500/15'
                    }`}>
                      {student.sex}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-300">{student.age} yrs</td>
                  <td className="py-3 px-4 text-center font-mono font-medium text-white">
                    {student.average.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[10px] text-slate-500 italic">Pre-verified</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                  {classStudents.length === 0 
                    ? "No student assigned to this class. Go back and trigger Class Allocation."
                    : "No matching student records found for your search query."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination control footer bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">
            {filteredAndSorted.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </span> to <span className="font-semibold text-slate-200">
            {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)}
          </span> of <span className="font-semibold text-slate-200">{filteredAndSorted.length}</span> results
        </div>

        <div className="flex gap-1.5">
          <button
            id="class-details-page-prev"
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 px-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition-colors disabled:cursor-not-allowed cursor-pointer"
          >
            Prev
          </button>
          <span className="p-1 px-2 font-semibold bg-slate-900 border border-slate-850 rounded-lg text-slate-200 font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            id="class-details-page-next"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 px-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition-colors disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  School, FileText, CheckCircle, Clock, AlertTriangle, 
  Upload, Search, CreditCard, ChevronDown, Check, Loader2, ArrowRight, MapPin, Phone
} from 'lucide-react';
import { uploadToCloudinary } from '../lib/cloudinary';
import { db } from '../lib/database';
import { Registration } from '../types';

interface StudentPanelProps {
  onSuccess: () => void;
  registrations: Registration[];
  onRefreshRegistrations: () => Promise<void>;
}

export default function StudentPanel({ onSuccess, registrations, onRefreshRegistrations }: StudentPanelProps) {
  // Navigation: 'welcome' | 'register' | 'status'
  const [activeTab, setActiveTab] = useState<'welcome' | 'register' | 'status'>('welcome');

  // Register Form States
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number>(15);
  const [sex, setSex] = useState<'Male' | 'Female' | ''>('');
  const [promotedGrade, setPromotedGrade] = useState<'10' | '11' | '12' | ''>('');
  const [average, setAverage] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CBE' | 'SINQEE BANK' | 'TELEBIRR' | ''>('');

  // File Upload States - Transcript
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptUrl, setTranscriptUrl] = useState('');
  const [transcriptPercent, setTranscriptPercent] = useState(0);
  const [transcriptUploading, setTranscriptUploading] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
  const [transcriptError, setTranscriptError] = useState('');

  // File Upload States - Receipt
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptPercent, setReceiptPercent] = useState(0);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [submitSuccessData, setSubmitSuccessData] = useState<Registration | null>(null);
  const [generalError, setGeneralError] = useState('');

  // Status Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Registration[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // File refs
  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const GRADE_OPTIONS = [10, 11, 12];
  const AGE_OPTIONS = [14, 15, 16, 17, 18, 19, 20];

  // Helper payment details
  const PAYMENT_DETAILS = {
    'CBE': { account: '10393930293', branch: 'Chercher Town Branch' },
    'SINQEE BANK': { account: '2939939393', branch: 'Chiro Main Branch' },
    'TELEBIRR': { account: '3939393939', branch: 'Direct Merchant Merchant Pay' }
  };

  // Upload Handlers
  const handleTranscriptChange = (file: File) => {
    setTranscriptFile(file);
    setTranscriptError('');
    setTranscriptUrl('');
    setTranscriptPercent(0);

    // Create localized preview
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTranscriptPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (extension === 'pdf') {
      setTranscriptPreview('pdf');
    }

    // Trigger Cloudinary unsigned upload
    setTranscriptUploading(true);
    uploadToCloudinary(file, {
      folder: 'school-registration/transcripts',
      onProgress: (percent) => setTranscriptPercent(percent),
      onSuccess: (url) => {
        setTranscriptUrl(url);
        setTranscriptUploading(false);
      },
      onError: (err) => {
        setTranscriptError(err);
        setTranscriptUploading(false);
        setTranscriptPercent(0);
      }
    });
  };

  const handleReceiptChange = (file: File) => {
    setReceiptFile(file);
    setReceiptError('');
    setReceiptUrl('');
    setReceiptPercent(0);

    // Create localized preview
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (extension === 'pdf') {
      setReceiptPreview('pdf');
    }

    // Trigger Cloudinary unsigned upload
    setReceiptUploading(true);
    uploadToCloudinary(file, {
      folder: 'school-registration/receipts',
      onProgress: (percent) => setReceiptPercent(percent),
      onSuccess: (url) => {
        setReceiptUrl(url);
        setReceiptUploading(false);
      },
      onError: (err) => {
        setReceiptError(err);
        setReceiptUploading(false);
        setReceiptPercent(0);
      }
    });
  };

  // Register form validations & submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!fullName.trim()) return setGeneralError('Please enter your full name');
    if (!sex) return setGeneralError('Please configure your gender');
    if (!promotedGrade) return setGeneralError('Please configure your promoted grade');
    
    const avgNum = parseFloat(average);
    if (isNaN(avgNum) || avgNum < 50 || avgNum > 100) {
      return setGeneralError('Please specify a valid average grade score from 50.0% to 100.0%');
    }

    if (!paymentMethod) return setGeneralError('Please select a payment method');
    if (!transcriptUrl) return setGeneralError('Please wait for Transcript File upload to complete');
    if (!receiptUrl) return setGeneralError('Please wait for Payment Receipt Proof upload to complete');

    setFormSubmitting(true);

    try {
      const registrationData: Registration = {
        full_name: fullName.trim(),
        age: Number(age),
        sex: sex as 'Male' | 'Female',
        promoted_grade: Number(promotedGrade) as 10 | 11 | 12,
        average: avgNum,
        transcript_url: transcriptUrl,
        receipt_url: receiptUrl,
        payment_method: paymentMethod,
        status: 'Pending Review'
      };

      const result = await db.saveRegistration(registrationData);
      setSubmitSuccessData(result);
      await onRefreshRegistrations();
      onSuccess();

      // Clear form
      setFullName('');
      setAverage('');
      setSex('');
      setPromotedGrade('');
      setPaymentMethod('');
      setTranscriptFile(null);
      setTranscriptUrl('');
      setTranscriptPreview(null);
      setReceiptFile(null);
      setReceiptUrl('');
      setReceiptPreview(null);
    } catch (err: any) {
      setGeneralError(err.message || 'Database connection error. Try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Status Search Handler
  const handleStatusSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    // Filter matching on full_name
    const matches = registrations.filter(
      r => r.full_name.toLowerCase().includes(normalizedQuery)
    );
    setSearchResults(matches);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      
      {/* Chercher Header Section */}
      <div id="school-identity-bar" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-indigo-950 p-6 sm:p-10 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-[#6366F1]/10 blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4 sm:gap-6 text-center md:text-left flex-col sm:flex-row">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner text-indigo-400">
            <School size={38} className="stroke-[1.5px]" />
          </div>
          <div>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-400/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Government School Registrar
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 text-white font-sans">Chercher High School</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm font-medium">Admission, Class Assignment & Official Registration Management Portal</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end font-mono text-[11px] text-slate-400 border-t border-slate-800 md:border-t-0 pt-4 md:pt-0 w-full md:w-auto text-center md:text-right">
          <div className="flex items-center justify-center md:justify-end gap-1.5"><MapPin size={12} className="text-indigo-400" /> <span className="text-slate-350">West Hararghe, Chiro, Ethiopia</span></div>
          <div className="flex items-center justify-center md:justify-end gap-1.5"><Phone size={12} className="text-indigo-400" /> <span className="text-slate-350">+251 25 551 0000</span></div>
        </div>
      </div>

      {/* Primary Landing Page Selector */}
      {activeTab === 'welcome' && (
        <motion.div
          id="student-landing-portal"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Card: Start Registration */}
          <div 
            onClick={() => setActiveTab('register')}
            className="group relative cursor-pointer overflow-hidden p-8 rounded-2xl border border-slate-800 bg-[#1E293B] hover:border-indigo-500 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between min-h-[220px]"
          >
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:bg-[#6366F1] group-hover:text-white transition-all duration-300">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#818CF8] transition-all duration-300">Online Grade Registration</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Enroll in Grade 10, Grade 11 or Grade 12. Complete the online form, upload your certified school transcript certificates, submit digital bank payment receipts, and get assigned into appropriate regular or special classes.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mt-4 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Launch Registration Form</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card: Lookup Status */}
          <div 
            onClick={() => setActiveTab('status')}
            className="group relative cursor-pointer overflow-hidden p-8 rounded-2xl border border-slate-800 bg-[#1E293B] hover:border-indigo-500 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between min-h-[220px]"
          >
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:bg-[#6366F1] group-hover:text-white transition-all duration-300">
                <Search size={22} />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#818CF8] transition-all duration-300">Status &amp; Class Allocation Lookup</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Check if your registry is verified of transcripts and payment fees. Verify if your application has been approved, or rejected, and inspect your newly allocated classroom block and classmates.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#818CF8] mt-4 group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Check Application Status</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 1: Registration Form */}
      {activeTab === 'register' && (
        <motion.div
          id="student-registration-form-portal"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Back handle */}
          <button 
            onClick={() => {
              setActiveTab('welcome');
              setSubmitSuccessData(null);
            }} 
            className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            ← Back to Student Hub
          </button>

          {/* Success Dialog */}
          <AnimatePresence>
            {submitSuccessData && (
              <motion.div
                id="submission-success-banner"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-950 bg-emerald-950/20 p-6 sm:p-8 text-center space-y-4 shadow-xl font-sans"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle size={32} className="stroke-[2px]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Application Submitted Successfully</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Your school file has been recorded for Chercher High School. Please note your search details below.</p>
                </div>

                <div className="rounded-xl bg-[#1E293B] border border-slate-800 p-4 max-w-xs mx-auto text-left space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-slate-850 pb-1.5"><span className="text-slate-400">Candidate Name:</span> <strong className="text-white font-semibold">{submitSuccessData.full_name}</strong></div>
                  <div className="flex justify-between border-b border-slate-850 pb-1.5"><span className="text-slate-400">Applying Grade:</span> <strong className="text-white font-semibold">Grade {submitSuccessData.promoted_grade}</strong></div>
                  <div className="flex justify-between border-b border-slate-850 pb-1.5"><span className="text-slate-400">Academic Avg:</span> <strong className="text-indigo-400 font-mono font-bold">{submitSuccessData.average}%</strong></div>
                  <div className="flex justify-between"><span className="text-amber-500 font-semibold">Initial Status:</span> <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">Pending Review</span></div>
                </div>

                <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                  Registrar office will review your uploaded certified school transcripts and verify your digital receipt with Bank accounts. Once approved, the Smart Assignment Algorithm will locate your classroom block alphabetically.
                </p>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('status')}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    Check Registry Search
                  </button>
                  <button
                    onClick={() => setSubmitSuccessData(null)}
                    className="px-4 py-2.5 rounded-xl bg-[#6366F1] text-xs font-semibold text-white hover:bg-[#4F46E5] transition-colors cursor-pointer"
                  >
                    Apply Another Student
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!submitSuccessData && (
            <div className="bg-[#1E293B] rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl font-sans">
              
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">Register Student Admission</h2>
                <p className="text-xs text-slate-400 font-sans">Enter accurate educational particulars as displayed on your certified certificates.</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                
                {/* Section: Student bio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bio Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wide">
                      Student Full Name (As in Passport/ID)
                    </label>
                    <input
                      id="input-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Nahom Debebe Wolde"
                      className="w-full text-sm rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500 px-3.5 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950"
                    />
                  </div>

                  {/* Bio Age */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wide">
                      Age
                    </label>
                    <div className="relative">
                      <select
                        id="input-age"
                        required
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full text-sm rounded-xl border border-slate-800 bg-slate-900 text-slate-100 px-3.5 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 appearance-none"
                      >
                        {AGE_OPTIONS.map((val) => (
                          <option key={val} value={val} className="bg-slate-900 text-slate-100">{val} Years Old</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-40 pointer-events-none" />
                    </div>
                  </div>

                  {/* Bio Sex */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wide">
                      Gender
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Male', 'Female'].map((sexOpt) => (
                        <button
                          id={`gender-select-btn-${sexOpt}`}
                          key={sexOpt}
                          type="button"
                          onClick={() => setSex(sexOpt as any)}
                          className={`py-3 text-xs sm:text-sm font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                            sex === sexOpt
                              ? 'bg-[#6366F1] border-indigo-550 text-white shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                          }`}
                        >
                          {sexOpt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Promoted Grade */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wide">
                      Promoted To Grade
                    </label>
                    <div className="relative">
                      <select
                        id="input-grade"
                        required
                        value={promotedGrade}
                        onChange={(e) => setPromotedGrade(e.target.value as any)}
                        className="w-full text-sm rounded-xl border border-slate-800 bg-slate-900 text-slate-100 px-3.5 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 appearance-none"
                      >
                        <option value="" className="bg-slate-900 text-slate-550">Select Grade</option>
                        {GRADE_OPTIONS.map((gradeOpt) => (
                          <option key={gradeOpt} value={gradeOpt} className="bg-slate-900 text-slate-100">Grade {gradeOpt}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-40 pointer-events-none" />
                    </div>
                  </div>

                  {/* Avg performance */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wide">
                      Last Year Academic Average (%)
                    </label>
                    <input
                      id="input-average"
                      type="number"
                      step="0.01"
                      min="50"
                      max="100"
                      required
                      value={average}
                      onChange={(e) => setAverage(e.target.value)}
                      placeholder="e.g. 84.65"
                      className="w-full text-sm rounded-xl border border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-550 px-3.5 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 font-mono"
                    />
                  </div>
                </div>

                {/* Section: Payment configuration */}
                <div className="space-y-3.5 pt-2">
                  <div className="border-t border-slate-800 pt-4">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">
                      Registration Fee Payment Method
                    </label>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Transfer school fee to any of the bank accounts listed below, then select corresponding channel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(PAYMENT_DETAILS).map(([bank, details]) => (
                      <div
                        id={`payment-card-${bank.replace(/\s/g, '-')}`}
                        key={bank}
                        onClick={() => setPaymentMethod(bank as any)}
                        className={`relative p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-[105px] ${
                          paymentMethod === bank 
                            ? 'bg-slate-900 border-[#6366F1] text-white shadow-[#6366F1]/10 shadow-md'
                            : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] uppercase font-bold tracking-wider">{bank}</span>
                          <span className={`flex h-4 w-4 items-center justify-center rounded-full ${
                            paymentMethod === bank ? 'bg-[#6366F1] text-white' : 'border border-slate-700'
                          }`}>
                            {paymentMethod === bank && <Check size={10} />}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-500 font-mono">ACCOUNT NO:</p>
                          <p className={`font-mono text-xs sm:text-sm font-bold leading-none ${
                            paymentMethod === bank ? 'text-yellow-400' : 'text-slate-200'
                          }`}>{details.account}</p>
                          <p className="text-[8px] text-slate-400 leading-tight truncate mt-1">{details.branch}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Certified File Uploads */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Required Educational &amp; payment attachments
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                       {/* Transcript Attachment File */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-300 block">1. School Certified Transcript (.jpg, .png, .pdf)</span>
                      
                      <div 
                        onClick={() => transcriptInputRef.current?.click()}
                        className="group relative h-40 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all overflow-hidden"
                      >
                        <input
                          id="file-transcript-hidden"
                          type="file"
                          ref={transcriptInputRef}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleTranscriptChange(e.target.files[0]);
                            }
                          }}
                          accept="image/*,.pdf"
                          className="hidden"
                        />

                        {transcriptPreview ? (
                          <div className="absolute inset-0 w-full h-full flex flex-col bg-[#1E293B] p-2">
                            {transcriptPreview === 'pdf' ? (
                              <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
                                <FileText size={40} className="text-rose-400" />
                                <span className="text-[10px] text-slate-350 truncate max-w-[150px] font-medium mt-1">{transcriptFile?.name}</span>
                              </div>
                            ) : (
                              <img src={transcriptPreview} alt="Transcript preview" className="w-full h-full object-contain rounded-lg" />
                            )}
                            
                            {/* Actions on overlay hover */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg animate-fade-in">
                              <span className="bg-[#6366F1] px-3 py-1.5 rounded-full text-[10px] text-white font-bold shadow-md">Replace File</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 flex flex-col items-center text-slate-400">
                            <Upload size={24} className="group-hover:text-indigo-400 transition-colors" />
                            <p className="text-xs font-semibold text-slate-300">Click or Drag Transcript File</p>
                            <p className="text-[9px] text-slate-500 leading-tight">PNG, JPG, WEBP, or PDF up to 5MB</p>
                          </div>
                        )}

                        {transcriptUploading && (
                          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 animate-fade-in">
                            <Loader2 size={18} className="animate-spin text-indigo-400 mb-1" />
                            <span className="text-[10px] font-semibold text-slate-300">Uploading and compressing...</span>
                            <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 text-left">
                              <div className="bg-[#6366F1] h-full rounded-full transition-all" style={{ width: `${transcriptPercent}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {transcriptUrl && <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">✔ Upload complete</p>}
                      {transcriptError && <p className="text-[10px] text-rose-400 font-medium leading-none">{transcriptError}</p>}
                    </div>

                    {/* Receipt Attachment File */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-300 block">2. Bank Transfer Payment Receipt Proof (.jpg, .png, .pdf)</span>
                      
                      <div 
                        onClick={() => receiptInputRef.current?.click()}
                        className="group relative h-40 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all overflow-hidden"
                      >
                        <input
                          id="file-receipt-hidden"
                          type="file"
                          ref={receiptInputRef}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleReceiptChange(e.target.files[0]);
                            }
                          }}
                          accept="image/*,.pdf"
                          className="hidden"
                        />

                        {receiptPreview ? (
                          <div className="absolute inset-0 w-full h-full flex flex-col bg-[#1E293B] p-2">
                            {receiptPreview === 'pdf' ? (
                              <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
                                <FileText size={40} className="text-rose-400" />
                                <span className="text-[10px] text-slate-350 truncate max-w-[150px] font-medium mt-1">{receiptFile?.name}</span>
                              </div>
                            ) : (
                              <img src={receiptPreview} alt="Receipt preview" className="w-full h-full object-contain rounded-lg" />
                            )}
                            
                            {/* Actions on overlay hover */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg animate-fade-in">
                              <span className="bg-[#6366F1] px-3 py-1.5 rounded-full text-[10px] text-white font-bold shadow-md">Replace File</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 flex flex-col items-center text-slate-400">
                            <Upload size={24} className="group-hover:text-indigo-400 transition-colors" />
                            <p className="text-xs font-semibold text-slate-300">Click or Drag Receipt Screenshot</p>
                            <p className="text-[9px] text-slate-500 leading-tight">PNG, JPG, WEBP, or PDF up to 5MB</p>
                          </div>
                        )}

                        {receiptUploading && (
                          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 animate-fade-in">
                            <Loader2 size={18} className="animate-spin text-indigo-400 mb-1" />
                            <span className="text-[10px] font-semibold text-slate-300">Uploading and compressing...</span>
                            <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 text-left">
                              <div className="bg-[#6366F1] h-full rounded-full transition-all" style={{ width: `${receiptPercent}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {receiptUrl && <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">✔ Upload complete</p>}
                      {receiptError && <p className="text-[10px] text-rose-400 font-medium leading-none">{receiptError}</p>}
                    </div>

                  </div>
                </div>

                {generalError && (
                  <div className="rounded-xl border border-rose-950 bg-rose-950/20 p-3 text-xs text-rose-400 leading-relaxed">
                    ⚠️ {generalError}
                  </div>
                )}

                {/* Submit trigger button */}
                <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setActiveTab('welcome')}
                    type="button"
                    className="px-5 py-3 rounded-xl border border-slate-800 text-sm font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-registration-form-btn"
                    type="submit"
                    disabled={formSubmitting || transcriptUploading || receiptUploading}
                    className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#6366F1] text-white font-semibold text-sm shadow-md hover:bg-[#4F46E5] disabled:opacity-40 transition-all cursor-pointer"
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin animate-spin" />
                        <span>Submitting Records...</span>
                      </>
                    ) : (
                      <span>Complete Submission</span>
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}
        </motion.div>
      )}

      {/* Section 2: Application Search Portal */}
      {activeTab === 'status' && (
        <motion.div
          id="student-lookup-portal"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Back handle */}
          <button 
            onClick={() => {
              setActiveTab('welcome');
              setHasSearched(false);
              setSearchResults(null);
              setSearchQuery('');
            }} 
            className="text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            ← Back to Student Hub
          </button>

          <div className="bg-[#1E293B] rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl font-sans">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Search Student Record</h2>
              <p className="text-xs text-slate-400 font-sans">Query student applications on file using full name matches.</p>
            </div>

            <form onSubmit={handleStatusSearch} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Search size={16} />
                </span>
                <input
                  id="status-lookup-name-input"
                  type="text"
                  required
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter full name of applicant (e.g. Nahom)..."
                  className="w-full text-sm rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-3 outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-950 text-white text-ellipsis"
                />
              </div>
              <button
                id="search-lookup-submit"
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#6366F1] text-white font-semibold text-sm shadow-md hover:bg-[#4F46E5] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Search Records</span>
              </button>
            </form>

            {/* Results */}
            {hasSearched && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Search Results ({searchResults?.length || 0})</h3>
                
                {searchResults && searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((match, mIdx) => (
                      <div 
                        key={mIdx}
                        className="rounded-xl border border-slate-800 p-5 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-white text-base">{match.full_name}</p>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                            <span>Promoted to: <strong className="text-slate-200 font-semibold">Grade {match.promoted_grade}</strong></span>
                            <span>•</span>
                            <span>Average Score: <strong className="text-slate-200 font-mono font-semibold">{match.average}%</strong></span>
                            <span>•</span>
                            <span>Method: <strong className="text-slate-200 uppercase font-semibold">{match.payment_method}</strong></span>
                          </div>
                        </div>

                        {/* Status elements */}
                        <div className="flex items-center gap-3">
                          
                          {match.status === 'Pending Review' && (
                            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center gap-2 text-xs text-amber-400 max-w-sm">
                              <Clock size={16} className="text-amber-400 shrink-0" />
                              <div>
                                <p className="font-bold uppercase tracking-wider text-[10px]">Review Is Pending</p>
                                <p className="text-[10px] text-amber-300 leading-snug mt-0.5">Certified Transcripts and Bank payment proofs are being analyzed.</p>
                              </div>
                            </div>
                          )}

                          {match.status === 'Rejected' && (
                            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 flex gap-2 text-xs text-rose-400 max-w-sm">
                              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                              <div>
                                <p className="font-bold uppercase tracking-wider text-[10px]">Application Rejected</p>
                                <p className="text-[10px] text-rose-300 font-sans leading-normal mt-1 border-t border-rose-500/10 pt-1">
                                  <strong>Reason:</strong> {match.rejection_reason || "Certified files did not match criteria."}
                                </p>
                              </div>
                            </div>
                          )}

                          {match.status === 'Approved' && (
                            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex gap-3 text-xs text-emerald-400 max-w-sm">
                              <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <p className="font-bold uppercase tracking-wider text-[9px] text-emerald-400">Admission Approved</p>
                                <p className="text-[10px] text-slate-350 font-sans leading-snug">Credentials verified successfully!</p>
                                
                                <div className="pt-2">
                                  {match.class_assignment ? (
                                    <div className="inline-flex flex-col rounded-lg bg-[#6366F1] text-white px-3 py-1.5 leading-none shadow-md">
                                      <span className="text-[8px] uppercase tracking-widest text-indigo-200">Allocated Class</span>
                                      <span className="text-sm font-extrabold tracking-tight mt-0.5">{match.class_assignment}</span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase">
                                      Class Allocation Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 rounded-xl bg-slate-900 border border-slate-800 p-4">
                    <p className="text-sm font-semibold text-slate-300">No student profile found for &quot;{searchQuery}&quot;</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Verify that you entered the correct registered name or launch a new online admission form.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
}

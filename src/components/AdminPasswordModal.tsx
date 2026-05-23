import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Eye, EyeOff, X, Loader2, Lock } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminPasswordModal({ isOpen, onClose, onSuccess }: AdminPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPassword('');
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Incorrect Password. Please try again.');
      }
    } catch {
      setError('Connection failed. Server might be launching, please wait.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="password-modal-root" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            id="password-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
          />

          {/* Modal content */}
          <motion.div
            id="password-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#1E293B] p-6 shadow-2xl"
          >
            {/* Close button */}
            <button
              id="password-modal-close-btn"
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-505 border-indigo-500/10">
                <Shield size={22} className="stroke-[2px]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Admin Account Access</h3>
                <p className="text-xs text-slate-400 font-sans">Authorized Registrar and Principal verify credentials</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-350 tracking-wider mb-2 uppercase">
                  Enter Admin Security Key
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                    <Lock size={16} />
                  </span>
                  <input
                    id="admin-security-pass-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-slate-650 focus:border-indigo-500 focus:bg-slate-900/40 text-white"
                    autoFocus
                  />
                  <button
                    id="hide-reveal-password-toggle"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  id="password-error-alert"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-400"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  id="cancel-pass-modal-btn"
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white transition-colors py-3 text-center text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  id="submit-pass-modal-btn"
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#6366F1] py-3 text-center text-sm font-medium text-white shadow-md hover:bg-[#4F46E5] focus:ring-2 focus:ring-[#6366F1]/50 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Authenticate</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

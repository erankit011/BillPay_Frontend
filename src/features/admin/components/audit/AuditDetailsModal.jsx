import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  User,
  Target,
  Globe,
  Clock,
  Copy,
  Check,
  FileCode,
  Laptop,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AuditCategoryBadge from './AuditCategoryBadge';

const formatActionName = (action) => {
  if (!action) return 'Unknown Action';
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const AuditDetailsModal = ({ isOpen, log, onClose }) => {
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text));
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const dateObj = log.createdAt ? new Date(log.createdAt) : null;
  const formattedDate = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {formatActionName(log.action)}
                </h3>
                <AuditCategoryBadge category={log.actionCategory} size="xs" />
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Audit ID: {log._id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Actor Card */}
            <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Executing Actor</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    {log.actor?.name || 'Platform System'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                    {log.actor?.role || 'SYSTEM'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{log.actor?.email || 'N/A'}</p>
                <p className="text-[11px] text-gray-400 font-mono truncate">
                  Actor ID: {log.actor?._id || 'N/A'}
                </p>
              </div>
            </div>

            {/* Target Card */}
            <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Target className="w-3.5 h-3.5 text-emerald-500" />
                <span>Target Resource</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    {log.targetName || log.targetType || 'System Platform'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                    {log.targetType || 'General'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-mono truncate">
                  Target ID: {log.targetId || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Network & Device Metadata */}
          <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>Network & Client Fingerprint</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">IP Address</span>
                <span className="font-mono font-medium text-gray-800 bg-white px-2 py-1 rounded border border-gray-200 inline-block">
                  {log.ipAddress || '127.0.0.1'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Timestamp (IST)</span>
                <div className="flex items-center gap-1.5 font-medium text-gray-800">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-400 block mb-0.5">Client User-Agent</span>
                <div className="flex items-start gap-1.5 text-gray-600 bg-white p-2 rounded border border-gray-200 font-mono text-[11px] break-all">
                  <Laptop className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span>{log.userAgent || 'Unknown User-Agent'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Details / Payload Diff */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <FileCode className="w-4 h-4 text-purple-500" />
                <span>Event Mutation Details & Payload</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(log.details || {}, 'details')}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                {copiedKey === 'details' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto text-xs font-mono text-emerald-400 shadow-inner max-h-60">
              <pre className="whitespace-pre-wrap break-all">
                {log.details && Object.keys(log.details).length > 0
                  ? JSON.stringify(log.details, null, 2)
                  : '{\n  "status": "No additional payload properties recorded"\n}'}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => copyToClipboard(log._id, 'id')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            {copiedKey === 'id' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Copy Log ID</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditDetailsModal;

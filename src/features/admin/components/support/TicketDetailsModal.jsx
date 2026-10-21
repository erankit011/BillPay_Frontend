import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Store,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Send,
  Save,
  MessageCircle,
  Shield,
  Copy,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TicketStatusBadge from './TicketStatusBadge';
import TicketPriorityBadge from './TicketPriorityBadge';

const CATEGORIES = [
  { value: 'GENERAL', label: 'General Inquiry' },
  { value: 'BILLING', label: 'Billing & Payments' },
  { value: 'TECHNICAL', label: 'Technical Issue' },
  { value: 'ACCOUNT', label: 'Account & Login' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
];

const TicketDetailsModal = ({
  isOpen,
  ticket,
  onClose,
  onUpdateTicket,
  onDeleteTicket,
}) => {
  const [status, setStatus] = useState(ticket?.status || 'OPEN');
  const [priority, setPriority] = useState(ticket?.priority || 'MEDIUM');
  const [category, setCategory] = useState(ticket?.category || 'GENERAL');
  const [adminNotes, setAdminNotes] = useState(ticket?.adminNotes || '');
  const [adminReply, setAdminReply] = useState(ticket?.adminReply || '');
  const [saving, setSaving] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (!isOpen || !ticket) return;
    setStatus(ticket.status || 'OPEN');
    setPriority(ticket.priority || 'MEDIUM');
    setCategory(ticket.category || 'GENERAL');
    setAdminNotes(ticket.adminNotes || '');
    setAdminReply(ticket.adminReply || '');
  }, [ticket, isOpen]);

  const handleCopyEmail = () => {
    if (ticket.email) {
      navigator.clipboard.writeText(ticket.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
      toast.success('Email copied to clipboard');
    }
  };

  const handleSave = async (quickStatus = null) => {
    setSaving(true);
    try {
      const payload = {
        status: quickStatus || status,
        priority,
        category,
        adminNotes,
        adminReply,
      };

      if (quickStatus) {
        setStatus(quickStatus);
      }

      await onUpdateTicket(ticket._id, payload);
      toast.success(
        quickStatus === 'RESOLVED'
          ? 'Ticket marked as resolved'
          : 'Ticket updated successfully'
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ticket #${ticket.ticketId}? This action cannot be undone.`
      )
    ) {
      try {
        await onDeleteTicket(ticket._id);
        toast.success('Ticket deleted');
        onClose();
      } catch (err) {
        toast.error('Failed to delete ticket');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay overscroll-contain"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal Container: Bottom Sheet on Mobile, Centered on sm+ */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div
          className="relative w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-xl border border-gray-200 animate-modal-content overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] pointer-events-auto shadow-2xl sm:shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0 bg-gray-50/80">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-base font-semibold text-gray-900 tracking-tight">
                #{ticket.ticketId}
              </span>
              <TicketStatusBadge status={status} />
              <TicketPriorityBadge priority={priority} />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200 ml-auto"
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Info Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Submitted: {formatDate(ticket.createdAt)}</span>
            </div>
            {ticket.resolvedAt && (
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Resolved {formatDate(ticket.resolvedAt)}{' '}
                  {ticket.resolvedBy?.name ? `by ${ticket.resolvedBy.name}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Requester Identity Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Requester Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2.5 text-gray-800">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-900">{ticket.name}</span>
                {ticket.user && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Registered Merchant
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <a
                  href={`mailto:${ticket.email}?subject=Re: [${ticket.ticketId}] ${ticket.subject}`}
                  className="text-[#093C5D] hover:underline truncate"
                >
                  {ticket.email}
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                  title="Copy email"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {ticket.phone && (
                <div className="flex items-center gap-2.5 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <a
                    href={`tel:${ticket.phone}`}
                    className="text-gray-700 hover:text-[#093C5D]"
                  >
                    {ticket.phone}
                  </a>
                </div>
              )}

              {(ticket.shopName || ticket.user?.businessName) && (
                <div className="flex items-center gap-2.5 text-gray-700">
                  <Store className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-800 font-medium">
                    Store: {ticket.shopName || ticket.user?.businessName}
                  </span>
                  {ticket.user?.subscriptionPlan && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {ticket.user.subscriptionPlan}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message Block */}
          <div className="bg-gray-50/60 rounded-lg border border-gray-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Inquiry Subject
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                {ticket.category}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 tracking-tight">
              {ticket.subject}
            </h3>
            <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-lg border border-gray-200">
              {ticket.message}
            </div>
          </div>

          {/* Action Settings: Category, Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2 bg-white focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-gray-500" />
              <span>Internal Admin Notes (Private to Team)</span>
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this user, debugging status, or next steps..."
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Official Admin Reply */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-[#093C5D]" />
              <span>Admin Resolution & Reply Log</span>
            </label>
            <textarea
              rows={3}
              value={adminReply}
              onChange={(e) => setAdminReply(e.target.value)}
              placeholder="Record the solution or response provided to the user..."
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] outline-none placeholder:text-gray-400 resize-none"
            />
          </div>
        </div>

        {/* Footer Toolbar */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded transition-colors border border-transparent hover:border-rose-200"
          >
            <Trash2 className="w-4 h-4" />
            Delete Ticket
          </button>

          <div className="flex items-center gap-2">
            {status !== 'RESOLVED' && status !== 'CLOSED' && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave('RESOLVED')}
                className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Resolve Ticket
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave()}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#093C5D] hover:bg-[#072C44] px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default TicketDetailsModal;

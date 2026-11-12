/**
 * QuickAddCustomer Component
 * Reusable inline customer creation drawer for POS billing and Voice workflows
 * Matches design system, labels, placeholders and typography from CustomerFormModal
 * Uses <div> container (NO nested <form>) and type="button" to prevent parent form submission
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const QuickAddCustomer = ({
  isOpen = false,
  onClose,
  onSuccess,
  initialName = '',
  isSpokenName = false,
  phoneInputRef: externalPhoneRef,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const internalPhoneRef = useRef(null);
  const nameInputRef = useRef(null);
  const activePhoneRef = externalPhoneRef || internalPhoneRef;

  const [name, setName] = useState(initialName || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Synchronize initialName when component mounts or initialName changes
  useEffect(() => {
    if (initialName) {
      setName(initialName);
    }
  }, [initialName]);

  // Auto-focus on appropriate input after drawer opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (initialName) {
          activePhoneRef.current?.focus();
        } else {
          nameInputRef.current?.focus();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialName, activePhoneRef]);

  const addCustomerMutation = useMutation({
    mutationFn: (newCust) => api.post('/customers', newCust),
    onSuccess: (res) => {
      const created = res.data?.data;
      // Optimistically update dropdown cache if present
      queryClient.setQueryData(['customers', 'dropdown'], (old) => {
        if (!Array.isArray(old)) return old;
        const exists = old.some((c) => String(c._id) === String(created?._id));
        return exists ? old : [...old, created];
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      toast.success(t('Customer created successfully'));
      setFieldErrors({});
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      if (onSuccess) {
        onSuccess(created);
      }
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || err.message || t('Failed to create customer');
      setFieldErrors((prev) => ({ ...prev, server: errMsg }));
      toast.error(errMsg);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }

    const errors = {};
    const trimmedName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

    if (!trimmedName) {
      errors.name = t('Name is required');
    }

    if (!cleanPhone) {
      errors.phone = t('Phone is required');
    } else if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = t('Enter a valid 10-digit number');
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = t('Please provide a valid email address');
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name) {
        nameInputRef.current?.focus();
      } else if (errors.phone) {
        activePhoneRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});
    addCustomerMutation.mutate({
      name: trimmedName,
      phone: cleanPhone,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
    });
  };

  const handleCancel = (e) => {
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    setFieldErrors({});
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    if (onClose) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-[#F0F2F6] border border-[#DCE1EA] rounded-xl p-3.5 sm:p-4 mb-3.5 animate-fade-in shadow-none">
      {/** Drawer Header */}
      <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-3 border-b border-[#DCE1EA]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EEF0FB] text-[#4338CA] flex items-center justify-center shrink-0 border border-[#D8DCF5]">
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-[13px] font-semibold text-[#191E2B] leading-tight">
              {t('Add New Customer')}
            </h4>
            <p className="text-[11px] font-medium text-[#757F94] leading-tight mt-0.5">
              {t('Add customer details to register in your Khata directory')}
            </p>
          </div>
        </div>
        {isSpokenName && (
          <span className="text-[11px] font-medium text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A] shrink-0">
            {t('Spoken Name Auto-Filled')}
          </span>
        )}
      </div>

      {/** Server-level error notification */}
      {fieldErrors.server && (
        <div className="bg-[#FFF1F2] border-l-[3px] border-[#E11D48] p-2 rounded-r-md mb-3 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />
          <p className="text-[11px] sm:text-xs font-medium text-[#B91C1C] leading-tight">
            {fieldErrors.server}
          </p>
        </div>
      )}

      {/** Form Fields (Standard div layout to prevent nested form submissions) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        <div>
          <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
            {t('Full Name')} <span className="text-[#B91C1C]">*</span>
          </label>
          <input
            ref={nameInputRef}
            type="text"
            placeholder={t('Enter Full Name')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
            }}
            onKeyDown={handleKeyDown}
            className={`block w-full rounded-lg border bg-[#FBFBFC] px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none ${
              fieldErrors.name
                ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
            }`}
          />
          {fieldErrors.name && (
            <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-none pt-[1px]">{fieldErrors.name}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
            {t('Phone Number')} <span className="text-[#B91C1C]">*</span>
          </label>
          <input
            ref={activePhoneRef}
            type="tel"
            maxLength={10}
            placeholder={t('Enter Phone Number')}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
              if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
            }}
            onKeyDown={handleKeyDown}
            className={`block w-full rounded-lg border bg-[#FBFBFC] px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none ${
              fieldErrors.phone
                ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
            }`}
          />
          {fieldErrors.phone && (
            <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-none pt-[1px]">{fieldErrors.phone}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
            {t('Email')}
          </label>
          <input
            type="email"
            placeholder={t('Enter Email Address')}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
            }}
            onKeyDown={handleKeyDown}
            className={`block w-full rounded-lg border bg-[#FBFBFC] px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none ${
              fieldErrors.email
                ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
            }`}
          />
          {fieldErrors.email && (
            <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-none pt-[1px]">{fieldErrors.email}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
            {t('Address')}
          </label>
          <input
            type="text"
            placeholder={t('Enter Address')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full rounded-lg border border-[#DCE1EA] bg-[#FBFBFC] px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
          />
        </div>
      </div>

      {/** Action Buttons: type="button" strictly prevents submitting enclosing forms */}
      <div className="flex justify-end gap-2 mt-3.5 pt-2.5 border-t border-[#DCE1EA]">
        <button
          type="button"
          onClick={handleCancel}
          className="cursor-pointer h-8 sm:h-9 px-3.5 sm:px-4 flex items-center justify-center text-xs font-medium text-[#4E5668] hover:bg-[#EBEEF4] rounded-lg transition-colors"
        >
          {t('Cancel')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={addCustomerMutation.isPending}
          className="cursor-pointer h-8 sm:h-9 px-4 sm:px-5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg transition-colors disabled:opacity-50 shadow-none active:scale-95"
        >
          {addCustomerMutation.isPending ? t('Saving...') : t('Save Customer')}
        </button>
      </div>
    </div>
  );
};

export default QuickAddCustomer;

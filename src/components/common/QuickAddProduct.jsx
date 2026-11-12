/**
 * QuickAddProduct Component
 * Reusable inline product creation drawer for POS billing and Voice workflows
 * Matches design system, labels, placeholders and typography from ProductFormModal
 * Uses <div> container (NO nested <form>) and type="button" to prevent parent form submission
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const QuickAddProduct = ({
  isOpen = false,
  onClose,
  onSuccess,
  initialName = '',
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [name, setName] = useState(initialName || '');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const nameInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const stockInputRef = useRef(null);

  useEffect(() => {
    if (initialName) {
      setName(initialName);
    }
  }, [initialName]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (initialName) {
          priceInputRef.current?.focus();
        } else {
          nameInputRef.current?.focus();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialName]);

  const addProductMutation = useMutation({
    mutationFn: (newProd) => api.post('/products', newProd),
    onSuccess: (res) => {
      const created = res.data?.data;
      // Optimistically update dropdown cache if present
      queryClient.setQueryData(['products', 'dropdown'], (old) => {
        if (!Array.isArray(old)) return old;
        const exists = old.some((p) => String(p._id) === String(created?._id));
        return exists ? old : [...old, created];
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast.success(t('Product created successfully'));
      setFieldErrors({});
      setName('');
      setPrice('');
      setStock('');
      if (onSuccess) {
        onSuccess(created);
      }
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || err.message || t('Failed to create product');
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

    if (!trimmedName) {
      errors.name = t('Name is required');
    }

    if (price === '' || price === null || price === undefined || String(price).trim() === '') {
      errors.price = t('Price is required');
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      errors.price = t('Price cannot be negative');
    }

    if (stock === '' || stock === null || stock === undefined || String(stock).trim() === '') {
      errors.stock = t('Stock is required');
    } else if (isNaN(Number(stock)) || Number(stock) < 0) {
      errors.stock = t('Stock cannot be negative');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name) {
        nameInputRef.current?.focus();
      } else if (errors.price) {
        priceInputRef.current?.focus();
      } else if (errors.stock) {
        stockInputRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});
    addProductMutation.mutate({
      name: trimmedName,
      price: Number(price),
      stock: Number(stock),
    });
  };

  const handleCancel = (e) => {
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    setFieldErrors({});
    setName('');
    setPrice('');
    setStock('');
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
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-[13px] font-semibold text-[#191E2B] leading-tight">
              {t('Add New Product')}
            </h4>
            <p className="text-[11px] font-medium text-[#757F94] leading-tight mt-0.5">
              {t('Add a new item directly to your inventory')}
            </p>
          </div>
        </div>
        {initialName && (
          <span className="text-[11px] font-medium text-[#4338CA] bg-[#EEF0FB] px-2 py-0.5 rounded border border-[#D8DCF5] shrink-0">
            {t('Auto-Filled')}
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
        <div className="sm:col-span-2">
          <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
            {t('Product Name')} <span className="text-[#B91C1C]">*</span>
          </label>
          <input
            ref={nameInputRef}
            type="text"
            placeholder="e.g. Atta 5kg"
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
            {t('Price (₹)')} <span className="text-[#B91C1C]">*</span>
          </label>
          <input
            ref={priceInputRef}
            type="number"
            placeholder="0"
            min="0"
            step="any"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
            }}
            onKeyDown={handleKeyDown}
            className={`block w-full rounded-lg border bg-[#FBFBFC] px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none ${
              fieldErrors.price
                ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
            }`}
          />
          {fieldErrors.price && (
            <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-none pt-[1px]">{fieldErrors.price}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
            {t('Stock Qty')} <span className="text-[#B91C1C]">*</span>
          </label>
          <input
            ref={stockInputRef}
            type="number"
            placeholder="0"
            min="0"
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              if (fieldErrors.stock) setFieldErrors((prev) => ({ ...prev, stock: '' }));
            }}
            onKeyDown={handleKeyDown}
            className={`block w-full rounded-lg border bg-[#FBFBFC] px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-[#191E2B] placeholder:text-[#9AA4B8] transition-colors duration-200 shadow-none focus:outline-none ${
              fieldErrors.stock
                ? 'border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C]'
                : 'border-[#DCE1EA] focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]'
            }`}
          />
          {fieldErrors.stock && (
            <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-none pt-[1px]">{fieldErrors.stock}</span>
            </p>
          )}
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
          disabled={addProductMutation.isPending}
          className="cursor-pointer h-8 sm:h-9 px-4 sm:px-5 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg transition-colors disabled:opacity-50 shadow-none active:scale-95"
        >
          {addProductMutation.isPending ? t('Saving...') : t('Save Product')}
        </button>
      </div>
    </div>
  );
};

export default QuickAddProduct;

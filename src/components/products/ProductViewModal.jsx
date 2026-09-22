import React, { useEffect } from 'react';
import { X, Package, Clock, IndianRupee, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/dateUtils';

// Product icon/emoji mapping
const getProductIcon = (name) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('atta') || nameLower.includes('flour')) return '🌾';
  if (nameLower.includes('oil')) return '💧';
  if (nameLower.includes('tea') || nameLower.includes('coffee') || nameLower.includes('premium')) return '☕';
  if (nameLower.includes('rice') || nameLower.includes('basmati')) return '🍚';
  if (nameLower.includes('soap') || nameLower.includes('dish') || nameLower.includes('detergent')) return '🧼';
  if (nameLower.includes('sugar')) return '🍬';
  if (nameLower.includes('salt')) return '🧂';
  if (nameLower.includes('milk')) return '🥛';
  if (nameLower.includes('cooking')) return '💧';
  return '📦';
};

const ProductViewModal = ({ isOpen, onClose, product }) => {
  const { t } = useTranslation();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: t('Out of Stock'), color: 'bg-red-50 text-red-700 border-red-200' };
    if (stock < 20) return { label: t('Low Stock'), color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { label: t('In Stock'), color: 'bg-green-50 text-green-700 border-green-200' };
  };

  const stockStatus = getStockStatus(product.stock);
  const updatedDate = formatDate(product.updatedAt || product.createdAt);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
        onClick={onClose}
      />

      {/* Mobile: bottom sheet | sm+: centered modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 flex sm:items-center sm:justify-center sm:px-4 sm:py-8 z-50 pointer-events-none">
        <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-200 animate-modal-content overflow-hidden pointer-events-auto shadow-2xl sm:shadow-xl">
          
          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-gray-100 flex-shrink-0 bg-white">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              {t('Product Details')}
            </h3>
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0 !min-h-[32px] !min-w-[32px] border border-gray-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 md:p-5 overflow-y-auto flex-1 bg-white">
            <div className="flex flex-col items-center mb-4 sm:mb-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] border border-gray-200 bg-white mb-3 flex-shrink-0">
                <div className="w-full h-full rounded-full flex items-center justify-center text-3xl sm:text-4xl bg-gray-50 text-[#093C5D]">
                  {getProductIcon(product.name)}
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#093C5D] text-center leading-tight mb-1">{product.name}</h2>
              <div className="flex items-center text-xs text-gray-500 font-medium">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {updatedDate}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Product Info */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  <div className="flex items-center px-3.5 py-3 sm:px-4 sm:py-3.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mr-3 shrink-0">
                      <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mb-0.5">{t('Price')}</p>
                      <p className="text-sm sm:text-base font-semibold text-[#093C5D] truncate">{formatCurrency(product.price)}</p>
                    </div>
                  </div>

                  <div className="flex items-center px-3.5 py-3 sm:px-4 sm:py-3.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mr-3 shrink-0">
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mb-0.5">{t('Stock Quantity')}</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{product.stock} Units</p>
                    </div>
                  </div>

                  <div className="flex items-center px-3.5 py-3 sm:px-4 sm:py-3.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-50 text-green-600 border border-green-100 flex items-center justify-center mr-3 shrink-0">
                      <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 mb-0.5">{t('Total Value (Price × Stock)')}</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{formatCurrency(product.price * product.stock)}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductViewModal;

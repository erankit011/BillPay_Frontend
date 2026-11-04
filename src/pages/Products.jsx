/**
 * Merchant Inventory & Catalog Management Page
 * Handles item creation, price updates, stock alerts, thermal PDF inventory report, and barcode lookups.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Search, Edit, Trash2, Download, PlusCircle, Wallet, Box, AlertTriangle, Loader2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { generateInventoryPDF } from '../utils/generateInventoryPDF';
import ProductFormModal from '../components/products/ProductFormModal';
import ProductViewModal from '../components/products/ProductViewModal';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadMoreButton from '../components/common/LoadMoreButton';
import SwirlingLoader from '../components/common/SwirlingLoader';
import toast from 'react-hot-toast';

import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';

/**
 * Product Item Category Emoji Resolution
 * Derives visual icon identifier based on common product keywords
 */
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

/**
 * Products Component
 */
const Products = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const filterStock = searchParams.get('filter') || 'All';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [editingProduct, setEditingProduct] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  const queryClient = useQueryClient();

  /**
   * Modal Scroll Lock Effect
   * Prevents background document scrolling when interactive dialogs are mounted
   */
  useEffect(() => {
    if (isModalOpen || deleteModalOpen || viewProduct) {
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
  }, [isModalOpen, deleteModalOpen, viewProduct]);

  const setFilterStock = (value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === 'All') next.delete('filter');
      else next.set('filter', value);
      return next;
    }, { replace: true });
  };

  /**
   * Debounced Search Synchronization
   * Updates URL query parameter with 500ms delay to prevent rapid query refetches
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (searchTerm) next.set('search', searchTerm);
        else next.delete('search');
        return next;
      }, { replace: true });
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, setSearchParams]);

  /**
   * History Navigation URL Sync
   * Restores search field state when traversing browser history forward or backward
   */
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== debouncedSearch) {
      setSearchTerm(urlSearch);
      setDebouncedSearch(urlSearch);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [searchParams]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['products', debouncedSearch, filterStock],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/products?page=${pageParam}&limit=15&search=${encodeURIComponent(debouncedSearch)}&filterStock=${encodeURIComponent(filterStock)}`);
      return res.data.data;
    },
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
  
  const [formError, setFormError] = useState(null);

  const createMutation = useMutation({
    mutationFn: (newProduct) => api.post('/products', newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
      toast.success(t('Product added successfully!'));
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      const msg = backendMessage ? t(backendMessage) : t('Failed to add product. Please try again.');
      setFormError(msg);
      toast.error(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedProduct) => api.put(`/products/${updatedProduct.id}`, updatedProduct.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
      toast.success(t('Product updated successfully!'));
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      const msg = backendMessage ? t(backendMessage) : t('Failed to update product. Please try again.');
      setFormError(msg);
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previousData = queryClient.getQueryData(['products', debouncedSearch, filterStock]);

      queryClient.setQueryData(['products', debouncedSearch, filterStock], (old) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: (page.data || []).filter((p) => p._id !== id),
            totalCount: Math.max(0, (page.totalCount || 1) - 1),
          })),
        };
      });

      setDeleteModalOpen(false);
      setProductToDelete(null);

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['products', debouncedSearch, filterStock], context.previousData);
      }
      toast.error(err.response?.data?.message || t('Failed to delete product.'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onSuccess: () => {
      toast.success(t('Product deleted successfully!'));
    }
  });

  const handleDelete = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete._id);
    }
  };

  const onSubmit = (formData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError(null);
  };

  const products = useMemo(() => data?.pages?.flatMap(page => page.data || []) || [], [data?.pages]);

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      const res = await api.get(`/products?limit=10000&search=${encodeURIComponent(debouncedSearch)}&filterStock=${encodeURIComponent(filterStock)}`);
      const settingsRes = await api.get(`/settings`);
      const allProducts = res.data.data?.data || res.data.data || [];
      generateInventoryPDF(allProducts, settingsRes.data.data, t, formatDate);
    } catch (error) {
      console.error("Error generating inventory PDF:", error);
      toast.error(t('Failed to download inventory report.'));
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Backend Aggregated Inventory Statistics
   * Derives catalog valuation and stock tier counts from initial page payload
   */
  const firstPage = data?.pages?.[0];
  const totalCount = firstPage?.totalCount || 0;
  const stats = {
    totalValue: firstPage?.totalValue || 0,
    activeItems: firstPage?.activeItems || 0,
    inStockItems: firstPage?.inStockItems || 0,
    lowStockItems: firstPage?.lowStockItems || 0,
    outOfStockItems: firstPage?.outOfStockItems || 0,
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      {/**
       * Inventory Page Header
       * Primary header with catalog description and action buttons
       */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B]">{t('Inventory & Products')}</h1>
          <p className="text-[#4E5668] text-xs sm:text-sm mt-1 sm:mt-1.5">{t('Manage your shop items, stock levels, and daily pricing.')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto mt-3 sm:mt-0">
          <button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="flex cursor-pointer bg-[#4338CA] hover:bg-[#3730A3] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
            )}
            {isDownloading ? t('Generating...') : t('Download PDF')}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden lg:flex cursor-pointer bg-[#4338CA] hover:bg-[#3730A3] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
            {t('Add Product')}
          </button>
        </div>
      </div>

      {/**
       * Inventory Analytics & Valuation Card
       * Displays total financial value of on-hand inventory and stock health counters
       */}
      <div className="w-full bg-[#FBFBFC] rounded-lg border border-[#DCE1EA] hover:border-[#DCE1EA] transition-all duration-200 overflow-hidden cursor-default mb-6 md:mb-8">

        {/**
         * Total Inventory Valuation Section
         * Cumulative purchase or sales value of entire stock
         */}
        <div className="p-4 md:p-5 xl:p-6 flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg p-[2px] border border-[#DCE1EA] bg-[#FBFBFC]">
            <div className="w-full h-full rounded-md flex items-center justify-center bg-[#F0F2F6] text-[#4338CA]">
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] md:text-xs xl:text-sm text-[#4E5668] mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('INVENTORY VALUE')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-[#191E2B] truncate">{formatCurrency(stats.totalValue)}</p>
            <p className="text-[10px] md:text-xs text-[#757F94] font-medium truncate mt-0.5">{t('Total Stock Value')}</p>
          </div>
        </div>

        {/**
         * Stock Level Breakdown Bar
         * Mini counters showing in-stock, low-stock, and out-of-stock items
         */}
        <div className="bg-[#F0F2F6] px-4 py-3 md:px-5 md:py-3.5 border-t border-[#E8ECF2] flex flex-wrap items-center gap-x-4 gap-y-2.5 sm:gap-x-6">
          <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#4338CA] shrink-0"></span><span className="text-[11px] sm:text-xs md:text-sm text-[#757F94] font-medium whitespace-nowrap">{t('Total Stock')}: <span className="font-semibold text-[#191E2B]">{stats.activeItems}</span></span></div>
          <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#0D7A57] shrink-0"></span><span className="text-[11px] sm:text-xs md:text-sm text-[#757F94] font-medium whitespace-nowrap">{t('In Stock')}: <span className="font-semibold text-[#191E2B]">{stats.inStockItems}</span></span></div>
          <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#B45309] shrink-0"></span><span className="text-[11px] sm:text-xs md:text-sm text-[#757F94] font-medium whitespace-nowrap">{t('Low Stock')}: <span className="font-semibold text-[#191E2B]">{stats.lowStockItems}</span></span></div>
          <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#B91C1C] shrink-0"></span><span className="text-[11px] sm:text-xs md:text-sm text-[#757F94] font-medium whitespace-nowrap">{t('Out of Stock')}: <span className="font-semibold text-[#191E2B]">{stats.outOfStockItems}</span></span></div>
        </div>

      </div>

      {/**
       * Stock Availability Filter Chips
       * Filters catalog by in-stock, low-stock, and exhausted stock items
       */}
      <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { label: 'All Stocks', value: 'All' },
          { label: 'In Stock', value: 'In Stock' },
          { label: 'Low Stock', value: 'Low Stock' },
          { label: 'Out of Stock', value: 'Out of Stock' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStock(filter.value)}
            className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${filterStock === filter.value
              ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-none'
              : 'bg-[#FBFBFC] text-[#4E5668] border-[#DCE1EA] hover:border-[#DCE1EA] hover:bg-[#F0F2F6] shadow-none'
              }`}
          >
            {t(filter.label)}
          </button>
        ))}
      </div>

      {/**
       * Inventory Search Bar
       * Instant keyword filter matching product name, barcode, and category
       */}
      <div className="flex flex-col w-full mb-3 sm:mb-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-[#9AA4B8]" />
          </div>
          <input
            type="text"
            placeholder={t("Search By Name & Barcode & Category")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-3 sm:pr-4 bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg text-[13px] sm:text-sm text-[#191E2B] placeholder-[#9AA4B8] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] transition-colors duration-200 shadow-none"
          />
        </div>
      </div>

      {/**
       * Product Catalog Listing
       * Renders responsive product list with desktop table and mobile cards
       */}
      <div className="bg-[#FBFBFC] md:border md:border-[#E8ECF2] md:rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <SwirlingLoader className="w-10 h-10 text-[#4338CA]" />
          </div>
        ) : isError ? (
          <div className="bg-[#FBFBFC] rounded-lg border border-red-200 md:border-none p-8 md:p-12 text-center text-[#B91C1C]">
            <p className="font-medium text-sm md:text-base">{t('Failed to load products.')}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-[#FBFBFC] rounded-lg border border-[#DCE1EA] md:border-none p-8 md:p-12 text-center text-[#757F94]">
            <Box className="w-12 h-12 md:w-16 md:h-16 text-[#CBD2E0] mx-auto mb-3 md:mb-4" />
            <p className="font-medium text-sm md:text-base">{t('No products found.')}</p>
          </div>
        ) : (
          <div>
            {/**
             * Desktop Product Table View
             * Tabular catalog layout for wide desktop displays
             */}
            <div className="hidden md:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full min-w-[900px] whitespace-nowrap">
                <thead className="bg-[#F0F2F6] border-b border-[#DCE1EA]">
                  <tr>
                    <th className="w-[35%] px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-[#757F94] uppercase tracking-wider">{t('Product Details')}</th>
                    <th className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-[#757F94] uppercase tracking-wider">{t('Price')}</th>
                    <th className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-[#757F94] uppercase tracking-wider">{t('Stock Status')}</th>
                    <th className="w-[25%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-[#757F94] uppercase tracking-wider">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8ECF2]">
                  {products.map((product, index) => (
                    <tr key={product._id} className="hover:bg-[#F4F6FA] transition-colors">
                      <td className="w-[35%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div
                            onClick={(e) => { e.stopPropagation(); setViewProduct(product); }}
                            className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg p-[2px] border border-[#DCE1EA] bg-[#FBFBFC] flex-shrink-0 cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                            title={t('View Product')}
                          >
                            <div className="w-full h-full rounded-md flex items-center justify-center text-xl lg:text-2xl bg-[#F0F2F6] text-[#4338CA]">
                              {getProductIcon(product.name)}
                            </div>
                          </div>
                          <div className="min-w-0 flex flex-col justify-center">
                            <span className="text-sm lg:text-[15px] font-semibold text-[#4338CA] truncate block mb-0.5">{product.name}</span>
                            <span className="text-[10px] sm:text-[11px] text-[#757F94] font-medium inline-flex items-center whitespace-nowrap gap-1 leading-none">
                              <Clock className="w-3 h-3 shrink-0 -translate-y-[1px]" />
                              <span>{formatDate(product.updatedAt || product.createdAt)}</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <span className="text-sm lg:text-base font-semibold text-[#4338CA]">
                          {formatCurrency(product.price)}
                        </span>
                      </td>
                      <td className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide text-center ${product.stock === 0
                          ? 'bg-[#FFF1F2] text-[#B91C1C] border border-[#FECDD3]'
                          : product.stock < 20
                            ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                            : 'bg-[#ECFDF5] text-[#0D7A57] border border-[#A7F3D0]'
                          }`}>
                          {product.stock === 0 ? t('Out of Stock') : `${product.stock} ${t('in stock')}`}
                        </span>
                      </td>
                      <td className="w-[25%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2 lg:gap-3">
                          <button
                            onClick={() => openEditModal(product)}
                            className="cursor-pointer text-[#4E5668] font-medium bg-[#F0F2F6] border border-[#DCE1EA] hover:bg-[#F0F2F6] px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-[11px] lg:text-xs active:scale-95 whitespace-nowrap"
                            title={t('Edit')}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> {t('Edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="cursor-pointer text-[#B91C1C] font-medium bg-[#FFF1F2] border border-red-200 hover:bg-[#FEE2E2] px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-[11px] lg:text-xs active:scale-95 whitespace-nowrap"
                            title={t('Delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> {t('Delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/**
             * Mobile & Tablet Product Cards View
             * Touch-friendly card listing for handheld screens
             */}
            <div className="md:hidden flex flex-col gap-2.5">
              {products.map((product, index) => (
                <div
                  key={product._id}
                  className="bg-[#FBFBFC] border border-[#DCE1EA] rounded-lg p-3 sm:p-4 active:bg-[#F0F2F6] transition-colors duration-200"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        onClick={(e) => { e.stopPropagation(); setViewProduct(product); }}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg p-[2px] border border-[#DCE1EA] bg-[#FBFBFC] flex-shrink-0 cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                        title={t('View Product')}
                      >
                        <div className="w-full h-full rounded-md flex items-center justify-center text-xl sm:text-2xl bg-[#F0F2F6] text-[#4338CA]">
                          {getProductIcon(product.name)}
                        </div>
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <h3 className="text-sm sm:text-[15px] font-semibold text-[#4338CA] truncate leading-tight mb-0.5">{product.name}</h3>
                        <span className="text-[10px] sm:text-[11px] text-[#757F94] font-medium inline-flex items-center whitespace-nowrap gap-1 leading-none">
                          <Clock className="w-3 h-3 shrink-0 -translate-y-[1px]" />
                          <span>{formatDate(product.updatedAt || product.createdAt)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                      <p className="text-[13px] sm:text-[14px] font-semibold leading-tight text-[#4338CA]">
                        {formatCurrency(product.price)}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase sm:text-[10px] font-semibold ${product.stock === 0
                        ? 'bg-[#FFF1F2] text-[#B91C1C] border border-[#FECDD3]'
                        : product.stock <= 5
                          ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                          : 'bg-[#ECFDF5] text-[#0D7A57] border border-[#A7F3D0]'
                        }`}>
                        {product.stock === 0 ? t('Out of Stock') : `${product.stock} ${t('in stock')}`}
                      </span>
                    </div>
                  </div>

                  {/**
                   * Product Card Divider
                   * Separates product details from management actions
                   */}
                  <div className="border-t border-[#E8ECF2] my-2.5 sm:my-3"></div>

                  {/**
                   * Product Management Actions
                   * Edit and delete triggers for mobile card view
                   */}
                  <div className="flex items-center justify-end flex-nowrap gap-1.5 sm:gap-2 w-full mt-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <button
                      onClick={() => openEditModal(product)}
                      className="shrink-0 cursor-pointer text-[#4E5668] font-medium bg-[#F0F2F6] border border-[#DCE1EA] hover:bg-[#F0F2F6] px-2 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[10px] sm:text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> {t('Edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="shrink-0 cursor-pointer text-[#B91C1C] font-medium bg-[#FFF1F2] border border-red-200 hover:bg-[#FEE2E2] px-2 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[10px] sm:text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> {t('Delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/**
             * Pagination Load More Trigger
             * Fetches next chunk of inventory products
             */}
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              currentCount={products.length}
              totalCount={totalCount}
              label={t('products')}
            />
          </div>
        )}
      </div>

      {/**
       * Product Form Modal
       * Modal dialog for creating new product or editing existing item details
       */}
      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          editingProduct={editingProduct}
          onClose={closeModal}
          onSubmit={onSubmit}
          isPending={createMutation.isPending || updateMutation.isPending}
          serverError={formError}
        />
      )}

      {/**
       * Product Detail Preview Modal
       * Displays complete specification and barcode details for selected item
       */}
      <ProductViewModal
        isOpen={viewProduct !== null}
        onClose={() => setViewProduct(null)}
        product={viewProduct}
      />

      {/**
       * Product Deletion Confirmation Modal
       */}
      <ConfirmModal
        isOpen={deleteModalOpen && !!productToDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={t('Delete Product')}
        message={t('Are you sure you want to delete')}
        itemName={productToDelete?.name}
        isLoading={deleteMutation.isPending}
        confirmText={t('Yes, Delete')}
        variant="danger"
      />

      {/**
       * Mobile Floating Action Button
       * Quick-access button for adding new products on handheld devices
       */}
      {!isModalOpen && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="lg:hidden fixed bottom-6 sm:bottom-8 right-6 sm:right-8 bg-[#4338CA] hover:bg-[#3730A3] text-white px-5 sm:px-6 py-3.5 rounded-lg flex items-center transition-all z-[40] active:scale-95 group font-semibold text-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('Add Product')}
        </button>
      )}
    </div>
  );
};

export default Products;

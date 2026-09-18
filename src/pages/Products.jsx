import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Search, Edit, Trash2, Download, PlusCircle, Wallet, Box, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ProductFormModal from '../components/products/ProductFormModal';
import InfiniteScrollObserver from '../components/common/InfiniteScrollObserver';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
};

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

const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' year' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' month' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' day' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hour' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' min' + (Math.floor(interval) > 1 ? 's' : '') + ' ago';

  return 'Just now';
};

const Products = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const filterStock = searchParams.get('filter') || 'All';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [editingProduct, setEditingProduct] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const queryClient = useQueryClient();

  // Handle body scroll for modals
  useEffect(() => {
    if (isModalOpen || deleteModalOpen) {
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
  }, [isModalOpen, deleteModalOpen]);

  const setFilterStock = (value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === 'All') next.delete('filter');
      else next.set('filter', value);
      return next;
    }, { replace: true });
  };

  // Debounce search term and sync URL
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

  // Sync URL back to local state (for back/forward navigation)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== debouncedSearch) {
      setSearchTerm(urlSearch);
      setDebouncedSearch(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    staleTime: 1 * 60 * 1000, // Data is fresh for 1 min
    gcTime: 5 * 60 * 1000,   // Garbage collect (delete from memory) if unused for 5 mins
  });

  const createMutation = useMutation({
    mutationFn: (newProduct) => api.post('/products', newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedProduct) => api.put(`/products/${updatedProduct.id}`, updatedProduct.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setDeleteModalOpen(false);
      setProductToDelete(null);
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
  };

  const products = data?.pages?.flatMap(page => page.data || []) || [];

  const handleDownloadReport = () => {
    if (!products || products.length === 0) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(9, 60, 93);
    doc.text(t('Inventory Report'), 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t('Generated on')}: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = [t('Product Name'), t('Price (INR)'), t('Stock Qty'), t('Status'), t('Last Updated')];
    const tableRows = [];

    products.forEach(p => {
      const status = p.stock === 0 ? t('Out of Stock') : p.stock < 20 ? t('Low Stock') : t('In Stock');
      const date = new Date(p.updatedAt || p.createdAt).toLocaleDateString();
      const productData = [
        p.name,
        p.price.toString(),
        p.stock.toString(),
        status,
        date
      ];
      tableRows.push(productData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [9, 60, 93], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Get EXACT stats from the first page backend response
  const firstPage = data?.pages?.[0];
  const stats = {
    totalValue: firstPage?.totalValue || 0,
    activeItems: firstPage?.activeItems || 0,
    lowStockItems: firstPage?.lowStockItems || 0,
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Inventory & Products')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5">{t('Manage your shop items, stock levels, and daily pricing.')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden lg:flex cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Add Product')}
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('INVENTORY VALUE')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{formatCurrency(stats.totalValue)}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{t('Total stock value')}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Box className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('ACTIVE ITEMS')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{stats.activeItems}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{t('Products in catalog')}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[7.5rem] sm:min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-red-700 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden cursor-default">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg bg-red-50 flex items-center justify-center text-red-700 border border-red-100">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('LOW STOCK ALERT')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-red-700 truncate">{stats.lowStockItems}</p>
            <p className="text-[10px] md:text-xs text-red-700 font-medium truncate mt-0.5">{t('Items need restock')}</p>
          </div>
        </div>
      </div>

      {/* Search + Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0 group">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-[#093C5D] transition-colors" />
          </div>
          <input
            type="text"
            placeholder={t("Search products...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block h-10 sm:h-12 w-full pl-9 sm:pl-11 pr-3 sm:pr-4 bg-white border border-gray-200 rounded-lg text-[13px] sm:text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] transition-all shadow-none"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative sm:flex-shrink-0">
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="block h-10 sm:h-12 w-full sm:w-auto sm:min-w-[150px] px-3 sm:px-4 bg-white border border-gray-200 rounded-lg text-[13px] sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#093C5D]/20 focus:border-[#093C5D] transition-all cursor-pointer shadow-none"
          >
            <option value="All">{t('All Stocks')}</option>
            <option value="In Stock">{t('In Stock')}</option>
            <option value="Low Stock">{t('Low Stock')}</option>
            <option value="Out of Stock">{t('Out of Stock')}</option>
          </select>
        </div>
      </div>

      {/* Products List View */}
      <div className="bg-white md:border md:border-gray-100 md:rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#093C5D]"></div>
          </div>
        ) : isError ? (
          <div className="bg-white rounded-lg border border-red-200 md:border-none p-8 md:p-12 text-center text-red-700">
            <p className="font-medium text-sm md:text-base">{t('Failed to load products.')}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 md:border-none p-8 md:p-12 text-center text-gray-500">
            <Box className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
            <p className="font-medium text-sm md:text-base">{t('No products found.')}</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full min-w-[900px] whitespace-nowrap">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="w-[35%] px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Product Details')}</th>
                    <th className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Price')}</th>
                    <th className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Stock Status')}</th>
                    <th className="w-[25%] px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product, index) => (
                    <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="w-[35%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl lg:text-2xl flex-shrink-0 border border-gray-200">
                            {getProductIcon(product.name)}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs lg:text-sm font-semibold text-gray-900 truncate block">{product.name}</span>
                            <span className="text-[9px] lg:text-[10px] text-gray-400 font-medium truncate mt-0.5 block">
                              {t('Last updated')} {getTimeAgo(product.updatedAt || product.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <span className="text-sm lg:text-base font-semibold text-[#093C5D]">
                          {formatCurrency(product.price)}
                        </span>
                      </td>
                      <td className="w-[20%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide text-center ${product.stock === 0
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : product.stock < 20
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}>
                          {product.stock === 0 ? t('Out of Stock') : `${product.stock} ${t('in stock')}`}
                        </span>
                      </td>
                      <td className="w-[25%] px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2 lg:gap-3">
                          <button
                            onClick={() => openEditModal(product)}
                            className="cursor-pointer text-gray-700 font-medium bg-gray-50 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-[11px] lg:text-xs active:scale-95 whitespace-nowrap"
                            title={t('Edit')}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> {t('Edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="cursor-pointer text-red-700 font-medium bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg flex items-center justify-center transition-all text-[11px] lg:text-xs active:scale-95 whitespace-nowrap"
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

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-2.5">
              {products.map((product, index) => (
                <div
                  key={product._id}
                  className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 active:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 border border-gray-200">
                        {getProductIcon(product.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-[13px] sm:text-sm font-semibold text-gray-900 truncate leading-tight">{product.name}</h3>
                        </div>
                        <div className="flex items-center text-gray-500 text-[10px] sm:text-xs font-medium mt-1 gap-2.5">
                          <span className="truncate">{t('Last updated')} {getTimeAgo(product.updatedAt || product.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                      <p className="text-[13px] sm:text-[14px] font-semibold leading-tight text-[#093C5D]">
                        {formatCurrency(product.price)}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase sm:text-[10px] font-semibold ${product.stock === 0
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : product.stock < 20
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                        {product.stock === 0 ? t('Out of Stock') : `${product.stock} ${t('in stock')}`}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 my-2.5 sm:my-3"></div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 w-full mt-1.5">
                    <button
                      onClick={() => openEditModal(product)}
                      className="cursor-pointer text-gray-700 font-medium bg-gray-50 border border-gray-200 hover:bg-gray-100 px-1.5 sm:px-2.5 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all text-[11px] sm:text-xs active:scale-95 whitespace-nowrap leading-none !min-h-0 !min-w-0 !h-fit"
                    >
                      <Edit className="w-3.5 h-3.5 shrink-0" /> <span className="pt-[1px]">{t('Edit')}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="cursor-pointer text-red-700 font-medium bg-red-50 border border-red-200 hover:bg-red-100 px-1.5 sm:px-2.5 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all text-[11px] sm:text-xs active:scale-95 whitespace-nowrap leading-none !min-h-0 !min-w-0 !h-fit"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" /> <span className="pt-[1px]">{t('Delete')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Loader + Intersection trigger */}
            {isFetchingNextPage && (
              <div className="flex justify-center items-center py-5">
                <div className="bg-white border border-gray-200 rounded-lg px-5 py-2.5 flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-[#093C5D]" />
                  <span className="text-xs font-semibold text-gray-600 tracking-wide">{t('Loading more...')}</span>
                </div>
              </div>
            )}
            <div className="mt-4">
              <InfiniteScrollObserver
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Second Stats Section (EXACT COPY OF ORIGINAL) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-5 bg-white rounded-xl border border-gray-200 p-4 md:p-5 lg:p-6">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1 truncate">{t('INVENTORY VALUE')}</p>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900 truncate" title={formatCurrency(stats.totalValue)}>{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1 truncate">{t('ACTIVE ITEMS')}</p>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900 truncate">{stats.activeItems}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1 truncate">{t('LOW STOCK ALERT')}</p>
          <p className="text-2xl md:text-3xl font-semibold text-red-600 truncate">{stats.lowStockItems}</p>
        </div>
      </div>

      {/* Download Report Button */}
      <div className="flex justify-center md:justify-start mt-6 md:mt-8">
        <button
          onClick={handleDownloadReport}
          className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Download Inventory Report (PDF)')}
        </button>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          editingProduct={editingProduct}
          onClose={closeModal}
          onSubmit={onSubmit}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/60 transition-opacity animate-modal-overlay"
            onClick={() => {
              setDeleteModalOpen(false);
              setProductToDelete(null);
            }}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in pointer-events-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4 border border-red-100">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('Delete Product')}</h3>
                <p className="text-gray-500 text-sm mb-6 font-medium">
                  {t('Are you sure you want to delete')} <span className="font-semibold text-gray-800">{productToDelete.name}</span>? {t('This action cannot be undone.')}
                </p>

                <div className="flex gap-2 sm:gap-3 justify-center">
                  <button
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setProductToDelete(null);
                    }}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm transition-colors active:scale-95"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="cursor-pointer flex-1 px-4 py-2 sm:px-5 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('Yes, Delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile & Tablet Extended FAB (No Shadow) */}
      {!isModalOpen && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="lg:hidden fixed bottom-6 sm:bottom-8 right-6 sm:right-8 bg-[#093C5D] hover:bg-[#082a42] text-white px-5 sm:px-6 py-3.5 rounded-lg flex items-center transition-all z-[40] active:scale-95 group font-semibold text-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('Add Product')}
        </button>
      )}
    </div>
  );
};

export default Products;

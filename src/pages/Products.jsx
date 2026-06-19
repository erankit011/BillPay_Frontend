import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axios';
import { Plus, Search, X, Edit2, Trash2, Download, PlusCircle, Wallet, Box, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const productSchema = yup.object({
  name: yup.string().required('Name is required'),
  price: yup.number().min(0, 'Price cannot be negative').required('Price is required'),
  stock: yup.number().min(0, 'Stock cannot be negative').required('Stock is required'),
});

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data.data;
    }
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(productSchema)
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
    }
  });

  const onSubmit = (data) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setValue('name', product.name);
    setValue('price', product.price);
    setValue('stock', product.stock);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const activeItems = products.length;
    const lowStockItems = products.filter(p => p.stock < 20).length;
    return { totalValue, activeItems, lowStockItems };
  }, [products]);

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
          className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          {t('Add Product')}
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('INVENTORY VALUE')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{formatCurrency(stats.totalValue)}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{t('Total stock value')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <Box className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('ACTIVE ITEMS')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-gray-900 truncate">{stats.activeItems}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{t('Products in catalog')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 xl:p-5 flex flex-col justify-between min-h-[8rem] md:min-h-[9rem] xl:min-h-[10rem] border-l-4 border-l-red-500 border-t border-t-gray-200 border-r border-r-gray-200 border-b border-b-gray-200 hover:border-r-gray-300 hover:border-t-gray-300 hover:border-b-gray-300 transition-all duration-200 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#093C5D] border border-gray-200">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-auto pt-2 min-w-0">
            <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('LOW STOCK ALERT')}</p>
            <p className="text-base md:text-lg xl:text-2xl font-semibold text-red-600 truncate">{stats.lowStockItems}</p>
            <p className="text-[10px] md:text-xs text-red-500 font-medium truncate mt-0.5">{t('Items need restock')}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={t("Search products...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] text-sm md:text-base font-medium transition-colors duration-200"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#093C5D]"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-8 md:p-10 lg:p-12 text-center">
            <p className="text-gray-500 text-sm md:text-base font-medium">{t('No products found.')}</p>
          </div>
        ) : (
          <>
            {filteredProducts.map((product, index) => (
              <div 
                key={product._id} 
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 relative animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Action Buttons */}
                <div className="absolute top-3 md:top-4 right-3 md:right-4 flex gap-2">
                  <button 
                    onClick={() => openEditModal(product)}
                    className="cursor-pointer text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 md:p-2.5 rounded-lg active:scale-90 transition-all"
                    title={t("Edit")}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm(t('Are you sure you want to delete this product?'))) {
                        deleteMutation.mutate(product._id);
                      }
                    }}
                    className="cursor-pointer text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 md:p-2.5 rounded-lg active:scale-90 transition-all"
                    title={t("Delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Product Icon */}
                <div className="text-3xl md:text-4xl mb-2 md:mb-3">
                  {getProductIcon(product.name)}
                </div>

                {/* Product Name */}
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 truncate pr-20">
                  {product.name}
                </h3>

                {/* Price */}
                <p className="text-xl md:text-2xl font-semibold text-[#093C5D] mb-2 md:mb-3">
                  {formatCurrency(product.price)}
                </p>

                {/* Stock Badge and Time */}
                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block w-fit ${
                    product.stock === 0 
                      ? 'bg-red-100 text-red-700' 
                      : product.stock < 20 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-green-100 text-green-700'
                  }`}>
                    {product.stock === 0 ? 'Out of Stock' : `${product.stock} in stock`}
                  </span>
                  <span className="text-xs text-gray-400 line-clamp-1 font-medium">
                    Last updated {getTimeAgo(product.updatedAt || product.createdAt)}
                  </span>
                </div>
              </div>
            ))}

            {/* New Inventory Card */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer bg-white rounded-xl border-2 border-dashed border-[#093C5D]/30 hover:border-[#093C5D]/50 p-4 md:p-5 flex flex-col items-center justify-center min-h-[200px] md:min-h-[220px] active:scale-95 transition-all text-[#093C5D]"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-2 md:mb-3">
                <PlusCircle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-1">New Inventory</h3>
              <p className="text-xs md:text-sm text-gray-600 text-center px-2 font-medium">
                Quickly add new products to your digital catalog.
              </p>
            </button>
          </>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-5 bg-white rounded-xl border border-gray-200 p-4 md:p-5 lg:p-6">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">INVENTORY VALUE</p>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">ACTIVE ITEMS</p>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900">{stats.activeItems}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">LOW STOCK ALERT</p>
          <p className="text-2xl md:text-3xl font-semibold text-red-600">{stats.lowStockItems}</p>
        </div>
      </div>

      {/* Download Report Button */}
      <button className="cursor-pointer flex items-center gap-2 text-[#093C5D] font-semibold text-sm md:text-base active:scale-95 transition-transform">
        <Download className="w-4 h-4 md:w-5 md:h-5" />
        Download Inventory Report
      </button>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-black/30 animate-modal-overlay" onClick={closeModal} />
            <div className="relative bg-white rounded-xl border border-gray-200 max-w-md w-full p-5 md:p-6 animate-modal-content">
              <div className="flex items-center justify-between mb-4 md:mb-5 pb-4 border-b border-gray-200">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  {editingProduct ? t('Edit Product') : t('Add New Product')}
                </h3>
                <button onClick={closeModal} className="cursor-pointer text-gray-400 hover:text-gray-600 active:scale-90 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm md:text-base font-semibold text-gray-700 mb-1.5">{t('Product Name')}</label>
                  <input 
                    {...register('name')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                    placeholder="e.g. Atta 5kg"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.name.message}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-gray-700 mb-1.5">{t('Price (₹)')}</label>
                    <input 
                      type="number"
                      step="0.01"
                      {...register('price')}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                      placeholder="0.00"
                    />
                    {errors.price && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.price.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm md:text-base font-semibold text-gray-700 mb-1.5">{t('Stock Qty')}</label>
                    <input 
                      type="number"
                      {...register('stock')}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm md:text-base font-medium focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200"
                      placeholder="0"
                    />
                    {errors.stock && <p className="text-red-500 text-xs mt-1.5 font-semibold">{errors.stock.message}</p>}
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="cursor-pointer w-full bg-[#093C5D] hover:bg-[#082a42] text-white rounded-full px-5 md:px-6 py-2.5 md:py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 transition-all text-sm md:text-base"
                >
                  {createMutation.isPending || updateMutation.isPending ? t('Saving...') : t('Save Product')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

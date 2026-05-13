import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/axios';
import { Plus, Search, Box, X, Package, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const productSchema = yup.object({
  name: yup.string().required('Name is required'),
  price: yup.number().min(0, 'Price cannot be negative').required('Price is required'),
  stock: yup.number().min(0, 'Stock cannot be negative').required('Stock is required'),
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Inventory & Products')}</h1>
          <p className="text-gray-500 text-sm">{t('Manage your shop items and stock levels')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('Add Product')}
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={t("Search products...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('Loading')}...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>{t('No products found in inventory.')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProducts.map((product, idx) => (
              <div key={product._id} className="p-4 hover:bg-indigo-50/50 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in group" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-sm">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{product.name}</h3>
                    <div className="flex items-center text-sm mt-1 space-x-4">
                      <span className="text-gray-900 font-bold">{formatCurrency(product.price)}</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock} {t('in stock')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 border-t sm:border-none pt-3 sm:pt-0 justify-end w-full sm:w-auto">
                  <button 
                    onClick={() => openEditModal(product)}
                    className="text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                    title={t("Edit")}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm(t('Are you sure you want to delete this product?'))) {
                        deleteMutation.mutate(product._id);
                      }
                    }}
                    className="text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title={t("Delete")}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm" onClick={closeModal} />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl sm:align-middle relative z-10 animate-scale-in">
              <div className="flex items-center justify-between mb-5 pb-4 border-b">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingProduct ? t('Edit Product') : t('Add New Product')}
                </h3>
                <button onClick={closeModal} className="hover:bg-gray-100 p-1 rounded-full transition-colors text-gray-400 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('Product Name')}</label>
                  <input 
                    {...register('name')}
                    className="mt-1 block w-full rounded-xl border-gray-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Atta 5kg"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('Price (₹)')}</label>
                    <input 
                      type="number"
                      step="0.01"
                      {...register('price')}
                      className="mt-1 block w-full rounded-xl border-gray-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.00"
                    />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('Stock Qty')}</label>
                    <input 
                      type="number"
                      {...register('stock')}
                      className="mt-1 block w-full rounded-xl border-gray-300 border p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0"
                    />
                    {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                  </div>
                </div>
                
                <div className="mt-6 pt-2">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full inline-flex justify-center rounded-xl border border-transparent px-4 py-3 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? t('Saving...') : t('Save Product')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

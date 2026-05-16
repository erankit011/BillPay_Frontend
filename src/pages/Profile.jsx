import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Save, User, Mail, Phone, Store, Camera } from 'lucide-react';
import { setUser } from '../redux/slices/authSlice';
import api from '../api/axios';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shopName: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        shopName: user.shopName || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/me', formData);
      if (res.data.success) {
        dispatch(setUser(res.data.data));
        alert(t('Profile updated successfully'));
      }
    } catch (error) {
      alert(error.response?.data?.message || t('Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append('image', file);

    setUploadingImage(true);
    try {
      const res = await api.post('/auth/me/photo', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        dispatch(setUser(res.data.data));
        alert(t('Profile image updated successfully'));
      }
    } catch (error) {
      alert(error.response?.data?.message || t('Failed to update profile image'));
    } finally {
      setUploadingImage(false);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const BASE_URL = API_URL.replace('/api/v1', '');

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('Profile')}</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">{t('Manage your account information')}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-slide-up card-hover shadow-sm" style={{ animationDelay: '100ms' }}>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          <section>
            <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6 gap-4">
              <div className="relative animate-scale-in" style={{ animationDelay: '200ms' }}>
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl sm:text-4xl font-bold border-4 border-white shadow-lg overflow-hidden transition-transform hover:scale-105">
                  {user?.profileImage && user.profileImage !== 'no-photo.jpg' ? (
                    <img src={`${BASE_URL}${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-2 rounded-full text-white border-2 border-white transition-all disabled:opacity-50 hover:scale-110"
                  title={t('Upload Profile Photo')}
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="text-center sm:text-left">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500 break-all">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1">{t('Click camera icon to change photo')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" /> 
                  <span>{t('Full Name')}</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" /> 
                  <span>{t('Email Address')}</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 text-gray-500 cursor-not-allowed"
                  readOnly
                  disabled
                />
                <p className="mt-1 text-xs text-red-500 font-medium">{t('* Cannot be changed')}</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" /> 
                  <span>{t('Phone Number')}</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-50 text-gray-500 cursor-not-allowed"
                  readOnly
                  disabled
                />
                <p className="mt-1 text-xs text-red-500 font-medium">{t('* Cannot be changed')}</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                  <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" /> 
                  <span>{t('Shop Name')}</span>
                </label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 sm:py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 sm:py-3 rounded-lg flex items-center justify-center font-medium disabled:opacity-50 btn-hover-lift transition-all text-sm sm:text-base"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              <span>{loading ? t('Saving...') : t('Save Profile')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

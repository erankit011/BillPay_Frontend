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
      // Need to use multipart/form-data
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{t('Profile')}</h1>
        <p className="text-slate-500 text-sm">{t('Manage your account information')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          <section>
            <div className="flex items-center mb-6">
              <div className="relative mr-5">
                <div 
                  className="w-20 h-20 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-3xl font-semibold shadow-sm border-2 border-white overflow-hidden"
                >
                  {user?.profileImage && user.profileImage !== 'no-photo.jpg' ? (
                    <img src={`${BASE_URL}${user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                
                {/* Permanent Camera Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 p-1.5 rounded-full text-white shadow-md border-2 border-white transition-colors"
                  title={t('Upload Profile Photo')}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <div>
                <h2 className="text-xl font-medium text-slate-800">{user?.name}</h2>
                <p className="text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 mb-1 flex items-center">
                  <User className="w-4 h-4 mr-1" /> {t('Full Name')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 mb-1 flex items-center">
                  <Mail className="w-4 h-4 mr-1" /> {t('Email Address')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 bg-slate-50 text-slate-500 cursor-not-allowed"
                  readOnly
                  disabled
                />
                <p className="mt-1.5 text-xs text-red-400 font-medium">{t('* Cannot be changed')}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 mb-1 flex items-center">
                  <Phone className="w-4 h-4 mr-1" /> {t('Phone Number')}
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 bg-slate-50 text-slate-500 cursor-not-allowed"
                  readOnly
                  disabled
                />
                <p className="mt-1.5 text-xs text-red-400 font-medium">{t('* Cannot be changed')}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 mb-1 flex items-center">
                  <Store className="w-4 h-4 mr-1" /> {t('Shop Name')}
                </label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center shadow-sm font-medium disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? t('Saving...') : t('Save Profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

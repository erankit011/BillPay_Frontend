import { useState, useEffect, useRef } from 'react';
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

  const fileInputRef = useRef(null);

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
    <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
      <div className="animate-fade-in">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900">{t('Profile')}</h1>
        <p className="text-gray-600 text-sm md:text-base mt-1 font-medium">{t('Manage your account information')}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-slide-up card-hover" style={{ animationDelay: '100ms' }}>
        <form onSubmit={handleSubmit} className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 space-y-4 md:space-y-6 lg:space-y-8">
          <section>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-4 md:mb-6">
              <div className="relative animate-scale-in" style={{ animationDelay: '200ms' }}>
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl md:text-3xl lg:text-4xl font-semibold border-4 border-white shadow-lg overflow-hidden transition-transform hover:scale-105">
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
                  className="cursor-pointer absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 p-2 md:p-2.5 rounded-full text-white border-2 border-white transition-all disabled:opacity-50 hover:scale-110 active:scale-90"
                  title={t('Upload Profile Photo')}
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 md:w-5 md:h-5" />
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
              <div className="text-center md:text-left">
                <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-sm md:text-base text-gray-500 break-all mt-1 font-medium">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1 md:mt-1.5 font-medium">{t('Click camera icon to change photo')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-5">
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-800 mb-1.5 md:mb-2 flex items-center">
                  <User className="w-4 h-4 md:w-4 md:h-4 mr-1.5 flex-shrink-0" /> 
                  <span>{t('Full Name')}</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-800 mb-1.5 md:mb-2 flex items-center">
                  <Mail className="w-4 h-4 md:w-4 md:h-4 mr-1.5 flex-shrink-0" /> 
                  <span>{t('Email Address')}</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium bg-gray-50 text-gray-500 cursor-not-allowed opacity-50"
                  readOnly
                  disabled
                />
                <p className="mt-1.5 text-xs text-red-600 font-semibold">{t('* Cannot be changed')}</p>
              </div>

              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-800 mb-1.5 md:mb-2 flex items-center">
                  <Phone className="w-4 h-4 md:w-4 md:h-4 mr-1.5 flex-shrink-0" /> 
                  <span>{t('Phone Number')}</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium bg-gray-50 text-gray-500 cursor-not-allowed opacity-50"
                  readOnly
                  disabled
                />
                <p className="mt-1.5 text-xs text-red-600 font-semibold">{t('* Cannot be changed')}</p>
              </div>

              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-800 mb-1.5 md:mb-2 flex items-center">
                  <Store className="w-4 h-4 md:w-4 md:h-4 mr-1.5 flex-shrink-0" /> 
                  <span>{t('Shop Name')}</span>
                </label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  required
                />
              </div>
            </div>
          </section>

          <div className="pt-3 md:pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 md:px-6 lg:px-7 py-2.5 md:py-3 lg:py-3.5 rounded-full flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg transition-all text-sm md:text-base active:scale-95"
            >
              <Save className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
              <span>{loading ? t('Saving...') : t('Save Profile')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

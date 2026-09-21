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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Profile')}</h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
            {t('Manage your account information')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 md:p-6 lg:p-8 space-y-6 md:space-y-8">
          <section>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-5 mb-6 md:mb-8">
              <div className="relative shrink-0 flex items-center justify-center w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full border border-gray-200 p-[3px]">
                {user?.profileImage && user.profileImage !== 'no-photo.jpg' ? (
                  <img src={getImageUrl(user.profileImage)} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#F5F5F5] text-[#093C5D] flex items-center justify-center text-3xl md:text-4xl lg:text-5xl font-semibold overflow-hidden">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="cursor-pointer absolute bottom-0 right-0 md:bottom-0.5 md:right-0.5 bg-[#093C5D] hover:bg-[#082a42] p-1.5 md:p-2 rounded-full text-white border-[2px] border-white transition-all disabled:opacity-50 active:scale-95 shadow-sm flex items-center justify-center"
                  title={t('Upload Profile Photo')}
                >
                  {uploadingImage ? (
                    <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
              <div className="text-center md:text-left mt-2 md:mt-1">
                <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-xs md:text-sm text-gray-500 break-all mt-0.5 font-medium">{user?.email}</p>
                <p className="text-[11px] md:text-xs text-gray-400 mt-1 md:mt-1.5 font-medium">{t('Click camera icon to change photo')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1">
                  {t('Full Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1">
                  {t('Email Address')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus:ring-[#093C5D] focus:border-[#093C5D]"
                  readOnly
                  disabled
                />
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('* Cannot be changed')}</p>
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1">
                  {t('Phone Number')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus:ring-[#093C5D] focus:border-[#093C5D]"
                  readOnly
                  disabled
                />
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('* Cannot be changed')}</p>
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1">
                  {t('Shop Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                  required
                />
              </div>
            </div>
          </section>

          <div className="pt-2 md:pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center whitespace-nowrap shrink-0 justify-center font-semibold text-xs md:text-sm w-full sm:w-auto active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span>{loading ? t('Saving...') : t('Save Profile')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

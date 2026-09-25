import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Save, Camera } from 'lucide-react';
import { setUser } from '../redux/slices/authSlice';
import api from '../api/axios';
import SwirlingLoader from '../components/common/SwirlingLoader';


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
  const [initialData, setInitialData] = useState({
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
      const initial = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        shopName: user.shopName || '',
      };
      setFormData(initial);
      setInitialData(initial);
    }
  }, [user]);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

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

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-5 md:px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-5">
            <div className="relative shrink-0 flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full border border-gray-200 p-[3px]">
              {user?.profileImage && user.profileImage !== 'no-photo.jpg' ? (
                <img src={getImageUrl(user.profileImage)} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full rounded-full bg-[#F5F5F5] text-[#093C5D] flex items-center justify-center text-3xl md:text-4xl font-semibold overflow-hidden">
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
                  <SwirlingLoader className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
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
            <div className="text-center md:text-left mt-1 md:mt-2">
              <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-xs md:text-sm text-gray-500 break-all mt-0.5 font-medium">{user?.email}</p>
              <p className="text-[11px] md:text-xs text-gray-400 mt-1.5 md:mt-2 font-medium">{t('Click camera icon to change photo')}</p>
            </div>
          </div>

          <div className="px-4 sm:px-5 md:px-6 py-5 md:py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                  {t('Full Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('Enter your full name')}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                  {t('Email Address')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  placeholder={t('Email cannot be changed')}
                  readOnly
                  disabled
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('* Cannot be changed')}</p>
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                  {t('Phone Number')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  placeholder={t('Phone number cannot be changed')}
                  readOnly
                  disabled
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D] disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium">{t('* Cannot be changed')}</p>
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-gray-700 mb-1.5">
                  {t('Shop Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder={t('Enter your shop name')}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm md:text-base font-medium transition-colors duration-200 focus:ring-1 focus:outline-none focus:ring-[#093C5D] focus:border-[#093C5D]"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="sticky bottom-16 lg:bottom-4 z-20 mt-8 pt-4 pb-4 lg:pb-0">
          <div className="bg-white border border-gray-200 p-2 sm:px-4 sm:py-2.5 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 w-full">
            <div className="hidden sm:flex items-center gap-2 text-sm ml-1">
              <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <span className={hasChanges ? 'text-amber-700 font-medium' : 'text-gray-500 font-medium'}>
                {hasChanges ? t('You have unsaved changes') : t('All changes saved')}
              </span>
            </div>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className={`cursor-pointer bg-[#093C5D] text-white px-8 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm w-full sm:w-auto active:scale-[0.98] transition-colors duration-300 ${(!hasChanges || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#072d46]'}`}
            >
              <Save className="w-4 h-4 shrink-0" />
              <span className="tracking-wide">{loading ? t('Saving...') : t('Save Profile')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;

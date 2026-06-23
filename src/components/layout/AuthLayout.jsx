import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#093C5D]"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Branding (Hidden on mobile & tablet) */}
      <div className="hidden lg:flex w-5/12 xl:w-1/2 bg-[#093C5D] text-white p-12 flex-col justify-between relative overflow-hidden sticky top-0 h-screen">
        {/* Background Graphic/Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400 blur-3xl mix-blend-screen opacity-50"></div>
          <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-[#093C5D] blur-3xl mix-blend-screen opacity-40"></div>
          <div className="absolute -bottom-24 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-400 blur-3xl mix-blend-screen opacity-30"></div>
        </div>

        <div className="relative z-10 cursor-pointer block mt-4 lg:mt-0" onClick={() => navigate('/')}>
          <span className="text-[28px] lg:text-[32px] font-semibold tracking-tight text-white select-none cursor-pointer" onClick={() => navigate('/')}>UdharPay<span className="inline-block w-2 h-2 lg:w-[9px] lg:h-[9px] rounded-full bg-[#2ECC71] ml-[2px] mb-[3px] align-baseline"></span></span>
        </div>

        <div className="relative z-10 my-auto">
          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.15] mb-6 tracking-tight">
            Manage your shop&apos;s <br /> Khata digitally.
          </h1>
          <p className="text-lg xl:text-xl text-blue-100 max-w-md leading-relaxed font-medium">
            Join thousands of Indian shopkeepers growing their business with UdharPay&apos;s smart ledger system.
          </p>

          {/* Testimonial / Features */}
          <div className="mt-12 space-y-5">
            <div className="flex items-center gap-4 text-blue-50">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white text-base">Track Every Rupee</p>
                <p className="text-sm opacity-80 mt-0.5">Stop losing money to forgotten udhar.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-blue-50">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white text-base">Save Time</p>
                <p className="text-sm opacity-80 mt-0.5">Automatic daily, weekly, and monthly reports.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-blue-200/80 font-medium">
          © {new Date().getFullYear()} UdharPay. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form Container */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col relative bg-white min-h-[100dvh]">

        {/* Desktop Top Right Action removed */}

        <div className="flex-1 flex flex-col justify-center items-center px-5 sm:px-10 lg:px-16 xl:px-24 py-8 sm:py-12 md:py-20">

          {/* Mobile App Branding */}
          <div className="lg:hidden w-full max-w-[420px] text-center mb-8 animate-fade-in">
            <div className="cursor-pointer inline-block" onClick={() => navigate('/')}>
              <span className="text-3xl font-bold tracking-tight text-[#093C5D] select-none">
                UdharPay<span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2ECC71] ml-1 mb-1 align-baseline"></span>
              </span>
            </div>
            <p className="text-gray-500 font-medium text-sm mt-1.5">Manage your shop's
              Khata digitally.</p>
          </div>

          <div className="w-full max-w-[420px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

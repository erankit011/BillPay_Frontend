import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Search, FileText, Send, Loader2, Wallet, Users, Mail, MessageSquare, MoreVertical, IndianRupee, Eye, Filter, Download, Printer, Clock, Hash, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import InfiniteScrollObserver from '../components/common/InfiniteScrollObserver';
import CreateBillModal from '../components/bills/CreateBillModal';
import ViewBillModal from '../components/bills/ViewBillModal';
import SwirlingLoader from '../components/common/SwirlingLoader';
import UpgradeModal from '../components/common/UpgradeModal';
import toast from 'react-hot-toast';

import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';
import { shareToWhatsApp } from '../utils/whatsappUtils';

const getInitials = (name) => {
    if (!name) return 'CS';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};


const Bills = () => {
    const { t } = useTranslation();
    const { user: shopDetails } = useSelector(state => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';
    const filterStatus = searchParams.get('filter') || 'All';

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

    const setFilterStatus = (value) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (value === 'All') next.delete('filter');
            else next.set('filter', value);
            return next;
        }, { replace: true });
    };

    // Upgrade Modal State
    const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, title: '', message: '' });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const queryClient = useQueryClient();

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

    const handleSetViewBill = (val) => {
        if (!val) {
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.delete('viewBill');
                return next;
            });
        } else {
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('viewBill', val._id);
                return next;
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdown && !event.target.closest('.action-dropdown')) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ['bills', debouncedSearch, filterStatus],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await api.get(`/bills?page=${pageParam}&limit=15&search=${encodeURIComponent(debouncedSearch)}&status=${encodeURIComponent(filterStatus)}`);
            return res.data.data; // Return the entire paginated object
        },
        getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
        staleTime: 1 * 60 * 1000, // Data is fresh for 1 min
        gcTime: 5 * 60 * 1000,   // Garbage collect (delete from memory) if unused for 5 mins
        placeholderData: keepPreviousData,
    });



    const { data: customers = [] } = useQuery({
        queryKey: ['customers', 'all'],
        queryFn: async () => {
            const res = await api.get('/customers?limit=1000');
            return res.data.data.data || res.data.data || [];
        }
    });

    const { data: products = [] } = useQuery({
        queryKey: ['products', 'all'],
        queryFn: async () => {
            const res = await api.get('/products?limit=1000');
            return res.data.data.data || res.data.data || [];
        }
    });

    const { data: shopSettings = {} } = useQuery({
        queryKey: ['shopSettings'],
        queryFn: async () => {
            const res = await api.get('/settings');
            return res.data.data || {};
        },
        staleTime: 5 * 60 * 1000,
    });

    const bills = data?.pages?.flatMap(page => page.data || []) || [];
    const viewBillId = searchParams.get('viewBill');
    const activeBill = viewBillId ? bills.find(b => b._id === viewBillId) : null;

    const handleSendInvoice = async (billId, sendVia = 'whatsapp') => {
        const bill = bills.find(b => b._id === billId);
        
        if (sendVia === 'whatsapp' || sendVia === 'both') {
            if (!bill?.customerId?.phone) {
                toast.error(t('Customer phone number not provided!'));
                return;
            }
            
            // Manual WhatsApp Share
            await shareToWhatsApp({
                customer: bill.customerId,
                amount: bill.customerId?.balance ?? bill.grandTotal, // Use overall customer balance for Account Status
                dueDate: bill.dueDate,
                type: 'receipt', // assuming bill is a type of receipt/invoice
                billNumber: bill.invoiceNumber,
                billData: bill,
                shopDetails: shopDetails,
                shopSettings: shopSettings
            }, shopDetails?.shopName, async () => {
                await generateInvoicePDF(bill, shopDetails, 'download', t, shopSettings);
            });

            if (sendVia === 'whatsapp') return; // Stop if only WhatsApp was requested
        }

        // Email logic (backend)
        if (sendVia === 'email' || sendVia === 'both') {
            if (!bill?.customerId?.email) {
                toast.error(t('Customer email not provided!'));
                return;
            }

            const sendPromise = api.post(`/invoices/generate/${billId}`, { sendVia: 'email' });

            toast.promise(sendPromise, {
                loading: t('Sending email...'),
                success: t('Invoice sent via email successfully!'),
                error: (err) => t('Failed to send email') + ': ' + (err.response?.data?.message || err.message)
            });
        }
    };

    const firstPage = data?.pages?.[0];
    const stats = firstPage?.stats || {
        totalRevenue: 0, revenueGrowth: 0, pendingUdharTotal: 0, customersWithUdhar: 0,
        advanceTotal: 0, customersWithAdvance: 0, activeCustomers: 0, newCustomersThisWeek: 0,
        billCounts: { today: 0, yesterday: 0, week: 0, month: 0, lifetime: 0 }
    };

    const handleNewBillClick = () => {
        if (!shopDetails?.subscriptionPlan || shopDetails?.subscriptionPlan === 'FREE' || shopDetails?.subscriptionStatus === 'none') {
            const trialEnd = new Date(shopDetails?.createdAt);
            trialEnd.setDate(trialEnd.getDate() + 7);
            
            if (new Date() > trialEnd) {
                setUpgradeModal({
                    isOpen: true,
                    title: t('Trial Expired'),
                    message: t('Your 7-day free trial has expired. Please upgrade your plan to continue creating bills.')
                });
                return;
            }
            
            const totalBills = stats.billCounts.lifetime || 0;
            if (totalBills >= 10) {
                setUpgradeModal({
                    isOpen: true,
                    title: t('Limit Reached'),
                    message: t('Free trial limit reached: You can only create up to 10 bills on the free plan. Please upgrade your subscription.')
                });
                return;
            }
        }
        setIsModalOpen(true);
    };

    return (
        <div className="w-full space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 pb-24 lg:pb-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">{t('Billing & Invoices')}</h1>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-1.5 leading-relaxed">
                        {t('Manage your shop\'s transactions & Track pending payments & ')}<br className="hidden sm:block" />
                        {t('and send instant WhatsApp invoices to your customers.')}
                    </p>
                </div>
                <button
                    onClick={handleNewBillClick}
                    className="hidden lg:flex cursor-pointer bg-[#093C5D] hover:bg-[#082a42] text-white px-4 sm:px-5 md:px-6 py-2 md:py-2.5 rounded-lg items-center whitespace-nowrap shrink-0 font-semibold text-xs md:text-sm w-full sm:w-auto justify-center active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                    {t('Create New Bill')}
                </button>
            </div>

            {/* Dashboard Stats Section (Matched with Products Page UI) */}
            <div className="w-full bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-default mb-4 sm:mb-6 mt-2">
                
                {/* Top Part: Active Customers */}
                <div className="p-4 md:p-5 xl:p-6 flex items-center gap-3 md:gap-4">
                    <div className="w-9 h-9 md:w-11 md:h-11 xl:w-12 xl:h-12 shrink-0 rounded-lg p-[2px] border border-gray-200 bg-white">
                        <div className="w-full h-full rounded-md flex items-center justify-center bg-gray-50 text-[#093C5D]">
                            <Users className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] md:text-xs xl:text-sm text-gray-600 mb-0.5 md:mb-1 font-semibold uppercase tracking-wide truncate">{t('Active Customers')}</p>
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate leading-none tracking-tight">{stats.activeCustomers}</p>
                            {stats.newCustomersThisWeek > 0 && (
                                <div className="flex items-center gap-1 bg-[#f0fdf4] px-2 py-0.5 rounded-md border border-[#bbf7d0] shrink-0">
                                    <TrendingUp className="w-3 h-3 text-green-600" />
                                    <p className="text-[10px] text-green-700 font-medium whitespace-nowrap">
                                        +{stats.newCustomersThisWeek} {t('New this week')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Part: Bills Generated Overview */}
                <div className="bg-gray-50/80 px-4 py-3 md:px-5 md:py-3.5 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-2.5 sm:gap-x-6">
                    <div className="flex items-center gap-1.5 sm:gap-2 mr-2">
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#093C5D] mb-[1px]" />
                        <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-gray-900 uppercase tracking-wide whitespace-nowrap leading-none mt-0.5">{t('Bills Generated')}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#093C5D] shrink-0 opacity-80"></span>
                        <span className="text-[11px] sm:text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">{t('Today')}: <span className="font-semibold text-gray-900">{stats.billCounts.today}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#093C5D] shrink-0 opacity-60"></span>
                        <span className="text-[11px] sm:text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">{t('Yesterday')}: <span className="font-semibold text-gray-900">{stats.billCounts.yesterday}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#093C5D] shrink-0 opacity-40"></span>
                        <span className="text-[11px] sm:text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">{t('This Week')}: <span className="font-semibold text-gray-900">{stats.billCounts.week}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#093C5D] shrink-0 opacity-20"></span>
                        <span className="text-[11px] sm:text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">{t('This Month')}: <span className="font-semibold text-gray-900">{stats.billCounts.month}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-300 shrink-0"></span>
                        <span className="text-[11px] sm:text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">{t('Lifetime')}: <span className="font-semibold text-gray-900">{stats.billCounts.lifetime}</span></span>
                    </div>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 mb-2 sm:mb-3 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {[
                    { label: 'All Bills', value: 'All' },
                    { label: 'Paid', value: 'PAID' },
                    { label: 'Unpaid', value: 'UNPAID' },
                    { label: 'Partial', value: 'PARTIAL' },
                    { label: 'Advance', value: 'ADVANCE' },
                ].map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => setFilterStatus(filter.value)}
                        className={`shrink-0 cursor-pointer py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-200 border active:scale-95 select-none flex items-center justify-center whitespace-nowrap !min-h-0 !min-w-0 !h-fit ${filterStatus === filter.value
                            ? 'bg-[#093C5D] text-white border-[#093C5D] shadow-none'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-none'
                            }`}
                    >
                        {t(filter.label)}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="flex flex-col w-full mb-3 sm:mb-4">
                <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={t("Search By Bill Or Customer")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-3 sm:pr-4 bg-white border border-gray-300 rounded-lg text-[13px] sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D] transition-colors duration-200 shadow-none"
                    />
                </div>
            </div>

            {/* Bills Table */}
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 md:p-12 text-center text-gray-500 flex justify-center">
                        <SwirlingLoader className="w-10 h-10 md:w-12 md:h-12 text-[#093C5D]" />
                    </div>
                ) : isError ? (
                    <div className="p-8 md:p-12 text-center text-red-700">
                        <p className="font-medium text-sm md:text-base">{t('Failed to load bills.')}</p>
                    </div>
                ) : bills.length === 0 ? (
                    <div className="p-8 md:p-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                        <p className="font-medium text-sm md:text-base">{t('No bills found. Create your first bill!')}</p>
                    </div>
                ) : (
                    <div>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <table className="w-full min-w-[900px] whitespace-nowrap">
                                <thead className="bg-gray-50/80 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Invoice')}</th>
                                        <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Customer')}</th>
                                        <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-left text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Date')}</th>
                                        <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Amount')}</th>
                                        <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Status')}</th>
                                        <th className="px-4 lg:px-6 py-3.5 lg:py-4 text-right text-[10px] lg:text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bills.map((bill) => (
                                        <tr
                                            key={bill._id}
                                            className={`bg-white border-b border-gray-100 last:border-b-0 hover:bg-[#F5F5F5]/60 transition-colors duration-150 relative ${openDropdown === bill._id ? 'z-50' : 'z-0'}`}
                                        >
                                            <td className="px-4 lg:px-6 py-3.5 lg:py-4 align-middle">
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg p-[2px] border border-gray-200 bg-white flex-shrink-0">
                                                        <div className="w-full h-full rounded-md flex items-center justify-center text-sm lg:text-base font-semibold bg-gray-50 text-[#093C5D]">
                                                            {getInitials(bill.customerId?.name)}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs lg:text-sm font-semibold text-[#093C5D] truncate">{bill.invoiceNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3.5 lg:py-4 align-middle">
                                                <span className="text-xs lg:text-sm font-semibold text-gray-900 truncate block">{bill.customerId?.name || t('Counter Sale')}</span>
                                                {bill.customerId?.balance > 0 && (
                                                    <span className="text-[10px] lg:text-xs text-red-700 font-medium block mt-0.5">
                                                        {t('Total Due')}: {formatCurrency(bill.customerId.balance)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3.5 lg:py-4 align-middle">
                                                <span className="text-xs lg:text-sm text-gray-900 font-medium block whitespace-nowrap">{formatDate(bill.createdAt)}</span>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                                                <span className="text-xs lg:text-sm font-semibold text-gray-900 block">{formatCurrency(bill.grandTotal)}</span>
                                                {bill.grandTotal > (bill.amountPaid || 0) ? (
                                                    <span className="text-[10px] lg:text-xs text-red-700 font-medium block mt-0.5">
                                                        {t('Bill Due')}: {formatCurrency(bill.grandTotal - (bill.amountPaid || 0))}
                                                    </span>
                                                ) : (bill.amountPaid || 0) > bill.grandTotal ? (
                                                    <span className="text-[10px] lg:text-xs text-green-700 font-medium block mt-0.5">
                                                        {t('Advance')}: {formatCurrency((bill.amountPaid || 0) - bill.grandTotal)}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                                                <div className="flex items-center justify-end w-full h-full">
                                                    <span className={`inline-block px-2.5 py-1 rounded text-[10px] lg:text-xs font-semibold uppercase tracking-wide text-center
                          ${(bill.paymentStatus === 'PAID' || bill.paymentStatus === 'ADVANCE') ? 'bg-green-50 text-green-700 border border-green-200' :
                                                            bill.paymentStatus === 'PARTIAL' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                                'bg-red-50 text-red-700 border border-red-200'}`}>
                                                        {bill.paymentStatus === 'PAID' ? t('Paid') : bill.paymentStatus === 'UNPAID' ? t('Unpaid') : bill.paymentStatus === 'PARTIAL' ? t('Partial') : bill.paymentStatus === 'ADVANCE' ? t('Advance') : bill.paymentStatus}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3.5 lg:py-4 align-middle text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSearchParams(prev => {
                                                                const next = new URLSearchParams(prev);
                                                                next.set('viewBill', bill._id);
                                                                return next;
                                                            });
                                                        }}
                                                        className="shrink-0 cursor-pointer text-blue-700 font-medium bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[10px] sm:text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                                                        title={t('View Bill')}
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> {t('View')}
                                                    </button>

                                                    <div className="relative inline-block action-dropdown">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenDropdown(openDropdown === bill._id ? null : bill._id);
                                                            }}
                                                            className="shrink-0 cursor-pointer text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[10px] sm:text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                                                        >
                                                            <Send className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> {t('Send')}
                                                            <MoreVertical className="w-3.5 h-3.5 ml-0.5 shrink-0" />
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        {openDropdown === bill._id && (
                                                            <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSendInvoice(bill._id, 'whatsapp');
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95"
                                                                >
                                                                    <MessageSquare className="w-4 h-4 text-green-700 flex-shrink-0" />
                                                                    <span>{t('Send via WhatsApp')}</span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSendInvoice(bill._id, 'email');
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    disabled={!bill.customerId?.email}
                                                                >
                                                                    <Mail className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                                                                    <span className={!bill.customerId?.email ? 'text-gray-400' : ''}>
                                                                        {t('Send via Email')}
                                                                        {!bill.customerId?.email && <span className="text-xs"> (No email)</span>}
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSendInvoice(bill._id, 'both');
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    disabled={!bill.customerId?.email || !bill.customerId?.phone}
                                                                >
                                                                    <Send className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                                                                    <span className={(!bill.customerId?.email || !bill.customerId?.phone) ? 'text-gray-400' : ''}>
                                                                        {t('Send Both')}
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        generateInvoicePDF(bill, shopDetails, 'download', t, shopSettings);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100"
                                                                >
                                                                    <Download className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                                                                    <span>{t('Download PDF')}</span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        generateInvoicePDF(bill, shopDetails, 'print', t, shopSettings);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100"
                                                                >
                                                                    <Printer className="w-4 h-4 text-blue-700 flex-shrink-0" />
                                                                    <span>{t('Print Invoice')}</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <InfiniteScrollObserver
                                hasNextPage={hasNextPage}
                                isFetchingNextPage={isFetchingNextPage}
                                fetchNextPage={fetchNextPage}
                            />
                        </div>

                        {/* Mobile & Tablet Cards */}
                        <div className="lg:hidden flex flex-col gap-2.5">
                            {bills.map((bill, index) => (
                                <div
                                    key={bill._id}
                                    className={`bg-white border border-gray-200 rounded-lg p-3 sm:p-4 animate-fade-in transition-colors relative ${openDropdown === bill._id ? 'z-50' : 'z-0'}`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg p-[2px] border border-gray-200 bg-white flex-shrink-0">
                                                <div className="w-full h-full rounded-md flex items-center justify-center text-sm font-semibold bg-gray-50 text-[#093C5D]">
                                                    {getInitials(bill.customerId?.name)}
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex flex-col justify-center">
                                                <h3 className="text-sm sm:text-[15px] font-semibold text-[#093C5D] truncate leading-tight mb-0.5">{bill.customerId?.name || t('Counter Sale')}</h3>
                                                <span className="text-[11px] sm:text-xs font-medium text-gray-500 flex items-center whitespace-nowrap gap-0.5">
                                                    <Hash className="w-[11px] h-[11px] sm:w-3 sm:h-3 shrink-0" />
                                                    <span>{bill.invoiceNumber}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                                            <p className="text-[14px] sm:text-[15px] font-semibold text-gray-900 leading-tight">{formatCurrency(bill.grandTotal)}</p>
                                            {bill.grandTotal > (bill.amountPaid || 0) ? (
                                                <p className="text-[10px] text-red-700 font-medium leading-tight">
                                                    {t('Bill Due')}: {formatCurrency(bill.grandTotal - (bill.amountPaid || 0))}
                                                </p>
                                            ) : (bill.amountPaid || 0) > bill.grandTotal ? (
                                                <p className="text-[10px] text-green-700 font-medium leading-tight">
                                                    {t('Advance')}: {formatCurrency((bill.amountPaid || 0) - bill.grandTotal)}
                                                </p>
                                            ) : null}
                                            {bill.customerId?.balance > 0 && (
                                                <p className="text-[10px] text-red-700 font-medium leading-tight">
                                                    {t('Total Due')}: {formatCurrency(bill.customerId.balance)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider inside card */}
                                    <div className="border-t border-gray-100 my-2.5 sm:my-3"></div>

                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase sm:text-[10px] font-semibold
                                                ${(bill.paymentStatus === 'PAID' || bill.paymentStatus === 'ADVANCE') ? 'bg-green-50 text-green-700 border border-green-200' :
                                                    bill.paymentStatus === 'PARTIAL' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                        'bg-red-50 text-red-700 border border-red-200'}`}>
                                                {bill.paymentStatus === 'PAID' ? t('Paid') : bill.paymentStatus === 'UNPAID' ? t('Unpaid') : bill.paymentStatus === 'PARTIAL' ? t('Partial') : bill.paymentStatus === 'ADVANCE' ? t('Advance') : bill.paymentStatus}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSetViewBill(bill);
                                                }}
                                                className="cursor-pointer text-blue-700 font-medium bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[10px] sm:text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> {t('View')}
                                            </button>

                                            <div className="relative action-dropdown">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdown(openDropdown === bill._id ? null : bill._id);
                                                    }}
                                                    className="cursor-pointer text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2 sm:px-3 py-1 rounded-md flex items-center justify-center transition-all text-[10px] sm:text-xs active:scale-95 whitespace-nowrap !min-h-0 !min-w-0 !h-fit"
                                                >
                                                    <Send className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> {t('Send')}
                                                    <MoreVertical className="w-3.5 h-3.5 ml-0.5 shrink-0" />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {openDropdown === bill._id && (
                                                    <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSendInvoice(bill._id, 'whatsapp');
                                                                setOpenDropdown(null);
                                                            }}
                                                            className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95"
                                                        >
                                                            <MessageSquare className="w-4 h-4 text-green-700 flex-shrink-0" />
                                                            <span>{t('Send via WhatsApp')}</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSendInvoice(bill._id, 'email');
                                                                setOpenDropdown(null);
                                                            }}
                                                            className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={!bill.customerId?.email}
                                                        >
                                                            <Mail className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                                                            <span className={!bill.customerId?.email ? 'text-gray-400' : ''}>
                                                                {t('Send via Email')}
                                                                {!bill.customerId?.email && <span className="text-xs"> (No email)</span>}
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSendInvoice(bill._id, 'both');
                                                                setOpenDropdown(null);
                                                            }}
                                                            className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={!bill.customerId?.email || !bill.customerId?.phone}
                                                        >
                                                            <Send className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                                                            <span className={(!bill.customerId?.email || !bill.customerId?.phone) ? 'text-gray-400' : ''}>
                                                                {t('Send Both')}
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                generateInvoicePDF(bill, shopDetails, 'download', t, shopSettings);
                                                                setOpenDropdown(null);
                                                            }}
                                                            className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100"
                                                        >
                                                            <Download className="w-4 h-4 text-[#093C5D] flex-shrink-0" />
                                                            <span>{t('Download PDF')}</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                generateInvoicePDF(bill, shopDetails, 'print', t, shopSettings);
                                                                setOpenDropdown(null);
                                                            }}
                                                            className="cursor-pointer w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 border-t border-gray-100"
                                                        >
                                                            <Printer className="w-4 h-4 text-blue-700 flex-shrink-0" />
                                                            <span>{t('Print Invoice')}</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
                        <InfiniteScrollObserver
                            hasNextPage={hasNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            fetchNextPage={fetchNextPage}
                        />

                    </div>
                )}
            </div>

            <ViewBillModal viewBill={activeBill} setViewBill={handleSetViewBill} shopSettings={shopSettings} />

            <CreateBillModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                customers={customers}
                products={products}
                shopSettings={shopSettings}
            />

            {/* Mobile & Tablet Extended FAB (No Shadow) - hidden when any modal is open */}
            {!activeBill && !isModalOpen && (
                <button
                    onClick={handleNewBillClick}
                    className="lg:hidden fixed bottom-6 sm:bottom-8 right-6 sm:right-8 z-50 bg-[#093C5D] hover:bg-[#082a42] text-white px-5 sm:px-6 py-3 rounded-lg cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all duration-200"
                    title={t('Create Bills')}
                >
                    <Plus className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="font-semibold text-sm">{t('Create Bills')}</span>
                </button>
            )}

            <UpgradeModal
                isOpen={upgradeModal.isOpen}
                onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                title={upgradeModal.title}
                message={upgradeModal.message}
            />
        </div>
    );
};

export default Bills;

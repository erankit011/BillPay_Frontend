/**
 * AI Voice & Natural Language POS Billing Entry Page
 * Processes spoken and typed commands into multi-item retail invoices and credit/payment ledger entries.
 * Pixel-perfect responsive UI/UX harmonized with CreateBillModal standards.
 */

import { useState, useRef, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Mic,
  Loader2,
  CheckCircle2,
  Keyboard,
  Plus,
  FileText,
  Printer,
  Download,
  AlertCircle,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import SwirlingLoader from '../components/common/SwirlingLoader';
import BusinessSetupModal from '../components/common/BusinessSetupModal';
import SearchableSelect from '../components/common/SearchableSelect';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import toast from 'react-hot-toast';

const VoiceBilling = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputMode = searchParams.get('mode') || 'voice';

  const setInputMode = (value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'voice') next.delete('mode');
        else next.set('mode', value);
        return next;
      },
      { replace: true }
    );
  };

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [businessSetupModalOpen, setBusinessSetupModalOpen] = useState(false);

  const { user } = useSelector((state) => state.auth);

  // Shop settings query
  const { data: shopSettings = {} } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  // Products catalog query
  const { data: productsData = [] } = useQuery({
    queryKey: ['products', 'dropdown'],
    queryFn: async () => {
      const res = await api.get('/products?limit=1000&fields=minimal&includeStats=false');
      return res.data.data?.data || res.data.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Customers query
  const { data: customersData = [] } = useQuery({
    queryKey: ['customers', 'dropdown'],
    queryFn: async () => {
      const res = await api.get('/customers?limit=1000&fields=minimal&includeStats=false');
      return res.data.data?.data || res.data.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Presentation States
  const [draftBill, setDraftBill] = useState(null);
  const [draftTransaction, setDraftTransaction] = useState(null);
  const [createdBill, setCreatedBill] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Quick-Add Customer state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [customerError, setCustomerError] = useState('');

  // Inline Quick-Add Product state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });
  const [productError, setProductError] = useState('');

  const recognitionRef = useRef(null);

  // Memoized options for SearchableSelect
  const customerOptions = useMemo(() => {
    const list = [
      { value: 'WALKIN', label: `📦 ${t('Counter Sale')}` },
      ...customersData.map((c) => ({
        value: String(c._id),
        label: `${c.name} +91 ${c.phone}`,
      })),
    ];

    // If draft bill has a real spoken customer not in contacts, prepend it as an option
    if (draftBill?.isNewSpokenCustomer && draftBill?.customerName) {
      list.splice(1, 0, {
        value: 'NEW_SPOKEN_CUSTOMER',
        label: `✨ ${draftBill.customerName} (${t('New Customer')})`,
      });
    }

    return list;
  }, [customersData, draftBill?.isNewSpokenCustomer, draftBill?.customerName, t]);

  const productOptions = useMemo(() => {
    return productsData.map((p) => ({
      value: String(p._id),
      label: `${p.name} - ₹${p.price} (${t('Stock')}: ${p.stock})`,
    }));
  }, [productsData, t]);

  // Quick Customer Creation Mutation
  const addCustomerMutation = useMutation({
    mutationFn: (cust) => api.post('/customers', cust),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddCustomerOpen(false);
      const created = res.data.data;
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setCustomerError('');
      toast.success(t('Customer created successfully'));

      if (draftBill) {
        setDraftBill((prev) => ({
          ...prev,
          customerId: created._id,
          customerName: created.name,
          customerPhone: created.phone,
          customerBalance: 0,
          isNewSpokenCustomer: false,
        }));
      }
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || err.message;
      setCustomerError(errMsg);
      toast.error(errMsg);
    },
  });

  // Quick Product Creation Mutation
  const addProductMutation = useMutation({
    mutationFn: (prod) => api.post('/products', prod),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddProductOpen(false);
      const created = res.data.data;
      setNewProduct({ name: '', price: '', stock: '' });
      setProductError('');
      toast.success(t('Product created successfully'));

      if (draftBill) {
        setDraftBill((prev) => {
          const nextProducts = [...prev.products];
          const emptyIdx = nextProducts.findIndex((p) => !p.productId);
          if (emptyIdx !== -1) {
            nextProducts[emptyIdx] = {
              productId: created._id,
              name: created.name,
              price: created.price,
              quantity: nextProducts[emptyIdx].quantity || 1,
              stock: created.stock,
              total: created.price * (nextProducts[emptyIdx].quantity || 1),
              matched: true,
            };
          } else {
            nextProducts.push({
              productId: created._id,
              name: created.name,
              price: created.price,
              quantity: 1,
              stock: created.stock,
              total: created.price,
              matched: true,
            });
          }
          const newSubtotal = nextProducts.reduce((sum, it) => sum + (it.total || 0), 0);
          return {
            ...prev,
            products: nextProducts,
            subtotal: newSubtotal,
            grandTotal: newSubtotal,
            amountPaid: prev.paymentMode === 'CREDIT' ? 0 : newSubtotal,
          };
        });
      }
    },
    onError: (err) => {
      const errMsg = err.response?.data?.message || err.message;
      setProductError(errMsg);
      toast.error(errMsg);
    },
  });

  const handleQuickAddProduct = (e) => {
    e.preventDefault();
    setProductError('');
    if (!newProduct.name || newProduct.price === '' || newProduct.stock === '') {
      setProductError(t('Please fill all product fields'));
      return;
    }
    addProductMutation.mutate({
      name: newProduct.name.trim(),
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
    });
  };

  const handleQuickAddCustomer = (e) => {
    e.preventDefault();
    setCustomerError('');
    if (!newCustomer.name || !newCustomer.phone) {
      setCustomerError(t('Please fill required customer fields (Name and Phone)'));
      return;
    }
    addCustomerMutation.mutate({
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
      email: newCustomer.email?.trim() || undefined,
      address: newCustomer.address?.trim() || undefined,
    });
  };

  /**
   * Browser Speech Recognition Trigger
   */
  const startVoiceRecognition = () => {
    if (!user?.isBusinessSetupCompleted) {
      toast(t('Please complete your Business Profile to use voice billing'), {
        id: 'voice-setup-required-toast',
        duration: 4000,
      });
      setBusinessSetupModalOpen(true);
      return;
    }

    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        toast.error(t('Voice recognition not supported. Please use manual input.'));
        setInputMode('manual');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = shopSettings?.voiceLanguage || 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setDraftBill(null);
        setDraftTransaction(null);
        setCreatedBill(null);
        setTranscript(t('Listening... Speak now!'));
      };

      recognition.onresult = async (event) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        setIsRecording(false);
        await processCommand(speechResult);
      };

      recognition.onerror = (event) => {
        setIsRecording(false);
        if (event.error === 'network') {
          setTranscript(t('Network error. Switching to manual input...'));
          setTimeout(() => {
            setInputMode('manual');
            setTranscript('');
          }, 2000);
        } else if (event.error === 'not-allowed') {
          setTranscript(t('Microphone access denied. Please use manual input.'));
          setTimeout(() => {
            setInputMode('manual');
            setTranscript('');
          }, 2000);
        } else if (event.error === 'no-speech') {
          setTranscript(t('No speech detected. Please tap mic again and speak clearly.'));
        } else {
          setTranscript(t('Error: ') + event.error + '. Switching to manual input...');
          setTimeout(() => {
            setInputMode('manual');
            setTranscript('');
          }, 2000);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      setIsRecording(false);
      toast.error(t('Failed to start voice recognition. Please use manual input.'));
      setInputMode('manual');
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Suppress benign stop error
      }
    }
    setIsRecording(false);
  };

  /**
   * Process Natural Language Command
   */
  const processCommand = async (text) => {
    if (!text || !text.trim()) return;

    setIsProcessing(true);
    setTranscript(t('Processing natural language bill...'));
    setDraftBill(null);
    setDraftTransaction(null);
    setCreatedBill(null);

    try {
      const res = await api.post('/voice/process', {
        manualTranscript: text.trim(),
        type: 'GENERAL',
      });

      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setTranscript(data.transcript || text);

        if (data.type === 'BILL' || data.type === 'BILLING') {
          // Resolve matched customer from contacts list
          let resolvedCustomerId = data.customerId || '';
          let matchedCustomerObj = null;

          if (resolvedCustomerId) {
            matchedCustomerObj = customersData.find((c) => c._id === resolvedCustomerId);
          } else if (data.customerName && data.customerName !== 'Walk-in Customer') {
            matchedCustomerObj = customersData.find(
              (c) => c.name.toLowerCase() === data.customerName.toLowerCase()
            );
            if (matchedCustomerObj) resolvedCustomerId = matchedCustomerObj._id;
          }

          const isRealSpokenCustomer =
            data.customerName &&
            data.customerName !== 'Walk-in Customer' &&
            data.customerName !== 'Counter Sale' &&
            data.customerName !== t('Counter Sale');

          // Clean valid products list: eliminate unnamed or empty records
          const validRawProducts = (data.products || []).filter(
            (p) => p.name && p.name.trim().length >= 2 && p.name.toLowerCase() !== 'unnamed'
          );

          const initialProducts = validRawProducts.length > 0
            ? validRawProducts.map((p) => {
                const stockVal = p.stock !== null && p.stock !== undefined ? p.stock : null;
                return {
                  productId: p.productId ? String(p.productId) : '',
                  name: p.name,
                  price: Number(p.price) || 0,
                  quantity: Number(p.quantity) || 1,
                  stock: stockVal,
                  total: (Number(p.price) || 0) * (Number(p.quantity) || 1),
                  matched: Boolean(p.matched),
                };
              })
            : [{ productId: '', name: '', price: 0, quantity: 1, stock: null, total: 0, matched: false }];

          const computedSubtotal = initialProducts.reduce((sum, it) => sum + it.total, 0);
          const paymentMode = data.paymentMode || 'CASH';
          const isCredit = paymentMode === 'CREDIT' || data.intent === 'UDHAR';

          // Determine selected customer ID for dropdown
          let initialCustomerId = 'WALKIN';
          if (matchedCustomerObj) {
            initialCustomerId = String(matchedCustomerObj._id);
          } else if (isRealSpokenCustomer) {
            initialCustomerId = 'NEW_SPOKEN_CUSTOMER';
          }

          setDraftBill({
            transcript: data.transcript || text,
            customerId: initialCustomerId,
            customerName: matchedCustomerObj ? matchedCustomerObj.name : (isRealSpokenCustomer ? data.customerName : t('Counter Sale')),
            customerPhone: matchedCustomerObj?.phone || '',
            customerBalance: matchedCustomerObj?.balance || 0,
            isNewSpokenCustomer: isRealSpokenCustomer && !matchedCustomerObj,
            products: initialProducts,
            paymentMode: isCredit ? 'CREDIT' : paymentMode,
            discountInput: 0,
            discountType: shopSettings?.discountType || 'PERCENTAGE',
            subtotal: computedSubtotal,
            grandTotal: computedSubtotal,
            amountPaid: isCredit ? 0 : computedSubtotal,
          });
        } else {
          // Pre-populate single Khata transaction
          let resolvedCustomerId = data.customerId || '';
          if (!resolvedCustomerId && data.customerName) {
            const foundCust = customersData.find(
              (c) => c.name.toLowerCase() === data.customerName.toLowerCase()
            );
            if (foundCust) resolvedCustomerId = foundCust._id;
          }

          setDraftTransaction({
            customerId: resolvedCustomerId,
            customerName: data.customerName || '',
            amount: data.amount || '',
            intent: data.intent || 'UDHAR',
            paymentMode: data.paymentMode || 'CASH',
            originalCommand: text,
          });
        }
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || t('Error processing command. Please try again.');
      toast.error(errMsg);
      setTranscript(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    if (!user?.isBusinessSetupCompleted) {
      toast(t('Please complete your Business Profile to use voice billing'), {
        id: 'voice-setup-required-toast',
        duration: 4000,
      });
      setBusinessSetupModalOpen(true);
      return;
    }

    await processCommand(manualText);
    setManualText('');
  };

  // Line item manipulation helpers
  const handleProductSelect = (index, productId) => {
    const selectedProd = productsData.find((p) => p._id === productId);
    if (!selectedProd) return;

    setDraftBill((prev) => {
      const nextProducts = [...prev.products];
      const qty = nextProducts[index]?.quantity || 1;
      nextProducts[index] = {
        productId: selectedProd._id,
        name: selectedProd.name,
        price: selectedProd.price,
        quantity: qty,
        stock: selectedProd.stock,
        total: selectedProd.price * qty,
        matched: true,
      };

      const newSubtotal = nextProducts.reduce((sum, it) => sum + it.total, 0);
      return {
        ...prev,
        products: nextProducts,
        subtotal: newSubtotal,
      };
    });
  };

  const handleQuantityChange = (index, newQuantity) => {
    const parsedQty = Math.max(1, parseInt(newQuantity, 10) || 1);
    setDraftBill((prev) => {
      const nextProducts = [...prev.products];
      const price = Number(nextProducts[index].price) || 0;
      nextProducts[index] = {
        ...nextProducts[index],
        quantity: parsedQty,
        total: price * parsedQty,
      };

      const newSubtotal = nextProducts.reduce((sum, it) => sum + it.total, 0);
      return {
        ...prev,
        products: nextProducts,
        subtotal: newSubtotal,
      };
    });
  };

  const handleRemoveItem = (index) => {
    setDraftBill((prev) => {
      const nextProducts = prev.products.filter((_, idx) => idx !== index);
      const newSubtotal = nextProducts.reduce((sum, it) => sum + it.total, 0);
      return {
        ...prev,
        products: nextProducts,
        subtotal: newSubtotal,
      };
    });
  };

  const handleAddBlankItem = () => {
    setDraftBill((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productId: '', name: '', price: 0, quantity: 1, stock: null, total: 0, matched: false },
      ],
    }));
  };

  // Financial Calculations (1:1 with CreateBillModal)
  const subtotal = draftBill?.subtotal || 0;
  const isPercentage = draftBill?.discountType === 'PERCENTAGE';
  const discountInput = Number(draftBill?.discountInput) || 0;
  const discountAmount = isPercentage ? Math.round((subtotal * discountInput) / 100) : discountInput;
  const taxRate = shopSettings?.taxRate || 0;
  const taxAmount = shopSettings?.taxEnabled ? Math.round(((subtotal - discountAmount) * taxRate) / 100) : 0;
  const totalAmount = Math.max(0, Math.round(subtotal - discountAmount + taxAmount));

  // Sync amountPaid and grandTotal when subtotal/discounts update
  useEffect(() => {
    if (draftBill) {
      setDraftBill((prev) => {
        if (!prev) return prev;
        const shouldBeZero = prev.paymentMode === 'CREDIT';
        const isFullPayment = prev.amountPaid === prev.grandTotal || prev.amountPaid === undefined;
        const nextAmountPaid = shouldBeZero
          ? 0
          : isFullPayment
          ? totalAmount
          : Math.min(Number(prev.amountPaid) || 0, totalAmount);
        return {
          ...prev,
          grandTotal: totalAmount,
          amountPaid: nextAmountPaid,
        };
      });
    }
  }, [totalAmount]);

  const selectedCustomer = customersData.find((c) => c._id === draftBill?.customerId);
  const isWalkin = draftBill?.customerId === 'WALKIN';
  const isNewSpokenCustomer = draftBill?.customerId === 'NEW_SPOKEN_CUSTOMER';
  const amountPaid = Number(draftBill?.amountPaid) || 0;
  const newPending = totalAmount - amountPaid;
  const currentBalance = (selectedCustomer?.balance || 0) > 0 ? selectedCustomer.balance : 0;
  const newTotalBalance = currentBalance + newPending;

  /**
   * Finalize Retail Bill Dispatch
   */
  const handleFinalizeBill = async () => {
    if (!draftBill || draftBill.products.length === 0) {
      toast.error(t('Please add at least one product'));
      return;
    }

    // Validation: All items must be matched to a product ID
    const unmatchedIndex = draftBill.products.findIndex((p) => !p.productId);
    if (unmatchedIndex !== -1) {
      toast.error(
        t('Please select a product from catalog for item #') +
          (unmatchedIndex + 1) +
          (draftBill.products[unmatchedIndex].name ? ` (${draftBill.products[unmatchedIndex].name})` : '')
      );
      return;
    }

    if ((isWalkin || isNewSpokenCustomer) && newPending > 0) {
      toast.error(t('Udhaar is not allowed for Counter Sale or unsaved customers. Please save customer to Khata first.'));
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustomerId = undefined;

      if (!isWalkin && draftBill.customerId && draftBill.customerId !== 'NEW_SPOKEN_CUSTOMER') {
        finalCustomerId = draftBill.customerId;
      }

      const payload = {
        customerId: finalCustomerId,
        products: draftBill.products.map((p) => ({
          productId: p.productId,
          quantity: Number(p.quantity) || 1,
        })),
        tax: Number(taxAmount) || 0,
        discount: Number(discountAmount) || 0,
        amountPaid: Number(draftBill.amountPaid) || 0,
        paymentMode: draftBill.paymentMode || 'CASH',
      };

      const res = await api.post('/bills', payload);

      if (res.data?.success) {
        toast.success(t('Bill created successfully!'));
        setCreatedBill(res.data.data);
        setDraftBill(null);

        // Invalidate caches across app
        queryClient.invalidateQueries({ queryKey: ['bills'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || t('Error creating bill');
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Finalize Single Khata Transaction
   */
  const handleFinalizeTransaction = async (e) => {
    e.preventDefault();
    if (!draftTransaction.customerName.trim() || !draftTransaction.amount) {
      toast.error(t('Please fill in customer name and amount'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/transactions', {
        customerId: draftTransaction.customerId || undefined,
        customerName: draftTransaction.customerName,
        amount: parseFloat(draftTransaction.amount),
        type: draftTransaction.intent,
        paymentMode: draftTransaction.paymentMode,
        description: transcript,
      });

      if (response.data?.success) {
        toast.success(t('Transaction saved successfully!'));
        setDraftTransaction(null);
        setTranscript('');

        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || t('Error saving transaction');
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    'w-full h-[42px] rounded-lg border border-[#DCE1EA] px-3 text-sm font-medium text-[#191E2B] placeholder-[#9AA4B8] focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] bg-[#FBFBFC] transition-colors outline-none shadow-none';

  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-20">
        {/** Top Title banner */}
        <div className="text-center animate-fade-in pt-1 sm:pt-2 px-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF0FB] rounded-full text-xs font-semibold text-[#4338CA] mb-1.5 sm:mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('Voice POS & Smart Billing')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B]">
            {t('Smart Voice Billing Assistant')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#4E5668] mt-1 max-w-lg mx-auto">
            {t('Speak your bill naturally in Hindi or English — instantly drafted into an official invoice')}
          </p>
        </div>

        {/** Mode Switcher */}
        {!draftBill && !draftTransaction && !createdBill && (
          <div className="flex justify-center animate-slide-up px-1">
            <div className="inline-flex bg-[#F0F2F6] rounded-xl p-1 border border-[#DCE1EA] w-full max-w-xs shadow-none">
              <button
                type="button"
                onClick={() => setInputMode('voice')}
                className={`cursor-pointer flex items-center justify-center gap-1.5 flex-1 px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-[0.98] focus:outline-none ${
                  inputMode === 'voice'
                    ? 'bg-[#4338CA] text-white shadow-sm'
                    : 'bg-transparent text-[#4E5668] hover:bg-[#E4E7ED] hover:text-[#191E2B]'
                }`}
              >
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{t('Voice Mic')}</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`cursor-pointer flex items-center justify-center gap-1.5 flex-1 px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-[0.98] focus:outline-none ${
                  inputMode === 'manual'
                    ? 'bg-[#4338CA] text-white shadow-sm'
                    : 'bg-transparent text-[#4E5668] hover:bg-[#E4E7ED] hover:text-[#191E2B]'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{t('Type Manually')}</span>
              </button>
            </div>
          </div>
        )}

        {/** Voice Mic Container */}
        {inputMode === 'voice' && !draftBill && !draftTransaction && !createdBill && (
          <div className="bg-[#FBFBFC] rounded-2xl p-5 sm:p-8 text-center flex flex-col items-center justify-center min-h-[290px] sm:min-h-[320px] relative overflow-hidden animate-slide-up border border-[#DCE1EA] shadow-none">
            <div className="relative flex items-center justify-center my-3 sm:my-4">
              {isRecording && (
                <>
                  <div
                    className="absolute w-[140%] h-[140%] bg-[#B91C1C]/20 rounded-full animate-ping pointer-events-none"
                    style={{ animationDuration: '2s' }}
                  ></div>
                  <div
                    className="absolute w-[180%] h-[180%] bg-[#B91C1C]/10 rounded-full animate-ping pointer-events-none"
                    style={{ animationDuration: '3s', animationDelay: '500ms' }}
                  ></div>
                </>
              )}

              <button
                onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                disabled={isProcessing}
                className={`cursor-pointer w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#4338CA]/40 focus:ring-offset-4 ${
                  isRecording
                    ? 'bg-[#B91C1C] text-white shadow-none border-4 border-[#FECDD3]'
                    : 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-none border-4 border-[#D8DCF5]'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={isRecording ? t('Stop Recording') : t('Start Voice Recording')}
              >
                {isProcessing ? (
                  <SwirlingLoader className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
                ) : (
                  <Mic className={`w-9 h-9 sm:w-10 sm:h-10 ${isRecording ? 'animate-pulse' : ''}`} />
                )}
              </button>
            </div>

            <div className="min-h-12 flex flex-col items-center justify-center">
              <p className="text-sm sm:text-base font-semibold text-[#191E2B] px-4">
                {transcript || (isRecording ? t('Listening... Speak now!') : t('Tap mic to start billing'))}
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-[#4E5668] mt-1">
                {isRecording ? t('Listening for items, quantities & customer name...') : t('Auto-matches products from your catalog & drafts invoice')}
              </p>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 text-xs font-medium text-[#4338CA] w-full max-w-md px-1">
              <div className="bg-[#EEF0FB] px-3 py-1.5 rounded-lg border border-[#D8DCF5] text-center text-[11px] sm:text-xs leading-normal">
                "{t('Ramesh ko 2 packet Parle-G, 1 chini udhar do')}"
              </div>
              <div className="bg-[#EEF0FB] px-3 py-1.5 rounded-lg border border-[#D8DCF5] text-center text-[11px] sm:text-xs leading-normal">
                "{t('3 frooti aur 2 chips cash bill banao')}"
              </div>
            </div>
          </div>
        )}

        {/** Manual Text Input Container */}
        {inputMode === 'manual' && !draftBill && !draftTransaction && !createdBill && (
          <form
            onSubmit={handleManualSubmit}
            className="bg-[#FBFBFC] border border-[#DCE1EA] rounded-xl p-4 sm:p-6 animate-slide-up shadow-none"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#191E2B] mb-2">
                  ⌨️ {t('Type your billing command in plain words')}
                </label>
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE1EA] px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] bg-white text-[#191E2B] placeholder-[#9AA4B8] shadow-none"
                  placeholder="e.g. Ramesh ko 2 bread aur 1 amul butter ka bill banao, cash me"
                  disabled={isProcessing}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !manualText.trim()}
                className="cursor-pointer w-full flex justify-center items-center px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all focus:outline-none shadow-none"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('Processing Bill...')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {t('Draft Bill from Text')}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/** 🛒 PROFESSIONAL POS BILL DRAFT (1:1 with User Specification & Market Standards) */}
        {draftBill && (
          <div className="bg-white rounded-xl border border-[#DCE1EA] p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-5 shadow-none animate-slide-up">
            {/** Header (1:1 with exact user UI layout) */}
            <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E8ECF2]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-[#4338CA] shrink-0" />
                  <h2 className="text-base sm:text-lg font-semibold text-[#191E2B]">
                    {t('Voice POS Bill Draft')}
                  </h2>
                </div>
                <p className="text-xs sm:text-[13px] font-medium text-[#757F94] mt-0.5">
                  {t('Review items, adjust quantities, and generate official invoice')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraftBill(null)}
                className="cursor-pointer text-[#B91C1C] hover:text-[#991B1B] hover:underline text-xs sm:text-sm font-semibold shrink-0 pt-0.5"
              >
                {t('Discard Draft')}
              </button>
            </div>

            {/** Spoken Transcript Banner (Responsive on all viewports) */}
            <div className="bg-[#EEF0FB]/70 border border-[#D8DCF5] rounded-lg p-2.5 sm:p-3 flex items-start sm:items-center justify-between gap-2">
              <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                <Mic className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-xs font-medium text-[#191E2B] leading-relaxed break-words">
                  <span className="text-[#4338CA] font-semibold">{t('Voice Command')}:</span> "{draftBill.transcript || transcript}"
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraftBill(null);
                  startVoiceRecognition();
                }}
                className="cursor-pointer inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-[#4338CA] bg-white px-2.5 py-1 rounded-md border border-[#D8DCF5] shrink-0 hover:bg-[#EEF0FB] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('Re-speak')}</span>
              </button>
            </div>

            {/** 1. Customer Selection Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-[13px] font-semibold text-[#191E2B]">
                  {t('Billed To Customer')}:
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(!isAddCustomerOpen)}
                  className="cursor-pointer bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] hover:bg-[#E0E4F9] h-6 sm:h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-none"
                >
                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{t('Create Customer')}</span>
                </button>
              </div>

              {/** Inline Quick-Add Customer Box */}
              {isAddCustomerOpen && (
                <div className="bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg p-3 sm:p-4 mb-2 animate-fade-in shadow-none">
                  <h4 className="text-xs font-semibold text-[#191E2B] mb-2">{t('Quick Add Customer')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <input
                      type="text"
                      placeholder={t('Full Name')}
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className={inputCls}
                    />
                    <input
                      type="text"
                      placeholder={t('Phone Number')}
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className={inputCls}
                    />
                    <input
                      type="email"
                      placeholder={t('Email')}
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className={inputCls}
                    />
                    <input
                      type="text"
                      placeholder={t('Address')}
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  {customerError && (
                    <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-2 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="leading-none pt-[1px]">{customerError}</span>
                    </p>
                  )}
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddCustomerOpen(false);
                        setCustomerError('');
                      }}
                      className="cursor-pointer h-7 sm:h-8 px-3 sm:px-4 flex items-center justify-center text-[11px] sm:text-xs leading-none font-medium text-[#4E5668] hover:bg-[#EBEEF4] rounded-lg transition-colors"
                    >
                      {t('Cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddCustomer}
                      disabled={addCustomerMutation.isPending}
                      className="cursor-pointer h-7 sm:h-8 px-3 sm:px-4 flex items-center justify-center text-[11px] sm:text-xs leading-none font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg transition-colors disabled:opacity-50 shadow-none"
                    >
                      {addCustomerMutation.isPending ? t('Saving...') : t('Save')}
                    </button>
                  </div>
                </div>
              )}

              <SearchableSelect
                options={customerOptions}
                value={draftBill.customerId}
                onChange={(val) => {
                  const selected = customersData.find((c) => String(c._id) === val);
                  setDraftBill((prev) => ({
                    ...prev,
                    customerId: val,
                    customerName: selected ? selected.name : (val === 'NEW_SPOKEN_CUSTOMER' ? prev.customerName : t('Counter Sale')),
                    customerPhone: selected ? selected.phone : '',
                    customerBalance: selected ? selected.balance : 0,
                    isNewSpokenCustomer: val === 'NEW_SPOKEN_CUSTOMER',
                  }));
                }}
                placeholder={t('Select Customer or Counter Sale')}
                searchPlaceholder={t('Search by name or phone...')}
              />

              {/** Alert if a real customer was spoken but not in contacts */}
              {isNewSpokenCustomer && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 sm:px-3 sm:py-2 bg-[#FFFBEB] rounded-lg border border-[#FDE68A] text-xs">
                  <div className="text-[#92400E] font-medium flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                    <span className="leading-snug break-words">
                      ⚠️ {t('Spoken name')}: <strong className="font-semibold text-[#78350F]">{draftBill.customerName}</strong> ({t('Not in contacts')})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomer((prev) => ({ ...prev, name: draftBill.customerName }));
                      setIsAddCustomerOpen(true);
                    }}
                    className="cursor-pointer text-[#4338CA] font-semibold hover:underline self-start sm:self-auto shrink-0 text-[11px] sm:text-xs"
                  >
                    + {t('Save as New Customer')}
                  </button>
                </div>
              )}
            </div>

            {/** 2. Products & Line Items Builder (Bulletproof 2-Tier Responsive Design) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-[13px] font-semibold text-[#191E2B]">
                  {t('INVOICE LINE ITEMS')} ({draftBill.products.length})
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(!isAddProductOpen)}
                  className="cursor-pointer bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] hover:bg-[#E0E4F9] h-6 sm:h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-none"
                >
                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{t('Add Product')}</span>
                </button>
              </div>

              {/** Inline Quick-Add Product Box */}
              {isAddProductOpen && (
                <div className="bg-[#F0F2F6] border border-[#DCE1EA] rounded-lg p-3 sm:p-4 mb-2 animate-fade-in shadow-none">
                  <h4 className="text-xs font-semibold text-[#191E2B] mb-2">{t('Quick Add Product')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <input
                      type="text"
                      placeholder={t('Product Name')}
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className={`${inputCls} sm:col-span-2`}
                    />
                    <input
                      type="number"
                      placeholder={t('Price')}
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className={inputCls}
                    />
                    <input
                      type="number"
                      placeholder={t('Stock')}
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  {productError && (
                    <p className="text-[#B91C1C] text-[11px] sm:text-xs mt-2 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="leading-none pt-[1px]">{productError}</span>
                    </p>
                  )}
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddProductOpen(false);
                        setProductError('');
                      }}
                      className="cursor-pointer h-7 sm:h-8 px-3 sm:px-4 flex items-center justify-center text-[11px] sm:text-xs leading-none font-medium text-[#4E5668] hover:bg-[#EBEEF4] rounded-lg transition-colors"
                    >
                      {t('Cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddProduct}
                      disabled={addProductMutation.isPending}
                      className="cursor-pointer h-7 sm:h-8 px-3 sm:px-4 flex items-center justify-center text-[11px] sm:text-xs leading-none font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] rounded-lg transition-colors disabled:opacity-50 shadow-none"
                    >
                      {addProductMutation.isPending ? t('Saving...') : t('Save')}
                    </button>
                  </div>
                </div>
              )}

              {/** Line Item Cards */}
              <div className="space-y-2.5">
                {draftBill.products.map((item, index) => {
                  const stockVal = item.stock !== null && item.stock !== undefined ? Number(item.stock) : null;
                  const isOutOfStock = stockVal !== null && stockVal <= 0;
                  const isMapped = Boolean(item.productId);

                  return (
                    <div
                      key={index}
                      className="bg-white p-3 sm:p-3.5 rounded-lg border border-[#DCE1EA] hover:border-[#CBD5E1] transition-all space-y-2.5 shadow-none"
                    >
                      {/** If unmapped spoken item, show warning alert */}
                      {!isMapped && item.name && (
                        <div className="text-[11px] sm:text-xs font-semibold text-[#B91C1C] bg-[#FEF2F2] px-2.5 py-1 rounded-md border border-[#FECDD3] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="break-words">{t('Map spoken item')}: "{item.name}"</span>
                        </div>
                      )}

                      {/** Tier 1: Full-width Product Selector */}
                      <div>
                        <SearchableSelect
                          options={productOptions}
                          value={item.productId}
                          onChange={(prodId) => handleProductSelect(index, prodId)}
                          placeholder={
                            item.name
                              ? `${item.name}${item.price ? ` - ₹${item.price}` : ''}`
                              : t('Choose Product from Store...')
                          }
                          searchPlaceholder={t('Search by product name...')}
                        />
                      </div>

                      {/** Tier 2: Stock Badge & Price (Left) + Stepper & Line Total + Trash (Right) */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        {/** Left: Stock Badge & Unit Price */}
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                          {isMapped ? (
                            <>
                              {isOutOfStock ? (
                                <span className="text-[10px] sm:text-[11px] font-semibold text-[#B91C1C] bg-[#FEF2F2] px-2 py-0.5 rounded-md border border-[#FECDD3] whitespace-nowrap">
                                  {t('Out of Stock')} (0)
                                </span>
                              ) : (
                                <span className="text-[10px] sm:text-[11px] font-semibold text-[#0D7A57] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0] whitespace-nowrap">
                                  ✓ {t('In Stock')}: {stockVal ?? 0}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-[#4E5668] whitespace-nowrap">
                                ₹{item.price} / PCS
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] font-medium text-[#757F94] italic whitespace-nowrap">
                              {t('Select product above')}
                            </span>
                          )}
                        </div>

                        {/** Right: Stepper [-] [Qty] [+] + Line Total + Trash */}
                        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                          {/** Stepper */}
                          <div className="flex items-center border border-[#DCE1EA] rounded-lg bg-[#FBFBFC] h-8 sm:h-9 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(index, item.quantity - 1)}
                              className="cursor-pointer w-7 sm:w-8 h-full flex items-center justify-center text-xs font-semibold text-[#4E5668] hover:bg-[#F0F2F6] active:bg-[#E4E7ED] select-none"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity || 1}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-8 sm:w-9 h-full text-center text-xs sm:text-sm font-semibold text-[#191E2B] bg-white border-x border-[#DCE1EA] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min="1"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(index, item.quantity + 1)}
                              className="cursor-pointer w-7 sm:w-8 h-full flex items-center justify-center text-xs font-semibold text-[#4E5668] hover:bg-[#F0F2F6] active:bg-[#E4E7ED] select-none"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          {/** Line Total */}
                          <span className="text-xs sm:text-sm font-semibold text-[#191E2B] min-w-[48px] sm:min-w-[56px] text-right">
                            ₹{item.total.toLocaleString('en-IN')}
                          </span>

                          {draftBill.products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="cursor-pointer text-[#757F94] hover:text-[#B91C1C] hover:bg-[#FFF1F2] w-8 h-8 rounded-lg flex items-center justify-center transition-all border border-transparent hover:border-[#FECDD3] shrink-0"
                              aria-label={t('Remove item')}
                              title={t('Remove item')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddBlankItem}
                className="cursor-pointer w-full py-2.5 bg-[#EEF0FB] hover:bg-[#E0E4F9] text-[#4338CA] border border-dashed border-[#D8DCF5] rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] shadow-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add Product')}</span>
              </button>
            </div>

            {/** 3. Invoice Summary & Totals (1:1 with Billing Page / CreateBillModal) */}
            <div className="bg-[#EEF0FB] border border-[#D8DCF5] rounded-lg p-3 sm:p-4 space-y-2 shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#3730A3]">{t('Subtotal')}</span>
                <span className="text-sm font-semibold text-[#3730A3]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {/** Discount Row */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#3730A3]">
                  {t('Discount')} {isPercentage ? '(%)' : '(₹)'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-[#3730A3]">{isPercentage ? '%' : '₹'}</span>
                  <input
                    type="number"
                    value={draftBill.discountInput || ''}
                    onChange={(e) =>
                      setDraftBill((prev) => ({
                        ...prev,
                        discountInput: Math.max(0, parseFloat(e.target.value) || 0),
                      }))
                    }
                    className="w-20 rounded-md border border-[#DCE1EA] px-2 py-1 text-sm font-medium text-right text-[#191E2B] bg-white focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#3730A3] text-opacity-80">{t('Discount Amount')}</span>
                  <span className="text-sm font-semibold text-[#B91C1C]">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {shopSettings?.taxEnabled && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#3730A3]">
                    {t('Tax')} ({taxRate}%)
                  </span>
                  <span className="text-sm font-semibold text-[#3730A3]">₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="pt-2 mt-2 border-t border-[#D8DCF5] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#191E2B]">{t('Total Bill Amount')}</span>
                <span className="text-base sm:text-lg font-semibold text-[#4338CA]">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/** 4. Payment Method & Collection Inputs (1:1 with Billing Page / CreateBillModal) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
                  {t('Payment Mode')}
                </label>
                <select
                  value={draftBill.paymentMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    const isCredit = mode === 'CREDIT';
                    setDraftBill((prev) => ({
                      ...prev,
                      paymentMode: mode,
                      amountPaid: isCredit ? 0 : totalAmount,
                    }));
                  }}
                  className={inputCls}
                >
                  <option value="CASH">{t('Cash')}</option>
                  <option value="UPI">{t('UPI')}</option>
                  <option value="BANK_TRANSFER">{t('Bank Transfer')}</option>
                  <option value="CHEQUE">{t('Cheque')}</option>
                  <option value="CREDIT">{t('Credit')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-0.5">
                  {t('Amount Paid')} <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  type="number"
                  value={draftBill.amountPaid ?? ''}
                  onChange={(e) =>
                    setDraftBill((prev) => ({
                      ...prev,
                      amountPaid: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  className={inputCls}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/** 5. Customer Ledger Impact Notification */}
            {newPending > 0 && !isWalkin && (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-3 text-xs space-y-1">
                <p className="font-semibold text-[#92400E] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{t('Customer Udhar Khata will be updated')}:</span>
                </p>
                <p className="text-[#78350F] font-medium leading-relaxed">
                  {draftBill.customerName}: {t('Previous Bal')}: ₹{currentBalance} + {t('Unpaid')}: ₹{newPending} = <strong className="font-semibold text-[#B91C1C]">₹{newTotalBalance}</strong>
                </p>
              </div>
            )}

            {isWalkin && newPending > 0 && (
              <div className="bg-[#FEF2F2] border border-[#FECDD3] rounded-lg p-3 text-xs text-[#B91C1C] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t('Udhaar is not allowed for Counter Sale. Please enter full amount paid or select a customer.')}</span>
              </div>
            )}

            {/** 6. Action Triggers */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDraftBill(null)}
                className="cursor-pointer flex-1 h-[42px] rounded-lg text-xs sm:text-sm font-semibold text-[#4E5668] bg-[#F0F2F6] hover:bg-[#EBEEF4] border border-[#DCE1EA] active:scale-95 transition-all text-center flex items-center justify-center"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleFinalizeBill}
                disabled={isSubmitting}
                className="cursor-pointer flex-1 sm:flex-[2] h-[42px] rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('Processing...')}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>{t('Generate Bill')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/** 💳 KHATA TRANSACTION FORM */}
        {draftTransaction && (
          <form
            onSubmit={handleFinalizeTransaction}
            className="bg-[#FBFBFC] border border-[#DCE1EA] rounded-xl p-4 sm:p-6 space-y-4 animate-slide-up shadow-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE1EA]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-[#4338CA]" />
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-[#191E2B]">{t('Review Khata Entry')}</h2>
              </div>
              <button
                type="button"
                onClick={() => setDraftTransaction(null)}
                className="cursor-pointer text-xs font-medium text-[#757F94] hover:text-[#191E2B]"
              >
                ✕ {t('Cancel')}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#191E2B] mb-1">👤 {t('Customer Name')}</label>
                <input
                  type="text"
                  value={draftTransaction.customerName}
                  onChange={(e) => setDraftTransaction((prev) => ({ ...prev, customerName: e.target.value }))}
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191E2B] mb-1">💰 {t('Amount')} (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={draftTransaction.amount}
                  onChange={(e) => setDraftTransaction((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#191E2B] mb-1">🎯 {t('Transaction Type')}</label>
                  <select
                    value={draftTransaction.intent}
                    onChange={(e) => setDraftTransaction((prev) => ({ ...prev, intent: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="UDHAR">{t('Udhar (Given)')}</option>
                    <option value="PAYMENT">{t('Payment (Received)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191E2B] mb-1">💳 {t('Payment Mode')}</label>
                  <select
                    value={draftTransaction.paymentMode}
                    onChange={(e) => setDraftTransaction((prev) => ({ ...prev, paymentMode: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="CASH">{t('Cash')}</option>
                    <option value="UPI">{t('UPI')}</option>
                    <option value="CARD">{t('Card')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraftTransaction(null)}
                className="cursor-pointer flex-1 h-[42px] rounded-lg text-xs sm:text-sm font-semibold text-[#4E5668] bg-[#F0F2F6] hover:bg-[#EBEEF4] border border-[#DCE1EA] flex items-center justify-center"
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer flex-1 h-[42px] rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-50 flex items-center justify-center gap-2 shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('Saving...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('Save to Khata')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/** 🎉 SUCCESS CARD */}
        {createdBill && (
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-5 sm:p-6 text-center space-y-4 animate-scale-in shadow-none">
            <div className="w-12 h-12 bg-[#D1FAE5] text-[#0D7A57] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#0D7A57]">
                {t('Invoice Generated Successfully!')}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-[#191E2B] mt-1">
                {t('Invoice #')}: <span className="font-semibold">{createdBill.invoiceNumber}</span> • ₹{createdBill.grandTotal}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => generateInvoicePDF(createdBill, user, 'download', t, shopSettings)}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#191E2B] border border-[#DCE1EA] rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#F0F2F6] transition-colors"
              >
                <Download className="w-4 h-4 text-[#4338CA]" />
                <span>{t('Download PDF')}</span>
              </button>
              <button
                type="button"
                onClick={() => generateInvoicePDF(createdBill, user, 'print', t, shopSettings)}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#191E2B] border border-[#DCE1EA] rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#F0F2F6] transition-colors"
              >
                <Printer className="w-4 h-4 text-[#4338CA]" />
                <span>{t('Print Receipt')}</span>
              </button>
              <Link
                to={`/bills?search=${encodeURIComponent(createdBill.invoiceNumber)}`}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4338CA] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#3730A3] transition-colors"
              >
                <span>{t('View in Invoices')}</span>
              </Link>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreatedBill(null);
                  setTranscript('');
                }}
                className="cursor-pointer text-xs font-semibold text-[#4338CA] hover:underline"
              >
                + {t('Create Another Voice Bill')}
              </button>
            </div>
          </div>
        )}
      </div>

      <BusinessSetupModal
        isOpen={businessSetupModalOpen}
        onClose={() => setBusinessSetupModalOpen(false)}
      />
    </div>
  );
};

export default VoiceBilling;

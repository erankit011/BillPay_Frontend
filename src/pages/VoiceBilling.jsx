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
  Minus,
  Plus,
  FileText,
  Printer,
  Download,
  AlertCircle,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import SwirlingLoader from '../components/common/SwirlingLoader';
import BusinessSetupModal from '../components/common/BusinessSetupModal';
import SearchableSelect from '../components/common/SearchableSelect';
import QuickAddCustomer from '../components/common/QuickAddCustomer';
import QuickAddProduct from '../components/common/QuickAddProduct';
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

  // Inline Quick-Add Customer & Product states
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [quickAddCustomerName, setQuickAddCustomerName] = useState('');
  const customerSectionRef = useRef(null);
  const khataCustomerSectionRef = useRef(null);
  const customerPhoneInputRef = useRef(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [quickAddProductName, setQuickAddProductName] = useState('');
  const [quickAddProductLineIndex, setQuickAddProductLineIndex] = useState(null);

  const recognitionRef = useRef(null);

  // Memoized options for SearchableSelect
  const customerOptions = useMemo(() => {
    const list = [
      { value: 'WALKIN', label: t('Counter Sale') },
      ...customersData.map((c) => ({
        value: String(c._id),
        label: `${c.name} +91 ${c.phone}`,
      })),
    ];

    // If draft bill has a real spoken customer not in contacts, prepend it as an option
    if (draftBill?.isNewSpokenCustomer && draftBill?.customerName) {
      list.splice(1, 0, {
        value: 'NEW_SPOKEN_CUSTOMER',
        label: `${draftBill.customerName} (${t('New Customer')})`,
      });
    }

    return list;
  }, [customersData, draftBill?.isNewSpokenCustomer, draftBill?.customerName, t]);

  // Memoized options for SearchableSelect (Khata Transaction)
  const transactionCustomerOptions = useMemo(() => {
    const list = customersData.map((c) => ({
      value: String(c._id),
      label: `${c.name} +91 ${c.phone}`,
    }));

    if (draftTransaction?.isNewSpokenCustomer && draftTransaction?.customerName) {
      list.unshift({
        value: 'NEW_SPOKEN_CUSTOMER',
        label: `${draftTransaction.customerName} (${t('New Customer')})`,
      });
    }

    return list;
  }, [customersData, draftTransaction?.isNewSpokenCustomer, draftTransaction?.customerName, t]);

  const productOptions = useMemo(() => {
    return productsData.map((p) => ({
      value: String(p._id),
      label: `${p.name} - ₹${p.price} (${t('Stock')}: ${p.stock})`,
    }));
  }, [productsData, t]);



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
      recognition.maxAlternatives = 5;
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
          } else if (data.customerName && data.customerName !== 'Counter Sale' && data.customerName !== 'Walk-in Customer') {
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
                  rawSpokenName: p.rawSpokenName || p.name,
                  price: Number(p.price) || 0,
                  quantity: Number(p.quantity) || 1,
                  stock: stockVal,
                  total: (Number(p.price) || 0) * (Number(p.quantity) || 1),
                  matched: Boolean(p.matched),
                  suggestions: Array.isArray(p.suggestions) ? p.suggestions : [],
                };
              })
            : [{ productId: '', name: '', rawSpokenName: '', price: 0, quantity: 1, stock: null, total: 0, matched: false, suggestions: [] }];

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
            newCustomerPhone: '',
            customerBalance: matchedCustomerObj?.balance || 0,
            isNewSpokenCustomer: isRealSpokenCustomer && !matchedCustomerObj,
            customerSuggestions: Array.isArray(data.customerSuggestions) ? data.customerSuggestions : [],
            rawSpokenCustomer: data.customerName || '',
            products: initialProducts,
            paymentMode: isCredit ? 'CREDIT' : paymentMode,
            discountInput: '',
            discountType: shopSettings?.discountType || 'PERCENTAGE',
            subtotal: computedSubtotal,
            grandTotal: computedSubtotal,
            amountPaid: 0,
          });
        } else {
          // Pre-populate single Khata transaction
          let resolvedCustomerId = data.customerId || '';
          let matchedCust = null;
          if (resolvedCustomerId) {
            matchedCust = customersData.find((c) => String(c._id) === String(resolvedCustomerId));
          } else if (data.customerName) {
            matchedCust = customersData.find(
              (c) => c.name.toLowerCase() === data.customerName.toLowerCase()
            );
            if (matchedCust) resolvedCustomerId = matchedCust._id;
          }

          const isRealSpokenCust =
            data.customerName &&
            data.customerName !== 'Walk-in Customer' &&
            data.customerName !== 'Counter Sale' &&
            data.customerName !== t('Counter Sale');

          let initialTransCustomerId = '';
          if (matchedCust) {
            initialTransCustomerId = String(matchedCust._id);
          } else if (isRealSpokenCust) {
            initialTransCustomerId = 'NEW_SPOKEN_CUSTOMER';
          }

          setDraftTransaction({
            customerId: initialTransCustomerId,
            customerName: matchedCust ? matchedCust.name : (isRealSpokenCust ? data.customerName : ''),
            customerPhone: matchedCust ? matchedCust.phone : '',
            isNewSpokenCustomer: Boolean(isRealSpokenCust && !matchedCust),
            customerSuggestions: Array.isArray(data.customerSuggestions) ? data.customerSuggestions : [],
            rawSpokenCustomer: data.customerName || '',
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
  const handleProductSelect = (index, productId, spokenPhraseToLearn) => {
    const selectedProd = productsData.find((p) => p._id === productId);
    if (!selectedProd) return;

    setDraftBill((prev) => {
      const nextProducts = [...prev.products];
      const currentItem = nextProducts[index] || {};
      const qty = currentItem.quantity || 1;
      nextProducts[index] = {
        productId: selectedProd._id,
        name: selectedProd.name,
        price: selectedProd.price,
        quantity: qty,
        stock: selectedProd.stock,
        total: selectedProd.price * qty,
        matched: true,
        rawSpokenName: currentItem.rawSpokenName,
        suggestions: [],
      };

      const newSubtotal = nextProducts.reduce((sum, it) => sum + it.total, 0);
      return {
        ...prev,
        products: nextProducts,
        subtotal: newSubtotal,
      };
    });

    // Only learn alias when explicitly selected from suggested phonetic matches
    const phrase = spokenPhraseToLearn;
    if (phrase && phrase.length >= 2 && phrase.toLowerCase() !== selectedProd.name.toLowerCase()) {
      api.post('/voice/alias', {
        entityType: 'PRODUCT',
        entityId: selectedProd._id,
        spokenPhrase: phrase,
      }).catch(() => {});
    }
  };

  const handleSelectCustomerSuggestion = (sug) => {
    if (draftBill) {
      setDraftBill((prev) => ({
        ...prev,
        customerId: String(sug._id),
        customerName: sug.name,
        customerPhone: sug.phone || '',
        newCustomerPhone: '',
        customerBalance: sug.balance || 0,
        customerSuggestions: [],
        isNewSpokenCustomer: false,
      }));
    }

    if (draftTransaction) {
      setDraftTransaction((prev) => ({
        ...prev,
        customerId: String(sug._id),
        customerName: sug.name,
        customerPhone: sug.phone || '',
        customerSuggestions: [],
        isNewSpokenCustomer: false,
      }));
    }

    const spokenRaw = draftBill?.rawSpokenCustomer || draftTransaction?.rawSpokenCustomer;
    if (
      spokenRaw &&
      spokenRaw.length >= 2 &&
      spokenRaw.toLowerCase() !== sug.name.toLowerCase()
    ) {
      api.post('/voice/alias', {
        entityType: 'CUSTOMER',
        entityId: sug._id,
        spokenPhrase: spokenRaw,
      }).catch(() => {});
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const qtyVal = newQuantity === '' ? '' : Math.max(1, parseInt(newQuantity, 10) || 1);
    const calcQty = Number(qtyVal) || 1;
    setDraftBill((prev) => {
      const nextProducts = [...prev.products];
      const price = Number(nextProducts[index].price) || 0;
      nextProducts[index] = {
        ...nextProducts[index],
        quantity: qtyVal,
        total: price * calcQty,
      };

      const newSubtotal = nextProducts.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
        0
      );
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
  const subtotal = draftBill?.products
    ? draftBill.products.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0
      )
    : (draftBill?.subtotal || 0);
  const isPercentage = draftBill?.discountType === 'PERCENTAGE';
  const discountInput = Number(draftBill?.discountInput) || 0;
  const rawDiscount = isPercentage ? Math.round((subtotal * discountInput) / 100) : discountInput;
  const discountAmount = Math.min(subtotal, Math.max(0, rawDiscount));
  const taxRate = shopSettings?.taxEnabled ? (shopSettings?.taxRate || 0) : 0;
  const taxAmount = Math.round(((subtotal - discountAmount) * taxRate) / 100);
  const totalAmount = Math.max(0, Math.round(subtotal - discountAmount + taxAmount));

  // Sync grandTotal with totalAmount without overriding user's manual amountPaid
  useEffect(() => {
    if (draftBill && draftBill.grandTotal !== totalAmount) {
      setDraftBill((prev) => (prev ? { ...prev, grandTotal: totalAmount } : prev));
    }
  }, [totalAmount]);

  const creditLimit = shopSettings?.defaultCreditLimit || 0;
  const selectedCustomer = customersData.find((c) => c._id === draftBill?.customerId);
  const isWalkin = draftBill?.customerId === 'WALKIN';
  const isNewSpokenCustomer = draftBill?.customerId === 'NEW_SPOKEN_CUSTOMER';
  const amountPaid = Number(draftBill?.amountPaid) || 0;
  const newPending = totalAmount - amountPaid;
  const currentBalance = (selectedCustomer?.balance || 0) > 0 ? selectedCustomer.balance : 0;
  const newTotalBalance = currentBalance + newPending;
  const isCreditLimitExceeded = creditLimit > 0 && newTotalBalance > creditLimit && !isWalkin;

  /**
   * Internal Bill Execution Dispatch
   */
  const executeCreateBill = async () => {
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

        if (shopSettings?.autoPrint && res.data?.data) {
          generateInvoicePDF(res.data.data, user, 'print', t, shopSettings);
        }

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
      const unmatchedItem = draftBill.products[unmatchedIndex];
      toast.error(
        unmatchedItem.name
          ? `${t('Please add')} "${unmatchedItem.name}" ${t('to catalog or select from list')}`
          : `${t('Please select a product from catalog for item #')}${unmatchedIndex + 1}`,
        { id: 'unmatched-product-toast', duration: 4000 }
      );
      setQuickAddProductLineIndex(unmatchedIndex);
      setQuickAddProductName(unmatchedItem.name || unmatchedItem.rawSpokenName || '');
      setIsAddProductOpen(true);
      return;
    }

    // If customer is a new spoken contact: show toast, scroll to customer input, and open Quick Create!
    if (isNewSpokenCustomer) {
      toast.error(
        `${t('Please enter a phone number to register')} "${draftBill.customerName}"`,
        { id: 'new-customer-required-toast', duration: 4000 }
      );
      setIsAddCustomerOpen(true);
      if (customerSectionRef.current) {
        customerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => {
        customerPhoneInputRef.current?.focus();
      }, 250);
      return;
    }

    if (isWalkin && newPending > 0) {
      toast.error(t('Credit is not allowed for Counter Sale. Please enter full amount paid.'));
      return;
    }

    if (isCreditLimitExceeded && !isWalkin) {
      toast.error(`${t('Credit limit exceeded! Max credit allowed is ₹')}${creditLimit}`);
      return;
    }

    await executeCreateBill();
  };

  /**
   * Finalize Single Khata Transaction
   */
  const handleFinalizeTransaction = async (e) => {
    if (e) e.preventDefault();
    if (!draftTransaction) return;

    if (!draftTransaction.amount) {
      toast.error(t('Please enter an amount'));
      return;
    }

    const isNew =
      !draftTransaction.customerId ||
      draftTransaction.customerId === 'NEW_SPOKEN_CUSTOMER' ||
      draftTransaction.isNewSpokenCustomer;

    if (isNew) {
      const custName = draftTransaction.customerName && draftTransaction.customerName !== t('Counter Sale') && draftTransaction.customerName !== 'Counter Sale'
        ? draftTransaction.customerName
        : '';
      toast.error(
        custName
          ? `${t('Please enter a phone number to register')} "${custName}"`
          : t('Please select or register a customer for Khata entry'),
        { id: 'khata-new-customer-toast', duration: 4000 }
      );
      setIsAddCustomerOpen(true);
      if (khataCustomerSectionRef.current) {
        khataCustomerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => {
        customerPhoneInputRef.current?.focus();
      }, 250);
      return;
    }

    const numericAmount = parseFloat(draftTransaction.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error(t('Please enter a valid amount'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/transactions', {
        customerId: draftTransaction.customerId,
        customerName: draftTransaction.customerName.trim(),
        customerPhone: draftTransaction.customerPhone?.trim() || undefined,
        amount: numericAmount,
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
    'w-full h-10 sm:h-[42px] rounded-lg border border-[#DCE1EA] px-3 text-[13px] sm:text-sm font-medium text-[#191E2B] placeholder-[#9AA4B8] placeholder:text-[13px] sm:placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] bg-[#FBFBFC] transition-colors outline-none shadow-none';

  return (
    <div className="w-full">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-20">
        {/** Top Title banner */}
        <div className="text-center animate-fade-in pt-1 sm:pt-2 px-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] mb-1 sm:mb-1.5">
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>{t('Voice POS & Smart Billing')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#191E2B]">
            {t('Smart Voice Billing Assistant')}
          </h1>
          <p className="text-xs sm:text-[13px] font-medium text-[#757F94] mt-1 max-w-md mx-auto leading-relaxed">
            {t('Speak or type bills naturally in Hindi or English for instant invoices')}
          </p>
        </div>

        {/** Mode Switcher */}
        {!draftBill && !draftTransaction && !createdBill && (
          <div className="flex justify-center animate-slide-up px-1">
            <div className="inline-flex items-center bg-[#F0F2F6] rounded-xl p-1 border border-[#DCE1EA] w-full max-w-xs shadow-none">
              <button
                type="button"
                onClick={() => setInputMode('voice')}
                className={`cursor-pointer inline-flex items-center justify-center gap-2 flex-1 h-9 px-3 rounded-lg font-semibold text-xs sm:text-[13px] leading-none transition-all duration-200 active:scale-[0.98] focus:outline-none select-none ${
                  inputMode === 'voice'
                    ? 'bg-[#4338CA] text-white shadow-none'
                    : 'bg-transparent text-[#4E5668] hover:bg-[#E4E7ED] hover:text-[#191E2B]'
                }`}
              >
                <Mic className="w-4 h-4 shrink-0" />
                <span className="leading-none pt-[1px]">{t('Voice Mic')}</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`cursor-pointer inline-flex items-center justify-center gap-2 flex-1 h-9 px-3 rounded-lg font-semibold text-xs sm:text-[13px] leading-none transition-all duration-200 active:scale-[0.98] focus:outline-none select-none ${
                  inputMode === 'manual'
                    ? 'bg-[#4338CA] text-white shadow-none'
                    : 'bg-transparent text-[#4E5668] hover:bg-[#E4E7ED] hover:text-[#191E2B]'
                }`}
              >
                <Keyboard className="w-4 h-4 shrink-0" />
                <span className="leading-none pt-[1px]">{t('Type Manually')}</span>
              </button>
            </div>
          </div>
        )}

        {/** Voice Mic Container */}
        {inputMode === 'voice' && !draftBill && !draftTransaction && !createdBill && (
          <div className="bg-[#FBFBFC] rounded-2xl p-5 sm:p-7 text-center flex flex-col items-center justify-center animate-slide-up border border-[#DCE1EA] shadow-none space-y-4">
            {/** Mic Stage */}
            <div className="relative flex items-center justify-center py-5 sm:py-6">
              {isRecording && (
                <>
                  {/** Soft concentric aura that never expands or gets cut off */}
                  <span className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#B91C1C]/10 animate-pulse pointer-events-none" />
                  <span className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#B91C1C]/15 pointer-events-none" />
                </>
              )}

              <button
                onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                disabled={isProcessing}
                className={`relative z-10 cursor-pointer w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 focus:outline-none ${
                  isRecording
                    ? 'bg-[#B91C1C] text-white shadow-none border-4 border-[#FECDD3]'
                    : 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-none border-4 border-[#D8DCF5]'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={isRecording ? t('Stop Recording') : t('Start Voice Recording')}
              >
                {isProcessing ? (
                  <SwirlingLoader className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                ) : (
                  <Mic className={`w-8 h-8 sm:w-9 sm:h-9 ${isRecording ? 'animate-pulse' : ''}`} />
                )}
              </button>
            </div>

            {/** Status & Feedback - Plain text without any rounded pill box */}
            <div className="flex flex-col items-center justify-center min-h-[48px] px-2">
              <p className="text-sm sm:text-base font-semibold text-[#191E2B] px-4">
                {transcript || (isRecording ? t('Listening... Speak now!') : t('Tap mic to start billing'))}
              </p>
              <p className="text-xs font-medium text-[#757F94] mt-1">
                {isRecording
                  ? t('Listening for customer name, item name & quantity...')
                  : t('Auto-matches products from your catalog & drafts invoice')}
              </p>
            </div>

            {/** How to Use Guide for Voice Mode */}
            <div className="w-full border-t border-[#E8ECF2] pt-4 mt-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4E5668] mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
                <span>{t('How to Use Voice Billing')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left mb-4">
                <div className="bg-white border border-[#DCE1EA] rounded-lg p-3">
                  <span className="inline-block text-[10px] font-semibold text-[#4338CA] bg-[#EEF0FB] px-1.5 py-0.5 rounded mb-1">
                    {t('Step 1')}
                  </span>
                  <p className="text-xs font-semibold text-[#191E2B]">{t('Tap Mic')}</p>
                  <p className="text-[11px] font-medium text-[#757F94] mt-0.5 leading-snug">
                    {t('Click mic button to start recording')}
                  </p>
                </div>

                <div className="bg-white border border-[#DCE1EA] rounded-lg p-3">
                  <span className="inline-block text-[10px] font-semibold text-[#4338CA] bg-[#EEF0FB] px-1.5 py-0.5 rounded mb-1">
                    {t('Step 2')}
                  </span>
                  <p className="text-xs font-semibold text-[#191E2B]">{t('Speak Your Bill')}</p>
                  <p className="text-[11px] font-medium text-[#757F94] mt-0.5 leading-snug">
                    {t('Name customer, item name & quantity')}
                  </p>
                </div>

                <div className="bg-white border border-[#DCE1EA] rounded-lg p-3">
                  <span className="inline-block text-[10px] font-semibold text-[#4338CA] bg-[#EEF0FB] px-1.5 py-0.5 rounded mb-1">
                    {t('Step 3')}
                  </span>
                  <p className="text-xs font-semibold text-[#191E2B]">{t('Review & Save')}</p>
                  <p className="text-[11px] font-medium text-[#757F94] mt-0.5 leading-snug">
                    {t('Draft is auto-created with stock matching')}
                  </p>
                </div>
              </div>

              {/** Example Voice Commands */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-[#757F94] text-center">
                  {t('Sample Voice Commands (Try Speaking These)')}:
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                  <div className="bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] px-3 py-1.5 rounded-lg text-[11px] font-medium text-center">
                    🛒 "{t('Rahul ko 2 packet Parle-G aur 1 frooti do')}"
                  </div>
                  <div className="bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] px-3 py-1.5 rounded-lg text-[11px] font-medium text-center">
                    📋 "{t('Suresh ko 5 packet Maggi udhar likho')}"
                  </div>
                  <div className="bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] px-3 py-1.5 rounded-lg text-[11px] font-medium text-center">
                    💰 "{t('Ramesh se 500 rupaye jama mila')}"
                  </div>
                </div>
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
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                  {t('Type your billing command in plain words')}
                </label>
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full h-11 sm:h-12 rounded-lg border border-[#DCE1EA] px-3.5 text-[13px] sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA] bg-white text-[#191E2B] placeholder-[#9AA4B8] placeholder:text-[13px] sm:placeholder:text-sm shadow-none"
                  placeholder={t('Ramesh ko 2 bread aur 1 amul butter ka bill banao, cash me')}
                  disabled={isProcessing}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !manualText.trim()}
                className="cursor-pointer w-full h-10 sm:h-11 flex justify-center items-center px-4 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all focus:outline-none shadow-none"
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

              {/** How to Use Guide for Manual Mode */}
              <div className="border-t border-[#E8ECF2] pt-4 mt-2 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4E5668]">
                  <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>{t('How to Use & Quick Examples')}</span>
                </div>

                <p className="text-xs font-medium text-[#757F94] leading-relaxed">
                  {t('Type in plain Hindi or English with customer name, items, and quantity. Click any sample below to auto-fill:')}
                </p>

                <div className="flex flex-wrap gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setManualText(t('Rahul ko 2 packet Parle-G aur 1 frooti do, cash me'))}
                    className="cursor-pointer bg-[#EEF0FB] hover:bg-[#E0E4F9] text-[#4338CA] border border-[#D8DCF5] px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors text-left active:scale-95"
                  >
                    🛒 {t('Rahul ko 2 packet Parle-G aur 1 frooti do, cash me')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualText(t('Suresh ko 5 packet Maggi udhar likho'))}
                    className="cursor-pointer bg-[#EEF0FB] hover:bg-[#E0E4F9] text-[#4338CA] border border-[#D8DCF5] px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors text-left active:scale-95"
                  >
                    📋 {t('Suresh ko 5 packet Maggi udhar likho')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualText(t('Ramesh se 500 rupaye jama mila'))}
                    className="cursor-pointer bg-[#EEF0FB] hover:bg-[#E0E4F9] text-[#4338CA] border border-[#D8DCF5] px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors text-left active:scale-95"
                  >
                    💰 {t('Ramesh se 500 rupaye jama mila')}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/** 🛒 PROFESSIONAL POS BILL DRAFT (1:1 with User Specification & Market Standards) */}
        {draftBill && (
          <div className="bg-white rounded-xl border border-[#DCE1EA] p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-5 shadow-none animate-slide-up">
            {/** Header (Clean, zero clutter) */}
            <div className="pb-3 border-b border-[#E8ECF2]">
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
            <div ref={customerSectionRef} className="space-y-1.5 scroll-mt-20">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-[13px] font-semibold text-[#191E2B]">
                  {t('Billed To Customer')}:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isAddCustomerOpen;
                    setIsAddCustomerOpen(nextState);
                    if (nextState) {
                      setTimeout(() => customerPhoneInputRef.current?.focus(), 250);
                    }
                  }}
                  className="cursor-pointer bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] hover:bg-[#E0E4F9] h-6 sm:h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-none"
                >
                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{t('Create Customer')}</span>
                </button>
              </div>

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
                onCreateNew={(term) => {
                  setQuickAddCustomerName(term);
                  setIsAddCustomerOpen(true);
                }}
                createButtonLabel={t('Create Customer')}
              />

              {/** Customer suggestion chips */}
              {Array.isArray(draftBill.customerSuggestions) && draftBill.customerSuggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-medium text-[#4E5668]">{t('Suggestions')}:</span>
                  {draftBill.customerSuggestions.map((sug) => (
                    <button
                      key={sug._id}
                      type="button"
                      onClick={() => handleSelectCustomerSuggestion(sug)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#432BC9] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] rounded-lg transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-[#432BC9]" />
                      <span>{sug.name} {sug.phone ? `(${sug.phone})` : ''}</span>
                    </button>
                  ))}
                </div>
              )}

              {/** Inline Quick-Add Customer Box (Right Under Customer Selection) */}
              <QuickAddCustomer
                isOpen={isAddCustomerOpen}
                initialName={
                  quickAddCustomerName ||
                  (draftBill?.customerName &&
                  draftBill.customerName !== t('Counter Sale') &&
                  draftBill.customerName !== 'Counter Sale'
                    ? draftBill.customerName
                    : '')
                }
                isSpokenName={Boolean(isNewSpokenCustomer && draftBill?.customerName)}
                phoneInputRef={customerPhoneInputRef}
                onClose={() => {
                  setIsAddCustomerOpen(false);
                  setQuickAddCustomerName('');
                }}
                onSuccess={(created) => {
                  setIsAddCustomerOpen(false);
                  setQuickAddCustomerName('');
                  if (created?._id) {
                    setDraftBill((prev) => ({
                      ...prev,
                      customerId: created._id,
                      customerName: created.name,
                      customerPhone: created.phone,
                      customerBalance: 0,
                      isNewSpokenCustomer: false,
                      newCustomerPhone: '',
                    }));
                  }
                }}
              />
            </div>

            {/** 2. Products & Line Items Builder (Bulletproof 2-Tier Responsive Design) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-[13px] font-semibold text-[#191E2B]">
                  {t('INVOICE LINE ITEMS')} ({draftBill.products.length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddProductLineIndex(null);
                    setQuickAddProductName('');
                    setIsAddProductOpen(!isAddProductOpen);
                  }}
                  className="cursor-pointer bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] hover:bg-[#E0E4F9] h-6 sm:h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-none"
                >
                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{t('Add Product')}</span>
                </button>
              </div>

              {/** Inline Quick-Add Product Box */}
              <QuickAddProduct
                isOpen={isAddProductOpen}
                initialName={quickAddProductName}
                onClose={() => {
                  setIsAddProductOpen(false);
                  setQuickAddProductName('');
                  setQuickAddProductLineIndex(null);
                }}
                onSuccess={(created) => {
                  setIsAddProductOpen(false);
                  setQuickAddProductName('');
                  if (created?._id) {
                    setDraftBill((prev) => {
                      const nextProducts = [...prev.products];
                      const targetIdx =
                        quickAddProductLineIndex !== null && quickAddProductLineIndex !== undefined
                          ? quickAddProductLineIndex
                          : nextProducts.findIndex((p) => !p.productId);

                      if (targetIdx !== -1 && nextProducts[targetIdx]) {
                        const currentQty = nextProducts[targetIdx].quantity || 1;
                        nextProducts[targetIdx] = {
                          productId: created._id,
                          name: created.name,
                          rawSpokenName: nextProducts[targetIdx].rawSpokenName || created.name,
                          price: created.price,
                          quantity: currentQty,
                          stock: created.stock,
                          total: created.price * currentQty,
                          matched: true,
                        };
                      } else {
                        nextProducts.push({
                          productId: created._id,
                          name: created.name,
                          rawSpokenName: created.name,
                          price: created.price,
                          quantity: 1,
                          stock: created.stock,
                          total: created.price,
                          matched: true,
                        });
                      }
                      setQuickAddProductLineIndex(null);
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
                }}
              />

              {/** Line Item Cards */}
              <div className="space-y-2.5">
                {draftBill.products.map((item, index) => {
                  const stockVal = item.stock !== null && item.stock !== undefined ? Number(item.stock) : null;
                  const isOutOfStock = stockVal !== null && stockVal <= 0;
                  const isMapped = Boolean(item.productId);

                  return (
                    <div
                      key={index}
                      className="bg-white p-3 sm:p-3.5 rounded-xl border border-[#DCE1EA] hover:border-[#CBD5E1] transition-all space-y-2.5 shadow-none"
                    >
                      {/** Unmatched product guidance banner with 1-click Add to Catalog button */}
                      {!isMapped && (
                        <div className="text-[11px] sm:text-xs font-medium text-[#92400E] bg-[#FFFBEB] p-2.5 rounded-lg border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Sparkles className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                            <span className="truncate">
                              {item.name
                                ? `${t('Product not found in store')}: "${item.name}"`
                                : t('Please choose a product from catalog')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickAddProductLineIndex(index);
                              setQuickAddProductName(item.name || item.rawSpokenName || '');
                              setIsAddProductOpen(true);
                            }}
                            className="cursor-pointer shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#432BC9] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] rounded-lg transition-all active:scale-95 shadow-none self-start sm:self-auto"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('Add to Catalog')}</span>
                          </button>
                        </div>
                      )}

                      {/** Line item suggestion chips */}
                      {Array.isArray(item.suggestions) && item.suggestions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[11px] font-medium text-[#4E5668]">{t('Suggestions')}:</span>
                          {item.suggestions.map((sug) => (
                            <button
                              key={sug._id}
                              type="button"
                              onClick={() => handleProductSelect(index, sug._id, item.rawSpokenName || item.name)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#432BC9] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] rounded-lg transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-[#432BC9]" />
                              <span>{sug.name} {sug.price ? `(₹${sug.price})` : ''}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/** If selected product is out of stock, show warning badge */}
                      {isMapped && isOutOfStock && (
                        <div className="text-[11px] font-semibold text-[#B91C1C] bg-[#FEF2F2] px-2.5 py-1 rounded-md border border-[#FECDD3] flex items-center gap-1.5 w-fit">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{t('Out of Stock')} (0)</span>
                        </div>
                      )}

                      {/** Responsive Line Item Row: Full width dropdown on mobile, single flex row on desktop */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/** Product Selector */}
                        <div className="flex-1 min-w-0">
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
                            onCreateNew={(term) => {
                              setQuickAddProductLineIndex(index);
                              setQuickAddProductName(term);
                              setIsAddProductOpen(true);
                            }}
                            createButtonLabel={t('Create Product')}
                          />
                        </div>

                        {/** Controls: Stepper & Rounded Delete Button (Height precisely matched to SearchableSelect 42px) */}
                        <div className="flex items-center justify-end gap-2 sm:gap-2.5 shrink-0">
                          {/** Stepper [-] [Qty] [+] with distinct background & exact 42px height */}
                          <div className="flex items-center border border-[#DCE1EA] rounded-lg bg-[#F0F2F6] h-[42px] overflow-hidden shrink-0">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(index, item.quantity - 1)}
                              className="cursor-pointer w-8 sm:w-9 h-full flex items-center justify-center text-[#4E5668] bg-[#F0F2F6] hover:bg-[#E4E7ED] hover:text-[#191E2B] active:bg-[#DCE1EA] transition-colors select-none"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity !== undefined && item.quantity !== null ? item.quantity : 1}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              onBlur={() => {
                                if (!item.quantity || Number(item.quantity) < 1) {
                                  handleQuantityChange(index, 1);
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-10 sm:w-12 h-full text-center text-sm font-semibold text-[#191E2B] bg-white border-x border-[#DCE1EA] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min="1"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(index, item.quantity + 1)}
                              className="cursor-pointer w-8 sm:w-9 h-full flex items-center justify-center text-[#4E5668] bg-[#F0F2F6] hover:bg-[#E4E7ED] hover:text-[#191E2B] active:bg-[#DCE1EA] transition-colors select-none"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>

                          {/** Rounded Delete Button matching CreateBillModal with exact 42px height */}
                          {draftBill.products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="cursor-pointer text-[#B91C1C] bg-[#FFF1F2] hover:bg-[#FFE4E6] hover:text-[#991B1B] w-[42px] h-[42px] flex items-center justify-center rounded-full transition-all active:scale-95 shrink-0 border border-[#FECDD3]"
                              aria-label={t('Remove item')}
                              title={t('Remove item')}
                            >
                              <Trash2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
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
                    value={draftBill.discountInput !== undefined && draftBill.discountInput !== null ? draftBill.discountInput : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftBill((prev) => ({
                        ...prev,
                        discountInput: val === '' ? '' : Math.max(0, parseFloat(val) || 0),
                      }));
                    }}
                    onFocus={(e) => {
                      if (e.target.value === '0') e.target.select();
                    }}
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
                    setDraftBill((prev) => ({
                      ...prev,
                      paymentMode: mode,
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
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668]">
                    {t('Amount Paid')} <span className="text-[#B91C1C]">*</span>
                  </label>
                  {totalAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftBill((prev) => ({ ...prev, amountPaid: totalAmount }))}
                      className="cursor-pointer text-[11px] font-semibold text-[#4338CA] hover:underline"
                    >
                      {t('Full Amount')} (₹{totalAmount})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={draftBill.amountPaid !== undefined && draftBill.amountPaid !== null ? draftBill.amountPaid : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraftBill((prev) => ({
                      ...prev,
                      amountPaid: val === '' ? '' : Math.max(0, parseFloat(val) || 0),
                    }));
                  }}
                  onFocus={(e) => {
                    if (e.target.value === '0') e.target.select();
                  }}
                  className={inputCls}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>


            {isWalkin && newPending > 0 && (
              <div className="bg-[#FEF2F2] border border-[#FECDD3] rounded-lg p-3 text-xs text-[#B91C1C] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t('Udhaar is not allowed for Counter Sale. Please enter full amount paid or select a customer.')}</span>
              </div>
            )}

            {isCreditLimitExceeded && (
              <div className="bg-[#FFF1F2] border-l-[3px] border-[#B91C1C] p-2.5 sm:p-3 rounded-r-md flex items-start gap-2 sm:gap-2.5 animate-fade-in shadow-none">
                <AlertCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#B91C1C] shrink-0 mt-[1px] sm:mt-[2px]" />
                <div>
                  <h4 className="text-[13px] sm:text-sm font-semibold text-[#991B1B] leading-none mb-1">{t('Credit Limit Exceeded')}</h4>
                  <p className="text-[11px] sm:text-xs font-medium text-[#B91C1C] leading-snug">
                    {t('This bill will increase the customer\'s pending balance to')} ₹{newTotalBalance.toLocaleString('en-IN')}, {t('which exceeds the limit of')} ₹{creditLimit.toLocaleString('en-IN')}.
                  </p>
                </div>
              </div>
            )}

            {/** 6. Action Triggers (Solid, responsive side-by-side on all viewports) */}
            <div className="flex items-center gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraftBill(null)}
                className="cursor-pointer flex-1 sm:flex-none sm:w-36 min-h-[44px] h-[44px] sm:h-[46px] rounded-lg text-xs sm:text-sm font-semibold text-[#4E5668] bg-[#F0F2F6] hover:bg-[#EBEEF4] border border-[#DCE1EA] active:scale-[0.98] transition-all flex items-center justify-center shrink-0 shadow-none"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleFinalizeBill}
                disabled={isSubmitting}
                className="cursor-pointer flex-[2] sm:flex-1 min-h-[44px] h-[44px] sm:h-[46px] rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 shrink-0 shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>{t('Processing...')}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t('Create Bill & Invoice')} ({`₹${totalAmount.toLocaleString('en-IN')}`})</span>
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
            className="bg-white border border-[#DCE1EA] rounded-xl p-4 sm:p-6 space-y-4 animate-slide-up shadow-none"
          >
            {/** Header */}
            <div className="pb-3 border-b border-[#E8ECF2]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-[#4338CA] shrink-0" />
                <h2 className="text-base sm:text-lg font-semibold text-[#191E2B]">
                  {t('Review Khata Entry')}
                </h2>
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-[#757F94] mt-0.5">
                {t('Verify transaction details before saving to customer ledger')}
              </p>
            </div>

            <div className="space-y-3.5">
              {/** Customer Selection Section */}
              <div ref={khataCustomerSectionRef} className="space-y-1.5 scroll-mt-20">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-[13px] font-semibold text-[#191E2B]">
                    {t('Customer')}: <span className="text-[#B91C1C]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !isAddCustomerOpen;
                      setIsAddCustomerOpen(nextState);
                      if (nextState) {
                        setTimeout(() => customerPhoneInputRef.current?.focus(), 250);
                      }
                    }}
                    className="cursor-pointer bg-[#EEF0FB] text-[#4338CA] border border-[#D8DCF5] hover:bg-[#E0E4F9] h-6 sm:h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-none"
                  >
                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{t('Create Customer')}</span>
                  </button>
                </div>

                <SearchableSelect
                  options={transactionCustomerOptions}
                  value={draftTransaction.customerId}
                  onChange={(val) => {
                    const selected = customersData.find((c) => String(c._id) === val);
                    setDraftTransaction((prev) => ({
                      ...prev,
                      customerId: val,
                      customerName: selected ? selected.name : (val === 'NEW_SPOKEN_CUSTOMER' ? prev.customerName : ''),
                      customerPhone: selected ? selected.phone : '',
                      isNewSpokenCustomer: val === 'NEW_SPOKEN_CUSTOMER',
                    }));
                  }}
                  placeholder={t('Select Customer')}
                  searchPlaceholder={t('Search by name or phone...')}
                  onCreateNew={(term) => {
                    setQuickAddCustomerName(term);
                    setIsAddCustomerOpen(true);
                  }}
                  createButtonLabel={t('Create Customer')}
                />

                {/** Customer suggestion chips */}
                {Array.isArray(draftTransaction.customerSuggestions) && draftTransaction.customerSuggestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-medium text-[#4E5668]">{t('Suggestions')}:</span>
                    {draftTransaction.customerSuggestions.map((sug) => (
                      <button
                        key={sug._id}
                        type="button"
                        onClick={() => handleSelectCustomerSuggestion(sug)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#432BC9] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] rounded-lg transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-[#432BC9]" />
                        <span>{sug.name} {sug.phone ? `(${sug.phone})` : ''}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/** Inline Quick-Add Customer Box (Right Under Customer Selection) */}
                <QuickAddCustomer
                  isOpen={isAddCustomerOpen}
                  initialName={
                    quickAddCustomerName ||
                    (draftTransaction?.customerName &&
                    draftTransaction.customerName !== t('Counter Sale') &&
                    draftTransaction.customerName !== 'Counter Sale'
                      ? draftTransaction.customerName
                      : '')
                  }
                  isSpokenName={Boolean(draftTransaction?.isNewSpokenCustomer && draftTransaction?.customerName)}
                  phoneInputRef={customerPhoneInputRef}
                  onClose={() => {
                    setIsAddCustomerOpen(false);
                    setQuickAddCustomerName('');
                  }}
                  onSuccess={(created) => {
                    setIsAddCustomerOpen(false);
                    setQuickAddCustomerName('');
                    if (created?._id) {
                      setDraftTransaction((prev) => ({
                        ...prev,
                        customerId: created._id,
                        customerName: created.name,
                        customerPhone: created.phone,
                        isNewSpokenCustomer: false,
                      }));
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                  {t('Amount')} (₹) <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={draftTransaction.amount}
                  onChange={(e) => setDraftTransaction((prev) => ({ ...prev, amount: e.target.value }))}
                  onFocus={(e) => {
                    if (e.target.value === '0') e.target.select();
                  }}
                  required
                  placeholder="0"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                    {t('Transaction Type')}
                  </label>
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
                  <label className="block text-xs sm:text-[13px] font-medium text-[#4E5668] mb-1.5">
                    {t('Payment Mode')}
                  </label>
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

            <div className="flex items-center gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraftTransaction(null)}
                className="cursor-pointer flex-1 sm:flex-none sm:w-36 min-h-[44px] h-[44px] sm:h-[46px] rounded-lg text-xs sm:text-sm font-semibold text-[#4E5668] bg-[#F0F2F6] hover:bg-[#EBEEF4] border border-[#DCE1EA] active:scale-[0.98] transition-all flex items-center justify-center shrink-0 shadow-none"
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer flex-[2] sm:flex-1 min-h-[44px] h-[44px] sm:h-[46px] rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 shrink-0 shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>{t('Saving...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
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

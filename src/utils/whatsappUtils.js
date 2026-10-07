import toast from 'react-hot-toast';
import api from '../api/axios';

/**
 * Formats phone number for WhatsApp API
 * @param {string} phone - The phone number
 * @returns {string} Formatted phone number with country code
 */
export const formatWhatsAppNumber = (phone) => {
  if (!phone) return '';
  let p = phone.toString().replace(/\D/g, '');
  if (p.startsWith('91') && p.length > 10) p = p.slice(2);
  if (p.startsWith('0') && p.length > 10) p = p.slice(1);
  if (p.length >= 10) p = p.slice(-10);
  return `91${p}`;
};

/**
 * Shares a bill/statement on WhatsApp manually.
 * Accepts an optional generatePdfFn callback to download the PDF before sharing.
 * @param {Object} data - The data object containing customer and bill details
 * @param {string} shopName - The name of the shop/business sending the reminder
 * @param {Function} [generatePdfFn] - Optional callback to generate and download the PDF
 */
export const shareToWhatsApp = async (data, shopName = 'UdharPay Business', generatePdfFn = null) => {
  try {
    toast.loading('Preparing WhatsApp message...', { id: 'wa-share' });

    let settings = data.shopSettings;
    if (!settings) {
        try {
            const res = await api.get('/settings');
            settings = res.data.data;
        } catch (err) {
            console.error('Failed to fetch settings for whatsapp share', err);
        }
    }

    const { customer, amount, dueDate, type, billNumber } = data;
    
    if (!customer?.phone) {
      toast.error('Customer phone number is missing!', { id: 'wa-share' });
      return;
    }

    const waNumber = formatWhatsAppNumber(customer.phone);
    
    let token = data.billData?.publicViewToken;
    if (data.billData?._id && !token) {
        // Fallback: If React Query has stale data without the token, fetch it real-time
        try {
            const res = await api.get(`/bills/${data.billData._id}`);
            if (res.data?.data?.publicViewToken) {
                token = res.data.data.publicViewToken;
            }
        } catch (err) {
            console.error('Failed to fetch latest bill token for WhatsApp share', err);
        }
    }

    // 2. Build smart professional bilingual message template
    // 2. Build smart professional separated bilingual message template
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    const displayAmount = amount ?? 0;
    const absAmount = Math.abs(displayAmount);
    
    const appUrl = import.meta.env.VITE_WHATSAPP_SHARE_URL || window.location.origin;

    const finalShopName = settings?.shopName || shopName || 'UdharPay Business';
    const shopAddress = settings?.shopAddress || data.shopDetails?.shopAddress || '';
    const shopPhone = settings?.shopPhone || data.shopDetails?.phone || data.shopDetails?.shopPhone || '';

    const shopEmail = settings?.shopEmail || data.shopDetails?.shopEmail || data.shopDetails?.email || '';

    let secureLink = '';
    if (data.billData?._id && token) {
        secureLink = `${appUrl}/invoice/public/${data.billData._id}?token=${token}`;
    }

    let message = `🏪 *${finalShopName.toUpperCase()}*\n`;
    if (shopPhone) message += `📞 Phone: ${shopPhone}\n`;
    if (shopEmail) message += `📧 Email: ${shopEmail}\n`;
    if (shopAddress) message += `📍 Address: ${shopAddress}\n`;
    message += `------------------------\n\n`;

    message += `👤 *Dear ${customer.name},* (नमस्ते)\n`;
    if (type === 'receipt') {
        message += `Here is your digital receipt / यह आपकी डिजिटल रसीद है।\n\n`;
    } else {
        message += `This is a reminder for your pending account / यह आपके बकाया खाते का रिमाइंडर है।\n\n`;
        if (dueDate && displayAmount > 0) {
            const dateObj = new Date(dueDate);
            message += `⏰ *Due Date (अंतिम तिथि):* ${dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n\n`;
        }
    }

    if (secureLink) {
        message += `🔗 *View / Download Invoice (रसीद यहाँ देखें):*\n`;
        message += `${secureLink}\n\n`;
    }

    if (type === 'receipt' && data.billData) {
        message += `------------------------\n`;
        if (billNumber) message += `🧾 *Bill No (बिल नंबर):* ${billNumber}\n`;
        message += `📅 *Date (तारीख):* ${currentDate}\n\n`;

        message += `💰 *BILL SUMMARY (बिल का विवरण)*\n`;
        message += `Total Bill (कुल बिल): ₹${data.billData.grandTotal}\n`;
        
        const paid = data.billData.amountPaid || 0;
        if (paid > 0) {
            message += `Amount Paid (जमा राशि): ₹${paid}\n`;
        }
        
        const remaining = data.billData.grandTotal - paid;
        if (remaining > 0) {
            message += `Bill Due (बकाया बिल): ₹${remaining}\n`;
        } else {
            message += `Status (स्थिति): PAID ✅\n`;
        }
        message += `\n`;
    }

    message += `------------------------\n`;
    message += `📊 *ACCOUNT STATUS (कुल खाता)*\n`;
    if (displayAmount > 0) {
        message += `🔴 *Pending Due (कुल बकाया): ₹${absAmount}*\n`;
        message += `_(Please clear your dues soon / कृपया अपना बकाया जल्द चुकाएं)_\n`;
    } else if (displayAmount < 0) {
        message += `🟢 *Advance (एडवांस): ₹${absAmount}*\n`;
        message += `_(Will be adjusted next time / अगली बार एडजस्ट कर दिया जाएगा)_\n`;
    } else {
        message += `✅ *Pending Due (कुल बकाया): ₹0*\n`;
        message += `_(Account is settled / खाता क्लियर है)_\n`;
    }

    message += `\n🤝 Thank you for your business! / धन्यवाद!\n`;
    message += `⚡ _Powered by UdharPay Business_\n`;
    message += `🌐 ${appUrl}`;

    const encodedMessage = encodeURIComponent(message);
    const waLink = `https://wa.me/${waNumber}?text=${encodedMessage}`;

    // 3. Open WhatsApp link
    toast.success('Opening WhatsApp... Secure link included in message.', { id: 'wa-share', duration: 4000 });
    
    // Open in a new tab/window
    window.open(waLink, '_blank');

  } catch (error) {
    console.error('WhatsApp Share Error:', error);
    toast.error('Failed to prepare WhatsApp share', { id: 'wa-share' });
  }
};

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
    
    // 1. Run PDF generator callback if provided
    if (generatePdfFn) {
      try {
        await generatePdfFn();
      } catch (pdfErr) {
        console.error("PDF generation error, continuing with text only:", pdfErr);
        toast.error("Couldn't generate PDF, but sending text message.", { id: 'wa-share', duration: 3000 });
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

    let message = `========================\n`;
    message += `🏪 *${finalShopName.toUpperCase()}*\n`;
    if (shopPhone) message += `📞 Phone/फ़ोन: ${shopPhone}\n`;
    if (shopAddress) message += `📍 Address/पता: ${shopAddress}\n`;
    message += `========================\n\n`;

    const items = data.billData?.products || data.billData?.items || [];

    message += `👤 Dear / प्रिय *${customer.name}*,\n\n`;

    if (type === 'receipt') {
        if (billNumber) message += `🧾 Bill No / बिल संख्या: ${billNumber}\n`;
        message += `📅 Date / दिनांक: ${currentDate}\n\n`;

        if (items.length > 0) {
            message += `🛒 *ITEMS / सामान*\n`;
            message += `------------------------\n`;
            items.forEach((item, index) => {
                const itemName = item.name || item.product?.name || item.item || `Item ${index + 1}`;
                message += `${item.quantity} x ${itemName} = ₹${item.total || (item.quantity * item.price)}\n`;
            });
            message += `------------------------\n\n`;
        }
        
        if (data.billData) {
            message += `💰 *BILL SUMMARY / बिल का हिसाब*\n`;
            message += `------------------------\n`;
            message += `Total Bill (कुल बिल): ₹${data.billData.grandTotal}\n`;
            message += `Amount Paid (जमा): ₹${data.billData.amountPaid || 0}\n`;
            
            const remaining = data.billData.grandTotal - (data.billData.amountPaid || 0);
            if (remaining > 0) {
                message += `Due (इस बिल का बाकी): ₹${remaining}\n`;
            } else {
                message += `Status (स्टेटस): PAID ✅\n`;
            }
            message += `------------------------\n\n`;
        }
    } else if (type === 'reminder' || data.isReminder) {
        message += `This is a friendly reminder. / यह एक अनुस्मारक है।\n\n`;
        if (dueDate && displayAmount > 0) {
            const dateObj = new Date(dueDate);
            message += `⏰ Due Date (अंतिम तिथि): *${dateObj.toLocaleDateString('en-IN')}*\n\n`;
        }
    }

    message += `📊 *ACCOUNT STATUS / खाता स्थिति*\n`;
    message += `------------------------\n`;
    if (displayAmount > 0) {
        message += `🔴 Pending Due (कुल बकाया): ₹${absAmount}\n`;
        message += `Please clear dues. (कृपया जल्द भुगतान करें।)\n`;
    } else if (displayAmount < 0) {
        message += `🟢 Advance (एडवांस जमा): ₹${absAmount}\n`;
        message += `Adjusted next time. (अगले बिल में उपयोग होगा।)\n`;
    } else {
        message += `✅ Pending Due (कुल बकाया): ₹0\n`;
        message += `Account settled! (हिसाब बराबर है।)\n`;
    }
    message += `------------------------\n`;

    if (generatePdfFn) {
        message += `\n📎 _(Detailed PDF attached / विस्तृत PDF संलग्न है)_\n`;
    }

    message += `\n========================\n`;
    message += `🤝 Thank you! / धन्यवाद!\n`;
    message += `\n⚡ Generated via *UdharPay*\n`;
    message += `🌐 ${appUrl}`;

    const encodedMessage = encodeURIComponent(message);
    const waLink = `https://wa.me/${waNumber}?text=${encodedMessage}`;

    // 3. Open WhatsApp link
    toast.success('Opening WhatsApp... Please attach the downloaded PDF manually.', { id: 'wa-share', duration: 4000 });
    
    // Open in a new tab/window
    window.open(waLink, '_blank');

  } catch (error) {
    console.error('WhatsApp Share Error:', error);
    toast.error('Failed to prepare WhatsApp share', { id: 'wa-share' });
  }
};

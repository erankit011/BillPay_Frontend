/**
 * Retail Invoice PDF Generation Engine
 * Supports standard A4 invoices and 2-inch/3-inch thermal POS receipt layouts
 * with dynamic branding, GSTIN breakdown, itemized tables, and UPI payment QR codes.
 */

import { formatDate } from './dateUtils';

/**
 * Dynamic PDF Engine Loader
 * Dynamically imports jsPDF and autoTable chunks to optimize initial bundle weight
 */
const loadPdfEngine = async () => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  return { jsPDF, autoTable };
};

const formatCurrency = (amount) => {
  return 'Rs. ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
};

const fetchImageAsBase64 = async (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

/**
 * Generate Invoice PDF Handler
 * Constructs vector PDF document and triggers download, print dialog, or raw blob return
 */
export const generateInvoicePDF = async (bill, shopDetails, action = 'download', t = (str) => str, settings = {}) => {
  const { jsPDF, autoTable } = await loadPdfEngine();

  const isThermal = settings?.printerType === 'THERMAL_3INCH' || settings?.printerType === 'THERMAL_2INCH';
  if (isThermal) {
    return generateThermalPDF(bill, shopDetails, action, t, settings, jsPDF);
  }

  const doc = new jsPDF();
  
  /**
   * Business Metadata Extraction
   * Resolves store profile properties with fallback settings
   */
  const shopPhone = settings.shopPhone || '';
  const shopEmail = settings.shopEmail || '';
  const shopAddress = settings.shopAddress || '';
  const gstNumber = settings.gstNumber || '';
  const footerNote = settings.invoiceFooterNote || '';
  const termsText = settings.termsAndConditions || '';

  /**
   * Invoice Header & Merchant Identity
   * Formats top banner title and typography
   */
  doc.setFontSize(22);
  doc.setTextColor(9, 60, 93);
  
  let headerX = 14;
  
  /**
   * Store Brand Logo Rendering
   * Injects merchant brand mark when asset exists
   */
  if (settings.invoiceLogo) {
    const base64Logo = await fetchImageAsBase64(settings.invoiceLogo);
    if (base64Logo) {
      doc.addImage(base64Logo, 'JPEG', 14, 15, 25, 25, undefined, 'FAST');
      headerX = 43;
    }
  }

  doc.text((settings?.shopName || t('Shop Invoice')).toUpperCase(), headerX, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  let headerY = 27;
  if (shopEmail) {
      doc.text(shopEmail, headerX, headerY);
      headerY += 4.5;
  }
  if (shopPhone) {
      doc.text(`${t('Phone')}: ${shopPhone}`, headerX, headerY);
      headerY += 4.5;
  }
  if (shopAddress) {
      const splitAddr = doc.splitTextToSize(shopAddress, 90);
      doc.text(splitAddr, headerX, headerY);
      headerY += splitAddr.length * 4.5;
  }
  if (gstNumber) {
      doc.text(`${t('GST')}: ${gstNumber}`, headerX, headerY);
  }

  /**
   * Invoice Number & Metadata Section (Right-Aligned)
   * Displays invoice code, billing date, and payment status
   */
  doc.setFontSize(22);
  doc.setTextColor(9, 60, 93);
  doc.text(t('INVOICE'), 196, 22, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${t('Invoice No')}: ${bill.invoiceNumber}`, 196, 28, { align: 'right' });
  doc.text(`${t('Date')}: ${formatDate(bill.createdAt)}`, 196, 33, { align: 'right' });
  doc.text(`${t('Status')}: ${bill.paymentStatus}`, 196, 38, { align: 'right' });

  /**
   * Customer Details Section
   * Shows recipient contact, customer phone, and email records
   */
  doc.setFontSize(16);
  doc.setTextColor(9, 60, 93);
  doc.setFont('helvetica', 'normal');
  doc.text(t('CUSTOMER DETAILS'), 14, 46);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${t('Name')}: ${bill.customerId?.name || t('Counter Sale')}`, 14, 53);
  
  let customerY = 57.5;
  if (bill.customerId?.phone) {
    doc.text(`${t('Phone')}: ${bill.customerId.phone}`, 14, customerY);
    customerY += 4.5;
  }
  if (bill.customerId?.email) {
    doc.text(`${t('Email')}: ${bill.customerId.email}`, 14, customerY);
  }

  /**
   * Invoice Line Items Tabular Grid
   * Formats columns for item description, quantity, unit price, and extended total
   */
  const tableColumn = [
    { content: t("Item"), styles: { halign: 'left' } },
    { content: t("Quantity"), styles: { halign: 'left' } },
    { content: t("Price"), styles: { halign: 'right' } },
    { content: t("Total"), styles: { halign: 'right' } }
  ];
  const tableRows = [];

  if (bill.products && bill.products.length > 0) {
    bill.products.forEach(item => {
      const itemData = [
        item.name || item.productName || 'Unknown Item',
        item.quantity?.toString() || '0',
        formatCurrency(item.price || 0),
        formatCurrency((item.price || 0) * (item.quantity || 0))
      ];
      tableRows.push(itemData);
    });
  }

  autoTable(doc, {
    startY: 68,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [9, 60, 93], textColor: 255, lineWidth: 0.1, lineColor: [9, 60, 93] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 80, halign: 'left' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 'auto', halign: 'right' },
      3: { cellWidth: 'auto', halign: 'right' }
    }
  });

  /**
   * Financial Summary & Taxation
   * Calculates subtotal, GST split (CGST + SGST), discounts, and net payable
   */
  const finalY = doc.lastAutoTable.finalY || 68;
  const rightColX = 140;
  const valuesX = 196;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  doc.text(t('Subtotal') + ':', rightColX, finalY + 10);
  doc.text(formatCurrency(bill.subtotal || 0), valuesX, finalY + 10, { align: 'right' });

  let totalsY = finalY + 16;
  if (settings?.taxEnabled || bill.tax > 0) {
    if (settings?.gstSplit) {
      const halfTax = (bill.tax || 0) / 2;
      const halfRate = (settings.taxRate || 0) / 2;
      const rateStr = halfRate ? ` (${halfRate}%)` : '';
      doc.text(t('CGST') + rateStr + ':', rightColX, totalsY);
      doc.text(formatCurrency(halfTax), valuesX, totalsY, { align: 'right' });
      totalsY += 6;
      doc.text(t('SGST') + rateStr + ':', rightColX, totalsY);
      doc.text(formatCurrency(halfTax), valuesX, totalsY, { align: 'right' });
      totalsY += 6;
    } else {
      const taxRateStr = settings?.taxRate ? ` (${settings.taxRate}%)` : '';
      doc.text(t('Tax') + taxRateStr + ':', rightColX, totalsY);
      doc.text(formatCurrency(bill.tax || 0), valuesX, totalsY, { align: 'right' });
      totalsY += 6;
    }
  }
  
  if (bill.discount > 0) {
    doc.text(t('Discount') + ':', rightColX, totalsY);
    doc.text(`-${formatCurrency(bill.discount)}`, valuesX, totalsY, { align: 'right', textColor: [220, 38, 38] });
    totalsY += 6;
    doc.setTextColor(0);
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(t('Grand Total') + ':', rightColX, totalsY + 3);
  doc.text(formatCurrency(bill.grandTotal || 0), valuesX, totalsY + 3, { align: 'right' });

  /**
   * Settlement & Outstanding Balance
   * Displays amount collected, remaining credit, or advance payment surplus
   */
  totalsY += 10;
  doc.setFontSize(10);
  
  if (bill.paymentMode && (bill.amountPaid || 0) > 0) {
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`${t('Payment Mode')}: ${bill.paymentMode}`, 14, totalsY);
    doc.setFontSize(10);
  }
  
  doc.setTextColor(0);
  doc.text(t('Amount Paid') + ':', rightColX, totalsY);
  doc.setTextColor(22, 163, 74);
  doc.text(formatCurrency(bill.amountPaid || 0), valuesX, totalsY, { align: 'right' });
  doc.setTextColor(0);

  totalsY += 6;
  if (bill.grandTotal > (bill.amountPaid || 0)) {
    doc.text(t('Pending Amount') + ':', rightColX, totalsY);
    doc.setTextColor(220, 38, 38);
    doc.text(formatCurrency(bill.grandTotal - (bill.amountPaid || 0)), valuesX, totalsY, { align: 'right' });
    doc.setTextColor(0);
  } else if ((bill.amountPaid || 0) > bill.grandTotal) {
    doc.text(t('Advance Amount') + ':', rightColX, totalsY);
    doc.setTextColor(22, 163, 74);
    doc.text(formatCurrency((bill.amountPaid || 0) - bill.grandTotal), valuesX, totalsY, { align: 'right' });
    doc.setTextColor(0);
  }

  /**
   * Invoice Annotations & Memo
   * Renders optional shopkeeper comments and billing notes
   */
  if (bill.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(t('Notes:'), 14, finalY + 10);
    const splitNotes = doc.splitTextToSize(bill.notes, 100);
    doc.text(splitNotes, 14, finalY + 15);
  }

  /**
   * Terms & Conditions Clause
   * Prints merchant return, refund, and warranty policy notes
   */
  const pageHeight = doc.internal.pageSize.height;

  if (termsText) {
    const termsStartY = totalsY + 14;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'bold');
    doc.text(t('Terms & Conditions') + ':', 14, termsStartY);
    doc.setFont('helvetica', 'normal');
    const splitTerms = doc.splitTextToSize(termsText, 120);
    doc.text(splitTerms, 14, termsStartY + 5);
  }

  /**
   * Merchant Authorized Signature
   * Designated line for legal authorization and seal placement
   */
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.text(t('Authorized Signature'), 176, pageHeight - 35, { align: 'center' });
  doc.setDrawColor(0);
  doc.line(156, pageHeight - 40, 196, pageHeight - 40);

  /**
   * Document Footer & Attribution
   * Displays custom merchant gratitude note and platform watermark
   */
  doc.setDrawColor(220, 220, 220);
  doc.line(14, pageHeight - 20, 196, pageHeight - 20);

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'italic');
  const footerMessage = footerNote || t('Thank you for your business!');
  doc.text(footerMessage, 105, pageHeight - 14, { align: 'center' });
  
  const generatedDateStr = formatDate(new Date());
  
  doc.setFontSize(8);
  doc.text(`${t('Generated by UdharPay')} | ${generatedDateStr}`, 105, pageHeight - 8, { align: 'center' });

  /**
   * PDF Dispatch Action
   * Triggers native print preview dialog or triggers immediate file download
   */
  if (action === 'print') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Invoice_${bill.invoiceNumber}.pdf`);
  }
};

/**
 * Thermal POS Receipt Generator
 * Produces continuous receipt slip for 58mm / 80mm thermal printers
 */
const generateThermalPDF = async (bill, shopDetails, action, t, settings, jsPDF) => {
  const width = settings.printerType === 'THERMAL_2INCH' ? 58 : 80;
  const height = 100 + (bill.products?.length || 0) * 15;
  const doc = new jsPDF({ format: [width, height], unit: 'mm' });
  
  const centerText = (text, y, size = 10) => {
    doc.setFontSize(size);
    const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const x = (width - textWidth) / 2;
    doc.text(text, x, y);
  };

  let y = 10;
  
  /**
   * Thermal Receipt Header Logo
   * Compact grayscale logo rendering for thermal print heads
   */
  if (settings.invoiceLogo) {
    const base64Logo = await fetchImageAsBase64(settings.invoiceLogo);
    if (base64Logo) {
      const logoSize = 16;
      doc.addImage(base64Logo, 'JPEG', (width - logoSize) / 2, y, logoSize, logoSize, undefined, 'FAST');
      y += logoSize + 5;
    }
  }

  doc.setTextColor(0);
  centerText(settings?.shopName || t('Shop Invoice'), y, 14);
  y += 5;
  
  const shopPhone = settings.shopPhone;
  if (shopPhone) {
    centerText(`Ph: ${shopPhone}`, y, 9);
    y += 4;
  }
  
  doc.setLineWidth(0.2);
  doc.line(2, y, width - 2, y);
  y += 4;
  
  doc.setFontSize(9);
  doc.text(`Inv: ${bill.invoiceNumber}`, 2, y);
  doc.text(formatDate(bill.createdAt), width - 2, y, { align: 'right' });
  y += 5;
  
  doc.line(2, y, width - 2, y);
  y += 4;
  
  doc.setFontSize(9);
  doc.text(t('Item'), 2, y);
  doc.text(t('Qty'), width * 0.5, y);
  doc.text(t('Total'), width - 2, y, { align: 'right' });
  y += 2;
  doc.line(2, y, width - 2, y);
  y += 4;
  
  bill.products?.forEach(item => {
    const name = doc.splitTextToSize(item.name || item.productName || '', width * 0.45);
    doc.text(name, 2, y);
    doc.text(item.quantity?.toString() || '0', width * 0.5, y);
    doc.text(formatCurrency((item.price || 0) * (item.quantity || 0)), width - 2, y, { align: 'right' });
    y += name.length * 4.5;
  });
  
  doc.line(2, y, width - 2, y);
  y += 5;
  
  doc.text(t('Subtotal') + ':', 2, y);
  doc.text(formatCurrency(bill.subtotal || 0), width - 2, y, { align: 'right' });
  y += 4.5;
  
  if (settings?.taxEnabled || bill.tax > 0) {
    if (settings?.gstSplit) {
      const halfTax = (bill.tax || 0) / 2;
      doc.text(t('CGST') + ':', 2, y);
      doc.text(formatCurrency(halfTax), width - 2, y, { align: 'right' });
      y += 4.5;
      doc.text(t('SGST') + ':', 2, y);
      doc.text(formatCurrency(halfTax), width - 2, y, { align: 'right' });
      y += 4.5;
    } else {
      doc.text(t('Tax') + ':', 2, y);
      doc.text(formatCurrency(bill.tax || 0), width - 2, y, { align: 'right' });
      y += 4.5;
    }
  }
  
  if (bill.discount > 0) {
    doc.text(t('Discount') + ':', 2, y);
    doc.text(`-${formatCurrency(bill.discount)}`, width - 2, y, { align: 'right' });
    y += 4.5;
  }
  
  doc.setFontSize(10);
  doc.text(t('Grand Total') + ':', 2, y);
  doc.text(formatCurrency(bill.grandTotal || 0), width - 2, y, { align: 'right' });
  y += 6;
  
  centerText(settings.invoiceFooterNote || t('Thank you for your business!'), y, 9);
  
  if (action === 'print') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Receipt_${bill.invoiceNumber}.pdf`);
  }
};

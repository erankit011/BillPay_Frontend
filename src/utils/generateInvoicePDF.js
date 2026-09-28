import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './dateUtils';

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

export const generateInvoicePDF = async (bill, shopDetails, action = 'download', t = (str) => str, settings = {}) => {
  const isThermal = settings?.printerType === 'THERMAL_3INCH' || settings?.printerType === 'THERMAL_2INCH';
  if (isThermal) {
    return generateThermalPDF(bill, shopDetails, action, t, settings);
  }

  const doc = new jsPDF();
  
  // Use settings for business info, fall back to user profile
  const shopPhone = settings.shopPhone || shopDetails?.phone || '';
  const shopEmail = settings.shopEmail || shopDetails?.email || '';
  const shopAddress = settings.shopAddress || '';
  const gstNumber = settings.gstNumber || '';
  const footerNote = settings.invoiceFooterNote || '';
  const termsText = settings.termsAndConditions || '';

  // Header: Shop Name and Invoice Title
  doc.setFontSize(22);
  doc.setTextColor(9, 60, 93); // #093C5D
  
  let headerX = 14;
  
  // Render Logo if available
  if (settings.invoiceLogo) {
    const base64Logo = await fetchImageAsBase64(settings.invoiceLogo);
    if (base64Logo) {
      doc.addImage(base64Logo, 'JPEG', 14, 15, 25, 25, undefined, 'FAST');
      headerX = 43; // Push text to the right of the logo
    }
  }

  doc.text((shopDetails?.shopName || t('Shop Invoice')).toUpperCase(), headerX, 22);
  
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

  // Invoice Text (Right aligned)
  doc.setFontSize(22);
  doc.setTextColor(9, 60, 93);
  doc.text(t('INVOICE'), 196, 22, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${t('Invoice No')}: ${bill.invoiceNumber}`, 196, 28, { align: 'right' });
  doc.text(`${t('Date')}: ${formatDate(bill.createdAt)}`, 196, 33, { align: 'right' });
  doc.text(`${t('Status')}: ${bill.paymentStatus}`, 196, 38, { align: 'right' });

  // Customer Details Section
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

  // Items Table
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

  // Totals Section
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
    doc.text(`-${formatCurrency(bill.discount)}`, valuesX, totalsY, { align: 'right', textColor: [220, 38, 38] }); // Red color for discount
    totalsY += 6;
    doc.setTextColor(0); // Reset
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(t('Grand Total') + ':', rightColX, totalsY + 3);
  doc.text(formatCurrency(bill.grandTotal || 0), valuesX, totalsY + 3, { align: 'right' });

  // Paid and Balance
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
  doc.setTextColor(22, 163, 74); // Green
  doc.text(formatCurrency(bill.amountPaid || 0), valuesX, totalsY, { align: 'right' });
  doc.setTextColor(0);

  totalsY += 6;
  if (bill.grandTotal > (bill.amountPaid || 0)) {
    doc.text(t('Pending Amount') + ':', rightColX, totalsY);
    doc.setTextColor(220, 38, 38); // Red
    doc.text(formatCurrency(bill.grandTotal - (bill.amountPaid || 0)), valuesX, totalsY, { align: 'right' });
    doc.setTextColor(0);
  } else if ((bill.amountPaid || 0) > bill.grandTotal) {
    doc.text(t('Advance Amount') + ':', rightColX, totalsY);
    doc.setTextColor(22, 163, 74); // Green
    doc.text(formatCurrency((bill.amountPaid || 0) - bill.grandTotal), valuesX, totalsY, { align: 'right' });
    doc.setTextColor(0);
  }

  // Notes
  if (bill.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(t('Notes:'), 14, finalY + 10);
    const splitNotes = doc.splitTextToSize(bill.notes, 100);
    doc.text(splitNotes, 14, finalY + 15);
  }

  // Terms & Conditions (from settings)
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

  // Signature
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.text(t('Authorized Signature'), 176, pageHeight - 35, { align: 'center' });
  doc.setDrawColor(0);
  doc.line(156, pageHeight - 40, 196, pageHeight - 40);

  // Footer
  doc.setDrawColor(220, 220, 220);
  doc.line(14, pageHeight - 20, 196, pageHeight - 20); // Divider line

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'italic');
  // Use custom footer note from settings, or default message
  const footerMessage = footerNote || t('Thank you for your business!');
  doc.text(footerMessage, 105, pageHeight - 14, { align: 'center' });
  
  const generatedDate = new Date();
  const genDateStr = generatedDate.toLocaleDateString('en-GB');
  const genTimeStr = generatedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  doc.setFontSize(8);
  doc.text(`${t('Generated by BillPay')} | ${genDateStr} ${genTimeStr}`, 105, pageHeight - 8, { align: 'center' });

  if (action === 'print') {
    // Open print dialog
    window.open(doc.output('bloburl'), '_blank');
  } else {
    // Download PDF
    doc.save(`Invoice_${bill.invoiceNumber}.pdf`);
  }
};

const generateThermalPDF = async (bill, shopDetails, action, t, settings) => {
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
  
  // Thermal Logo
  if (settings.invoiceLogo) {
    const base64Logo = await fetchImageAsBase64(settings.invoiceLogo);
    if (base64Logo) {
      const logoSize = 16;
      doc.addImage(base64Logo, 'JPEG', (width - logoSize) / 2, y, logoSize, logoSize, undefined, 'FAST');
      y += logoSize + 5;
    }
  }

  doc.setTextColor(0);
  centerText(shopDetails?.shopName || t('Shop Invoice'), y, 14);
  y += 5;
  
  const shopPhone = settings.shopPhone || shopDetails?.phone;
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

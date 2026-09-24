import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './dateUtils';

const formatCurrency = (amount) => {
  return 'Rs. ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
};

export const generateInvoicePDF = (bill, shopDetails, action = 'download', t = (str) => str) => {
  const doc = new jsPDF();
  
  // Header: Shop Name and Invoice Title
  doc.setFontSize(22);
  doc.setTextColor(9, 60, 93); // #093C5D
  doc.text((shopDetails?.shopName || t('Shop Invoice')).toUpperCase(), 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  let headerY = 27;
  if (shopDetails?.email) {
      doc.text(shopDetails.email, 14, headerY);
      headerY += 4.5;
  }
  if (shopDetails?.phone) {
      doc.text(`${t('Phone')}: ${shopDetails.phone}`, 14, headerY);
      headerY += 4.5;
  }
  if (shopDetails?.address) {
      doc.text(shopDetails.address, 14, headerY);
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
  doc.text(`${t('Name')}: ${bill.customerId?.name || t('Walk-in Customer')}`, 14, 53);
  
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
  
  doc.text(t('Subtotal:'), rightColX, finalY + 10);
  doc.text(formatCurrency(bill.subtotal || 0), valuesX, finalY + 10, { align: 'right' });

  let totalsY = finalY + 16;
  if (bill.tax > 0) {
    doc.text(t('Tax:'), rightColX, totalsY);
    doc.text(formatCurrency(bill.tax), valuesX, totalsY, { align: 'right' });
    totalsY += 6;
  }
  
  if (bill.discount > 0) {
    doc.text(`${t('Discount')}:`, rightColX, totalsY);
    doc.text(`-${formatCurrency(bill.discount)}`, valuesX, totalsY, { align: 'right', textColor: [220, 38, 38] }); // Red color for discount
    totalsY += 6;
    doc.setTextColor(0); // Reset
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(t('Grand Total:'), rightColX, totalsY + 3);
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
  doc.text(`${t('Amount Paid')}:`, rightColX, totalsY);
  doc.setTextColor(22, 163, 74); // Green
  doc.text(formatCurrency(bill.amountPaid || 0), valuesX, totalsY, { align: 'right' });
  doc.setTextColor(0);

  totalsY += 6;
  if (bill.grandTotal > (bill.amountPaid || 0)) {
    doc.text(t('Pending Amount:'), rightColX, totalsY);
    doc.setTextColor(220, 38, 38); // Red
    doc.text(formatCurrency(bill.grandTotal - (bill.amountPaid || 0)), valuesX, totalsY, { align: 'right' });
    doc.setTextColor(0);
  } else if ((bill.amountPaid || 0) > bill.grandTotal) {
    doc.text(t('Advance Amount:'), rightColX, totalsY);
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

  // Signature
  const pageHeight = doc.internal.pageSize.height;
  
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
  doc.text(t('Thank you for your business!'), 105, pageHeight - 14, { align: 'center' });
  
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

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateStatementPDF = (filteredBills, filteredTransactions, statementPeriod, user, t, formatCurrency, formatDate) => {
  if (filteredBills.length === 0 && filteredTransactions.length === 0) {
    alert(t("No data available for the selected period."));
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Left side: Title and Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(9, 60, 93);
  doc.text(t('Store Statement'), 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100);
  const periodLabels = {
    'today': t('Today'),
    '7days': t('Last 7 Days'),
    '30days': t('Last 30 Days'),
    'all': t('All Time')
  };
  doc.text(`${t('Period')}: ${periodLabels[statementPeriod]}`, 14, 30);
  doc.text(`${t('Generated on')}: ${formatDate(new Date())}`, 14, 36);

  // Right side: Shop Details
  if (user) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(9, 60, 93);
    const shopName = user.shopName || user.name || 'UdharPay Shop';
    doc.text(shopName, pageWidth - 14, 22, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    let currentY = 28;
    if (user.phone) {
      doc.text(`Phone: ${user.phone}`, pageWidth - 14, currentY, { align: 'right' });
      currentY += 6;
    }
    if (user.email) {
      doc.text(`Email: ${user.email}`, pageWidth - 14, currentY, { align: 'right' });
    }
  }

  const tableColumn = [t("Invoice No"), t("Customer"), t("Date"), t("Amount"), t("Status")];
  const tableRows = [];

  let totalSales = 0;
  let totalCollections = 0;

  filteredBills.forEach(bill => {
    totalSales += bill.grandTotal;
    const billData = [
      bill.invoiceNumber,
      bill.customerId?.name || t('Walk-in Customer'),
      formatDate(bill.createdAt),
      `Rs ${bill.grandTotal}`,
      bill.paymentStatus
    ];
    tableRows.push(billData);
  });

  filteredTransactions.forEach(tx => {
    totalCollections += tx.amount;
  });

  const startY = user && (user.phone || user.email) ? 48 : 42;

  autoTable(doc, {
    startY: startY,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [9, 60, 93], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || startY;

  doc.setFontSize(11);
  doc.text(`${t('Total Bills')}: ${filteredBills.length}`, 14, finalY + 12);
  doc.text(`${t('Total Sales')}: Rs. ${totalSales.toLocaleString('en-IN')}`, 14, finalY + 18);
  doc.text(`${t('Total Collections')}: Rs. ${totalCollections.toLocaleString('en-IN')}`, 14, finalY + 24);

  doc.save(`Store_Statement_${statementPeriod}.pdf`);
};

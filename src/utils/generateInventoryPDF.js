import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInventoryPDF = (products, user, t, formatDate) => {
  if (!products || products.length === 0) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Left side: Title and Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(9, 60, 93);
  doc.text(t('Inventory Report'), 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${t('Generated on')}: ${formatDate(new Date())}`, 14, 30);

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

  const tableColumn = [t('Product Name'), t('Price (INR)'), t('Stock Qty'), t('Status'), t('Last Updated')];
  const tableRows = [];

  products.forEach(p => {
    const status = p.stock === 0 ? t('Out of Stock') : p.stock < 20 ? t('Low Stock') : t('In Stock');
    const date = formatDate(p.updatedAt || p.createdAt);
    const productData = [
      p.name,
      p.price.toString(),
      p.stock.toString(),
      status,
      date
    ];
    tableRows.push(productData);
  });

  const startY = user && (user.phone || user.email) ? 42 : 38;

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: startY,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [9, 60, 93], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

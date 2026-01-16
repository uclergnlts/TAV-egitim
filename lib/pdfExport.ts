/**
 * PDF Export Utility
 * Kurumsal antetli kağıt tasarımı ile PDF oluşturma
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFExportOptions {
    title: string;
    subtitle?: string;
    headers: string[];
    rows: (string | number)[][];
    filename: string;
    orientation?: 'portrait' | 'landscape';
    footer?: string;
}

// TAV Logo Base64 (SVG to PNG conversion için placeholder - gerçek logo base64 olarak eklenecek)
const TAV_LOGO_BASE64 = '';  // Logo base64 string buraya gelecek

/**
 * Kurumsal antetli PDF oluşturur
 */
export function exportToPDF(options: PDFExportOptions): void {
    const {
        title,
        subtitle,
        headers,
        rows,
        filename,
        orientation = 'landscape',
        footer
    } = options;

    const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // ========== HEADER SECTION ==========

    // Top border line (gradient effect with multiple lines)
    doc.setDrawColor(0, 51, 102); // TAV Blue
    doc.setLineWidth(2);
    doc.line(0, 0, pageWidth, 0);

    doc.setDrawColor(218, 165, 32); // Gold accent
    doc.setLineWidth(1);
    doc.line(0, 3, pageWidth, 3);

    // Header background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 5, pageWidth, 25, 'F');

    // Company Name (Left side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('TAV TEKNOLOJİLER', margin, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Eğitim Yönetim Sistemi', margin, 24);

    // Right side - Date and Document info
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Oluşturulma: ${dateStr} ${timeStr}`, pageWidth - margin, 14, { align: 'right' });
    doc.text(`Belge No: TAV-EGT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, pageWidth - margin, 20, { align: 'right' });

    // Separator line after header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 32, pageWidth - margin, 32);

    // ========== TITLE SECTION ==========

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 30, 30);
    doc.text(title, pageWidth / 2, 42, { align: 'center' });

    if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(subtitle, pageWidth / 2, 49, { align: 'center' });
    }

    // ========== TABLE SECTION ==========

    autoTable(doc, {
        head: [headers],
        body: rows.map(row => row.map(cell => String(cell))),
        startY: subtitle ? 55 : 50,
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [0, 51, 102],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252],
        },
        bodyStyles: {
            textColor: [50, 50, 50],
        },
        didDrawPage: (data) => {
            // Footer on each page
            const pageNumber = (doc as any).internal.getCurrentPageInfo?.()?.pageNumber || 1;
            const totalPages = (doc as any).internal.getNumberOfPages?.() || 1;

            // Footer background
            doc.setFillColor(248, 250, 252);
            doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

            // Footer line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

            // Footer text
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);

            // Left: Company info
            doc.text('TAV TEKNOLOJİLER HOLDİNG A.Ş. - Gizlilik Derecesi: Kurumsal', margin, pageHeight - 7);

            // Center: Custom footer or default
            const footerText = footer || 'Bu belge TAV Eğitim Yönetim Sistemi tarafından otomatik oluşturulmuştur.';
            doc.text(footerText, pageWidth / 2, pageHeight - 7, { align: 'center' });

            // Right: Page number
            doc.text(`Sayfa ${pageNumber} / ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });

            // Bottom border
            doc.setDrawColor(0, 51, 102);
            doc.setLineWidth(1);
            doc.line(0, pageHeight - 1, pageWidth, pageHeight - 1);
        }
    });

    // Save
    doc.save(`${filename}.pdf`);
}

/**
 * Basit liste için PDF oluşturur
 */
export function exportListToPDF(
    title: string,
    items: Array<{ label: string; value: string | number }>,
    filename: string
): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Header
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('TAV TEKNOLOJİLER', margin, 18);

    doc.setFontSize(10);
    doc.text('Eğitim Yönetim Sistemi', margin, 25);

    // Title
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.text(title, margin, 45);

    // Date
    const now = new Date();
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tarih: ${now.toLocaleDateString('tr-TR')}`, pageWidth - margin, 45, { align: 'right' });

    // Items
    let y = 60;
    items.forEach((item, index) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(item.label + ':', margin, y);

        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.value), margin + 60, y);
        doc.setFont('helvetica', 'normal');

        y += 8;
    });

    doc.save(`${filename}.pdf`);
}

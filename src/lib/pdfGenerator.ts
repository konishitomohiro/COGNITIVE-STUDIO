import { LectureStudyData } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates pure black-and-white, unadorned HTML string with zero card borders,
 * zero background colors, zero multi-color accents, line-height 1.8, wide margins (20mm 15mm),
 * perfect for tablet import (Goodnotes/Notability) and manual header highlighting.
 */
export function generateMinimalHtml(data: LectureStudyData): string {
  const { title, core_points, key_terms } = data;

  const corePointsHtml = (core_points || [])
    .map((point) => `<li style="margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid;">${escapeHtml(point)}</li>`)
    .join('');

  const keyTermsHtml = (key_terms || [])
    .map(
      (kt) => {
        const annotationsHtml = kt.annotations && kt.annotations.length > 0
          ? `<div style="margin-top: 4px; padding-left: 12px;">
              ${kt.annotations.map(ann => `<div style="margin-top: 3px; font-size: 10pt; color: #000000;"><span style="font-weight: 700;">※${escapeHtml(ann.word)}</span><span style="margin: 0 6px;">:</span><span>${escapeHtml(ann.explanation)}</span></div>`).join('')}
            </div>`
          : '';
        return `
    <div style="margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid;">
      <div>
        <span style="font-weight: 700; text-decoration: none;">${escapeHtml(kt.term)}</span>
        <span style="margin: 0 6px;">:</span>
        <span>${escapeHtml(kt.definition)}</span>
      </div>
      ${annotationsHtml}
    </div>
  `;
      }
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} - ミニマル学習ノート</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 15mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: sans-serif;
      font-size: 11pt;
      line-height: 1.8;
      color: #000000;
      background-color: #ffffff;
      padding: 20mm 15mm;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
    }

    .doc-header {
      margin-bottom: 35px;
      text-align: left;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    h1 {
      font-size: 20pt;
      font-weight: 700;
      line-height: 1.3;
      color: #000000;
      margin-bottom: 8px;
    }

    .meta-subtitle {
      font-size: 9pt;
      color: #000000;
      margin-top: 4px;
      letter-spacing: 0.05em;
    }

    h2 {
      font-size: 14pt;
      font-weight: 700;
      color: #000000;
      margin-top: 32px;
      margin-bottom: 16px;
      padding: 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    ul {
      padding-left: 20px;
      margin-bottom: 24px;
    }

    .section-content {
      margin-bottom: 30px;
    }

    @media print {
      body {
        padding: 0;
        width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1>${escapeHtml(title)}</h1>
    <div class="meta-subtitle">講義用ミニマル学習ノート（認知心理学最適化フォーマット）</div>
  </div>

  <div class="section-content">
    <h2>1. 核心要約 (Core Points)</h2>
    <ul>
      ${corePointsHtml}
    </ul>
  </div>

  <div class="section-content">
    <h2>2. 重要単語集 (Key Terms)</h2>
    <div>
      ${keyTermsHtml}
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Triggers PDF generation with top/bottom margins and page-break text protection
 */
export async function downloadPdfFile(data: LectureStudyData, elementToRender?: HTMLElement): Promise<void> {
  const sanitizedTitle = (data.title || 'Lecture_Notes')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .substring(0, 40);

  // Locate target DOM element
  const targetElement = elementToRender || document.getElementById('printable-a4-document');

  if (!targetElement) {
    // Fallback: Open print stream for native PDF print/save
    const htmlContent = generateMinimalHtml(data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }
    return;
  }

  try {
    // Render visible element to high resolution canvas (scale: 2 for sharp crisp text)
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: targetElement.offsetWidth || 794,
      onclone: (clonedDoc) => {
        const highlights = clonedDoc.querySelectorAll('[data-difficult-highlight="true"]');
        highlights.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.backgroundColor = 'transparent';
          htmlEl.style.borderBottom = 'none';
          htmlEl.style.padding = '0';
          htmlEl.style.margin = '0';
          htmlEl.style.borderRadius = '0';
          htmlEl.style.fontWeight = 'inherit';
        });
      },
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // A4 Dimensions: 210mm x 297mm
    // Margins: Top 20mm, Bottom 20mm, Left 15mm, Right 15mm
    // Printable Area: 180mm x 257mm
    const printWidthMm = 180;
    const printHeightMm = 257;

    // Calculate canvas height corresponding to one A4 printable page
    const pageCanvasHeight = Math.floor(canvas.width * (printHeightMm / printWidthMm));

    // Collect bottom Y boundaries of inner block elements to find safe line-break points
    const elementRect = targetElement.getBoundingClientRect();
    const scale = canvas.width / targetElement.offsetWidth;
    
    // Query all block elements (headings, list items, term blocks)
    const blockChildren = Array.from(
      targetElement.querySelectorAll('h1, h2, li, div > div, p')
    );

    // Calculate relative bottom positions in canvas pixel coordinates
    const safeBreakYPoints: number[] = [];
    blockChildren.forEach((child) => {
      const childRect = child.getBoundingClientRect();
      const relativeBottomPx = childRect.bottom - elementRect.top;
      const relativeBottomCanvas = relativeBottomPx * scale;
      if (relativeBottomCanvas > 0 && relativeBottomCanvas <= canvas.height) {
        safeBreakYPoints.push(relativeBottomCanvas);
      }
    });

    safeBreakYPoints.sort((a, b) => a - b);

    let currentY = 0;
    let pageIndex = 0;

    while (currentY < canvas.height - 10) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      const maxY = currentY + pageCanvasHeight;

      let splitY = maxY;
      if (maxY < canvas.height) {
        // Find the largest safe break Y point that fits inside the page height (with margin)
        const validBreaks = safeBreakYPoints.filter(
          (y) => y > currentY + 80 && y <= maxY - 10
        );

        if (validBreaks.length > 0) {
          splitY = validBreaks[validBreaks.length - 1] + 6; // Include a small padding below element
        }
      } else {
        splitY = canvas.height;
      }

      const chunkCanvasHeight = Math.max(50, Math.min(Math.ceil(splitY - currentY), canvas.height - currentY));

      // Create page chunk canvas
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = chunkCanvasHeight;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          canvas,
          0,
          currentY,
          canvas.width,
          chunkCanvasHeight,
          0,
          0,
          canvas.width,
          chunkCanvasHeight
        );
      }

      const chunkImgData = pageCanvas.toDataURL('image/png');
      const chunkHeightMm = (chunkCanvasHeight * printWidthMm) / canvas.width;

      // Add image with top 20mm, left 15mm margin
      pdf.addImage(chunkImgData, 'PNG', 15, 20, printWidthMm, chunkHeightMm);

      currentY += chunkCanvasHeight;
      pageIndex++;
    }

    pdf.save(`${sanitizedTitle}_学習ノート.pdf`);
  } catch (err) {
    console.warn('html2canvas / jsPDF error, falling back to print window:', err);
    const htmlContent = generateMinimalHtml(data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }
  }
}



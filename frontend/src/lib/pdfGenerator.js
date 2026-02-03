// PDF Generator utility - isolated module to avoid webpack bundling conflicts
export const generateChecklistDocument = async (items, title, baseName) => {
    // Use require to avoid webpack dynamic import issues
    const jsPDF = require('jspdf').default;
    
    // A6 size: 105mm x 148mm
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [105, 148] });
    
    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 52.5, 10, { align: 'center' });
    
    // Base name
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Base: ${baseName}`, 5, 18);
    
    // Table header
    let y = 25;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEM', 5, y);
    doc.text('CHECK', 55, y);
    doc.text('FECHA', 70, y);
    doc.text('FIRMA', 90, y);
    
    // Draw header line
    doc.line(5, y + 1, 100, y + 1);
    
    // Items
    doc.setFont('helvetica', 'normal');
    y += 6;
    
    items.forEach((item) => {
        if (y > 135) {
            doc.addPage([105, 148]);
            y = 15;
        }
        
        // Item name (truncate to 25 chars)
        doc.text(item.nombre.substring(0, 25), 5, y);
        
        // Checkbox (empty square)
        doc.rect(57, y - 3, 4, 4);
        
        // Date line
        doc.line(68, y, 85, y);
        
        // Signature line
        doc.line(88, y, 100, y);
        
        y += 8;
    });
    
    // Footer with receiver info
    y = 138;
    doc.setFontSize(7);
    doc.text('Recibido por: _______________________', 5, y);
    doc.text('Fecha: ___/___/____', 70, y);
    
    // Return as blob
    return doc.output('blob');
};

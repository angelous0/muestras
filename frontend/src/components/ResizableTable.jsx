import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';

/**
 * Hook para manejar el redimensionamiento de columnas
 * @param {string} tableId - Identificador único para persistir los anchos
 * @param {object} defaultWidths - Anchos iniciales de las columnas { columnKey: width }
 */
export function useResizableColumns(tableId, defaultWidths = {}) {
    // Cargar anchos guardados de localStorage o usar los defaults
    const [columnWidths, setColumnWidths] = useState(() => {
        try {
            const saved = localStorage.getItem(`table-widths-${tableId}`);
            if (saved) {
                return { ...defaultWidths, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Error loading column widths:', e);
        }
        return defaultWidths;
    });

    // Guardar cambios en localStorage
    useEffect(() => {
        try {
            localStorage.setItem(`table-widths-${tableId}`, JSON.stringify(columnWidths));
        } catch (e) {
            console.warn('Error saving column widths:', e);
        }
    }, [columnWidths, tableId]);

    const updateWidth = useCallback((columnKey, width) => {
        setColumnWidths(prev => ({
            ...prev,
            [columnKey]: Math.max(50, width) // Mínimo 50px
        }));
    }, []);

    const resetWidths = useCallback(() => {
        setColumnWidths(defaultWidths);
        localStorage.removeItem(`table-widths-${tableId}`);
    }, [defaultWidths, tableId]);

    return { columnWidths, updateWidth, resetWidths };
}

/**
 * Componente de encabezado de columna redimensionable
 */
export function ResizableTableHead({ 
    children, 
    columnKey, 
    width, 
    onResize, 
    className = '',
    minWidth = 50,
    ...props 
}) {
    const [isResizing, setIsResizing] = useState(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = width || 100;
        
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [width]);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e) => {
            const delta = e.clientX - startXRef.current;
            const newWidth = Math.max(minWidth, startWidthRef.current + delta);
            onResize(columnKey, newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, columnKey, onResize, minWidth]);

    return (
        <TableHead
            className={`text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4 relative select-none ${className}`}
            style={{ 
                width: width ? `${width}px` : 'auto',
                minWidth: `${minWidth}px`
            }}
            {...props}
        >
            <div className="flex items-center justify-between">
                <span className="truncate">{children}</span>
                {/* Resizer handle */}
                <div
                    className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors ${
                        isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-300'
                    }`}
                    onMouseDown={handleMouseDown}
                    title="Arrastrar para redimensionar"
                />
            </div>
        </TableHead>
    );
}

/**
 * Componente de celda que respeta el ancho de la columna
 */
export function ResizableTableCell({ 
    children, 
    width, 
    className = '',
    ...props 
}) {
    return (
        <TableCell
            className={`py-3 px-4 text-sm text-slate-700 ${className}`}
            style={{ 
                width: width ? `${width}px` : 'auto',
                maxWidth: width ? `${width}px` : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}
            {...props}
        >
            {children}
        </TableCell>
    );
}

// Re-exportar los componentes base de tabla para conveniencia
export { Table, TableBody, TableHeader, TableRow };

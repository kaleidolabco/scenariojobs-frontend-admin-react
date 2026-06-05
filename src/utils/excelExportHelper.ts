import * as XLSX from 'xlsx';
import { JobFunction, Capability, Knowledge, Module, Topic, /* Detail */ } from '../services/functionService';

// ─── Types ────────────────────────────────────────────────────────────────────

type Row = (string | number)[];

interface CellMerge {
    s: { r: number; c: number };
    e: { r: number; c: number };
}

// Column indices
const COL = {
    FUNCION:      0,
    CAPACIDAD:    1,
    CONOCIMIENTO: 2,
    MODULO:       3,
    TIPO:         4,
    FUENTES:      5,
    NIVEL:        6,
    TEMA:         7,
    DETALLE:      8,
} as const;

const TOTAL_COLS = 9;

const NIVEL_LABEL: Record<number, string> = {
    0: 'Nivel 0 – Desconocimiento',
    1: 'Nivel 1 – Básico',
    2: 'Nivel 2 – Intermedio',
    3: 'Nivel 3 – Avanzado',
};

const HEADER: Row = [
    'FUNCIÓN PRINCIPAL',
    'CAPACIDAD A DESARROLLAR',
    'CONOCIMIENTO',
    'MÓDULO',
    'TIPO DE CONOCIMIENTO',
    'FUENTES',
    'NIVEL DE DESARROLLO REQUERIDO',
    'TEMA',
    'DETALLE',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Adds a merge only when it spans more than one row. */
function addMerge(merges: CellMerge[], rowStart: number, rowEnd: number, col: number) {
    if (rowEnd > rowStart) {
        merges.push({ s: { r: rowStart, c: col }, e: { r: rowEnd, c: col } });
    }
}

/** Returns an empty row with TOTAL_COLS cells. */
function emptyRow(): Row {
    return Array(TOTAL_COLS).fill('');
}

// ─── Sheet builder ────────────────────────────────────────────────────────────

/**
 * Builds the row/merge data for one JobFunction.
 *
 * Strategy: push empty rows as we recurse into leaf nodes, then backfill
 * parent cell values once we know how many rows each level consumed.
 * This avoids having to pre-calculate row spans before writing.
 */
function buildSheet(fn: JobFunction): { rows: Row[]; merges: CellMerge[] } {
    const rows: Row[] = [HEADER];
    const merges: CellMerge[] = [];

    // Edge case: function with no capabilities
    if (fn.capacidades.length === 0) {
        const row = emptyRow();
        row[COL.FUNCION] = fn.titulo;
        rows.push(row);
        return { rows, merges };
    }

    const fnStart = rows.length; // row index where this function starts

    for (const cap of fn.capacidades) {
        processCapability(cap, rows, merges);
    }

    const fnEnd = rows.length - 1;
    // Backfill function title into first row of this function's block
    rows[fnStart][COL.FUNCION] = fn.titulo;
    addMerge(merges, fnStart, fnEnd, COL.FUNCION);

    return { rows, merges };
}

function processCapability(cap: Capability, rows: Row[], merges: CellMerge[]) {
    const capStart = rows.length;

    if (cap.conocimientos.length === 0) {
        const row = emptyRow();
        row[COL.CAPACIDAD] = cap.titulo;
        rows.push(row);
        return;
    }

    for (const know of cap.conocimientos) {
        processKnowledge(know, rows, merges);
    }

    const capEnd = rows.length - 1;
    rows[capStart][COL.CAPACIDAD] = cap.titulo;
    addMerge(merges, capStart, capEnd, COL.CAPACIDAD);
}

function processKnowledge(know: Knowledge, rows: Row[], merges: CellMerge[]) {
    const knowStart = rows.length;

    if (know.modulos.length === 0) {
        const row = emptyRow();
        row[COL.CONOCIMIENTO] = know.titulo;
        rows.push(row);
        return;
    }

    for (const mod of know.modulos) {
        processModule(mod, know, rows, merges);
    }

    const knowEnd = rows.length - 1;
    rows[knowStart][COL.CONOCIMIENTO] = know.titulo;
    addMerge(merges, knowStart, knowEnd, COL.CONOCIMIENTO);
}

function processModule(mod: Module, know: Knowledge, rows: Row[], merges: CellMerge[]) {
    const modStart = rows.length;

    if (mod.temas.length === 0) {
        const row = emptyRow();
        row[COL.MODULO]   = mod.titulo;
        row[COL.TIPO]     = know.tipoConocimiento;
        row[COL.FUENTES]  = know.fuentes.join(', ');
        row[COL.NIVEL]    = NIVEL_LABEL[know.nivelDesarrollo] ?? know.nivelDesarrollo;
        rows.push(row);
        return;
    }

    for (const tema of mod.temas) {
        processTopic(tema, rows, merges);
    }

    const modEnd = rows.length - 1;

    // Backfill module columns into first row of this module's block
    rows[modStart][COL.MODULO]  = mod.titulo;
    rows[modStart][COL.TIPO]    = know.tipoConocimiento;
    rows[modStart][COL.FUENTES] = know.fuentes.join(', ');
    rows[modStart][COL.NIVEL]   = NIVEL_LABEL[know.nivelDesarrollo] ?? know.nivelDesarrollo;

    addMerge(merges, modStart, modEnd, COL.MODULO);
    addMerge(merges, modStart, modEnd, COL.TIPO);
    addMerge(merges, modStart, modEnd, COL.FUENTES);
    addMerge(merges, modStart, modEnd, COL.NIVEL);
}

function processTopic(tema: Topic, rows: Row[], merges: CellMerge[]) {
    const temaStart = rows.length;

    if (tema.detalles.length === 0) {
        const row = emptyRow();
        row[COL.TEMA] = tema.titulo;
        rows.push(row);
        return;
    }

    for (const det of tema.detalles) {
        const row = emptyRow();
        row[COL.DETALLE] = det.titulo;
        rows.push(row);
    }

    const temaEnd = rows.length - 1;
    rows[temaStart][COL.TEMA] = tema.titulo;
    addMerge(merges, temaStart, temaEnd, COL.TEMA);
}

// ─── Styling ──────────────────────────────────────────────────────────────────

const HEADER_STYLE = {
    fill:      { fgColor: { rgb: 'FF366092' } },
    font:      { color: { rgb: 'FFFFFFFF' }, bold: true, sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
        top:    { style: 'thin', color: { rgb: 'FF000000' } },
        bottom: { style: 'thin', color: { rgb: 'FF000000' } },
        left:   { style: 'thin', color: { rgb: 'FF000000' } },
        right:  { style: 'thin', color: { rgb: 'FF000000' } },
    },
};

const DATA_STYLE = {
    alignment: { vertical: 'center', wrapText: true },
    border: {
        top:    { style: 'thin', color: { rgb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { rgb: 'FFDDDDDD' } },
        left:   { style: 'thin', color: { rgb: 'FFDDDDDD' } },
        right:  { style: 'thin', color: { rgb: 'FFDDDDDD' } },
    },
};

function applyStyles(ws: XLSX.WorkSheet, totalRows: number) {
    // Header row
    for (let c = 0; c < TOTAL_COLS; c++) {
        const ref = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[ref]) ws[ref].s = HEADER_STYLE;
    }
    // Data rows
    for (let r = 1; r < totalRows; r++) {
        for (let c = 0; c < TOTAL_COLS; c++) {
            const ref = XLSX.utils.encode_cell({ r, c });
            if (!ws[ref]) ws[ref] = { t: 's', v: '' };
            ws[ref].s = DATA_STYLE;
        }
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Exports each JobFunction as a separate sheet in an XLSX file.
 * Each hierarchical level occupies its own column; parent cells are merged
 * across as many rows as their children occupy.
 */
export const exportFunctionsToExcel = (
    functions: JobFunction[],
    filename = 'Funciones.xlsx'
) => {
    const workbook = XLSX.utils.book_new();

    functions.forEach(fn => {
        const { rows, merges } = buildSheet(fn);
        const ws = XLSX.utils.aoa_to_sheet(rows);

        if (merges.length) ws['!merges'] = merges;

        ws['!cols'] = [
            { wch: 24 }, // Función
            { wch: 24 }, // Capacidad
            { wch: 24 }, // Conocimiento
            { wch: 24 }, // Módulo
            { wch: 16 }, // Tipo
            { wch: 12 }, // Fuentes
            { wch: 26 }, // Nivel
            { wch: 24 }, // Tema
            { wch: 30 }, // Detalle
        ];

        // Row height: header slightly taller
        ws['!rows'] = [{ hpt: 36 }];

        applyStyles(ws, rows.length);

        const sheetName = (fn.titulo || 'Función').substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    });

    XLSX.writeFile(workbook, filename);
};

/**
 * Exports a compact summary sheet: one row per function with aggregate counts.
 */
export const exportFunctionsSummaryToExcel = (
    functions: JobFunction[],
    filename = 'Funciones_Resumen.xlsx'
) => {
    const workbook = XLSX.utils.book_new();

    const summaryRows: Row[] = [
        ['FUNCIÓN', 'CAPACIDADES', 'CONOCIMIENTOS', 'MÓDULOS', 'TEMAS', 'DETALLES'],
    ];

    functions.forEach(fn => {
        let conocimientos = 0, modulos = 0, temas = 0, detalles = 0;
        fn.capacidades.forEach(cap => {
            conocimientos += cap.conocimientos.length;
            cap.conocimientos.forEach(know => {
                modulos += know.modulos.length;
                know.modulos.forEach(mod => {
                    temas += mod.temas.length;
                    mod.temas.forEach(tema => { detalles += tema.detalles.length; });
                });
            });
        });
        summaryRows.push([fn.titulo, fn.capacidades.length, conocimientos, modulos, temas, detalles]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryRows);
    ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];

    // Style header
    for (let c = 0; c < 6; c++) {
        const ref = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[ref]) ws[ref].s = HEADER_STYLE;
    }

    XLSX.utils.book_append_sheet(workbook, ws, 'Resumen');
    XLSX.writeFile(workbook, filename);
};

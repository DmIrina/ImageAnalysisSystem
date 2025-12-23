// frontend/src/utils/reportUtils.js
import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";

pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

export { pdfMake };

/**
 * Побудова базового імені файлу за оригінальним ім'ям і суфіксом модуля.
 * Повертає { fileName, now }, де fileName без розширення.
 */
export function buildModuleFileName(originalFileName, suffix) {
    const now = new Date();
    const ts = now.toLocaleString().replace(/[:.]/g, "-");
    const base = (originalFileName || "image").replace(/\.[^/.]+$/, "");
    return {
        fileName: `${base}_${suffix}_${ts}`,
        now,
    };
}

export function toLocalISOString(date) {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localTime = new Date(date.getTime() - tzOffset);
    return localTime.toISOString().slice(0, -1);
}

export function heatmapToDataUrl(matrix, scale = 8) {
    if (!matrix || !matrix.length || !matrix[0].length) return null;

    const h = matrix.length;
    const w = matrix[0].length;
    const canvas = document.createElement("canvas");
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");

    let min = Infinity;
    let max = -Infinity;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const v = matrix[y][x];
            if (v < min) min = v;
            if (v > max) max = v;
        }
    }
    const range = max - min || 1;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const norm = (matrix[y][x] - min) / range;
            const val = Math.round(norm * 255);
            // синьо-червоний градієнт
            ctx.fillStyle = `rgb(${val},0,${255 - val})`;
            ctx.fillRect(x * scale, y * scale, scale, scale);
        }
    }

    return canvas.toDataURL("image/png");
}

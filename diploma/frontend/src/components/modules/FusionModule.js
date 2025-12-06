// frontend/src/components/modules/FusionModule.js
// frontend/src/components/modules/FusionModule.js
import React from "react";
import { pdfMake, heatmapToDataUrl, buildModuleFileName } from "../../utils/reportUtils";

export default function FusionModule({ results, originalFileName, previewUrl }) {
    if (!results) {
        return (
            <div>
                <h2 className="text-xl font-semibold mb-2">Підсумковий результат</h2>
                <p className="text-sm text-gray-500">Результати fusion-модуля відсутні.</p>
            </div>
        );
    }

    const {
        fusion_score,
        ai_score,
        manipulation_score,
        patch_score,
        metadata_score,
        ai_heatmap,
        manip_heatmap,
        fusion_heatmap,
    } = results;

    // fusion_score з backend = ПІДОЗРІЛІСТЬ у [0,1]
    const credibility  =
        typeof fusion_score === "number" ? fusion_score : null;
    const suspicion =
        typeof fusion_score === "number" ? 1 - fusion_score : null;

    const credibilityPercent =
        credibility != null ? (credibility * 100).toFixed(2) : null;
    const suspicionPercent =
        suspicion != null ? (suspicion * 100).toFixed(2) : null;

    const safeToFixed = (v, digits = 3) =>
        typeof v === "number" ? v.toFixed(digits) : "—";

    const handleDownloadJson = () => {
        const { fileName, now } = buildModuleFileName(originalFileName, "fusion");
        const blob = new Blob(
            [
                JSON.stringify(
                    {
                        module: "fusion_overall",
                        file: originalFileName || null,
                        generated_at: now.toISOString(),
                        // Зберігаємо все, як приходить із backend
                        // fusion_score тут = підозрілість
                        results,
                        derived: {
                            credibility,
                            suspicion,
                        },
                    },
                    null,
                    2
                ),
            ],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        const { fileName, now } = buildModuleFileName(originalFileName, "fusion");

        const aiMapUrl = ai_heatmap ? heatmapToDataUrl(ai_heatmap) : null;
        const manipMapUrl = manip_heatmap ? heatmapToDataUrl(manip_heatmap) : null;
        const fusionMapUrl = fusion_heatmap ? heatmapToDataUrl(fusion_heatmap) : null;

        const docDefinition = {
            content: [
                { text: "Image authenticity report (fusion)", style: "header" },
                {
                    columns: [
                        { text: `File: ${originalFileName || "-"}`, width: "50%" },
                        {
                            text: `Generated at: ${now.toLocaleString()}`,
                            width: "50%",
                            alignment: "right",
                        },
                    ],
                    margin: [0, 0, 0, 12],
                },

                previewUrl && {
                    text: "Original image:",
                    style: "subheader",
                    margin: [0, 0, 0, 4],
                },
                previewUrl && {
                    image: previewUrl,
                    width: 260,
                    margin: [0, 0, 0, 16],
                },

                {
                    columns: [
                        { text: "Overall authenticity (credibility):", style: "subheader" },
                        {
                            text: credibilityPercent != null ? `${credibilityPercent} %` : "—",
                            style: "score",
                            alignment: "right",
                        },
                    ],
                    margin: [0, 0, 0, 4],
                },
                suspicionPercent != null && {
                    text: `Approx. suspicion level (fusion_score): ${suspicionPercent} %`,
                    fontSize: 9,
                    color: "#555",
                    margin: [0, 0, 0, 10],
                },

                { text: "Module scores (0..1, suspiciousness):", style: "subheader", margin: [0, 6, 0, 4] },
                {
                    type: "none",
                    margin: [0, 0, 0, 10],
                    ul: [
                        `AI detector (suspiciousness):         ${safeToFixed(ai_score)}`,
                        `Manipulation (Photoshop, MVSS):       ${safeToFixed(manipulation_score)}`,
                        `Patch / local artifacts (suspicious): ${safeToFixed(patch_score)}`,
                        `Metadata suspiciousness (EXIF):       ${safeToFixed(metadata_score)}`,
                    ],
                },

                { text: "Heatmaps:", style: "subheader", margin: [0, 8, 0, 6] },

                aiMapUrl && { text: "AI heatmap", style: "heatmapTitle", margin: [0, 2, 0, 2] },
                aiMapUrl && { image: aiMapUrl, width: 220, margin: [0, 0, 0, 8] },

                manipMapUrl && {
                    text: "Manipulation heatmap",
                    style: "heatmapTitle",
                    margin: [0, 2, 0, 2],
                },
                manipMapUrl && { image: manipMapUrl, width: 220, margin: [0, 0, 0, 8] },

                fusionMapUrl && {
                    text: "Fusion heatmap (combined suspiciousness)",
                    style: "heatmapTitle",
                    margin: [0, 2, 0, 2],
                },
                fusionMapUrl && { image: fusionMapUrl, width: 220, margin: [0, 0, 0, 12] },

                {
                    text:
                        "Note: fusion_score ∈ [0,1] — 0.0 означає низьку підозрілість " +
                        "(висока довіра до зображення), 1.0 — високу підозрілість. " +
                        "Оцінки модулів (AI / manip / patch / metadata) також інтерпретуються " +
                        "як рівень підозрілості окремих аспектів. Інтегральна достовірність " +
                        "обчислюється як (1 - fusion_score).",
                    style: "note",
                    margin: [0, 4, 0, 0],
                },
            ].filter(Boolean),
            styles: {
                header: {
                    fontSize: 20,
                    bold: true,
                    margin: [0, 0, 0, 8],
                },
                subheader: {
                    fontSize: 12,
                    bold: true,
                },
                score: {
                    fontSize: 14,
                    bold: true,
                },
                heatmapTitle: {
                    fontSize: 11,
                    bold: true,
                },
                note: {
                    fontSize: 8,
                    italics: true,
                    color: "#555",
                },
            },
            defaultStyle: {
                fontSize: 11,
                lineHeight: 1.2,
            },
        };

        pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Підсумковий результат</h2>

            <p className="mb-2">
                Інтегральна оцінка <b>достовірності</b> зображення:
                <b> {credibilityPercent != null ? `${credibilityPercent}%` : "—"}</b>
            </p>

            {suspicionPercent != null && (
                <p className="text-sm text-gray-700 mb-2">
                    Приблизний рівень <b>підозрілості</b> (fusion_score):{" "}
                    <b>{suspicionPercent}%</b>.
                </p>
            )}

            <p className="text-sm text-gray-700 mb-3">
                Чим <b>вищий</b> показник достовірності, тим більше система довіряє
                зображенню. Високе значення <code>fusion_score</code> означає, що один
                або кілька модулів (AI, маніпуляції, патчі, метадані) виявили суттєві
                ознаки фейку чи редагування.
            </p>

            <div className="fusion-summary-grid">
                <div>
                    <h4 className="font-semibold mb-1">
                        Оцінки модулів (0..1, підозрілість)
                    </h4>
                    <ul className="text-sm">
                        <li>AI-детектор: {safeToFixed(ai_score)}</li>
                        <li>Маніпуляції (Photoshop / MVSS): {safeToFixed(manipulation_score)}</li>
                        <li>Патчі / локальні артефакти: {safeToFixed(patch_score)}</li>
                        <li>Метадані (EXIF, підозрілість): {safeToFixed(metadata_score)}</li>
                    </ul>
                </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" className="secondary-button" onClick={handleDownloadPdf}>
                    Завантажити PDF-звіт
                </button>
                <button type="button" className="secondary-button" onClick={handleDownloadJson}>
                    Завантажити JSON
                </button>
            </div>
        </div>
    );
}



// // frontend/src/components/modules/FusionModule.js
// import React from "react";
// import { pdfMake, heatmapToDataUrl, buildModuleFileName } from "../../utils/reportUtils";
//
// export default function FusionModule({ results, originalFileName, previewUrl }) {
//     const {
//         fusion_score,
//         ai_score,
//         manipulation_score,
//         patch_score,
//         metadata_score,
//         ai_heatmap,
//         manip_heatmap,
//         fusion_heatmap,
//     } = results;
//
//     const overallPercent = (fusion_score * 100).toFixed(2);
//
//     const handleDownloadJson = () => {
//         const { fileName, now } = buildModuleFileName(originalFileName, "fusion");
//         const blob = new Blob(
//             [JSON.stringify(
//                 {
//                     module: "fusion_overall",
//                     file: originalFileName || null,
//                     generated_at: now.toISOString(),
//                     results,
//                 },
//                 null,
//                 2
//             )],
//             { type: "application/json" }
//         );
//
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `${fileName}.json`;
//         a.click();
//         URL.revokeObjectURL(url);
//     };
//
//     const handleDownloadPdf = () => {
//         const { fileName, now } = buildModuleFileName(originalFileName, "fusion");
//
//         const aiMapUrl = heatmapToDataUrl(ai_heatmap);
//         const manipMapUrl = heatmapToDataUrl(manip_heatmap);
//         const fusionMapUrl = heatmapToDataUrl(fusion_heatmap);
//
//         const docDefinition = {
//             content: [
//                 { text: "Image authenticity report (fusion)", style: "header" },
//                 {
//                     columns: [
//                         { text: `File: ${originalFileName || "-"}`, width: "50%" },
//                         {
//                             text: `Generated at: ${now.toLocaleString()}`,
//                             width: "50%",
//                             alignment: "right",
//                         },
//                     ],
//                     margin: [0, 0, 0, 12],
//                 },
//
//                 previewUrl && {
//                     text: "Original image:",
//                     style: "subheader",
//                     margin: [0, 0, 0, 4],
//                 },
//                 previewUrl && {
//                     image: previewUrl,
//                     width: 260,
//                     margin: [0, 0, 0, 16],
//                 },
//
//                 {
//                     columns: [
//                         { text: "Overall fusion score:", style: "subheader" },
//                         {
//                             text: `${overallPercent} %`,
//                             style: "score",
//                             alignment: "right",
//                         },
//                     ],
//                     margin: [0, 0, 0, 10],
//                 },
//
//                 { text: "Module scores (0..1):", style: "subheader", margin: [0, 6, 0, 4] },
//                 {
//                     type: "none",
//                     margin: [0, 0, 0, 10],
//                     ul: [
//                         `AI detector:              ${ai_score.toFixed(3)}`,
//                         `Manipulation (Photoshop): ${manipulation_score.toFixed(3)}`,
//                         `Patch / local artifacts:  ${patch_score.toFixed(3)}`,
//                         `Metadata score (EXIF):    ${metadata_score.toFixed(3)}`,
//                     ],
//                 },
//
//                 { text: "Heatmaps:", style: "subheader", margin: [0, 8, 0, 6] },
//
//                 aiMapUrl && { text: "AI heatmap", style: "heatmapTitle", margin: [0, 2, 0, 2] },
//                 aiMapUrl && { image: aiMapUrl, width: 220, margin: [0, 0, 0, 8] },
//
//                 manipMapUrl && { text: "Manipulation heatmap", style: "heatmapTitle", margin: [0, 2, 0, 2] },
//                 manipMapUrl && { image: manipMapUrl, width: 220, margin: [0, 0, 0, 8] },
//
//                 fusionMapUrl && { text: "Fusion heatmap", style: "heatmapTitle", margin: [0, 2, 0, 2] },
//                 fusionMapUrl && { image: fusionMapUrl, width: 220, margin: [0, 0, 0, 12] },
//
//                 {
//                     text: "Note: all scores are model outputs in [0,1]; higher values mean higher suspicion.",
//                     style: "note",
//                     margin: [0, 4, 0, 0],
//                 },
//             ].filter(Boolean),
//             styles: {
//                 header: {
//                     fontSize: 20,
//                     bold: true,
//                     margin: [0, 0, 0, 8],
//                 },
//                 subheader: {
//                     fontSize: 12,
//                     bold: true,
//                 },
//                 score: {
//                     fontSize: 14,
//                     bold: true,
//                 },
//                 heatmapTitle: {
//                     fontSize: 11,
//                     bold: true,
//                 },
//                 note: {
//                     fontSize: 8,
//                     italics: true,
//                     color: "#555",
//                 },
//             },
//             defaultStyle: {
//                 fontSize: 11,
//                 lineHeight: 1.2,
//             },
//         };
//
//         pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
//     };
//
//     return (
//         <div>
//             <h2 className="text-xl font-semibold mb-2">Підсумковий результат</h2>
//
//             <p className="mb-2">
//                 Інтегральна оцінка достовірності:
//                 <b> {(fusion_score * 100).toFixed(2)}%</b>
//             </p>
//
//             <p className="text-sm text-gray-700 mb-3">
//                 Чим вищий показник, тим більша підозра, що зображення може бути
//                 згенерованим ШІ або містити суттєві маніпуляції.
//             </p>
//
//             <div className="fusion-summary-grid">
//                 <div>
//                     <h4 className="font-semibold mb-1">Оцінки модулів (0..1)</h4>
//                     <ul className="text-sm">
//                         <li>AI-детектор: {ai_score.toFixed(3)}</li>
//                         <li>Маніпуляції (Photoshop): {manipulation_score.toFixed(3)}</li>
//                         <li>Патчі / локальні артефакти: {patch_score.toFixed(3)}</li>
//                         <li>Метадані (EXIF): {metadata_score.toFixed(3)}</li>
//                     </ul>
//                 </div>
//             </div>
//
//             <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
//                 <button type="button" className="secondary-button" onClick={handleDownloadPdf}>
//                     Завантажити PDF-звіт
//                 </button>
//                 <button type="button" className="secondary-button" onClick={handleDownloadJson}>
//                     Завантажити JSON
//                 </button>
//             </div>
//         </div>
//     );
// }



// frontend/src/components/modules/FusionModule.jsx
// import React from "react";
// import pdfMake from "pdfmake/build/pdfmake.js";
// import pdfFonts from "pdfmake/build/vfs_fonts.js";
//
// pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;
//
// // малюємо heatmap в offscreen canvas і повертаємо dataURL
// function heatmapToDataUrl(matrix) {
//     if (!matrix || !matrix.length || !matrix[0].length) return null;
//     const h = matrix.length;
//     const w = matrix[0].length;
//     const canvas = document.createElement("canvas");
//     const scale = 8;
//     canvas.width = w * scale;
//     canvas.height = h * scale;
//     const ctx = canvas.getContext("2d");
//
//     // знаходимо min/max
//     let min = Infinity;
//     let max = -Infinity;
//     for (let y = 0; y < h; y++) {
//         for (let x = 0; x < w; x++) {
//             const v = matrix[y][x];
//             if (v < min) min = v;
//             if (v > max) max = v;
//         }
//     }
//     const range = max - min || 1;
//
//     for (let y = 0; y < h; y++) {
//         for (let x = 0; x < w; x++) {
//             const norm = (matrix[y][x] - min) / range;
//             const val = Math.round(norm * 255);
//             // синьо-червона палітра
//             ctx.fillStyle = `rgb(${val},0,${255 - val})`;
//             ctx.fillRect(x * scale, y * scale, scale, scale);
//         }
//     }
//
//     return canvas.toDataURL("image/png");
// }
//
// export default function FusionModule({ results, originalFileName, previewUrl }) {
//     const {
//         fusion_score,
//         ai_score,
//         manipulation_score,
//         patch_score,
//         metadata_score,
//         ai_heatmap,
//         manip_heatmap,
//         fusion_heatmap,
//     } = results;
//
//     const overallPercent = (fusion_score * 100).toFixed(2);
//
//     const handleDownloadJson = () => {
//         const now = new Date();
//         const ts = now.toISOString().replace(/[:.]/g, "-");
//         const baseName = (originalFileName || "report").replace(/\.[^/.]+$/, "");
//         const fileName = `${baseName}_${ts}.json`;
//
//         const blob = new Blob(
//             [JSON.stringify({ file: originalFileName || null, generated_at: now.toISOString(), results }, null, 2)],
//             { type: "application/json" }
//         );
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = fileName;
//         a.click();
//         URL.revokeObjectURL(url);
//     };
//
//     const handleDownloadPdf = () => {
//         const now = new Date();
//         const ts = now.toISOString().replace(/[:.]/g, "-");
//         const baseName = (originalFileName || "report").replace(/\.[^/.]+$/, "");
//         const fileName = `${baseName}_${ts}.pdf`;
//
//         const aiMapUrl = heatmapToDataUrl(ai_heatmap);
//         const manipMapUrl = heatmapToDataUrl(manip_heatmap);
//         const fusionMapUrl = heatmapToDataUrl(fusion_heatmap);
//
//         const docDefinition = {
//             content: [
//                 { text: "Image authenticity report", style: "header" },
//                 {
//                     columns: [
//                         { text: `File: ${originalFileName || "-"}`, width: "50%" },
//                         {
//                             text: `Generated at: ${now.toLocaleString()}`,
//                             width: "50%",
//                             alignment: "right",
//                         },
//                     ],
//                     margin: [0, 0, 0, 12],
//                 },
//
//                 // Оригінальне зображення
//                 previewUrl && {
//                     text: "Original image:",
//                     style: "subheader",
//                     margin: [0, 0, 0, 4],
//                 },
//                 previewUrl && {
//                     image: previewUrl,
//                     width: 260,
//                     margin: [0, 0, 0, 16],
//                 },
//
//                 {
//                     columns: [
//                         { text: "Overall fusion score:", style: "subheader" },
//                         {
//                             text: `${overallPercent} %`,
//                             style: "score",
//                             alignment: "right",
//                         },
//                     ],
//                     margin: [0, 0, 0, 10],
//                 },
//
//                 { text: "Module scores (0..1):", style: "subheader", margin: [0, 6, 0, 4] },
//                 {
//                     type: "none",
//                     margin: [0, 0, 0, 10],
//                     ul: [
//                         `AI detector:              ${ai_score.toFixed(3)}`,
//                         `Manipulation (Photoshop): ${manipulation_score.toFixed(3)}`,
//                         `Patch / local artifacts:  ${patch_score.toFixed(3)}`,
//                         `Metadata score (EXIF):    ${metadata_score.toFixed(3)}`,
//                     ],
//                 },
//
//                 // !!! Блок причини EXIF *не додаємо* згідно з твоїм побажанням
//
//                 { text: "Heatmaps:", style: "subheader", margin: [0, 8, 0, 6] },
//
//                 aiMapUrl && { text: "AI heatmap", style: "heatmapTitle", margin: [0, 2, 0, 2] },
//                 aiMapUrl && { image: aiMapUrl, width: 220, margin: [0, 0, 0, 8] },
//
//                 manipMapUrl && { text: "Manipulation heatmap", style: "heatmapTitle", margin: [0, 2, 0, 2] },
//                 manipMapUrl && { image: manipMapUrl, width: 220, margin: [0, 0, 0, 8] },
//
//                 fusionMapUrl && { text: "Fusion heatmap", style: "heatmapTitle", margin: [0, 2, 0, 2] },
//                 fusionMapUrl && { image: fusionMapUrl, width: 220, margin: [0, 0, 0, 12] },
//
//                 {
//                     text: "Note: all scores are model outputs in [0,1]; higher values mean higher suspicion.",
//                     style: "note",
//                     margin: [0, 4, 0, 0],
//                 },
//             ].filter(Boolean),
//             styles: {
//                 header: {
//                     fontSize: 20,
//                     bold: true,
//                     margin: [0, 0, 0, 8],
//                 },
//                 subheader: {
//                     fontSize: 12,
//                     bold: true,
//                 },
//                 score: {
//                     fontSize: 14,
//                     bold: true,
//                 },
//                 heatmapTitle: {
//                     fontSize: 11,
//                     bold: true,
//                 },
//                 note: {
//                     fontSize: 8,
//                     italics: true,
//                     color: "#555",
//                 },
//             },
//             defaultStyle: {
//                 fontSize: 11,
//                 lineHeight: 1.2,
//             },
//         };
//
//         pdfMake.createPdf(docDefinition).download(fileName);
//     };
//
//     return (
//         <div>
//             <h2 className="text-xl font-semibold mb-2">Підсумковий результат</h2>
//
//             <p className="mb-2">
//                 Інтегральна оцінка достовірності:
//                 <b> {(fusion_score * 100).toFixed(2)}%</b>
//             </p>
//
//             <p className="text-sm text-gray-700 mb-3">
//                 Чим вищий показник, тим більша підозра, що зображення може бути
//                 згенерованим ШІ або містити суттєві маніпуляції.
//             </p>
//
//             <div className="fusion-summary-grid">
//                 <div>
//                     <h4 className="font-semibold mb-1">Оцінки модулів (0..1)</h4>
//                     <ul className="text-sm">
//                         <li>AI-детектор: {ai_score.toFixed(3)}</li>
//                         <li>Маніпуляції (Photoshop): {manipulation_score.toFixed(3)}</li>
//                         <li>Патчі / локальні артефакти: {patch_score.toFixed(3)}</li>
//                         <li>Метадані (EXIF): {metadata_score.toFixed(3)}</li>
//                     </ul>
//                 </div>
//             </div>
//
//             <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
//                 <button type="button" className="secondary-button" onClick={handleDownloadPdf}>
//                     Завантажити PDF-звіт
//                 </button>
//                 <button type="button" className="secondary-button" onClick={handleDownloadJson}>
//                     Завантажити JSON
//                 </button>
//             </div>
//         </div>
//     );
// }
//
//

// // frontend/src/components/modules/FusionModule.jsx
// import React from "react";
// import jsPDF from "jspdf";
// import HeatmapCanvas from "../HeatmapCanvas"; // не забудь: npm install jspdf
//
// export default function FusionModule({results, fileName}) {
//     const {
//         ai_score,
//         manipulation_score,
//         patch_score,
//         metadata_score,
//         metadata_reason,
//         fusion_score,
//         ai_heatmap,
//         manip_heatmap,
//         fusion_heatmap,
//     } = results;
//
//     // Генеруємо назву файлу
//     const baseName = (fileName ?? "image")
//         .replace(/\.[^.]+$/, "")       // прибираємо розширення
//         .replace(/[^a-zA-Z0-9_-]/g, "_"); // чистимо спецсимволи
//
//     const timestamp = new Date()
//         .toISOString()
//         .replace(/[-:.]/g, "")
//         .replace("T", "-")
//         .slice(0, 15); // YYYYMMDD-HHMMSS
//
//     const jsonFileName = `${baseName}__${timestamp}.json`;
//     const pdfFileName = `${baseName}__${timestamp}.pdf`;
//
//
//     const scores = [
//         {label: "AI-детектор", value: ai_score},
//         {label: "Маніпуляції (Photoshop)", value: manipulation_score},
//         {label: "Патчі / локальні артефакти", value: patch_score},
//         {label: "Метадані (EXIF)", value: metadata_score},
//     ];
//
//     const handleDownloadJson = () => {
//         const payload = {
//             file_name: fileName,
//             timestamp: new Date().toISOString(),
//             ai_score,
//             manipulation_score,
//             patch_score,
//             metadata_score,
//             metadata_reason,
//             fusion_score,
//             ai_heatmap,
//             manip_heatmap,
//             fusion_heatmap,
//         };
//
//         const blob = new Blob([JSON.stringify(payload, null, 2)], {
//             type: "application/json",
//         });
//
//         const a = document.createElement("a");
//         a.href = URL.createObjectURL(blob);
//         a.download = jsonFileName;
//         a.click();
//     };
//
//
//     const handleDownloadPdf = () => {
//         const doc = new jsPDF();
//         let y = 10;
//
//         const addLine = (text, step = 7) => {
//             doc.text(text, 10, y);
//             y += step;
//         };
//
//         doc.setFontSize(16);
//         addLine("Звіт аналізу достовірності зображення", 10);
//         doc.setFontSize(11);
//         y += 2;
//
//         // Підсумковий результат
//         addLine(
//             `Підсумкова оцінка (fusion): ${(fusion_score * 100).toFixed(2)}%`
//         );
//         y += 3;
//         doc.line(10, y, 200, y);
//         y += 6;
//
//         // Оцінки модулів
//         addLine("Оцінки модулів (0–1):");
//         scores.forEach((row) => {
//             addLine(`${row.label}: ${row.value != null ? row.value.toFixed(3) : "—"}`);
//         });
//
//         y += 3;
//         doc.line(10, y, 200, y);
//         y += 6;
//
//         // Метадані
//         addLine("Метадані (EXIF):");
//         addLine(metadata_reason || "—");
//
//         y += 3;
//         doc.line(10, y, 200, y);
//         y += 6;
//
//         // Коротка інформація про heatmap'и
//         addLine("Heatmap-и (розміри матриць):");
//         if (ai_heatmap) {
//             addLine(
//                 `AI heatmap: ${ai_heatmap.length}×${ai_heatmap[0].length}`
//             );
//         }
//         if (manip_heatmap) {
//             addLine(
//                 `Маніпуляції heatmap: ${manip_heatmap.length}×${manip_heatmap[0].length}`
//             );
//         }
//         if (fusion_heatmap) {
//             addLine(
//                 `Об’єднана heatmap: ${fusion_heatmap.length}×${fusion_heatmap[0].length}`
//             );
//         }
//
//         // TODO (якщо захочеш покращити): додати в PDF самі картинки
//         // - оригінальне зображення (через dataURL)
//         // - візуалізації heatmap з canvas (addImage)
//
//         doc.save(pdfFileName);
//
//     };
//
//     return (
//         <div>
//             <h2 className="text-xl font-semibold mb-4">Підсумковий результат</h2>
//
//             {/* Підсумкове значення */}
//             <div className="p-3 border rounded bg-blue-50 mb-4">
//                 <span className="font-medium">
//                     Інтегральна достовірність зображення:
//                 </span>{" "}
//                 <b>{(fusion_score * 100).toFixed(2)}%</b>
//             </div>
//
//             {/* Кнопки експорту */}
//             <div
//                 style={{
//                     display: "flex",
//                     gap: 12,
//                     flexWrap: "wrap",
//                     marginBottom: 16,
//                 }}
//             >
//                 <button
//                     type="button"
//                     className="secondary-button"
//                     onClick={handleDownloadPdf}
//                 >
//                     Завантажити PDF-звіт
//                 </button>
//                 <button
//                     type="button"
//                     className="secondary-button"
//                     onClick={handleDownloadJson}
//                 >
//                     Завантажити JSON
//                 </button>
//             </div>
//
//             {/* Таблиця модулів */}
//             <h3 className="text-lg font-semibold mb-2">Оцінки модулів</h3>
//             <table className="w-full mb-3 text-sm">
//                 <thead>
//                 <tr className="border-b text-gray-700">
//                     <th className="text-left py-1">Модуль</th>
//                     <th className="text-right py-1">Оцінка (0–1)</th>
//                 </tr>
//                 </thead>
//                 <tbody>
//                 {scores.map((row) => (
//                     <tr key={row.label} className="border-b">
//                         <td className="py-1">{row.label}</td>
//                         <td className="py-1 text-right">
//                             {row.value != null ? row.value.toFixed(3) : "—"}
//                         </td>
//                     </tr>
//                 ))}
//                 </tbody>
//             </table>
//
//             {/* Причина по метаданих */}
//             <p className="text-sm text-gray-600 mb-4">
//                 <b>Метадані:</b> {metadata_reason || "—"}
//             </p>
//
//             {fusion_heatmap ? (
//                 <div className="mt-3">
//                     <p className="text-sm text-gray-700 mb-1">
//                         Зведена карта підозрілих ділянок (fusion heatmap):
//                     </p>
//                     <HeatmapCanvas
//                         data={fusion_heatmap}
//                         width={256}
//                         height={256}
//                     />
//                 </div>
//             ) : (
//                 <p className="text-sm text-gray-500 mt-2">
//                     Дані для зведеної heatmap наразі недоступні.
//                 </p>
//             )}
//         </div>
//     );
// }
//
//
// // import React from "react";
// //
// // export default function FusionModule({ results }) {
// //     const {
// //         ai_score,
// //         manipulation_score,
// //         patch_score,
// //         metadata_score,
// //         metadata_reason,
// //         fusion_score,
// //         fusion_heatmap
// //     } = results;
// //
// //     const scores = [
// //         { label: "AI-детектор", value: ai_score },
// //         { label: "Маніпуляції (Photoshop)", value: manipulation_score },
// //         { label: "Патчі / локальні артефакти", value: patch_score },
// //         { label: "Метадані (EXIF)", value: metadata_score },
// //     ];
// //
// //     return (
// //         <div>
// //             <h2 className="text-xl font-semibold mb-4">Підсумковий результат</h2>
// //
// //             {/* Підсумкове значення */}
// //             <div className="p-3 border rounded bg-blue-50 mb-4">
// //                 <span className="font-medium">
// //                     Інтегральна достовірність зображення:
// //                 </span>{" "}
// //                 <b>{(fusion_score * 100).toFixed(2)}%</b>
// //             </div>
// //
// //             {/* Таблиця модулів */}
// //             <h3 className="text-lg font-semibold mb-2">Оцінки модулів</h3>
// //             <table className="w-full mb-3 text-sm">
// //                 <thead>
// //                 <tr className="border-b text-gray-700">
// //                     <th className="text-left py-1">Модуль</th>
// //                     <th className="text-right py-1">Оцінка (0–1)</th>
// //                 </tr>
// //                 </thead>
// //                 <tbody>
// //                 {scores.map((row) => (
// //                     <tr key={row.label} className="border-b">
// //                         <td className="py-1">{row.label}</td>
// //                         <td className="py-1 text-right">
// //                             {row.value != null ? row.value.toFixed(3) : "—"}
// //                         </td>
// //                     </tr>
// //                 ))}
// //                 </tbody>
// //             </table>
// //
// //             {/* Причина по метаданих */}
// //             <p className="text-sm text-gray-600 mb-4">
// //                 <b>Метадані:</b> {metadata_reason || "—"}
// //             </p>
// //
// //             {/* Heatmap */}
// //             <h3 className="text-lg font-semibold mb-2">Об’єднана Heatmap</h3>
// //             {fusion_heatmap ? (
// //                 <pre className="text-xs bg-gray-100 p-2 rounded shadow-sm">
// //                     Розмір матриці: {fusion_heatmap.length}×{fusion_heatmap[0].length}
// //                 </pre>
// //             ) : (
// //                 <p className="text-sm text-gray-500">Heatmap відсутня.</p>
// //             )}
// //         </div>
// //     );
// // }
// //
//
// // import React from "react";
// //
// // export default function FusionModule({results}) {
// //     const {fusion_score, fusion_heatmap} = results;
// //
// //     return (
// //         <div>
// //             <h2 className="text-xl font-semibold mb-2">Підсумковий результат</h2>
// //
// //             <p>
// //                 Інтегральна оцінка достовірності:
// //                 <b> {(fusion_score * 100).toFixed(2)}%</b>
// //             </p>
// //
// //             <h3 className="font-semibold mt-4 mb-2">Об'єднана heatmap</h3>
// //             <pre className="text-xs bg-gray-100 p-2 rounded">
// //                 Масив {fusion_heatmap.length}×{fusion_heatmap[0].length}
// //             </pre>
// //         </div>
// //     );
// // }

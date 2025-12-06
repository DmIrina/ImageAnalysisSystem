// frontend/src/components/modules/ExifModule.jsx
import React from "react";
import { pdfMake, buildModuleFileName } from "../../utils/reportUtils";

export default function ExifModule({ results, originalFileName }) {
    const metaScore = results?.metadata_score ?? null;
    const metaSoftware = results?.metadata_software ?? null;
    const metaReason = results?.metadata_reason ?? null; // лише для UI

    const handleDownloadJson = () => {
        const { fileName, now } = buildModuleFileName(originalFileName, "metadata");
        const payload = {
            module: "metadata_exif",
            file: originalFileName || null,
            generated_at: now.toISOString(),
            metadata_score: metaScore,
            metadata_software: metaSoftware,
            metadata_reason: metaReason,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        const { fileName, now } = buildModuleFileName(originalFileName, "metadata");

        const docDefinition = {
            content: [
                { text: "Metadata / EXIF module report", style: "header" },
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
                {
                    text: `Metadata suspiciousness score: ${
                        metaScore != null ? metaScore.toFixed(3) : "—"
                    }`,
                    margin: [0, 0, 0, 6],
                },
                metaSoftware && {
                    text: `Software tag: ${metaSoftware}`,
                    margin: [0, 0, 0, 4],
                },
                // metadata_reason НАВМИСНО не додаємо в PDF
            ].filter(Boolean),
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 8] },
            },
            defaultStyle: { fontSize: 11 },
        };

        pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
    };

    let impactText = "";
    if (metaScore != null) {
        if (metaScore < 0.7) {
            impactText =
                "Поточний рівень підозрілість метаданих низький, тому модуль метаданих майже не впливає на інтегральну оцінку.";
        } else {
            impactText =
                "Виявлено підозрілі метадані (наприклад, згадка графічного редактора або аномальні поля). Це суттєво зменшує довіру до зображення у підсумковій оцінці.";
        }
    }

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Метадані (EXIF)</h3>

            <p className="mb-2">
                Інтегральна оцінка <b>підозрілості метаданих</b> (0..1):
                <b> {metaScore != null ? metaScore.toFixed(3) : "—"}</b>
            </p>

            {impactText && (
                <p className="text-sm text-gray-700 mb-2">
                    {impactText}
                </p>
            )}

            {metaSoftware && (
                <p className="text-sm text-gray-700 mb-1">
                    Поле <code>Software</code>: <b>{metaSoftware}</b>
                </p>
            )}

            {metaReason && (
                <p className="text-sm text-gray-600 mb-3">
                    Пояснення: {metaReason}
                </p>
            )}

            {!metaSoftware && !metaReason && (
                <p className="text-sm text-gray-500 mb-3">
                    У метаданих не знайдено додаткової інформації, або EXIF відсутній.
                    Відсутність EXIF не зменшує довіру автоматично.
                </p>
            )}

            <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" className="secondary-button" onClick={handleDownloadPdf}>
                    Завантажити PDF (метадані)
                </button>
                <button type="button" className="secondary-button" onClick={handleDownloadJson}>
                    Завантажити JSON (метадані)
                </button>
            </div>
        </div>
    );
}


// // frontend/src/components/modules/ExifModule.jsx
// import React from "react";
// import { pdfMake, buildModuleFileName } from "../../utils/reportUtils";
//
// export default function ExifModule({ results, originalFileName }) {
//     const metaScore = results?.metadata_score ?? null;
//     const metaSoftware = results?.metadata_software ?? null;
//     const metaReason = results?.metadata_reason ?? null; // лише для UI
//
//     const handleDownloadJson = () => {
//         const { fileName, now } = buildModuleFileName(originalFileName, "metadata");
//         const payload = {
//             module: "metadata_exif",
//             file: originalFileName || null,
//             generated_at: now.toISOString(),
//             metadata_score: metaScore,
//             metadata_software: metaSoftware,
//             metadata_reason: metaReason,
//         };
//
//         const blob = new Blob([JSON.stringify(payload, null, 2)], {
//             type: "application/json",
//         });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `${fileName}.json`;
//         a.click();
//         URL.revokeObjectURL(url);
//     };
//
//     const handleDownloadPdf = () => {
//         const { fileName, now } = buildModuleFileName(originalFileName, "metadata");
//
//         const docDefinition = {
//             content: [
//                 { text: "Metadata / EXIF module report", style: "header" },
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
//                 {
//                     text: `Metadata score: ${
//                         metaScore != null ? metaScore.toFixed(3) : "—"
//                     }`,
//                     margin: [0, 0, 0, 6],
//                 },
//                 metaSoftware && {
//                     text: `Software tag: ${metaSoftware}`,
//                     margin: [0, 0, 0, 4],
//                 },
//                 // metadata_reason НАВМИСНО не додаємо в PDF
//             ].filter(Boolean),
//             styles: {
//                 header: { fontSize: 18, bold: true, margin: [0, 0, 0, 8] },
//             },
//             defaultStyle: { fontSize: 11 },
//         };
//
//         pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
//     };
//
//     return (
//         <div>
//             <h3 className="text-lg font-semibold mb-2">Метадані (EXIF)</h3>
//
//             <p className="mb-2">
//                 Інтегральна оцінка метаданих:
//                 <b> {metaScore != null ? metaScore.toFixed(3) : "—"}</b>
//             </p>
//
//             {metaSoftware && (
//                 <p className="text-sm text-gray-700 mb-1">
//                     Поле <code>Software</code>: <b>{metaSoftware}</b>
//                 </p>
//             )}
//
//             {metaReason && (
//                 <p className="text-sm text-gray-600 mb-3">
//                     Пояснення: {metaReason}
//                 </p>
//             )}
//
//             {!metaSoftware && !metaReason && (
//                 <p className="text-sm text-gray-500 mb-3">
//                     У метаданих не знайдено додаткової інформації, або EXIF відсутній.
//                 </p>
//             )}
//
//             <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
//                 <button type="button" className="secondary-button" onClick={handleDownloadPdf}>
//                     Завантажити PDF (метадані)
//                 </button>
//                 <button type="button" className="secondary-button" onClick={handleDownloadJson}>
//                     Завантажити JSON (метадані)
//                 </button>
//             </div>
//         </div>
//     );
// }



// import React from "react";
//
// export default function ExifModule({ results }) {
//
//         const {
//             metadata_score,
//             metadata_reason,
//             metadata_software
//         } = results;
//
//         return (
//             <div>
//                 <h2 className="text-xl font-semibold mb-2">Метадані (EXIF)</h2>
//
//                 <p><b>Оцінка підозрілості:</b> {metadata_score}</p>
//                 <p><b>Причина:</b> {metadata_reason}</p>
//
//                 {metadata_software && (
//                     <p><b>ПЗ:</b> {metadata_software}</p>
//                 )}
//             </div>
//         );
//     }

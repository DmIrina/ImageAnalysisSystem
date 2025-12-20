// frontend/src/components/modules/AIModule.jsx
import React from "react";
import HeatmapCanvas from "../HeatmapCanvas";
import {pdfMake, heatmapToDataUrl, buildModuleFileName} from "../../utils/reportUtils";

export default function AIModule({results, originalFileName}) {
    const aiScore = results?.ai_score ?? null;
    const aiHeatmap = results?.ai_heatmap ?? null;

    const probText =
        aiScore != null ? `${(aiScore * 100).toFixed(2)}%` : "—";

    const hasHeatmap =
        Array.isArray(aiHeatmap) &&
        aiHeatmap.length > 0 &&
        Array.isArray(aiHeatmap[0]) &&
        aiHeatmap[0].length > 0;

    const handleDownloadJson = () => {
        const {fileName, now} = buildModuleFileName(originalFileName, "ai");
        const payload = {
            module: "ai_detector",
            file: originalFileName || null,
            generated_at: now.toISOString(),
            ai_score: aiScore,
            ai_heatmap: aiHeatmap,
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
        const {fileName, now} = buildModuleFileName(originalFileName, "ai");
        const mapUrl = heatmapToDataUrl(aiHeatmap);

        const docDefinition = {
            content: [
                {text: "AI-detector module report", style: "header"},
                {
                    columns: [
                        {text: `File: ${originalFileName || "-"}`, width: "50%"},
                        {
                            text: `Generated at: ${now.toLocaleString()}`,
                            width: "50%",
                            alignment: "right",
                        },
                    ],
                    margin: [0, 0, 0, 12],
                },
                {
                    text: `AI score: ${aiScore != null ? aiScore.toFixed(3) : "—"} (${probText})`,
                    margin: [0, 0, 0, 8],
                },
                mapUrl && {
                    text: "AI heatmap:",
                    style: "subheader",
                    margin: [0, 4, 0, 4],
                },
                mapUrl && {
                    image: mapUrl,
                    width: 220,
                    margin: [0, 0, 0, 8],
                },
            ].filter(Boolean),
            styles: {
                header: {fontSize: 18, bold: true, margin: [0, 0, 0, 8]},
                subheader: {fontSize: 12, bold: true},
            },
            defaultStyle: {
                fontSize: 11,
            },
        };

        pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Детекція ШІ-генерації</h3>

            <p className="mb-3">
                Ймовірність ШІ-генерації:{" "}
                <b>{probText}</b>
            </p>

            <p className="text-sm text-gray-600 mb-2">
                Модуль аналізує зображення на наявність специфічних артефактів та порушень глобальної структури,
                характерних для сучасних нейромереж (Midjourney, Stable Diffusion, DALL-E).
            </p>

            {hasHeatmap ? (
                <div className="mt-3">
                    <p className="text-sm text-gray-700 mb-1">
                        Нижче наведено теплову карту (Grad-CAM). Вона візуалізує зони, які найбільше вплинули на рішення
                        алгоритму:
                        яскраві (червоні) ділянки вказують на місця концентрації синтетичних ознак, що видають штучне
                        походження зображення.
                    </p>
                    <HeatmapCanvas data={aiHeatmap} width={256} height={256}/>
                </div>
            ) : (
                <p className="text-sm text-gray-500 mt-2">
                    Дані heatmap для AI-модуля відсутні.
                </p>
            )}

            <div style={{marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap"}}>
                <button
                    type="button"
                    className="secondary-button"
                    onClick={handleDownloadPdf}
                >
                    Завантажити PDF (AI-модуль)
                </button>
                <button
                    type="button"
                    className="secondary-button"
                    onClick={handleDownloadJson}
                >
                    Завантажити JSON (AI-модуль)
                </button>
            </div>
        </div>
    );
}

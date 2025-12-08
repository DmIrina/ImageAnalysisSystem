// frontend/src/components/modules/ManipModule.jsx
import React from "react";
import HeatmapCanvas from "../HeatmapCanvas";
import {pdfMake, heatmapToDataUrl, buildModuleFileName} from "../../utils/reportUtils";

export default function ManipModule({results, originalFileName}) {
    const manipScore = results?.manipulation_score ?? null;
    const manipHeatmap = results?.manip_heatmap ?? null;

    const hasHeatmap =
        Array.isArray(manipHeatmap) &&
        manipHeatmap.length > 0 &&
        Array.isArray(manipHeatmap[0]) &&
        manipHeatmap[0].length > 0;

    const handleDownloadJson = () => {
        const {fileName, now} = buildModuleFileName(originalFileName, "manip");
        const payload = {
            module: "manipulation_detector",
            file: originalFileName || null,
            generated_at: now.toISOString(),
            manipulation_score: manipScore,
            manip_heatmap: manipHeatmap,
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
        const {fileName, now} = buildModuleFileName(originalFileName, "manip");
        const mapUrl = hasHeatmap ? heatmapToDataUrl(manipHeatmap) : null;

        const docDefinition = {
            content: [
                {text: "Manipulation detector module report", style: "header"},
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
                    text: `Manipulation score (suspiciousness, 0..1): ${
                        manipScore != null ? manipScore.toFixed(3) : "—"
                    }`,
                    margin: [0, 0, 0, 8],
                },
                mapUrl && {
                    text: "Manipulation heatmap:",
                    style: "subheader",
                    margin: [0, 4, 0, 4],
                },
                mapUrl && {image: mapUrl, width: 220, margin: [0, 0, 0, 8]},
            ].filter(Boolean),
            styles: {
                header: {fontSize: 18, bold: true, margin: [0, 0, 0, 8]},
                subheader: {fontSize: 12, bold: true},
            },
            defaultStyle: {fontSize: 11},
        };

        pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Перевірка маніпуляцій та редагування (Photoshop / локальні
                зміни)</h3>

            <p className="mb-2">
                Ймовірність наявності змін на зображенні:
                <b> {manipScore != null ? `${(manipScore * 100).toFixed(2)}%` : "—"}</b>
            </p>

            <p className="text-sm text-gray-600 mb-2">
                Модуль виявляє локальні втручання, наприклад:

                - зміна об’єктів на фото,
                - видалення або додавання елементів,
                - сильна ретуш шкіри,
                - монтаж або композитинг.

                На тепловій карті показано ділянки, де можливі редагування.
                Чим яскравіший фрагмент — тим сильніша підозра.
            </p>

            {hasHeatmap ? (
                <div className="mt-3">
                    <HeatmapCanvas data={manipHeatmap} width={256} height={256}/>
                </div>
            ) : (
                <p className="text-sm text-gray-500 mt-2">
                    Дані heatmap для модуля маніпуляцій відсутні.
                </p>
            )}

            <div style={{marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap"}}>
                <button type="button" className="secondary-button" onClick={handleDownloadPdf}>
                    Завантажити PDF (маніпуляції)
                </button>
                <button type="button" className="secondary-button" onClick={handleDownloadJson}>
                    Завантажити JSON (маніпуляції)
                </button>
            </div>
        </div>
    );
}
// frontend/src/components/modules/PatchModule.jsx
import React from "react";
import HeatmapCanvas from "../HeatmapCanvas";
import {pdfMake, heatmapToDataUrl, buildModuleFileName} from "../../utils/reportUtils";

export default function PatchModule({results, originalFileName}) {
    const patchScore = results?.patch_score ?? null;

    let patchHeatmap =
        results?.patch_heatmap ??
        results?.patch_map ??
        results?.patch_heatmap_norm ??
        results?.fusion_heatmap ??
        null;

    if (Array.isArray(patchHeatmap) && patchHeatmap.length > 0) {
        const first = patchHeatmap[0];
        if (typeof first === "number") {
            patchHeatmap = [patchHeatmap];
        }
    }

    const hasHeatmap =
        Array.isArray(patchHeatmap) &&
        patchHeatmap.length > 0 &&
        Array.isArray(patchHeatmap[0]) &&
        patchHeatmap[0].length > 0;

    const handleDownloadJson = () => {
        const {fileName, now} = buildModuleFileName(originalFileName, "patch");

        const payload = {
            module: "patch_local_artifacts",
            file: originalFileName || null,
            generated_at: now.toISOString(),
            patch_score: patchScore,
            patch_heatmap: patchHeatmap,
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
        const {fileName, now} = buildModuleFileName(originalFileName, "patch");
        const mapUrl = hasHeatmap ? heatmapToDataUrl(patchHeatmap) : null;

        const docDefinition = {
            content: [
                {text: "Patch / Local Artifacts Module Report", style: "header"},

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
                    text: `Patch suspiciousness score (0..1): ${
                        patchScore != null ? patchScore.toFixed(3) : "—"
                    }`,
                    margin: [0, 0, 0, 12],
                },

                mapUrl && {
                    text: "Patch / fusion heatmap:",
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
            defaultStyle: {fontSize: 11},
        };

        pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Патч-аналіз (масштаб локальних аномалій)</h3>

            <p className="mb-3">
                Середня локальна підозрілість:
                <b> {patchScore != null ? `${(patchScore * 100).toFixed(2)}%` : "—"}</b>
            </p>

            <p className="text-sm text-gray-700 mb-2">
                <p>Цей показник показує, наскільки велика частина зображення могла бути відредагована.
                    Якщо підозрілі ділянки трапляються у багатьох місцях кадру, це може означати масштабне втручання у
                    зображення.</p>

                <p>Теплова карта підсвічує фрагменти, де можливі зміни:
                    чим більше таких зон — тим більша ймовірність, що редагування вплинуло на зміст фото.</p>
            </p>

            {hasHeatmap ? (
                <>
                    <p className="text-sm text-gray-700 mb-2">
                        На тепловій карті підсвічені ділянки з найбільшою локальною підозрілістю.
                    </p>
                    <HeatmapCanvas data={patchHeatmap} width={256} height={256}/>
                </>
            ) : (
                <p className="text-sm text-gray-500">
                    Дані теплової карти для локальних артефактів відсутні.
                </p>
            )}

            <div style={{marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap"}}>
                <button type="button" className="secondary-button" onClick={handleDownloadPdf}>
                    Завантажити PDF (патчі)
                </button>
                <button type="button" className="secondary-button" onClick={handleDownloadJson}>
                    Завантажити JSON (патчі)
                </button>
            </div>
        </div>
    );
}

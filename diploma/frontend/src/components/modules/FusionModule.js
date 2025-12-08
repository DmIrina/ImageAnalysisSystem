// frontend/src/components/modules/FusionModule.js
import React from "react";
import {pdfMake, heatmapToDataUrl, buildModuleFileName} from "../../utils/reportUtils";

export default function FusionModule({results, originalFileName, previewUrl}) {
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
    const suspicion =
        typeof fusion_score === "number" ? fusion_score : null;
    const credibility =
        typeof fusion_score === "number" ? 1 - fusion_score : null;

    const credibilityPercent =
        credibility != null ? (credibility * 100).toFixed(2) : null;
    const suspicionPercent =
        suspicion != null ? (suspicion * 100).toFixed(2) : null;

    const safeToFixed = (v, digits = 3) =>
        typeof v === "number" ? v.toFixed(digits) : "—";

    const handleDownloadJson = () => {
        const {fileName, now} = buildModuleFileName(originalFileName, "fusion");
        const blob = new Blob(
            [
                JSON.stringify(
                    {
                        module: "fusion_overall",
                        file: originalFileName || null,
                        generated_at: now.toISOString(),
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
            {type: "application/json"}
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        const {fileName, now} = buildModuleFileName(originalFileName, "fusion");

        const aiMapUrl = ai_heatmap ? heatmapToDataUrl(ai_heatmap) : null;
        const manipMapUrl = manip_heatmap ? heatmapToDataUrl(manip_heatmap) : null;
        const fusionMapUrl = fusion_heatmap ? heatmapToDataUrl(fusion_heatmap) : null;

        const docDefinition = {
            content: [
                {text: "Image authenticity report (fusion)", style: "header"},
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
                        {text: "Overall authenticity (credibility):", style: "subheader"},
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

                {text: "Module scores (0..1, suspiciousness):", style: "subheader", margin: [0, 6, 0, 4]},
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

                {text: "Heatmaps:", style: "subheader", margin: [0, 8, 0, 6]},

                aiMapUrl && {text: "AI heatmap", style: "heatmapTitle", margin: [0, 2, 0, 2]},
                aiMapUrl && {image: aiMapUrl, width: 220, margin: [0, 0, 0, 8]},

                manipMapUrl && {
                    text: "Manipulation heatmap",
                    style: "heatmapTitle",
                    margin: [0, 2, 0, 2],
                },
                manipMapUrl && {image: manipMapUrl, width: 220, margin: [0, 0, 0, 8]},

                fusionMapUrl && {
                    text: "Fusion heatmap (combined suspiciousness)",
                    style: "heatmapTitle",
                    margin: [0, 2, 0, 2],
                },
                fusionMapUrl && {image: fusionMapUrl, width: 220, margin: [0, 0, 0, 12]},

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
                    Приблизний рівень <b>підозрілості</b> зображення:{" "}
                    <b>{suspicionPercent}%</b>.
                </p>
            )}

            <p className="text-sm text-gray-700 mb-3">
                Чим вищий показник достовірності, тим більше система довіряє
                зображенню. Високе значення показника підозрілості означає, що один
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

            <div style={{marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap"}}>
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
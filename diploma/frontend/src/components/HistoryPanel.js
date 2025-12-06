// frontend/src/components/HistoryPanel.jsx
import React, {useEffect, useState} from "react";
import {fetchHistory} from "../api/backend";

function parseSummary(summary) {
    if (!summary || typeof summary !== "string") return null;

    const parts = summary.split(",").map((p) => p.trim());
    const result = {};

    const map = {
        AI: "ai",
        manip: "manip",
        patch: "patch",
        meta: "meta",
        fusion: "fusion",
    };

    for (const part of parts) {
        const [keyRaw, valueRaw] = part.split("=").map((s) => s.trim());
        if (!keyRaw || !valueRaw) continue;

        const mappedKey = map[keyRaw];
        if (!mappedKey) continue;

        const num = Number(valueRaw.replace(",", "."));
        if (!Number.isNaN(num)) {
            result[mappedKey] = num;
        }
    }

    return Object.keys(result).length ? result : null;
}

function scoreClass(v) {
    if (v == null) return "score text-muted";
    if (v < 0.3) return "score score-low";
    if (v < 0.7) return "score score-mid";
    return "score score-high";
}

export default function HistoryPanel() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHistory()
            .then(({data}) => setItems(data))
            .catch((err) => {
                console.error(err);
                setError("Не вдалося завантажити історію. Переконайтесь, що ви увійшли в систему.");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p className="text-muted" style={{marginTop: 24, textAlign: "center"}}>Завантаження історії...</p>;
    }

    if (error) {
        return <p style={{marginTop: 24, textAlign: "center", color: "#dc2626", fontSize: 13}}>{error}</p>;
    }

    return (
        <div className="history-container">
            <div className="history-card">
                <h2 className="app-card-title">Історія проаналізованих зображень</h2>
                {items.length === 0 ? (
                    <p className="text-muted">
                        Історія порожня. Виконайте аналіз зображення, щоб побачити тут записи.
                    </p>
                ) : (
                    <>
                        <p className="app-card-text">
                            Тут відображаються результати аналізу зображень для поточного користувача.
                        </p>

                        <div className="history-table-wrapper">
                            <table className="history-table">
                                <thead>
                                <tr>
                                    <th>Дата/час</th>
                                    <th>Файл</th>
                                    <th style={{textAlign: "right"}}>Розмір (байт)</th>
                                    <th style={{textAlign: "right"}}>AI</th>
                                    <th style={{textAlign: "right"}}>Маніп.</th>
                                    <th style={{textAlign: "right"}}>Патчі</th>
                                    <th style={{textAlign: "right"}}>Метадані</th>
                                    <th style={{textAlign: "right"}}>Підсумок (підозрілість)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {items.map((row) => {
                                    const parsed = parseSummary(row.analysis_summary);
                                    const ai = parsed?.ai ?? null;
                                    const manip = parsed?.manip ?? null;
                                    const patch = parsed?.patch ?? null;
                                    const meta = parsed?.meta ?? null;
                                    const fusion = (1 - parsed?.fusion) ?? null;

                                    const created = new Date(row.created_at);

                                    return (
                                        <tr key={row.id}>
                                            <td>
                                                <div className="history-date">
                                                    {created.toLocaleString()}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="history-filename">
                                                    {row.filename}
                                                </div>
                                            </td>
                                            <td style={{textAlign: "right"}}>
                                                {row.file_size_bytes ?? "—"}
                                            </td>
                                            <td style={{textAlign: "right"}}>
                          <span className={scoreClass(ai)}>
                            {ai != null ? ai.toFixed(3) : "—"}
                          </span>
                                            </td>
                                            <td style={{textAlign: "right"}}>
                          <span className={scoreClass(manip)}>
                            {manip != null ? manip.toFixed(3) : "—"}
                          </span>
                                            </td>
                                            <td style={{textAlign: "right"}}>
                          <span className={scoreClass(patch)}>
                            {patch != null ? patch.toFixed(3) : "—"}
                          </span>
                                            </td>
                                            <td style={{textAlign: "right"}}>
                          <span className={scoreClass(meta)}>
                            {meta != null ? meta.toFixed(3) : "—"}
                          </span>
                                            </td>
                                            <td style={{textAlign: "right"}}>
                                                <div className={scoreClass(fusion)}>
                                                    {fusion != null ? fusion.toFixed(3) : "—"}
                                                </div>

                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        <div className="history-note">
                            * Зелені значення – низька підозрілість, жовті – середня, червоні – висока.
                            Підсумок відображає інтегральну оцінку підозрілості зображення.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


// // frontend/src/components/HistoryPanel.jsx
// import React, { useEffect, useState } from "react";
// import { fetchHistory } from "../api/backend";
//
// // Надійний парсинг рядка "AI=0.024, manip=0.528, patch=0.731, meta=0.6, fusion=0.5"
// function parseSummary(summary) {
//     if (!summary || typeof summary !== "string") return null;
//
//     const parts = summary.split(",").map((p) => p.trim());
//     const result = {};
//
//     for (const part of parts) {
//         const [keyRaw, valueRaw] = part.split("=").map((s) => s.trim());
//         if (!keyRaw || !valueRaw) continue;
//
//         const keyMap = {
//             AI: "ai",
//             manip: "manip",
//             patch: "patch",
//             meta: "meta",
//             fusion: "fusion",
//         };
//
//         const mappedKey = keyMap[keyRaw];
//         if (!mappedKey) continue;
//
//         const num = Number(valueRaw.replace(",", "."));
//         if (!Number.isNaN(num)) {
//             result[mappedKey] = num;
//         }
//     }
//
//     if (Object.keys(result).length === 0) return null;
//     return result;
// }
//
// // Клас для підсвітки значення
// function scoreClass(v) {
//     if (v == null) return "text-gray-400";
//     if (v < 0.3) return "text-emerald-600 font-semibold";   // низька підозрілість
//     if (v < 0.7) return "text-amber-600 font-semibold";      // середня
//     return "text-red-600 font-semibold";                     // висока
// }
//
// export default function HistoryPanel() {
//     const [items, setItems] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//
//     useEffect(() => {
//         fetchHistory()
//             .then(({ data }) => {
//                 setItems(data);
//             })
//             .catch((err) => {
//                 console.error(err);
//                 setError(
//                     "Не вдалося завантажити історію. Переконайтесь, що ви увійшли в систему."
//                 );
//             })
//             .finally(() => setLoading(false));
//     }, []);
//
//     if (loading) {
//         return (
//             <p className="mt-8 text-center text-gray-600">
//                 Завантаження історії...
//             </p>
//         );
//     }
//
//     if (error) {
//         return (
//             <p className="mt-8 text-center text-red-600 text-sm">
//                 {error}
//             </p>
//         );
//     }
//
//     if (!items.length) {
//         return (
//             <div className="mt-8 max-w-5xl mx-auto p-8 rounded-3xl bg-white/90 shadow-xl">
//                 <h2 className="text-2xl font-semibold mb-2">
//                     Моя історія аналізів
//                 </h2>
//                 <p className="text-sm text-gray-500">
//                     Історія порожня. Виконайте аналіз зображення, щоб побачити тут записи.
//                 </p>
//             </div>
//         );
//     }
//
//     return (
//         <div className="mt-10 max-w-6xl mx-auto px-4">
//             <div className="p-8 rounded-3xl bg-white/95 shadow-2xl border border-slate-100">
//                 <h2 className="text-2xl font-semibold mb-4">
//                     Моя історія аналізів
//                 </h2>
//                 <p className="text-sm text-gray-500 mb-4">
//                     Тут відображаються результати аналізу зображень: модуль ШІ, маніпуляції,
//                     локальні артефакти, метадані та підсумкова оцінка достовірності.
//                 </p>
//
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full text-sm border-separate border-spacing-y-3">
//                         <thead>
//                         <tr className="bg-slate-900 text-slate-50">
//                             <th className="px-4 py-3 text-left rounded-l-2xl">
//                                 Дата/час
//                             </th>
//                             <th className="px-4 py-3 text-left">
//                                 Файл
//                             </th>
//                             <th className="px-4 py-3 text-right">
//                                 Розмір (байт)
//                             </th>
//                             <th className="px-4 py-3 text-right">
//                                 AI
//                             </th>
//                             <th className="px-4 py-3 text-right">
//                                 Маніп.
//                             </th>
//                             <th className="px-4 py-3 text-right">
//                                 Патчі
//                             </th>
//                             <th className="px-4 py-3 text-right">
//                                 Метадані
//                             </th>
//                             <th className="px-4 py-3 text-right rounded-r-2xl">
//                                 Підсумок
//                             </th>
//                         </tr>
//                         </thead>
//                         <tbody>
//                         {items.map((row) => {
//                             const parsed = parseSummary(row.analysis_summary);
//                             const ai = parsed?.ai ?? null;
//                             const manip = parsed?.manip ?? null;
//                             const patch = parsed?.patch ?? null;
//                             const meta = parsed?.meta ?? null;
//                             const fusion = parsed?.fusion ?? null;
//
//                             const created = new Date(row.created_at);
//
//                             return (
//                                 <tr
//                                     key={row.id}
//                                     className="bg-slate-50/90 hover:bg-slate-100 transition-colors shadow-sm rounded-2xl"
//                                 >
//                                     <td className="px-4 py-3 rounded-l-2xl align-top">
//                                         <div className="text-xs text-gray-500">
//                                             {created.toLocaleString()}
//                                         </div>
//                                     </td>
//                                     <td className="px-4 py-3 align-top">
//                                         <div className="font-medium text-slate-900">
//                                             {row.filename}
//                                         </div>
//                                     </td>
//                                     <td className="px-4 py-3 text-right align-top text-gray-700">
//                                         {row.file_size_bytes ?? "—"}
//                                     </td>
//                                     <td className="px-4 py-3 text-right align-top">
//                       <span className={scoreClass(ai)}>
//                         {ai != null ? ai.toFixed(3) : "—"}
//                       </span>
//                                     </td>
//                                     <td className="px-4 py-3 text-right align-top">
//                       <span className={scoreClass(manip)}>
//                         {manip != null ? manip.toFixed(3) : "—"}
//                       </span>
//                                     </td>
//                                     <td className="px-4 py-3 text-right align-top">
//                       <span className={scoreClass(patch)}>
//                         {patch != null ? patch.toFixed(3) : "—"}
//                       </span>
//                                     </td>
//                                     <td className="px-4 py-3 text-right align-top">
//                       <span className={scoreClass(meta)}>
//                         {meta != null ? meta.toFixed(3) : "—"}
//                       </span>
//                                     </td>
//                                     <td className="px-4 py-3 text-right align-top rounded-r-2xl">
//                                         <div className={scoreClass(fusion)}>
//                                             {fusion != null ? fusion.toFixed(3) : "—"}
//                                         </div>
//                                         {row.analysis_summary && (
//                                             <div className="text-[11px] text-gray-500 mt-1">
//                                                 {row.analysis_summary}
//                                             </div>
//                                         )}
//                                     </td>
//                                 </tr>
//                             );
//                         })}
//                         </tbody>
//                     </table>
//                 </div>
//
//                 <p className="mt-4 text-xs text-gray-500">
//                     * Зелені значення – низька підозрілість, жовті – середня, червоні –
//                     висока. Підсумок відображає інтегральну оцінку достовірності.
//                 </p>
//             </div>
//         </div>
//     );
// }

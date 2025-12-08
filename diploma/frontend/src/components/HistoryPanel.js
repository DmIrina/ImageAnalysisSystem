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
                                    const fusion = parsed?.fusion ?? null;

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

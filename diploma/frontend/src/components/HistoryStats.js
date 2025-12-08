// frontend/src/components/HistoryStats.jsx
import React, {useEffect, useState} from "react";
import {fetchHistory} from "../api/backend";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
} from "recharts";

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

function formatScore(v) {
    if (v == null) return "—";
    return v.toFixed(3);
}

function calculateStats(items) {
    if (!items || items.length === 0) return null;

    const total = items.length;

    let firstDate = null;
    let lastDate = null;

    let sumAi = 0, cAi = 0;
    let sumManip = 0, cManip = 0;
    let sumPatch = 0, cPatch = 0;
    let sumMeta = 0, cMeta = 0;
    let sumFusion = 0, cFusion = 0;

    let lowCount = 0;
    let midCount = 0;
    let highCount = 0;

    for (const row of items) {
        const created = new Date(row.created_at);
        if (!firstDate || created < firstDate) firstDate = created;
        if (!lastDate || created > lastDate) lastDate = created;

        const parsed = parseSummary(row.analysis_summary);
        if (!parsed) continue;

        const {ai, manip, patch, meta, fusion} = parsed;

        if (ai != null) {
            sumAi += ai;
            cAi++;
        }
        if (manip != null) {
            sumManip += manip;
            cManip++;
        }
        if (patch != null) {
            sumPatch += patch;
            cPatch++;
        }
        if (meta != null) {
            sumMeta += meta;
            cMeta++;
        }
        if (fusion != null) {
            sumFusion += fusion;
            cFusion++;
            if (fusion < 0.3) lowCount++;
            else if (fusion < 0.7) midCount++;
            else highCount++;
        }
    }

    return {
        total,
        firstDate,
        lastDate,
        lowCount,
        midCount,
        highCount,
        avgAi: cAi ? sumAi / cAi : null,
        avgManip: cManip ? sumManip / cManip : null,
        avgPatch: cPatch ? sumPatch / cPatch : null,
        avgMeta: cMeta ? sumMeta / cMeta : null,
        avgFusion: cFusion ? sumFusion / cFusion : null,
    };
}

export default function HistoryStats() {
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchHistory()
            .then(({data}) => {
                const arr = data || [];
                setItems(arr);
                setStats(calculateStats(arr));
            })
            .catch((err) => {
                console.error(err);
                setError("Не вдалося завантажити статистику. Переконайтесь, що ви увійшли в систему.");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <p className="text-muted" style={{textAlign: "center"}}>
                Обчислення статистики...
            </p>
        );
    }

    if (error) {
        return (
            <p style={{textAlign: "center", color: "#dc2626", fontSize: 13}}>
                {error}
            </p>
        );
    }

    if (!stats || items.length === 0) {
        return (
            <div>
                <h2 className="app-card-title">Статистика проаналізованих зображень</h2>
                <p className="app-card-text">
                    Поки що немає жодного запису. Виконайте аналіз зображення, щоб побачити тут підсумки.
                </p>
            </div>
        );
    }

    const {
        total,
        firstDate,
        lastDate,
        lowCount,
        midCount,
        highCount,
        avgAi,
        avgManip,
        avgPatch,
        avgMeta,
        avgFusion,
    } = stats;

    const pct = (part) => (total ? ((part / total) * 100).toFixed(1) + "%" : "0%");

    const riskData = [
        {name: "Низька", value: lowCount},
        {name: "Середня", value: midCount},
        {name: "Висока", value: highCount},
    ];

    const timelineData = items
        .map((row) => {
            const parsed = parseSummary(row.analysis_summary);
            if (!parsed || parsed.fusion == null) return null;
            const created = new Date(row.created_at);
            return {
                label: created.toLocaleString(),
                fusion: parsed.fusion,
            };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(a.label) - new Date(b.label));

    const topSuspicious = items
        .map((row) => {
            const parsed = parseSummary(row.analysis_summary);
            if (!parsed || parsed.fusion == null) return null;
            return {
                id: row.id,
                filename: row.filename,
                fusion: parsed.fusion,
                created_at: row.created_at,
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.fusion - a.fusion)
        .slice(0, 5);

    return (
        <div>
            <h2 className="app-card-title">Статистика аналізів</h2>
            <p className="app-card-text">
                Короткий підсумок за всіма зображеннями, які ви проаналізували в системі.
            </p>

            {/* Картки зі зведеною статистикою */}
            <div className="history-stats-grid">
                <div className="history-stat-card">
                    <h3 className="history-stat-title">Загальна активність</h3>
                    <p className="history-stat-value">{total}</p>
                    <p className="history-stat-sub">проаналізованих зображень</p>
                    {firstDate && lastDate && (
                        <p className="history-stat-sub">
                            від {firstDate.toLocaleDateString()} до{" "}
                            {lastDate.toLocaleDateString()}
                        </p>
                    )}
                </div>

                <div className="history-stat-card">
                    <h3 className="history-stat-title">Середні значення модулів</h3>
                    <p className="history-stat-line">
                        AI: <b>{formatScore(avgAi)}</b>
                    </p>
                    <p className="history-stat-line">
                        Маніпуляції: <b>{formatScore(avgManip)}</b>
                    </p>
                    <p className="history-stat-line">
                        Патчі: <b>{formatScore(avgPatch)}</b>
                    </p>
                    <p className="history-stat-line">
                        Метадані: <b>{formatScore(avgMeta)}</b>
                    </p>
                    <p className="history-stat-line">
                        Підсумок (fusion): <b>{formatScore(avgFusion)}</b>
                    </p>
                </div>

                <div className="history-stat-card">
                    <h3 className="history-stat-title">Розподіл за підозрілістю</h3>
                    <p className="history-stat-line">
                        <span className="dot dot-low"/> Низька (fusion &lt; 0.3):{" "}
                        <b>{lowCount}</b> ({pct(lowCount)})
                    </p>
                    <p className="history-stat-line">
                        <span className="dot dot-mid"/> Середня (0.3–0.7):{" "}
                        <b>{midCount}</b> ({pct(midCount)})
                    </p>
                    <p className="history-stat-line">
                        <span className="dot dot-high"/> Висока (&ge; 0.7):{" "}
                        <b>{highCount}</b> ({pct(highCount)})
                    </p>
                </div>
            </div>

            {/* Стовпчикова діаграма рівнів підозрілості */}
            <div style={{marginTop: 20}}>
                <h3 className="history-stat-title" style={{marginBottom: 8}}>
                    Діаграма рівнів підозрілості (fusion)
                </h3>
                <div style={{width: "100%", height: 260}}>
                    <ResponsiveContainer>
                        <BarChart
                            data={riskData}
                            margin={{top: 10, right: 20, left: 0, bottom: 10}}
                        >
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis allowDecimals={false}/>
                            <Tooltip/>
                            <Legend/>
                            <Bar dataKey="value" name="Кількість зображень"/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Лінійний графік динаміки fusion у часі */}
            {timelineData.length > 0 && (
                <div style={{marginTop: 24}}>
                    <h3 className="history-stat-title" style={{marginBottom: 8}}>
                        Динаміка підсумкової оцінки (fusion) у часі
                    </h3>
                    <p className="history-stat-sub" style={{marginBottom: 8}}>
                        Дозволяє побачити, як змінювалася підозрілість зображень з часом.
                    </p>
                    <div style={{width: "100%", height: 260}}>
                        <ResponsiveContainer>
                            <LineChart
                                data={timelineData}
                                margin={{top: 10, right: 20, left: 0, bottom: 10}}
                            >
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis
                                    dataKey="label"
                                    tick={{fontSize: 10}}
                                    minTickGap={20}
                                />
                                <YAxis domain={[0, 1]}/>
                                <Tooltip/>
                                <Legend/>
                                <Line
                                    type="monotone"
                                    dataKey="fusion"
                                    name="fusion"
                                    dot={{r: 3}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Топ найбільш підозрілих зображень */}
            {topSuspicious.length > 0 && (
                <div style={{marginTop: 24}}>
                    <h3 className="history-stat-title" style={{marginBottom: 8}}>
                        Топ найменш підозрілих зображень
                    </h3>
                    <p className="history-stat-sub" style={{marginBottom: 8}}>
                        За спаданням інтегрального показника fusion.
                    </p>
                    <table className="history-table">
                        <thead>
                        <tr>
                            <th>Файл</th>
                            <th>Дата/час</th>
                            <th style={{textAlign: "right"}}>Fusion</th>
                        </tr>
                        </thead>
                        <tbody>
                        {topSuspicious.map((item) => {
                            const created = new Date(item.created_at);
                            return (
                                <tr key={item.id}>
                                    <td>{item.filename}</td>
                                    <td>{created.toLocaleString()}</td>
                                    <td style={{textAlign: "right"}}>
                                        {item.fusion.toFixed(3)}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

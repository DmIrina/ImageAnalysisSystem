// frontend/src/components/AdminPanel.jsx
import React, { useEffect, useState } from "react";
import { getAdminOverview } from "../api/admin";

function scoreClass(v) {
    if (v == null) return "score text-muted";
    if (v < 0.3) return "score score-low";
    if (v < 0.7) return "score score-mid";
    return "score score-high";
}

function formatScore(v) {
    if (v == null) return "—";
    return v.toFixed(3);
}

export default function AdminPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAdminOverview()
            .then(({ data }) => setData(data))
            .catch((err) => {
                console.error(err);
                setError("Не вдалося завантажити статистику по користувачам.");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <p className="text-muted" style={{ textAlign: "center" }}>
                Завантаження статистики по користувачам...
            </p>
        );
    }

    if (error) {
        return (
            <p style={{ color: "#dc2626", textAlign: "center" }}>
                {error}
            </p>
        );
    }

    if (!data) return null;

    const { users, images, scores, fusion_distribution, top_users_by_images } = data;

    return (
        <div>
            <h2 className="app-card-title">Панель статистики для адміна</h2>
            <p className="app-card-text" style={{ marginBottom: 16 }}>
                Тут відображається зведена статистика по користувачах та проаналізованих зображень
                у системі.
            </p>

            {/* Блок 1: статистика користувачів */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3 className="stat-title">Користувачі</h3>
                    <p className="stat-value">Всього: <b>{users.total}</b></p>
                    <p className="stat-sub">За останній місяць: {users.last_month}</p>
                    <p className="stat-sub">За останній тиждень: {users.last_week}</p>
                </div>

                {/* Блок 2: статистика зображень */}
                <div className="stat-card">
                    <h3 className="stat-title">Зображення</h3>
                    <p className="stat-value">Всього: <b>{images.total}</b></p>
                    <p className="stat-sub">За останній місяць: {images.last_month}</p>
                    <p className="stat-sub">За останній тиждень: {images.last_week}</p>
                </div>
            </div>

            {/* Блок 3: середні значення модулів */}
            <div className="stats-section">
                <h3 className="app-card-subtitle">Середні оцінки модулів</h3>
                <table className="history-table">
                    <thead>
                    <tr>
                        <th>Модуль</th>
                        <th style={{ textAlign: "right" }}>Середнє значення</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>ШІ</td>
                        <td style={{ textAlign: "right" }}>
                            <span className={scoreClass(scores.avg_ai)}>
                                {formatScore(scores.avg_ai)}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td>Маніпуляції</td>
                        <td style={{ textAlign: "right" }}>
                            <span className={scoreClass(scores.avg_manip)}>
                                {formatScore(scores.avg_manip)}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td>Патчі / локальні артефакти</td>
                        <td style={{ textAlign: "right" }}>
                            <span className={scoreClass(scores.avg_patch)}>
                                {formatScore(scores.avg_patch)}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td>Метадані</td>
                        <td style={{ textAlign: "right" }}>
                            <span className={scoreClass(scores.avg_meta)}>
                                {formatScore(scores.avg_meta)}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td>Підсумкова оцінка </td>
                        <td style={{ textAlign: "right" }}>
                            <span className={scoreClass(scores.avg_fusion)}>
                                {formatScore(scores.avg_fusion)}
                            </span>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <p className="history-note">
                    * Зелені значення – низька підозрілість, жовті – середня, червоні – висока.
                </p>
            </div>

            {/* Блок 4: розподіл підсумкових оцінок */}
            <div className="stats-section">
                <h3 className="app-card-subtitle">Розподіл підсумкових оцінок (fusion)</h3>
                <p className="app-card-text">
                    Низька підозрілість: <b>{fusion_distribution.low}</b> записів,
                    середня: <b>{fusion_distribution.mid}</b>,
                    висока: <b>{fusion_distribution.high}</b>.
                </p>

                <div className="fusion-chart">
                    {fusion_distribution.bins.map((count, idx) => {
                        const from = (idx / 10).toFixed(1);
                        const to = ((idx + 1) / 10).toFixed(1);
                        const max = Math.max(...fusion_distribution.bins, 1);
                        const widthPercent = (count / max) * 100;

                        return (
                            <div key={idx} className="fusion-bar-row">
                                <div className="fusion-bar-label">
                                    {from} – {to}
                                </div>
                                <div className="fusion-bar-track">
                                    <div
                                        className="fusion-bar-fill"
                                        style={{ width: `${widthPercent}%` }}
                                    />
                                </div>
                                <div className="fusion-bar-count">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Блок 5: топ-користувачі за кількістю зображень */}
            {top_users_by_images && top_users_by_images.length > 0 && (
                <div className="stats-section">
                    <h3 className="app-card-subtitle">Топ користувачів за кількістю аналізів зображень</h3>
                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                            <tr>
                                <th>Користувач</th>
                                <th>Email</th>
                                <th style={{ textAlign: "right" }}>Кількість зображень</th>
                            </tr>
                            </thead>
                            <tbody>
                            {top_users_by_images.map((u) => (
                                <tr key={u.user_id}>
                                    <td>{u.full_name || "—"}</td>
                                    <td>{u.email}</td>
                                    <td style={{ textAlign: "right" }}>{u.images_count}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

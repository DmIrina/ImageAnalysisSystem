import React, {useEffect, useState} from "react";
import {getAdminModelMetrics} from "../api/admin";

function formatVal(v, digits = 3) {
    if (v == null || Number.isNaN(v)) return "—";
    return Number(v).toFixed(digits);
}

export default function AdminModelMetricsPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAdminModelMetrics()
            .then(({data}) => setData(data))
            .catch((err) => {
                console.error(err);
                setError("Не вдалося завантажити метрики моделей.");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <p className="text-muted" style={{textAlign: "center"}}>
                Завантаження метрик моделей...
            </p>
        );
    }

    if (error) {
        return (
            <p style={{color: "#dc2626", textAlign: "center"}}>
                {error}
            </p>
        );
    }

    if (!data) return null;

    const {ai_detector} = data;
    const cm = Array.isArray(ai_detector?.confusion_matrix)
        ? ai_detector.confusion_matrix
        : null;

    let tn, fp, fn, tp;
    if (cm && cm.length === 2 && cm[0].length === 2 && cm[1].length === 2) {
        tn = cm[0][0];
        fp = cm[0][1];
        fn = cm[1][0];
        tp = cm[1][1];
    }

    return (
        <div>
            <h2 className="app-card-title">Метрики моделей</h2>
            <p className="app-card-text" style={{marginBottom: 16}}>
                Тут відображаються зведені показники якості основного модуля системи –
                детектора ШІ-згенерованих зображень. Інші модулі перебувають на стадії
                дослідної інтеграції і не показуються в цій панелі.
            </p>

            {/* Блок: AI-детектор */}
            {ai_detector ? (
                <div className="stats-section">
                    <h3 className="app-card-subtitle">
                        AI-детектор ({ai_detector.model_name})
                    </h3>
                    <p className="app-card-text">
                        Кількість валідаційних зразків:{" "}
                        <b>{ai_detector.n_val_samples}</b>
                        {ai_detector.evaluated_at && (
                            <> &nbsp;| Оцінено: {ai_detector.evaluated_at}</>
                        )}
                    </p>

                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                            <tr>
                                <th>Метрика</th>
                                <th style={{textAlign: "right"}}>Значення</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>Accuracy</td>
                                <td style={{textAlign: "right"}}>
                                    {formatVal(ai_detector.accuracy, 4)}
                                </td>
                            </tr>
                            <tr>
                                <td>Precision</td>
                                <td style={{textAlign: "right"}}>
                                    {formatVal(ai_detector.precision, 4)}
                                </td>
                            </tr>
                            <tr>
                                <td>Recall</td>
                                <td style={{textAlign: "right"}}>
                                    {formatVal(ai_detector.recall, 4)}
                                </td>
                            </tr>
                            <tr>
                                <td>F1-score</td>
                                <td style={{textAlign: "right"}}>
                                    {formatVal(ai_detector.f1, 4)}
                                </td>
                            </tr>
                            <tr>
                                <td>ROC-AUC</td>
                                <td style={{textAlign: "right"}}>
                                    {formatVal(ai_detector.roc_auc, 4)}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    {tn != null && (
                        <>
                            <h4 className="app-card-subtitle" style={{marginTop: 16}}>
                                Матриця помилок (image-level)
                            </h4>
                            <table className="history-table">
                                <thead>
                                <tr>
                                    <th></th>
                                    <th colSpan={2} style={{textAlign: "center"}}>
                                        Передбачення
                                    </th>
                                </tr>
                                <tr>
                                    <th>Фактичний клас</th>
                                    <th>Real (0)</th>
                                    <th>AI (1)</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td>Real (0)</td>
                                    <td>{tn}</td>
                                    <td>{fp}</td>
                                </tr>
                                <tr>
                                    <td>AI (1)</td>
                                    <td>{fn}</td>
                                    <td>{tp}</td>
                                </tr>
                                </tbody>
                            </table>
                            <p className="history-note">
                                * Позитивний клас – «AI-згенероване зображення».
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <p className="app-card-text">
                    Дані по AI-детектору відсутні. Переконайтеся, що виконано скрипт{" "}
                    <code>training/eval_ai_metrics.py</code> і JSON збережено у{" "}
                    <code>backend/logs/ai_metrics.json</code>.
                </p>
            )}
        </div>
    );
}

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

    const {ai_detector, manip_detector} = data;

    // Допоміжна функція для рендеру секції однієї моделі
    const renderModelSection = (modelData, title, labels) => {
        if (!modelData) return null;

        const cm = Array.isArray(modelData.confusion_matrix)
            ? modelData.confusion_matrix
            : null;

        let tn, fp, fn, tp;
        if (cm && cm.length === 2 && cm[0].length === 2 && cm[1].length === 2) {
            tn = cm[0][0];
            fp = cm[0][1];
            fn = cm[1][0];
            tp = cm[1][1];
        }

        return (
            <div className="stats-section" style={{ marginBottom: 32 }}>
                <h3 className="app-card-subtitle">
                    {title} ({modelData.model_name})
                </h3>
                <p className="app-card-text">
                    Кількість валідаційних зразків:{" "}
                    <b>{modelData.n_val_samples}</b>
                    {modelData.evaluated_at && (
                        <> &nbsp;| Оцінено: {new Date(modelData.evaluated_at).toLocaleString()}</>
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
                                {formatVal(modelData.accuracy, 4)}
                            </td>
                        </tr>
                        <tr>
                            <td>Precision</td>
                            <td style={{textAlign: "right"}}>
                                {formatVal(modelData.precision, 4)}
                            </td>
                        </tr>
                        <tr>
                            <td>Recall</td>
                            <td style={{textAlign: "right"}}>
                                {formatVal(modelData.recall, 4)}
                            </td>
                        </tr>
                        <tr>
                            <td>Specificity</td>
                            <td style={{textAlign: "right"}}>
                                {formatVal(modelData.specificity, 4)}
                            </td>
                        </tr>
                        <tr>
                            <td>F1-score</td>
                            <td style={{textAlign: "right"}}>
                                {formatVal(modelData.f1, 4)}
                            </td>
                        </tr>
                        <tr>
                            <td>ROC-AUC</td>
                            <td style={{textAlign: "right"}}>
                                {formatVal(modelData.roc_auc, 4)}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {tn != null && (
                    <>
                        <h4 className="app-card-subtitle" style={{marginTop: 16}}>
                            Матриця помилок
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
                                <th>{labels.negative} (0)</th>
                                <th>{labels.positive} (1)</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>{labels.negative} (0)</td>
                                <td>{tn}</td>
                                <td>{fp}</td>
                            </tr>
                            <tr>
                                <td>{labels.positive} (1)</td>
                                <td>{fn}</td>
                                <td>{tp}</td>
                            </tr>
                            </tbody>
                        </table>
                        <p className="history-note">
                            * Позитивний клас – «{labels.note}».
                        </p>
                    </>
                )}
            </div>
        );
    };

    return (
        <div>
            <h2 className="app-card-title">Метрики моделей</h2>
            <p className="app-card-text" style={{marginBottom: 16}}>
                Зведені показники якості роботи нейромережевих модулів системи, розраховані на валідаційних вибірках.
            </p>

            {/* Блок: AI-детектор */}
            {ai_detector ? renderModelSection(
                ai_detector,
                "AI-детектор",
                {
                    negative: "Real",
                    positive: "AI",
                    note: "AI-згенероване зображення"
                }
            ) : (
                <p className="app-card-text text-muted">
                    Дані по AI-детектору відсутні (ai_metrics.json).
                </p>
            )}

            <hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />

            {/* Блок: Детектор маніпуляцій */}
            {manip_detector ? renderModelSection(
                manip_detector,
                "Детектор маніпуляцій",
                {
                    negative: "Authentic",
                    positive: "Manipulated",
                    note: "Модифіковане зображення"
                }
            ) : (
                <p className="app-card-text text-muted">
                    Дані по детектору маніпуляцій відсутні (manip_metrics.json).
                </p>
            )}
        </div>
    );
}
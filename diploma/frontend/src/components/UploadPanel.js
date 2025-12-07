// frontend/src/components/UploadPanel.jsx

import React, { useState } from "react";
import { analyzeAll } from "../api/backend";
import ResultTabs from "./ResultTabs";

export default function UploadPanel() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);      // dataURL
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setFile(f);
        setResults(null);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(f);
    };

    const handleAnalyze = async () => {
        if (!file) {
            alert("Оберіть зображення для аналізу.");
            return;
        }
        setLoading(true);
        try {
            const { data } = await analyzeAll(file);
            setResults(data);
        } catch (err) {
            console.error(err);
            alert("Помилка аналізу. Перевірте роботу бекенду.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="app-card-title">Аналіз достовірності зображення</h2>
            <p className="app-card-text" style={{ marginBottom: 14 }}>
                Завантажте зображення, а потім натисніть кнопку «Почати аналіз»,
                щоб виконати перевірку на генерацію ШІ, маніпуляції,
                локальні артефакти та метадані.
            </p>

            <div className="upload-row">
                <label className="file-input-label">
                    Обрати зображення
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input-hidden"
                    />
                </label>
                {file && (
                    <span className="file-input-name">
                        {file.name}
                    </span>
                )}
            </div>

            {preview && (
                <img
                    src={preview}
                    alt="Попередній перегляд"
                    className="upload-preview"
                />
            )}

            <button
                onClick={handleAnalyze}
                disabled={loading || !file}
                className="primary-button"
                style={{ marginTop: 16 }}
            >
                {loading ? "Аналіз виконується..." : "Почати аналіз"}
            </button>

            {results && (
                <ResultTabs
                    results={results}
                    originalFileName={file ? file.name : null}
                    previewUrl={preview}
                />
            )}
        </div>
    );
}
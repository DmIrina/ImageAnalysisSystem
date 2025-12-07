// frontend/src/components/ResultTabs.jsx
import React, { useState } from "react";
import AIModule from "./modules/AIModule";
import ManipModule from "./modules/ManipModule";
import PatchModule from "./modules/PatchModule";
import ExifModule from "./modules/ExifModule";
import FusionModule from "./modules/FusionModule";

export default function ResultTabs({ results, originalFileName, previewUrl }) {
    const [active, setActive] = useState("ai");

    if (!results) return null;

    const tabs = [
        { id: "ai", label: "AI-аналіз" },
        { id: "manip", label: "Маніпуляції" },
        { id: "patch", label: "Патчі / локальні артефакти" },
        { id: "meta", label: "Метадані (EXIF)" },
        { id: "fusion", label: "Підсумковий результат" },
    ];

    return (
        <div>
            <div className="result-tabs-buttons">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActive(t.id)}
                        className={`tab-button ${active === t.id ? "active" : ""}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="app-card" style={{ marginTop: 12 }}>
                {active === "ai" && (
                    <AIModule
                        results={results}
                        originalFileName={originalFileName}
                        previewUrl={previewUrl}
                    />
                )}
                {active === "manip" && (
                    <ManipModule
                        results={results}
                        originalFileName={originalFileName}
                        previewUrl={previewUrl}
                    />
                )}
                {active === "patch" && (
                    <PatchModule
                        results={results}
                        originalFileName={originalFileName}
                        previewUrl={previewUrl}
                    />
                )}
                {active === "meta" && (
                    <ExifModule
                        results={results}
                        originalFileName={originalFileName}
                        previewUrl={previewUrl}
                    />
                )}
                {active === "fusion" && (
                    <FusionModule
                        results={results}
                        originalFileName={originalFileName}
                        previewUrl={previewUrl}
                    />
                )}
            </div>
        </div>
    );
}

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

// frontend/src/components/ResultTabs.jsx
// import React, { useState } from "react";
// import AIModule from "./modules/AIModule";
// import ManipModule from "./modules/ManipModule";
// import PatchModule from "./modules/PatchModule";
// import ExifModule from "./modules/ExifModule";
// import FusionModule from "./modules/FusionModule";
//
// export default function ResultTabs({ results, originalFileName, previewUrl }) {
//     const [active, setActive] = useState("ai");
//
//     if (!results) return null;
//
//     const tabs = [
//         { id: "ai", label: "AI-аналіз" },
//         { id: "manip", label: "Маніпуляції" },
//         { id: "patch", label: "Патчі / локальні артефакти" },
//         { id: "meta", label: "Метадані (EXIF)" },
//         { id: "fusion", label: "Підсумковий результат" },
//     ];
//
//     return (
//         <div className="result-tabs">
//             <div className="tabs-row">
//                 {tabs.map((t) => (
//                     <button
//                         key={t.id}
//                         type="button"
//                         onClick={() => setActive(t.id)}
//                         className={`tab-button ${active === t.id ? "active" : ""}`}
//                     >
//                         {t.label}
//                     </button>
//                 ))}
//             </div>
//
//             <div className="tab-content-card">
//                 {active === "ai" && <AIModule results={results} />}
//                 {active === "manip" && <ManipModule results={results} />}
//                 {active === "patch" && <PatchModule results={results} />}
//                 {active === "meta" && <ExifModule results={results} />}
//                 {active === "fusion" && (
//                     <FusionModule
//                         results={results}
//                         originalFileName={originalFileName}
//                         previewUrl={previewUrl}
//                     />
//                 )}
//             </div>
//         </div>
//     );
// }
//

// frontend/src/components/ResultTabs.jsx
// import React, { useState } from "react";
// import AIModule from "./modules/AIModule";
// import ManipModule from "./modules/ManipModule";
// import PatchModule from "./modules/PatchModule";
// import ExifModule from "./modules/ExifModule";
// import FusionModule from "./modules/FusionModule";
//
// export default function ResultTabs({ results, originalFileName, previewUrl }) {
//     const [active, setActive] = useState("ai");
//
//     if (!results) return null;
//
//     const tabs = [
//         { id: "ai", label: "AI-аналіз" },
//         { id: "manip", label: "Маніпуляції" },
//         { id: "patch", label: "Патчі / локальні артефакти" },
//         { id: "meta", label: "Метадані (EXIF)" },
//         { id: "fusion", label: "Підсумковий результат" },
//     ];
//
//     return (
//         <div>
//             <div className="result-tabs-row">
//                 {tabs.map((t) => (
//                     <button
//                         key={t.id}
//                         onClick={() => setActive(t.id)}
//                         className={
//                             "tab-button " + (active === t.id ? "tab-button-active" : "")
//                         }
//                     >
//                         {t.label}
//                     </button>
//                 ))}
//             </div>
//
//             <div className="p-4 border rounded-xl bg-white shadow" style={{ marginTop: 12 }}>
//                 {active === "ai" && <AIModule results={results} />}
//                 {active === "manip" && <ManipModule results={results} />}
//                 {active === "patch" && <PatchModule results={results} />}
//                 {active === "meta" && <ExifModule results={results} />}
//                 {active === "fusion" && (
//                     <FusionModule
//                         results={results}
//                         originalFileName={originalFileName}
//                         previewUrl={previewUrl}
//                     />
//                 )}
//             </div>
//         </div>
//     );
// }
//

// import React, { useState } from "react";
// import AIModule from "./modules/AIModule";
// import ManipModule from "./modules/ManipModule";
// import PatchModule from "./modules/PatchModule";
// import ExifModule from "./modules/ExifModule";
// import FusionModule from "./modules/FusionModule";
//
// export default function ResultTabs({ results }) {
//     const [active, setActive] = useState("ai");
//
//     if (!results) return null;
//
//     const tabs = [
//         { id: "ai", label: "AI-аналіз" },
//         { id: "manip", label: "Маніпуляції" },
//         { id: "patch", label: "Патчі / локальні артефакти" },
//         { id: "meta", label: "Метадані (EXIF)" },
//         { id: "fusion", label: "Підсумковий результат" },
//     ];
//
//     return (
//         <div className="result-tabs">
//             <div className="result-tabs-header">
//                 {tabs.map((t) => (
//                     <button
//                         key={t.id}
//                         type="button"
//                         onClick={() => setActive(t.id)}
//                         className={
//                             "result-tab-button" +
//                             (active === t.id ? " result-tab-button--active" : "")
//                         }
//                     >
//                         {t.label}
//                     </button>
//                 ))}
//             </div>
//
//             <div className="result-tabs-body">
//                 {active === "ai" && <AIModule results={results} />}
//                 {active === "manip" && <ManipModule results={results} />}
//                 {active === "patch" && <PatchModule results={results} />}
//                 {active === "meta" && <ExifModule results={results} />}
//                 {active === "fusion" && <FusionModule results={results} />}
//             </div>
//         </div>
//     );
// }


// import React, { useState } from "react";
// import AIModule from "./modules/AIModule";
// import ManipModule from "./modules/ManipModule";
// import PatchModule from "./modules/PatchModule";
// import ExifModule from "./modules/ExifModule";
// import FusionModule from "./modules/FusionModule";
//
// export default function ResultTabs({ results }) {
//     const [active, setActive] = useState("ai");
//
//     if (!results) return null;
//
//     const tabs = [
//         { id: "ai", label: "AI-аналіз" },
//         { id: "manip", label: "Маніпуляції" },
//         { id: "patch", label: "Патчі / локальні артефакти" },
//         { id: "meta", label: "Метадані (EXIF)" },
//         { id: "fusion", label: "Підсумковий результат" },
//     ];
//
//     return (
//         <div>
//             <div className="flex flex-wrap gap-2 mb-4">
//                 {tabs.map((t) => (
//                     <button
//                         key={t.id}
//                         onClick={() => setActive(t.id)}
//                         className={`px-4 py-2 rounded-lg border text-sm md:text-base
//                             ${
//                             active === t.id
//                                 ? "bg-blue-600 text-white border-blue-600"
//                                 : "bg-white text-gray-800 hover:bg-gray-100"
//                         }`}
//                     >
//                         {t.label}
//                     </button>
//                 ))}
//             </div>
//
//             <div className="p-4 border rounded-xl bg-white shadow">
//                 {active === "ai" && <AIModule results={results} />}
//                 {active === "manip" && <ManipModule results={results} />}
//                 {active === "patch" && <PatchModule results={results} />}
//                 {active === "meta" && <ExifModule results={results} />}
//                 {active === "fusion" && <FusionModule results={results} />}
//             </div>
//         </div>
//     );
// }

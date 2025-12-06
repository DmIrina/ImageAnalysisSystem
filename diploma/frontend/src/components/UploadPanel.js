// frontend/src/components/UploadPanel.jsx

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

        // Читаємо як dataURL, щоб потім в pdfMake вставити картинку
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result); // data:image/png;base64,...
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

            {/*{results && (*/}
            {/*    <ResultTabs*/}
            {/*        results={results}*/}
            {/*        originalFileName={file?.name}*/}
            {/*        previewUrl={preview}*/}
            {/*    />*/}
            {/*)}*/}
        </div>
    );
}

// import React, { useState } from "react";
// import { analyzeAll } from "../api/backend";
// import ResultTabs from "./ResultTabs";
//
// export default function UploadPanel() {
//     const [file, setFile] = useState(null);
//     const [preview, setPreview] = useState(null);
//     const [results, setResults] = useState(null);
//     const [loading, setLoading] = useState(false);
//
//     const handleFileChange = (e) => {
//         const f = e.target.files[0];
//         if (!f) return;
//         setFile(f);
//         setResults(null);
//
//         // робимо dataURL, щоб додавати в PDF
//         const reader = new FileReader();
//         reader.onload = () => {
//             setPreview(reader.result);
//         };
//         reader.readAsDataURL(f);
//     };
//
//     const handleAnalyze = async () => {
//         if (!file) {
//             alert("Оберіть зображення для аналізу.");
//             return;
//         }
//         setLoading(true);
//         try {
//             const { data } = await analyzeAll(file);
//             setResults(data);
//         } catch (err) {
//             console.error(err);
//             alert("Помилка аналізу. Перевірте роботу бекенду.");
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     return (
//         <div>
//             <h2 className="app-card-title">Аналіз достовірності зображення</h2>
//             <p className="app-card-text" style={{ marginBottom: 14 }}>
//                 Завантажте зображення, а потім натисніть кнопку «Почати аналіз»,
//                 щоб виконати перевірку на генерацію ШІ, маніпуляції, локальні артефакти та метадані.
//             </p>
//
//             <div className="upload-row">
//                 <label className="file-input-label">
//                     Обрати зображення
//                     <input
//                         type="file"
//                         accept="image/*"
//                         onChange={handleFileChange}
//                         className="file-input-hidden"
//                     />
//                 </label>
//                 {file && (
//                     <span className="file-input-name">
//                         {file.name}
//                     </span>
//                 )}
//             </div>
//
//             {preview && (
//                 <img
//                     src={preview}
//                     alt="Попередній перегляд"
//                     className="upload-preview"
//                 />
//             )}
//
//             <button
//                 onClick={handleAnalyze}
//                 disabled={loading || !file}
//                 className="primary-button"
//                 style={{ marginTop: 16 }}
//             >
//                 {loading ? "Аналіз виконується..." : "Почати аналіз"}
//             </button>
//
//             {results && (
//                 <ResultTabs
//                     results={results}
//                     fileName={file?.name || null}
//                     imageDataUrl={preview}
//                 />
//             )}
//         </div>
//     );
// }


// // frontend/src/components/UploadPanel.jsx
// import React, { useState } from "react";
// import { analyzeAll } from "../api/backend";
// import ResultTabs from "./ResultTabs";
//
// export default function UploadPanel() {
//     const [file, setFile] = useState(null);
//     const [preview, setPreview] = useState(null);
//     const [results, setResults] = useState(null);
//     const [loading, setLoading] = useState(false);
//
//     const handleFileChange = (e) => {
//         const f = e.target.files[0];
//         if (!f) return;
//         setFile(f);
//         setResults(null);
//         setPreview(URL.createObjectURL(f));
//     };
//
//     const handleAnalyze = async () => {
//         if (!file) {
//             alert("Оберіть зображення для аналізу.");
//             return;
//         }
//         setLoading(true);
//         try {
//             const { data } = await analyzeAll(file);
//             setResults(data);
//         } catch (err) {
//             console.error(err);
//             alert("Помилка аналізу. Перевірте роботу бекенду.");
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     return (
//         <div>
//             <h2 className="app-card-title">Аналіз достовірності зображення</h2>
//             <p className="app-card-text" style={{ marginBottom: 14 }}>
//                 Завантажте зображення, а потім натисніть кнопку «Почати аналіз»,
//                 щоб виконати перевірку на генерацію ШІ, маніпуляції, локальні артефакти та метадані.
//             </p>
//
//             <div className="upload-row">
//                 <label className="file-input-label">
//                     Обрати зображення
//                     <input
//                         type="file"
//                         accept="image/*"
//                         onChange={handleFileChange}
//                         className="file-input-hidden"
//                     />
//                 </label>
//                 {file && (
//                     <span className="file-input-name">
//                         {file.name}
//                     </span>
//                 )}
//             </div>
//
//             {preview && (
//                 <img
//                     src={preview}
//                     alt="Попередній перегляд"
//                     className="upload-preview"
//                 />
//             )}
//
//             <button
//                 onClick={handleAnalyze}
//                 disabled={loading || !file}
//                 className="primary-button"
//                 style={{ marginTop: 16 }}
//             >
//                 {loading ? "Аналіз виконується..." : "Почати аналіз"}
//             </button>
//
//             {results && <ResultTabs results={results} />}
//         </div>
//     );
// }


// // frontend/src/components/UploadPanel.jsx
// import React, { useState } from "react";
// import { analyzeAll } from "../api/backend";
// import ResultTabs from "./ResultTabs";
//
// export default function UploadPanel() {
//     const [file, setFile] = useState(null);
//     const [preview, setPreview] = useState(null);
//     const [results, setResults] = useState(null);
//     const [loading, setLoading] = useState(false);
//
//     const handleFileChange = (e) => {
//         const f = e.target.files[0];
//         if (!f) return;
//         setFile(f);
//         setResults(null);
//         setPreview(URL.createObjectURL(f));
//     };
//
//     const handleAnalyze = async () => {
//         if (!file) {
//             alert("Оберіть зображення для аналізу.");
//             return;
//         }
//         setLoading(true);
//         try {
//             const { data } = await analyzeAll(file);
//             setResults(data);
//         } catch (err) {
//             console.error(err);
//             alert("Помилка аналізу. Перевірте роботу бекенду.");
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     return (
//         <div>
//             <h2 className="app-card-title">Аналіз достовірності зображення</h2>
//             <p className="app-card-text">
//                 Завантажте зображення, а потім натисніть кнопку &laquo;Почати аналіз&raquo;,
//                 щоб виконати перевірку на генерацію ШІ, маніпуляції, локальні артефакти
//                 та метадані.
//             </p>
//
//             <div className="file-input-wrapper">
//                 <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleFileChange}
//                     className="file-input"
//                 />
//             </div>
//
//             {preview && (
//                 <img
//                     src={preview}
//                     alt="Попередній перегляд"
//                     className="image-preview"
//                 />
//             )}
//
//             <div style={{ marginTop: "8px", marginBottom: "8px" }}>
//                 <button
//                     onClick={handleAnalyze}
//                     disabled={loading || !file}
//                     className="primary-button"
//                 >
//                     {loading ? "Аналіз виконується..." : "Почати аналіз"}
//                 </button>
//             </div>
//
//             {results && (
//                 <div style={{ marginTop: "16px" }}>
//                     <ResultTabs results={results} />
//                 </div>
//             )}
//         </div>
//     );
// }





// // frontend/src/components/UploadPanel.jsx
//
// import React, { useState } from "react";
// import { analyzeAll } from "../api/backend";
// import ResultTabs from "./ResultTabs";
//
// export default function UploadPanel() {
//     const [file, setFile] = useState(null);
//     const [preview, setPreview] = useState(null);
//     const [results, setResults] = useState(null);
//     const [loading, setLoading] = useState(false);
//
//     const handleFileChange = (e) => {
//         const f = e.target.files[0];
//         if (!f) return;
//         setFile(f);
//         setResults(null);
//         setPreview(URL.createObjectURL(f));
//     };
//
//     const handleAnalyze = async () => {
//         if (!file) {
//             alert("Оберіть зображення для аналізу.");
//             return;
//         }
//         setLoading(true);
//         try {
//             const { data } = await analyzeAll(file);
//             setResults(data);
//         } catch (err) {
//             console.error(err);
//             alert("Помилка аналізу. Перевірте роботу бекенду.");
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     return (
//         <div className="p-6 bg-white rounded-2xl shadow-lg w-full max-w-xl">
//             <h2 className="text-2xl font-semibold mb-4 text-center">
//                 Аналіз достовірності зображення
//             </h2>
//
//             <div className="flex flex-col items-center">
//                 <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleFileChange}
//                     className="mb-4"
//                 />
//
//                 {preview && (
//                     <img
//                         src={preview}
//                         alt="Попередній перегляд"
//                         className="w-64 h-auto rounded-xl shadow mb-4 border"
//                     />
//                 )}
//
//                 <button
//                     onClick={handleAnalyze}
//                     disabled={loading || !file}
//                     className={`px-5 py-2 rounded-lg text-white ${
//                         loading || !file
//                             ? "bg-gray-400 cursor-not-allowed"
//                             : "bg-blue-600 hover:bg-blue-700 transition"
//                     }`}
//                 >
//                     {loading ? "Аналіз виконується..." : "Почати аналіз"}
//                 </button>
//             </div>
//
//             {results && (
//                 <div className="mt-8">
//                     <ResultTabs results={results} />
//                 </div>
//             )}
//         </div>
//     );
// }

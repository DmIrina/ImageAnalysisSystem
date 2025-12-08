// frontend/src/App.jsx

import React, {useState, useEffect} from "react";
import LoginPanel from "./components/LoginPanel";
import UploadPanel from "./components/UploadPanel";
import HistoryPanel from "./components/HistoryPanel";
import HistoryStats from "./components/HistoryStats";
import AdminPanel from "./components/AdminPanel";
import AdminModelMetricsPanel from "./components/AdminModelMetricsPanel";
import {getProfile} from "./api/auth";

export default function App() {
    const [isLogged, setIsLogged] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [view, setView] = useState("analysis");
    const [results, setResults] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        getProfile()
            .then((res) => {
                setIsLogged(true);
                setIsAdmin(!!res.data.is_admin);
            })
            .catch(() => {
                setIsLogged(false);
                setIsAdmin(false);
            });
    }, []);

    const handleAuthSuccess = async (payload) => {
        if (payload && typeof payload.isAdmin === "boolean") {
            setIsAdmin(payload.isAdmin);
        } else {
            try {
                const res = await getProfile();
                setIsAdmin(!!res.data.is_admin);
            } catch {
                setIsAdmin(false);
            }
        }
        setIsLogged(true);
        setView("analysis");
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLogged(false);
        setIsAdmin(false);
        setView("analysis");
    };

    return (
        <div className="app-root">
            <div className="app-header-block">
                <h1>Система аналізу достовірності зображень</h1>
            </div>

            <div className="card-block">
                <p>
                    Система виконує комплексний аналіз зображення: перевіряє,
                    чи могла картинка бути згенерованою ШІ, виявляє можливі
                    маніпуляції (наприклад, редагування у графічних редакторах),
                    локалізує підозрілі ділянки за допомогою карт активацій
                    та аналізу патчів, а також перевіряє EXIF-метадані.
                </p>
                <p>
                    На основі цих модулів формується інтегральна оцінка
                    достовірності зображення.
                </p>
            </div>

            {/* Логін / реєстрація */}
            <div className="card-block">
                <LoginPanel
                    isAuthenticated={isLogged}
                    onAuthSuccess={handleAuthSuccess}
                    onLogout={handleLogout}
                />
            </div>

            {/* Кнопки перемикання режимів */}
            {isLogged && (
                <div className="card-block">
                    <div className="switch-buttons">
                        <button
                            className={view === "analysis" ? "active" : ""}
                            onClick={() => setView("analysis")}
                        >
                            Аналіз зображення
                        </button>

                        <button
                            className={view === "history" ? "active" : ""}
                            onClick={() => setView("history")}
                        >
                            Моя історія
                        </button>

                        {isAdmin && (
                            <>
                                <button
                                    className={view === "admin_stats" ? "active" : ""}
                                    onClick={() => setView("admin_stats")}
                                >
                                    Статистика по користувачам
                                </button>

                                <button
                                    className={view === "admin_models" ? "active" : ""}
                                    onClick={() => setView("admin_models")}
                                >
                                    Метрики моделей
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Основна панель */}
            <div className="card-block">
                <div className="view-panel">
                    {/* Аналіз зображення */}
                    {view === "analysis" && (
                        <UploadPanel onResults={setResults} results={results}/>
                    )}

                    {/* Історія + статистика користувача */}
                    {view === "history" && isLogged && (
                        <>
                            <div className="card-block">
                                <HistoryPanel/>
                            </div>

                            <div className="card-block">
                                <HistoryStats/>
                            </div>
                        </>
                    )}

                    {view === "history" && !isLogged && (
                        <p style={{marginTop: 8}}>
                            Щоб переглянути історію аналізів зображень, увійдіть у систему.
                        </p>
                    )}

                    {/* Адмін: зведена статистика */}
                    {view === "admin_stats" && isAdmin && <AdminPanel/>}

                    {/* Адмін: метрики моделей */}
                    {view === "admin_models" && isAdmin && <AdminModelMetricsPanel/>}
                </div>
            </div>
        </div>
    );
}


// import React, {useState} from "react";
// import LoginPanel from "./components/LoginPanel";
// import UploadPanel from "./components/UploadPanel";
// import HistoryPanel from "./components/HistoryPanel";
// import HistoryStats from "./components/HistoryStats";
// import AdminPanel from "./components/AdminPanel";
// import AdminModelMetricsPanel from "./components/AdminModelMetricsPanel";
// import {getProfile} from "./api/auth";
//
// export default function App() {
//     const [isLogged, setIsLogged] = useState(false);
//     const [isAdmin, setIsAdmin] = useState(false);
//     const [view, setView] = useState("analysis");
//     const [results, setResults] = useState(null);
//
//     const handleAuthSuccess = async (payload) => {
//         if (payload && typeof payload.isAdmin === "boolean") {
//             setIsAdmin(payload.isAdmin);
//         } else {
//             try {
//                 const res = await getProfile();
//                 setIsAdmin(!!res.data.is_admin);
//             } catch {
//                 setIsAdmin(false);
//             }
//         }
//         setIsLogged(true);
//     };
//
//     const handleLogout = () => {
//         localStorage.removeItem("token");
//         setIsLogged(false);
//         setIsAdmin(false);
//         setView("analysis");
//     };
//
//     return (
//         <div className="app-root">
//             <div className="app-header-block">
//                 <h1>Система аналізу достовірності зображень</h1>
//             </div>
//
//             <div className="card-block">
//                 <p>
//                     Система виконує комплексний аналіз зображення: перевіряє,
//                     чи могла картинка бути згенерованою ШІ, виявляє можливі
//                     маніпуляції (наприклад, редагування у графічних редакторах),
//                     локалізує підозрілі ділянки за допомогою карт активацій
//                     та аналізу патчів, а також перевіряє EXIF-метадані.
//                 </p>
//                 <p>
//                     На основі цих модулів формується інтегральна оцінка
//                     достовірності зображення.
//                 </p>
//             </div>
//
//             {/* Логін */}
//             <div className="card-block">
//                 <LoginPanel
//                     isAuthenticated={isLogged}
//                     onAuthSuccess={handleAuthSuccess}
//                     onLogout={handleLogout}
//                 />
//             </div>
//
//             {/* Кнопки "Аналіз" / "Моя історія" / "Адмін статистика" */}
//             {isLogged && (
//                 <div className="card-block">
//                     <div className="switch-buttons">
//                         <button
//                             className={view === "analysis" ? "active" : ""}
//                             onClick={() => setView("analysis")}
//                         >
//                             Аналіз зображення
//                         </button>
//
//                         <button
//                             className={view === "history" ? "active" : ""}
//                             onClick={() => setView("history")}
//                         >
//                             Моя історія
//                         </button>
//
//                         {isAdmin && (
//                             <button
//                                 className={view === "admin" ? "active" : ""}
//                                 onClick={() => setView("admin")}
//                             >
//                                 Статистика по користувачам
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             )}
//
//             {/* Основна панель */}
//             <div className="card-block">
//                 <div className="view-panel">
//
//                     <div
//                         style={{
//                             display: view === "analysis" ? "block" : "none",
//                         }}
//                     >
//                         <UploadPanel onResults={setResults} results={results}/>
//                     </div>
//
//                     {/* Історія + статистика */}
//                     {view === "history" && isLogged && (
//                         <>
//                             <div className="card-block">
//                                 <HistoryPanel/>
//                             </div>
//
//                             <div className="card-block">
//                                 <HistoryStats/>
//                             </div>
//                         </>
//                     )}
//
//                     {view === "history" && !isLogged && (
//                         <p style={{marginTop: 8}}>
//                             Щоб переглянути історію аналізів зображень, увійдіть у систему.
//                         </p>
//                     )}
//
//
//                     {/* Адмін: зведена статистика */}
//                     {view === "admin" && isAdmin && (
//                         <AdminPanel />
//                     )}
//
//                     {/* Адмін: метрики моделей */}
//                     {view === "admin_models" && isAdmin && (
//                         <AdminModelMetricsPanel />
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
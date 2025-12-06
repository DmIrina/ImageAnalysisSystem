// frontend/src/App.jsx
import React, {useState} from "react";
import LoginPanel from "./components/LoginPanel";
import UploadPanel from "./components/UploadPanel";
import HistoryPanel from "./components/HistoryPanel";
import HistoryStats from "./components/HistoryStats";
import AdminPanel from "./components/AdminPanel";
import {getProfile} from "./api/auth";

export default function App() {
    const [isLogged, setIsLogged] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [view, setView] = useState("analysis");
    const [results, setResults] = useState(null);

    const handleAuthSuccess = async (payload) => {
        // якщо LoginPanel передасть isAdmin – беремо його
        if (payload && typeof payload.isAdmin === "boolean") {
            setIsAdmin(payload.isAdmin);
        } else {
            // запасний варіант – дотягнути профіль з /auth/me
            try {
                const res = await getProfile();
                setIsAdmin(!!res.data.is_admin);
            } catch {
                setIsAdmin(false);
            }
        }
        setIsLogged(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLogged(false);
        setIsAdmin(false);
        setView("analysis");
    };

    return (
        <div className="app-root">
            {/* Назва системи */}
            <div className="app-header-block">
                <h1>Система аналізу достовірності зображень</h1>
            </div>

            {/* Що робить система */}
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

            {/* Логін */}
            <div className="card-block">
                <LoginPanel
                    isAuthenticated={isLogged}
                    onAuthSuccess={handleAuthSuccess}
                    onLogout={handleLogout}
                />
            </div>

            {/* Кнопки "Аналіз" / "Моя історія" / "Адмін статистика" */}
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
                            <button
                                className={view === "admin" ? "active" : ""}
                                onClick={() => setView("admin")}
                            >
                                Статистика по користувачам
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/*/!* Основна панель *!/*/}
            {/*<div className="card-block">*/}
            {/*    <div className="view-panel">*/}
            {/*        {view === "analysis" && (*/}
            {/*            <UploadPanel onResults={setResults} results={results}/>*/}
            {/*        )}*/}

            {/*        {view === "history" && (*/}
            {/*            <>*/}
            {/*                <HistoryPanel/>*/}
            {/*                <div style={{marginTop: 20}}>*/}
            {/*                    <i>Статистика для користувача — графіки вже додані 😉</i>*/}
            {/*                </div>*/}
            {/*            </>*/}
            {/*        )}*/}



            {/*    </div>*/}
            {/*</div>*/}

            {/* Основна панель */}
            <div className="card-block">
                <div className="view-panel">
                    {/* Аналіз зображення — UploadPanel НЕ демонтовується,
                         просто ховається, тому вибране зображення зберігається */}
                    <div
                        style={{
                            display: view === "analysis" ? "block" : "none",
                        }}
                    >
                        <UploadPanel onResults={setResults} results={results}/>
                    </div>

                    {/* Історія + плейсхолдер статистики */}
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
                            Щоб переглянути історію аналізів зображень, увійдіть до системи.
                        </p>
                    )}

                    {view === "admin" && isAdmin && (
                        <AdminPanel/>
                    )}
                </div>
            </div>
        </div>
    );
}


// // frontend/src/App.jsx
// import React, { useState } from "react";
// import LoginPanel from "./components/LoginPanel";
// import UploadPanel from "./components/UploadPanel";
// import HistoryPanel from "./components/HistoryPanel";
// import HistoryStats from "./components/HistoryStats";
//
// export default function App() {
//     const [isLogged, setIsLogged] = useState(false);
//     const [view, setView] = useState("analysis");
//     const [results, setResults] = useState(null);
//
//     const handleAuthSuccess = () => {
//         setIsLogged(true);
//     };
//
//     const handleLogout = () => {
//         // якщо зберігаєш токен у localStorage — чистимо
//         localStorage.removeItem("token");
//         setIsLogged(false);
//         setView("analysis");
//     };
//
//     return (
//         <div className="app-root">
//             {/* Назва системи */}
//             <div className="app-header-block">
//                 <h1>Система аналізу достовірності зображень</h1>
//             </div>
//
//             {/* Що робить система */}
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
//             {/* Логін / реєстрація або "ви увійшли" + Вийти */}
//             <div className="card-block">
//                 <LoginPanel
//                     isAuthenticated={isLogged}
//                     onAuthSuccess={handleAuthSuccess}
//                     onLogout={handleLogout}
//                 />
//             </div>
//
//             {/* Кнопки "Аналіз" / "Моя історія" (історія тільки після логіну) */}
//             <div className="card-block">
//                 <div className="switch-buttons">
//                     <button
//                         className={view === "analysis" ? "active" : ""}
//                         onClick={() => setView("analysis")}
//                     >
//                         Аналіз зображення
//                     </button>
//
//                     {isLogged && (
//                         <button
//                             className={view === "history" ? "active" : ""}
//                             onClick={() => setView("history")}
//                         >
//                             Моя історія
//                         </button>
//                     )}
//                 </div>
//             </div>
//
//             {/* Основна панель */}
//             <div className="card-block">
//                 <div className="view-panel">
//                     {/* Аналіз зображення — UploadPanel НЕ демонтовується,
//                         просто ховається, тому вибране зображення зберігається */}
//                     <div
//                         style={{
//                             display: view === "analysis" ? "block" : "none",
//                         }}
//                     >
//                         <UploadPanel onResults={setResults} results={results} />
//                     </div>
//
//                     {/* Історія + плейсхолдер статистики */}
//                     {view === "history" && isLogged && (
//                         <>
//                             <div className="card-block">
//                                 <HistoryPanel />
//                             </div>
//
//                             <div className="card-block">
//                                 <HistoryStats />
//                             </div>
//                         </>
//                     )}
//
//                     {view === "history" && !isLogged && (
//                         <p style={{ marginTop: 8 }}>
//                             Щоб переглянути історію аналізів зображень, увійдіть до системи.
//                         </p>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
//
//
//
// // // frontend/src/App.js
// // import React, { useEffect, useState } from "react";
// // import LoginPanel from "./components/LoginPanel";
// // import UploadPanel from "./components/UploadPanel";
// // import HistoryPanel from "./components/HistoryPanel";
// //
// // function StatsPlaceholder() {
// //     return (
// //         <div className="view-subblock">
// //             <h3 className="app-card-title" style={{ fontSize: 18 }}>
// //                 Статистика по всіх зображеннях (плейсхолдер)
// //             </h3>
// //             <p className="app-card-text">
// //                 У цьому блоці в майбутньому можна буде показати зведену статистику:
// //                 кількість проаналізованих зображень, розподіл оцінок достовірності,
// //                 частку згенерованих ШІ / маніпульованих зображень тощо.
// //             </p>
// //         </div>
// //     );
// // }
// //
// // export default function App() {
// //     const [isAuthenticated, setIsAuthenticated] = useState(false);
// //     const [activeView, setActiveView] = useState("analysis"); // "analysis" | "history"
// //
// //     useEffect(() => {
// //         const token = localStorage.getItem("token");
// //         if (token) {
// //             setIsAuthenticated(true);
// //         }
// //     }, []);
// //
// //     const handleAuthSuccess = () => {
// //         setIsAuthenticated(true);
// //     };
// //
// //     const handleLogout = () => {
// //         localStorage.removeItem("token");
// //         setIsAuthenticated(false);
// //         setActiveView("analysis");
// //     };
// //
// //     return (
// //         <div className="app-root">
// //             {/* 1. Назва системи */}
// //             <h1 className="app-title">
// //                 Система аналізу достовірності зображень
// //             </h1>
// //
// //             {/* Усе тіло – в одній великій картці */}
// //             <div className="app-card">
// //                 {/* 2. Опис системи – окремий блок */}
// //                 <section className="section-block">
// //                     <p className="app-card-text">
// //                         Система виконує комплексний аналіз зображення: перевіряє,
// //                         чи могла картинка бути згенерованою ШІ, виявляє можливі
// //                         маніпуляції (наприклад, редагування у графічних редакторах),
// //                         локалізує підозрілі ділянки за допомогою карт активацій
// //                         та аналізу патчів, а також перевіряє EXIF-метадані.
// //                         На основі цих модулів формується інтегральна оцінка
// //                         достовірності зображення.
// //                     </p>
// //                 </section>
// //
// //                 {/* 3. Логін / реєстрація – окремий блок із своїм фоном */}
// //                 <section className="section-block section-auth">
// //                     <LoginPanel
// //                         isAuthenticated={isAuthenticated}
// //                         onAuthSuccess={handleAuthSuccess}
// //                         onLogout={handleLogout}
// //                     />
// //                 </section>
// //
// //                 {/* 4. Кнопки перемикання режимів – окремий блок */}
// //                 <section className="section-block section-switch">
// //                     <div className="view-switcher">
// //                         <button
// //                             type="button"
// //                             onClick={() => setActiveView("analysis")}
// //                             className={
// //                                 activeView === "analysis"
// //                                     ? "primary-button"
// //                                     : "secondary-button"
// //                             }
// //                         >
// //                             Аналіз зображення
// //                         </button>
// //
// //                         {isAuthenticated && (
// //                             <button
// //                                 type="button"
// //                                 onClick={() => setActiveView("history")}
// //                                 className={
// //                                     activeView === "history"
// //                                         ? "primary-button"
// //                                         : "secondary-button"
// //                                 }
// //                             >
// //                                 Моя історія
// //                             </button>
// //                         )}
// //                     </div>
// //                 </section>
// //
// //                 {/* 5. Основний вміст: або аналіз, або історія+статистика */}
// //                 <section className="section-block">
// //                     <div className="view-panel">
// //                         {activeView === "analysis" && (
// //                             <div className="view-subblock">
// //                                 {/* всередині UploadPanel уже є:
// //                                    - обрати зображення
// //                                    - прев’ю
// //                                    - кнопка "Почати аналіз"
// //                                    - блоки результатів (ResultTabs) після аналізу
// //                                 */}
// //                                 <UploadPanel />
// //                             </div>
// //                         )}
// //
// //                         {activeView === "history" && isAuthenticated && (
// //                             <>
// //                                 <div className="view-subblock">
// //                                     <HistoryPanel />
// //                                 </div>
// //                                 <StatsPlaceholder />
// //                             </>
// //                         )}
// //
// //                         {activeView === "history" && !isAuthenticated && (
// //                             <p className="app-card-text">
// //                                 Щоб переглянути історію аналізів, будь ласка, увійдіть
// //                                 до системи.
// //                             </p>
// //                         )}
// //                     </div>
// //                 </section>
// //             </div>
// //         </div>
// //     );
// // }
//
//
//
// // // frontend/src/App.js
// // import React, { useEffect, useState } from "react";
// // import LoginPanel from "./components/LoginPanel";
// // import UploadPanel from "./components/UploadPanel";
// // import HistoryPanel from "./components/HistoryPanel";
// //
// // function StatsPlaceholder() {
// //     return (
// //         <div className="view-subblock">
// //             <h3 className="app-card-title" style={{ fontSize: 18 }}>
// //                 Статистика по всіх зображеннях (плейсхолдер)
// //             </h3>
// //             <p className="app-card-text">
// //                 У цьому блоці в майбутньому можна буде показати зведену статистику:
// //                 кількість проаналізованих зображень, розподіл оцінок достовірності,
// //                 частку згенерованих ШІ / маніпульованих зображень тощо.
// //             </p>
// //         </div>
// //     );
// // }
// //
// // export default function App() {
// //     const [isAuthenticated, setIsAuthenticated] = useState(false);
// //     const [activeView, setActiveView] = useState("analysis"); // "analysis" | "history"
// //
// //     useEffect(() => {
// //         const token = localStorage.getItem("token");
// //         if (token) {
// //             setIsAuthenticated(true);
// //         }
// //     }, []);
// //
// //     const handleAuthSuccess = () => {
// //         setIsAuthenticated(true);
// //     };
// //
// //     const handleLogout = () => {
// //         localStorage.removeItem("token");
// //         setIsAuthenticated(false);
// //         setActiveView("analysis");
// //     };
// //
// //     return (
// //         <div className="app-root">
// //             {/* 1. Назва системи */}
// //             <h1 className="app-title">
// //                 Система аналізу достовірності зображень
// //             </h1>
// //
// //             {/* Усе тіло – в одній великій картці */}
// //             <div className="app-card">
// //                 {/* 2. Опис системи – окремий блок */}
// //                 <section className="section-block">
// //                     <p className="app-card-text">
// //                         Система виконує комплексний аналіз зображення: перевіряє,
// //                         чи могла картинка бути згенерованою ШІ, виявляє можливі
// //                         маніпуляції (наприклад, редагування у графічних редакторах),
// //                         локалізує підозрілі ділянки за допомогою карт активацій
// //                         та аналізу патчів, а також перевіряє EXIF-метадані.
// //                         На основі цих модулів формується інтегральна оцінка
// //                         достовірності зображення.
// //                     </p>
// //                 </section>
// //
// //                 {/* 3. Логін / реєстрація – окремий блок із своїм фоном */}
// //                 <section className="section-block section-auth">
// //                     <LoginPanel
// //                         isAuthenticated={isAuthenticated}
// //                         onAuthSuccess={handleAuthSuccess}
// //                         onLogout={handleLogout}
// //                     />
// //                 </section>
// //
// //                 {/* 4. Кнопки перемикання режимів – окремий блок */}
// //                 <section className="section-block section-switch">
// //                     <div className="view-switcher">
// //                         <button
// //                             type="button"
// //                             onClick={() => setActiveView("analysis")}
// //                             className={
// //                                 activeView === "analysis"
// //                                     ? "primary-button"
// //                                     : "secondary-button"
// //                             }
// //                         >
// //                             Аналіз зображення
// //                         </button>
// //
// //                         {isAuthenticated && (
// //                             <button
// //                                 type="button"
// //                                 onClick={() => setActiveView("history")}
// //                                 className={
// //                                     activeView === "history"
// //                                         ? "primary-button"
// //                                         : "secondary-button"
// //                                 }
// //                             >
// //                                 Моя історія
// //                             </button>
// //                         )}
// //                     </div>
// //                 </section>
// //
// //                 {/* 5. Основний вміст: або аналіз, або історія+статистика */}
// //                 <section className="section-block">
// //                     <div className="view-panel">
// //                         {activeView === "analysis" && (
// //                             <div className="view-subblock">
// //                                 {/* всередині UploadPanel уже є:
// //                                    - обрати зображення
// //                                    - прев’ю
// //                                    - кнопка "Почати аналіз"
// //                                    - блоки результатів (ResultTabs) після аналізу
// //                                 */}
// //                                 <UploadPanel />
// //                             </div>
// //                         )}
// //
// //                         {activeView === "history" && isAuthenticated && (
// //                             <>
// //                                 <div className="view-subblock">
// //                                     <HistoryPanel />
// //                                 </div>
// //                                 <StatsPlaceholder />
// //                             </>
// //                         )}
// //
// //                         {activeView === "history" && !isAuthenticated && (
// //                             <p className="app-card-text">
// //                                 Щоб переглянути історію аналізів, будь ласка, увійдіть
// //                                 до системи.
// //                             </p>
// //                         )}
// //                     </div>
// //                 </section>
// //             </div>
// //         </div>
// //     );
// // }

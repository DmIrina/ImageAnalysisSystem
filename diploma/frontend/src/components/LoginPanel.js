// frontend/src/components/LoginPanel.jsx

import React, {useState, useEffect} from "react";
import {login, register, getProfile} from "../api/auth";
import ToastMessage from "./ToastMessage";

export default function LoginPanel({isAuthenticated, onAuthSuccess, onLogout}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [toast, setToast] = useState(null);
    const [userName, setUserName] = useState("");

    const showToast = (msg, type = "success") => {
        setToast({msg, type});
    };

    useEffect(() => {
        if (isAuthenticated) {
            getProfile()
                .then(res => {
                    setUserName(res.data.full_name || "");
                })
                .catch(() => {
                });
        }
    }, [isAuthenticated]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isLogin) {
                const res = await login(email, password);
                localStorage.setItem("token", res.data.access_token);

                const profile = await getProfile();

                const name =
                    profile.data.full_name ||
                    profile.data.email ||
                    "";

                setUserName(name);

                const isAdmin = !!profile.data.is_admin;

                showToast(`Вітаємо, ${name || "користувачу"}!`, "success");
                // onAuthSuccess && onAuthSuccess();
                onAuthSuccess && onAuthSuccess({ isAdmin, fullName: name });
            } else {
                if (!fullName.trim()) {
                    showToast("Введіть повне ім'я!", "error");
                    return;
                }
                await register(email, password, fullName);
                showToast("Реєстрація успішна! Тепер увійдіть.", "success");
                setIsLogin(true);
                return;
            }
        } catch (err) {
            console.error(err);
            showToast("Помилка. Перевірте введені дані.", "error");
        }
    };


    return (
        <div className="auth-panel">
            {toast && (
                <ToastMessage
                    message={toast.msg}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {isAuthenticated ? (
                <div className="auth-logged-box" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap"
                }}>
                    <div>
                        <p className="app-card-text" style={{marginBottom: 4}}>
                            Вітаємо, <b>{userName}</b>!
                        </p>
                        <p className="app-card-text" style={{marginBottom: 0}}>
                            Історія аналізів зображень буде збережена у вашому кабінеті.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onLogout}
                        style={{whiteSpace: "nowrap"}}
                    >
                        Вийти
                    </button>
                </div>

            ) : (
                <>
                    <h2 className="app-card-title">{isLogin ? "Вхід" : "Реєстрація"}</h2>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {!isLogin && (
                            <input
                                type="text"
                                required
                                placeholder="Повне ім'я"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="input-field"
                            />
                        )}

                        <input
                            type="email"
                            required
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                        />

                        <input
                            type="password"
                            required
                            autoComplete="new-password"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                        />

                        <button type="submit" className="primary-button">
                            {isLogin ? "Увійти" : "Зареєструватися"}
                        </button>

                        <button
                            type="button"
                            className="secondary-button auth-toggle"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin
                                ? "Немає акаунта? Зареєструватися"
                                : "Уже є акаунт? Увійти"}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}


// import React, { useState } from "react";
// import { login, register } from "../api/auth";
// import ToastMessage from "./ToastMessage";
//
// export default function LoginPanel({ isAuthenticated, onAuthSuccess, onLogout }) {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [fullName, setFullName] = useState("");
//     const [isLogin, setIsLogin] = useState(true);
//     const [toast, setToast] = useState(null);
//
//     const showToast = (msg, type = "success") => {
//         setToast({ msg, type });
//     };
//
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             if (isLogin) {
//                 const res = await login(email, password);
//                 localStorage.setItem("token", res.data.access_token);
//                 onAuthSuccess && onAuthSuccess();
//                 showToast("Вхід успішний!", "success");
//             } else {
//                 await register(email, password, fullName);
//                 showToast("Реєстрація успішна! Тепер увійдіть.", "success");
//                 setIsLogin(true);
//                 return;
//             }
//         } catch (err) {
//             console.error(err);
//             showToast("Помилка авторизації або реєстрації. Перевірте дані.", "error");
//         }
//     };
//
//     return (
//         <div className="auth-panel">
//             {toast && (
//                 <ToastMessage
//                     message={toast.msg}
//                     type={toast.type}
//                     onClose={() => setToast(null)}
//                 />
//             )}
//
//             {isAuthenticated ? (
//                 <div
//                     style={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "space-between",
//                         gap: 12,
//                         flexWrap: "wrap",
//                     }}
//                 >
//                     <p className="app-card-text" style={{ marginBottom: 0 }}>
//                         Ви увійшли в систему. Історія аналізів буде збережена у вашому кабінеті.
//                     </p>
//                     <button
//                         type="button"
//                         className="secondary-button"
//                         onClick={onLogout}
//                     >
//                         Вийти
//                     </button>
//                 </div>
//             ) : (
//                 <>
//                     <h2 className="app-card-title" style={{ marginBottom: 12 }}>
//                         {isLogin ? "Вхід" : "Реєстрація"}
//                     </h2>
//
//                     <form onSubmit={handleSubmit} className="auth-form">
//                         {!isLogin && (
//                             <div style={{ marginBottom: 10 }}>
//                                 <input
//                                     type="text"
//                                     placeholder="Повне ім'я (необов’язково)"
//                                     value={fullName}
//                                     onChange={(e) => setFullName(e.target.value)}
//                                     className="input-field"
//                                 />
//                             </div>
//                         )}
//
//                         <div style={{ marginBottom: 10 }}>
//                             <input
//                                 type="email"
//                                 required
//                                 placeholder="Email"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                                 className="input-field"
//                             />
//                         </div>
//
//                         <div style={{ marginBottom: 16 }}>
//                             <input
//                                 type="password"
//                                 required
//                                 placeholder="Пароль"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 className="input-field"
//                             />
//                         </div>
//
//                         <div
//                             style={{
//                                 display: "flex",
//                                 gap: 12,
//                                 flexWrap: "wrap",
//                                 alignItems: "center",
//                             }}
//                         >
//                             <button type="submit" className="primary-button">
//                                 {isLogin ? "Увійти" : "Зареєструватися"}
//                             </button>
//
//                             <button
//                                 type="button"
//                                 className="secondary-button auth-toggle"
//                                 onClick={() => setIsLogin(!isLogin)}
//                             >
//                                 {isLogin
//                                     ? "Немає акаунта? Зареєструватися"
//                                     : "Уже є акаунт? Увійти"}
//                             </button>
//                         </div>
//                     </form>
//                 </>
//             )}
//         </div>
//     );
// }


// import React, { useState } from "react";
// import { login, register } from "../api/auth";
//
// export default function LoginPanel({ isAuthenticated, onAuthSuccess, onLogout }) {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [fullName, setFullName] = useState("");
//     const [isLogin, setIsLogin] = useState(true);
//
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             if (isLogin) {
//                 const res = await login(email, password);
//                 localStorage.setItem("token", res.data.access_token);
//             } else {
//                 await register(email, password, fullName);
//                 alert("Реєстрація успішна! Тепер увійдіть.");
//                 setIsLogin(true);
//                 return;
//             }
//             onAuthSuccess && onAuthSuccess();
//         } catch (err) {
//             alert("Помилка авторизації або реєстрації");
//             console.error(err);
//         }
//     };
//
//     // 🔹 Якщо користувач уже увійшов – показуємо тільки статус + Вийти
//     if (isAuthenticated) {
//         return (
//             <div className="auth-panel">
//                 <div style={{
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                     gap: 12,
//                     flexWrap: "wrap"
//                 }}>
//                     <p className="app-card-text" style={{ marginBottom: 0 }}>
//                         Ви увійшли в систему. Історія аналізів буде збережена у вашому кабінеті.
//                     </p>
//                     <button
//                         type="button"
//                         className="secondary-button"
//                         onClick={onLogout}
//                     >
//                         Вийти
//                     </button>
//                 </div>
//             </div>
//         );
//     }
//
//     // 🔹 Якщо НЕ увійшов – форма логіну/реєстрації
//     return (
//         <div className="auth-panel">
//             <h2 className="app-card-title" style={{ marginBottom: 12 }}>
//                 {isLogin ? "Вхід" : "Реєстрація"}
//             </h2>
//
//             <form onSubmit={handleSubmit}>
//                 {!isLogin && (
//                     <div style={{ marginBottom: 12 }}>
//                         <input
//                             type="text"
//                             placeholder="Повне ім'я (необов’язково)"
//                             value={fullName}
//                             onChange={(e) => setFullName(e.target.value)}
//                             className="input-field"
//                         />
//                     </div>
//                 )}
//
//                 <div style={{ marginBottom: 12 }}>
//                     <input
//                         type="email"
//                         required
//                         placeholder="Email"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         className="input-field"
//                     />
//                 </div>
//
//                 <div style={{ marginBottom: 16 }}>
//                     <input
//                         type="password"
//                         required
//                         placeholder="Пароль"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         className="input-field"
//                     />
//                 </div>
//
//                 <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
//                     <button type="submit" className="primary-button">
//                         {isLogin ? "Увійти" : "Зареєструватися"}
//                     </button>
//
//                     <button
//                         type="button"
//                         className="secondary-button auth-toggle"
//                         onClick={() => setIsLogin(!isLogin)}
//                     >
//                         {isLogin
//                             ? "Немає акаунта? Зареєструватися"
//                             : "Уже є акаунт? Увійти"}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }


// // frontend/src/components/LoginPanel.jsx
// import React, { useState } from "react";
// import { login, register } from "../api/auth";
//
// export default function LoginPanel({ isAuthenticated, onAuthSuccess, onLogout }) {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [fullName, setFullName] = useState("");
//     const [isLogin, setIsLogin] = useState(true);
//
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             if (isLogin) {
//                 const res = await login(email, password);
//                 localStorage.setItem("token", res.data.access_token);
//             } else {
//                 await register(email, password, fullName);
//                 alert("Реєстрація успішна! Тепер увійдіть.");
//                 setIsLogin(true);
//                 return;
//             }
//             onAuthSuccess && onAuthSuccess();
//         } catch (err) {
//             alert("Помилка авторизації або реєстрації");
//             console.error(err);
//         }
//     };
//
//     // 🔹 Якщо користувач уже увійшов – показуємо статус + кнопку "Вийти"
//     if (isAuthenticated) {
//         return (
//             <div className="auth-panel">
//                 <div
//                     style={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "space-between",
//                         gap: 12,
//                     }}
//                 >
//                     <div className="app-card-text" style={{ marginBottom: 0 }}>
//                         Ви увійшли в систему. Історія аналізів буде
//                         збережена у вашому кабінеті.
//                     </div>
//                     <button
//                         type="button"
//                         className="secondary-button"
//                         onClick={onLogout}
//                     >
//                         Вийти
//                     </button>
//                 </div>
//             </div>
//         );
//     }
//
//     // 🔹 Якщо НЕ увійшов – показуємо форму
//     return (
//         <div className="auth-panel">
//             <h2 className="app-card-title" style={{ marginBottom: 12 }}>
//                 {isLogin ? "Вхід" : "Реєстрація"}
//             </h2>
//
//             <form onSubmit={handleSubmit}>
//                 {!isLogin && (
//                     <div style={{ marginBottom: 12 }}>
//                         <input
//                             type="text"
//                             placeholder="Повне ім'я (необов’язково)"
//                             value={fullName}
//                             onChange={(e) => setFullName(e.target.value)}
//                             className="input-field"
//                         />
//                     </div>
//                 )}
//
//                 <div style={{ marginBottom: 12 }}>
//                     <input
//                         type="email"
//                         required
//                         placeholder="Email"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         className="input-field"
//                     />
//                 </div>
//
//                 <div style={{ marginBottom: 16 }}>
//                     <input
//                         type="password"
//                         required
//                         placeholder="Пароль"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         className="input-field"
//                     />
//                 </div>
//
//                 <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
//                     <button
//                         type="submit"
//                         className="primary-button"
//                     >
//                         {isLogin ? "Увійти" : "Зареєструватися"}
//                     </button>
//
//                     <button
//                         type="button"
//                         className="secondary-button auth-toggle"
//                         onClick={() => setIsLogin(!isLogin)}
//                     >
//                         {isLogin
//                             ? "Немає акаунта? Зареєструватися"
//                             : "Уже є акаунт? Увійти"}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }


// import React, { useState } from "react";
// import { login, register } from "../api/auth";
//
// export default function LoginPanel({ onAuthSuccess }) {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [fullName, setFullName] = useState("");
//     const [isLogin, setIsLogin] = useState(true);
//
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             if (isLogin) {
//                 const res = await login(email, password);
//                 localStorage.setItem("token", res.data.access_token);
//             } else {
//                 await register(email, password, fullName);
//                 alert("Реєстрація успішна! Тепер увійдіть.");
//                 setIsLogin(true);
//                 return;
//             }
//             onAuthSuccess();
//         } catch (err) {
//             alert("Помилка авторизації або реєстрації");
//             console.error(err);
//         }
//     };
//
//     return (
//         <div className="auth-panel">
//             <h2 className="app-card-title" style={{ marginBottom: 12 }}>
//                 {isLogin ? "Вхід" : "Реєстрація"}
//             </h2>
//
//             <form onSubmit={handleSubmit}>
//                 {!isLogin && (
//                     <div style={{ marginBottom: 12 }}>
//                         <input
//                             type="text"
//                             placeholder="Повне ім'я (необов’язково)"
//                             value={fullName}
//                             onChange={(e) => setFullName(e.target.value)}
//                             className="input-field"
//                         />
//                     </div>
//                 )}
//
//                 <div style={{ marginBottom: 12 }}>
//                     <input
//                         type="email"
//                         required
//                         placeholder="Email"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         className="input-field"
//                     />
//                 </div>
//
//                 <div style={{ marginBottom: 16 }}>
//                     <input
//                         type="password"
//                         required
//                         placeholder="Пароль"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         className="input-field"
//                     />
//                 </div>
//
//                 <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//                     <button
//                         type="submit"
//                         className="primary-button"
//                     >
//                         {isLogin ? "Увійти" : "Зареєструватися"}
//                     </button>
//
//                     <button
//                         type="button"
//                         className="secondary-button auth-toggle"
//                         onClick={() => setIsLogin(!isLogin)}
//                     >
//                         {isLogin
//                             ? "Немає акаунта? Зареєструватися"
//                             : "Уже є акаунт? Увійти"}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// }

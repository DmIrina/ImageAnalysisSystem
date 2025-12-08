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
                onAuthSuccess && onAuthSuccess({isAdmin, fullName: name});
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
                            Історія проаналізованих зображень буде збережена у вашому кабінеті.
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


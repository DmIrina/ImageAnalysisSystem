// frontend/src/api/backend.js
import axios from "axios";

export const API_URL = "http://127.0.0.1:8000";

// єдиний інстанс axios, до якого чіпляємо токен
const axiosInstance = axios.create({
    baseURL: API_URL,
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Аналіз зображення ---
const postFile = (url, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosInstance.post(url, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const analyzeAll = (file) => postFile("/analyze_full", file);

// --- Історія поточного користувача ---
export const fetchHistory = () =>
    axiosInstance.get("/history/me");

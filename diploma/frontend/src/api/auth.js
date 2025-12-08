import axios from "axios";
import {API_URL} from "./backend";

export const register = (email, password, fullName) =>
    axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        full_name: fullName,
    });

export const login = (email, password) =>
    axios.post(`${API_URL}/auth/login`, {
        email,
        password,
    });

export const getProfile = () => {
    const token = localStorage.getItem("token");
    return axios.get(`${API_URL}/auth/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};


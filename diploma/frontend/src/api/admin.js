import axios from "axios";
import {API_URL} from "./backend";

export const getAdminOverview = () => {
    const token = localStorage.getItem("token");
    return axios.get(`${API_URL}/admin/overview`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const getAdminModelMetrics = () => {
    const token = localStorage.getItem("token");
    return axios.get(`${API_URL}/admin/models-metrics`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

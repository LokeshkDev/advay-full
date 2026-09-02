import axios from "axios";


export const API_BASE_URL = (process.env.REACT_APP_API_URL || "https://api.advaytraders.in/api").replace(/\/$/, "");
export const BACKEND_HOST = API_BASE_URL.replace(/\/api$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

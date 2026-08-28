import axios from "axios";


// const API_BASE_URL = "http://localhost:5000/api";
const API_BASE_URL = process.env.REACT_APP_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

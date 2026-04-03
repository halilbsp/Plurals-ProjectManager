import axios from "axios";

const defaultApiUrl = "http://127.0.0.1:8000";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || defaultApiUrl;

export const api = axios.create({
  baseURL: apiBaseUrl.replace(/\/+$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});

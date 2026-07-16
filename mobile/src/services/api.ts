import axios from "axios";

const api = axios.create({
  baseURL: "http://172.27.182.10:3000/api",
  timeout: 10000, // 10 secondes maximum
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
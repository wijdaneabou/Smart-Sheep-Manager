import axios from "axios";

const api = axios.create({
  baseURL: "http://172.27.182.10:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
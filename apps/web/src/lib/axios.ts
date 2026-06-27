import axios from "axios";

// ─── In-memory access token ───────────────────────────────────────────────────
// localStorage mein nahi rakhte — XSS attack se chori ho sakta hai.
// Memory mein rakho: page refresh pe jaata hai, lekin /auth/refresh (httpOnly
// cookie) se wapas mil jaata hai — isliye괜찮다 safe hai.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// ─── Base Axios instance ──────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  withCredentials: true, // httpOnly cookies automatically jaate hain (refresh token)
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────
// Har request se pehle chalta hai — accessToken hai toh header mein lagao
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response interceptor ────────────────────────────────────────────────────
// Flag to prevent infinite retry loop (refresh khud bhi 401 de toh stop karo)
let isRefreshing = false;

// Jab refresh chal raha ho, baaki failed requests yahan queue mein wait karti hain
let waitingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  waitingQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  waitingQueue = [];
}

api.interceptors.response.use(
  // 2xx response — seedha return
  (response) => response,

  // Error response
  async (error) => {
    const originalRequest = error.config;

    // 401 aaya + yeh retry nahi tha abhi tak
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Refresh already chal raha hai — is request ko queue mein daal do
        return new Promise((resolve, reject) => {
          waitingQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // httpOnly cookie automatically jaayegi — explicitly kuch nahi bhejna
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken: string = data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);

        // Original request dobara try karo naye token ke saath
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh bhi fail hua — user logged out hai
        processQueue(refreshError, null);
        setAccessToken(null);

        // Zustand store clear karna hoga (19d mein wire karenge)
        // Abhi sirf login page pe bhejo
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

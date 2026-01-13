import { API_BASE, API_KEY } from "./config.js";

function buildUrl(path) {
  const url = new URL(API_BASE + path);
  url.searchParams.set("api_key", API_KEY);
  return url.toString();
}

async function request(path, options = {}) {
  const url = buildUrl(path);

  const merged = {
    headers: {
      ...(options.headers || {}),
    },
    ...options,
  };

  if (merged.body && typeof merged.body !== "string") {
    merged.headers["Content-Type"] = "application/json";
    merged.body = JSON.stringify(merged.body);
  }

  let resp;
  try {
    resp = await fetch(url, merged);
  } catch (err) {
    throw new Error("Сетевая ошибка. Проверьте подключение к интернету и доступность API.");
  }

  let data = null;
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await resp.json();
  } else {
    data = await resp.text();
  }

  if (!resp.ok) {
    // API часто возвращает {error: "..."}
    const msg = (data && data.error) ? data.error : `HTTP ${resp.status}`;
    throw new Error(msg);
  }

  return data;
}

export const api = {

  getCourses: () => request("/api/courses"),
  getTutors: () => request("/api/tutors"),
  getOrders: () => request("/api/orders"),

  createOrder: (payload) => request("/api/orders", { method: "POST", body: payload }),
  updateOrder: (id, payload) => request(`/api/orders/${id}`, { method: "PUT", body: payload }),
  deleteOrder: (id) => request(`/api/orders/${id}`, { method: "DELETE" }),
  getOrder: (id) => request(`/api/orders/${id}`),

 
  getTutor: (id) => request(`/api/tutors/${id}`),
  getCourse: (id) => request(`/api/course/${id}`),
};

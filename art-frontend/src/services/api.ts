export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const getHeaders = () => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("art_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`API GET ${endpoint} failed:`, error);
      return { status: "error", message: "Failed to connect to backend" } as any;
    }
  },
  post: async <T>(endpoint: string, body: any): Promise<T> => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`API POST ${endpoint} failed:`, error);
      return { status: "error", message: "Failed to connect to backend" } as any;
    }
  },
  put: async <T>(endpoint: string, body: any): Promise<T> => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`API PUT ${endpoint} failed:`, error);
      return { status: "error", message: "Failed to connect to backend" } as any;
    }
  },
  // Special handler for FormData (files)
  postFormData: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const headers = getHeaders() as any;
    delete headers["Content-Type"]; // Let browser set boundary
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });
    return res.json();
  },
  delete: async <T>(endpoint: string): Promise<T> => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return await res.json();
    } catch (error) {
      console.error(`API DELETE ${endpoint} failed:`, error);
      return { status: "error", message: "Failed to connect to backend" } as any;
    }
  },
};

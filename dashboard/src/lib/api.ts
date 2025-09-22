import axios, { type AxiosRequestHeaders } from "axios";

const API = import.meta.env.VITE_FLAGS_API || "http://localhost:3000/api";
const API_ROOT = API.replace(/\/api\/?$/, "");

// Admin (JWT) client
export const api = axios.create({ baseURL: API });
api.interceptors.request.use((config) => {
	const stored = (typeof window !== "undefined") ? localStorage.getItem("ff_jwt") : null;
	const envToken = import.meta.env.VITE_ADMIN_TOKEN as string | undefined;
	const token = stored || envToken;

	if (token) {
		const headers: AxiosRequestHeaders = config.headers ?? {};
		headers["Authorization"] = `Bearer ${token}`;
		config.headers = headers;
	}
	return config;
});

// SDK (x-api-key) client
export const sdkApi = axios.create({ baseURL: API });
sdkApi.interceptors.request.use((config) => {
	const headers: AxiosRequestHeaders = config.headers ?? {};
	const fromEnv = import.meta.env.VITE_SDK_KEY as string | undefined;
	const fromLS = localStorage.getItem("ff_sdk_key") || undefined;
	const sdkKey = fromLS || fromEnv;
	if (sdkKey) headers["x-api-key"] = sdkKey;
	config.headers = headers;
	return config;
});

// Root client (for login or anything mounted at server root)
export const rootApi = axios.create({ baseURL: API_ROOT });

export async function login(email: string, password: string) {
	const { data, headers } = await rootApi.post(
		"/api/auth/login",
		{ email, password },
		{ headers: { "Content-Type": "application/json" } }
	);

	const token =
		typeof data === "string"
		? data
		: data && typeof data === "object" && "token" in data
		? (data as any).token
		: null;

	if (!token) {
		throw new Error(`No token returned (Content-Type: ${headers["content-type"] || ""})`);
	}

	localStorage.setItem("ff_jwt", token);
	return token;
}

export function logout() {
  	localStorage.removeItem("ff_jwt");
}

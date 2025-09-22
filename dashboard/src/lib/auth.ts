export const TOKEN_KEY = "ff_jwt";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}
export function isAuthed(): boolean {
    const t = getToken();
    return !!t;
}
export function onAuthChange(cb: () => void) {
    const handler = () => cb();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
}
export function setToken(t: string) {
    localStorage.setItem(TOKEN_KEY, t);
    window.dispatchEvent(new StorageEvent("storage"));
}
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new StorageEvent("storage"));
}

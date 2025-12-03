export const createAuthService = (config) => ({
  async login(credentials) {
    if (!config.adminAuthEnabled || !config.apiBaseUrl) {
      throw new Error("Admin access is disabled. Configure a secure backend and enable adminAuthEnabled.");
    }

    const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Login failed");
    }

    return response.json();
  },
  async logout() {
    if (!config.adminAuthEnabled || !config.apiBaseUrl) return;
    await fetch(`${config.apiBaseUrl}/auth/logout`, { method: "POST", credentials: "include" });
  },
});

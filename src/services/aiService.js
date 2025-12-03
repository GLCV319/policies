export const createAiService = (config) => ({
  async generatePolicy(topic) {
    if (!config.apiBaseUrl) {
      throw new Error("AI endpoint not configured. Set apiBaseUrl in config.js to a secured server.");
    }

    const response = await fetch(`${config.apiBaseUrl}/ai/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Unable to generate content");
    }

    return response.json();
  },
});

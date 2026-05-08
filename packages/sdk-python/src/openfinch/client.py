"""OpenFinch Python SDK"""

import os
from typing import Any, Optional


class OpenFinch:
    """Client for the OpenFinch API."""

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = (base_url or os.environ.get("OPENFINCH_API_URL", "http://localhost:8787")).rstrip("/")
        self.api_key = api_key or os.environ.get("OPENFINCH_API_KEY")

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _request(self, method: str, path: str, body: Optional[dict] = None) -> Any:
        import httpx

        url = f"{self.base_url}{path}"
        response = httpx.request(method, url, headers=self._headers(), json=body, timeout=120)
        response.raise_for_status()
        return response.json()

    def search(self, query: str, limit: int = 10, language: Optional[str] = None) -> Any:
        """Search the web."""
        body: dict[str, Any] = {"query": query, "limit": limit}
        if language:
            body["language"] = language
        return self._request("POST", "/v1/search", body)

    def fetch(self, url: str, format: str = "markdown", timeout_ms: int = 15000) -> Any:
        """Fetch a URL and return clean content."""
        return self._request("POST", "/v1/fetch", {
            "url": url,
            "format": format,
            "timeoutMs": timeout_ms,
        })

    def extract(self, url: str, prompt: Optional[str] = None,
                schema: Optional[dict] = None, provider: Optional[str] = None) -> Any:
        """Extract structured data from a webpage."""
        body: dict[str, Any] = {"url": url}
        if prompt:
            body["prompt"] = prompt
        if schema:
            body["schema"] = schema
        if provider:
            body["provider"] = provider
        return self._request("POST", "/v1/extract", body)

    def health(self) -> Any:
        """Check API health."""
        return self._request("GET", "/health")

    @property
    def browser(self):
        return _BrowserClient(self)

    @property
    def agent(self):
        return _AgentClient(self)


class _BrowserClient:
    def __init__(self, client: OpenFinch):
        self._client = client

    def create_session(self, headless: bool = True, ttl_seconds: int = 300) -> Any:
        return self._client._request("POST", "/v1/browser/session", {
            "headless": headless,
            "ttlSeconds": ttl_seconds,
        })

    def screenshot(self, session_id: str) -> Any:
        return self._client._request("POST", f"/v1/browser/session/{session_id}/screenshot")

    def close(self, session_id: str) -> Any:
        return self._client._request("DELETE", f"/v1/browser/session/{session_id}")


class _AgentClient:
    def __init__(self, client: OpenFinch):
        self._client = client

    def run(self, goal: str, url: Optional[str] = None,
            max_steps: int = 10, provider: Optional[str] = None) -> Any:
        body: dict[str, Any] = {"goal": goal, "maxSteps": max_steps}
        if url:
            body["url"] = url
        if provider:
            body["provider"] = provider
        return self._client._request("POST", "/v1/agent/run", body)

    def get(self, run_id: str) -> Any:
        return self._client._request("GET", f"/v1/agent/run/{run_id}")

    def events(self, run_id: str) -> Any:
        return self._client._request("GET", f"/v1/agent/run/{run_id}/events")

    def result(self, run_id: str) -> Any:
        return self._client._request("GET", f"/v1/agent/run/{run_id}/result")

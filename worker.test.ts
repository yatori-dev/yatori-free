import { describe, expect, it, vi } from "vitest"

import worker from "./worker"

describe("maintenance mode", () => {
  it("returns 503 without fetching assets when enabled", async () => {
    const fetch = vi.fn()
    const response = await worker.fetch(new Request("https://example.com"), {
      ASSETS: { fetch },
      MAINTENANCE_MODE: "1",
    })

    expect(response.status).toBe(503)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(fetch).not.toHaveBeenCalled()
  })
})

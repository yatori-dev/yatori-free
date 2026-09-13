interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  MAINTENANCE_MODE: string
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    if (env.MAINTENANCE_MODE === "1") {
      return Promise.resolve(
        new Response("Service Unavailable", {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": "3600",
          },
        }),
      )
    }

    return env.ASSETS.fetch(request)
  },
}

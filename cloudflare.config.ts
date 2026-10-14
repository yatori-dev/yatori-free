import { bindings, defineConfig, triggers } from "cf/config";

/**
 * Secret-like files were detected but not read or migrated: .env. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

export default defineConfig({
	worker: {
		name: "yatori-free",
		compatibilityDate: "2026-06-06",
		entrypoint: "./worker/worker.ts",
		domains: ["yatori.hungrym0.com"],
		// Keep the existing zone route declared alongside the custom domain.
		triggers: [
			triggers.fetch({
				pattern: "yatori.hungrym0.com/*",
				zone: "hungrym0.com",
			}),
		],
		assets: {
			notFoundHandling: "404-page",
			runWorkerFirst: true,
		},
		env: {
			ASSETS: bindings.assets(),
			MAINTENANCE_MODE: bindings.text("0"),
		},
	},
});

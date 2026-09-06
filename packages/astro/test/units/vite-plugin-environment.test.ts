import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { vitePluginEnvironment } from '../../dist/vite-plugin-environment/index.js';

/** Minimal settings stub with only the fields vitePluginEnvironment reads. */
function createMinimalSettings(overrides = {}) {
	return {
		config: {
			srcDir: new URL('file:///tmp/test/src/'),
		},
		renderers: [],
		...overrides,
	};
}

/** Minimal crawl result. */
function createCrawlResult() {
	return {
		optimizeDeps: { include: [], exclude: [] },
		ssr: { noExternal: [], external: [] },
	};
}

/**
 * Call the plugin's configEnvironment hook. Handles the fact that Vite allows
 * hooks to be either a plain function or an object with a `handler` property.
 */
function callConfigEnvironment(plugin, envName, options) {
	const hook = plugin.configEnvironment;
	if (typeof hook === 'function') {
		return hook.call(null, envName, options);
	}
	if (hook && typeof hook.handler === 'function') {
		return hook.handler.call(null, envName, options);
	}
	throw new Error('configEnvironment hook not found');
}

describe('vitePluginEnvironment', () => {
	describe('renderer server entrypoints in optimizeDeps.include', () => {
		it('includes string serverEntrypoints for server environments', () => {
			const plugin = vitePluginEnvironment({
				command: 'dev',
				settings: createMinimalSettings({
					renderers: [
						{
							name: '@astrojs/svelte',
							clientEntrypoint: '@astrojs/svelte/client.js',
							serverEntrypoint: '@astrojs/svelte/server.js',
						},
						{
							name: '@astrojs/react',
							clientEntrypoint: '@astrojs/react/client.js',
							serverEntrypoint: '@astrojs/react/server.js',
						},
					],
				}),
				astroPkgsConfig: createCrawlResult(),
			});

			// Call with noDiscovery: false (as the Cloudflare adapter sets for ssr)
			const ssrResult = callConfigEnvironment(plugin, 'ssr', {
				optimizeDeps: { noDiscovery: false },
			});
			assert.ok(
				ssrResult.optimizeDeps?.include?.includes('@astrojs/svelte/server.js'),
				'ssr environment should include svelte server entrypoint',
			);
			assert.ok(
				ssrResult.optimizeDeps?.include?.includes('@astrojs/react/server.js'),
				'ssr environment should include react server entrypoint',
			);

			// Call with noDiscovery: undefined (as the astro environment gets by default)
			const astroResult = callConfigEnvironment(plugin, 'astro', {
				optimizeDeps: {},
			});
			assert.ok(
				astroResult.optimizeDeps?.include?.includes('@astrojs/svelte/server.js'),
				'astro environment should include svelte server entrypoint',
			);

			// Call with noDiscovery: undefined for prerender
			const prerenderResult = callConfigEnvironment(plugin, 'prerender', {
				optimizeDeps: {},
			});
			assert.ok(
				prerenderResult.optimizeDeps?.include?.includes('@astrojs/svelte/server.js'),
				'prerender environment should include svelte server entrypoint',
			);
		});

		it('does not include server entrypoints for the client environment', () => {
			const plugin = vitePluginEnvironment({
				command: 'dev',
				settings: createMinimalSettings({
					renderers: [
						{
							name: '@astrojs/svelte',
							clientEntrypoint: '@astrojs/svelte/client.js',
							serverEntrypoint: '@astrojs/svelte/server.js',
						},
					],
				}),
				astroPkgsConfig: createCrawlResult(),
			});

			const clientResult = callConfigEnvironment(plugin, 'client', {
				optimizeDeps: {},
			});
			assert.ok(
				!clientResult.optimizeDeps?.include?.includes('@astrojs/svelte/server.js'),
				'client environment should not include server entrypoints',
			);
		});

		it('handles empty renderers list', () => {
			const plugin = vitePluginEnvironment({
				command: 'dev',
				settings: createMinimalSettings({ renderers: [] }),
				astroPkgsConfig: createCrawlResult(),
			});

			const result = callConfigEnvironment(plugin, 'ssr', {
				optimizeDeps: { noDiscovery: false },
			});
			// Should not crash and include should be an array
			assert.ok(Array.isArray(result.optimizeDeps?.include));
		});
	});
});

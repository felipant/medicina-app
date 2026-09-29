<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	onMount(() => {
		function sendHeartbeat() {
			if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
				fetch('/api/session/heartbeat', { method: 'POST' }).catch(() => {});
			}
		}

		sendHeartbeat();
		const interval = setInterval(sendHeartbeat, 60000);

		const handleVisibility = () => {
			if (document.visibilityState === 'visible') {
				sendHeartbeat();
			}
		};
		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</svelte:head>

{@render children()}


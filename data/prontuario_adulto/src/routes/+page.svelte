<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let { data } = $props();
  
  onMount(() => {
    if (data.session) {
      goto('/pacientes');
    } else {
      goto('/login');
    }
  });
</script>

<div style="text-align:center; padding-top: 50px;">Carregando...</div>

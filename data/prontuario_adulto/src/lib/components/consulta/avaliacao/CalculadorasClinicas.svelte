<script lang="ts">
  import { Calculator, ExternalLink } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import { page } from '$app/stores';

  let { readonly = false } = $props();

  let calculadorasDB = $state<any[]>([]);
  let carregando = $state(true);

  $effect(() => {
    async function loadCalculadoras() {
      try {
        const token = $page.data.token || localStorage.getItem("token");
        const res = await apiFetch<any[]>("/api/v1/calculadoras", token);
        // Only keep active ones and sort by order
        calculadorasDB = (res || []).filter(c => c.ativo);
      } catch (err) {
        console.error("Erro ao carregar calculadoras:", err);
      } finally {
        carregando = false;
      }
    }
    loadCalculadoras();
  });

  // Mapeamento estático de temas para termos comuns de categoria
  const TEMAS_ESTATICOS: Record<string, string> = {
    'geral': 'bg-slate-100 text-slate-700 border-slate-200/60',
    'cardio': 'bg-rose-50 text-rose-700 border-rose-100',
    'cardiologia': 'bg-rose-50 text-rose-700 border-rose-100',
    'nefro': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'nefrologia': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'renal': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'ped': 'bg-amber-50 text-amber-700 border-amber-100',
    'pediatria': 'bg-amber-50 text-amber-700 border-amber-100',
    'neuro': 'bg-purple-50 text-purple-700 border-purple-100',
    'neurologia': 'bg-purple-50 text-purple-700 border-purple-100',
    'pulmão': 'bg-sky-50 text-sky-700 border-sky-100',
    'pneumologia': 'bg-sky-50 text-sky-700 border-sky-100',
    'endócrino': 'bg-orange-50 text-orange-700 border-orange-100',
    'endocrinologia': 'bg-orange-50 text-orange-700 border-orange-100',
    'hepático': 'bg-lime-50 text-lime-700 border-lime-100',
    'gastro': 'bg-lime-50 text-lime-700 border-lime-100',
    'gastroenterologia': 'bg-lime-50 text-lime-700 border-lime-100',
  };

  // Paleta randômica determinística estável para outras categorias dinâmicas
  const PALETA_RANDOMICA = [
     'bg-blue-50 text-blue-700 border-blue-100',
     'bg-indigo-50 text-indigo-700 border-indigo-100',
     'bg-teal-50 text-teal-700 border-teal-100',
     'bg-cyan-50 text-cyan-700 border-cyan-100',
     'bg-pink-50 text-pink-700 border-pink-100',
     'bg-violet-50 text-violet-700 border-violet-100',
     'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  ];

  function obterEstiloCategoria(categoriaNome: string | null) {
    const nome = (categoriaNome || 'Geral').trim().toLowerCase();
    if (TEMAS_ESTATICOS[nome]) return TEMAS_ESTATICOS[nome];
    
    // Tenta localizar substrings comuns como fallback direto
    for (const [termo, css] of Object.entries(TEMAS_ESTATICOS)) {
      if (nome.includes(termo)) return css;
    }

    // Se for uma categoria desconhecida, escolhe cor fixa determinística via hash
    let hash = 0;
    for (let i = 0; i < nome.length; i++) {
      hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PALETA_RANDOMICA.length;
    return PALETA_RANDOMICA[index];
  }
</script>

<div class="bg-white text-slate-900 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
  <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2.5 font-bold text-slate-800">
    <Calculator class="w-4.5 h-4.5 text-slate-400" />
    Ferramentas de Apoio à Decisão (Calculadoras Clínicas)
  </div>

  <div class="p-6 space-y-6">
    {#if carregando}
       <div class="flex items-center gap-2 text-slate-400 text-xs animate-pulse py-4">
          <div class="w-2 h-2 rounded-full bg-slate-300 animate-ping"></div>
          Carregando calculadoras...
       </div>
    {:else if calculadorasDB.length === 0}
       <div class="text-center text-slate-400 py-8 text-xs italic bg-slate-50/50 rounded-xl border border-slate-100">
          Nenhuma calculadora clínica externa vinculada atualmente.
       </div>
    {:else}
       <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-in fade-in duration-200">
          {#each calculadorasDB as c}
             <a 
               href={c.url_externa} 
               target="_blank" 
               rel="noreferrer" 
               class="group relative bg-slate-50/50 hover:bg-white border border-slate-200/60 hover:border-slate-300 p-4 rounded-xl flex flex-col items-start gap-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
               title={c.descricao}
             >
               <!-- Categoria com cor única definida dinamicamente -->
               <span class="inline-flex items-center text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border {obterEstiloCategoria(c.categoria)} select-none leading-none mb-0.5 shrink-0">
                 {c.categoria || 'Geral'}
               </span>
               
               <span class="font-bold text-sm text-slate-800 mt-1 truncate leading-tight group-hover:text-slate-900 pr-4 w-full block">
                 {c.nome}
               </span>
               
               {#if c.descricao}
                  <span class="text-[10px] text-slate-400 group-hover:text-slate-500 line-clamp-2 mt-1 leading-snug font-medium">
                    {c.descricao}
                  </span>
               {/if}
               
               <div class="absolute top-4 right-4 text-slate-300 group-hover:text-slate-500 transition-colors">
                 <ExternalLink class="w-3.5 h-3.5" />
               </div>
             </a>
          {/each}
       </div>
    {/if}
  </div>
</div>

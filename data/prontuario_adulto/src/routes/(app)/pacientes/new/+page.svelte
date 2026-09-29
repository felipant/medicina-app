<script lang="ts">
  import { goto } from '$app/navigation';
  import { PUBLIC_API_URL } from '$env/static/public';

  let { data } = $props();
  let { session } = $derived(data);

  let nome = $state('');
  let iniciais = $state('');
  let cpf = $state('');
  let cns = $state('');
  let data_nasc = $state('');
  let sexo = $state('M');
  
  let loading = $state(false);
  let error = $state('');

  const isEstudante = $derived(data.usuario?.role === 'estudante');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';

    const bodyData = isEstudante 
      ? {
          iniciais: iniciais || null,
          data_nasc: data_nasc || null,
          sexo
        }
      : {
          nome,
          cpf: cpf || null,
          cns: cns || null,
          data_nasc: data_nasc || null,
          sexo
        };

    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/v1/pacientes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Erro ao salvar.");
      }

      goto('/pacientes');
    } catch (e: any) {
      error = e.message;
      loading = false;
    }
  }
</script>

<div class="container">
  <header>
    <a href="/pacientes" class="back">&larr; Voltar</a>
    <h2>Novo Paciente</h2>
  </header>

  <form onsubmit={handleSubmit} class="card form-container">
    {#if error}
      <div class="alert">{error}</div>
    {/if}

    <div class="grid">
      {#if isEstudante}
        <div class="col">
          <label for="iniciais">Iniciais do Nome (Ex: J.S.) *</label>
          <input type="text" id="iniciais" bind:value={iniciais} required maxlength="10" placeholder="M.A." />
        </div>
      {:else}
        <div class="col">
          <label for="nome">Nome Completo *</label>
          <input type="text" id="nome" bind:value={nome} required />
        </div>
        
        <div class="col">
          <label for="cpf">CPF</label>
          <input type="text" id="cpf" bind:value={cpf} placeholder="000.000.000-00" />
        </div>
      {/if}

      <div class="col">
        <label for="nascimento">Data de Nascimento</label>
        <input type="date" id="nascimento" bind:value={data_nasc} />
      </div>

      <div class="col">
        <label for="sexo">Sexo</label>
        <select id="sexo" bind:value={sexo}>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      {#if !isEstudante}
        <div class="col full">
          <label for="cns">CNS (Cartão Nacional de Saúde)</label>
          <input type="text" id="cns" bind:value={cns} />
        </div>
      {/if}
    </div>

    <div class="actions">
      <button type="submit" class="btn btn-primary" disabled={loading}>
        {loading ? 'Salvando...' : 'Cadastrar Paciente'}
      </button>
    </div>
  </form>
</div>

<style>
  .container { max-width: 600px; margin: 3rem auto; padding: 0 1rem; font-family: sans-serif; }
  header { margin-bottom: 1.5rem; }
  .back { text-decoration: none; color: #64748b; font-size: 0.9rem; display: block; margin-bottom: 0.5rem; }
  h2 { margin: 0; color: #1e293b; }
  
  .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .col { display: flex; flex-direction: column; }
  .full { grid-column: 1 / span 2; }
  
  label { font-size: 0.875rem; font-weight: 500; color: #475569; margin-bottom: 0.5rem; }
  input, select { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
  
  .actions { margin-top: 2rem; display: flex; justify-content: flex-end; }
  .btn { padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 600; border: none; cursor: pointer; }
  .btn-primary { background: #2563eb; color: #fff; }
  .alert { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; }
</style>

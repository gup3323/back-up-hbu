import { supabase } from "./supabase";

export const medicoService = {
  // Buscar todas as cirurgias de um médico específico filtrando pelo seu CRM
  async buscarAgendaDoMedico(crmMedico) {
    // Passo 1: Busca os IDs das cirurgias em que o médico está alocado
    const { data: vinculos, error: erroVinculo } = await supabase
      .from('equipe_cirurgica')
      .select('id_cirurgia')
      .eq('CRM_medico', crmMedico);

    if (erroVinculo) throw erroVinculo;
    if (!vinculos || vinculos.length === 0) return [];

    const idsCirurgias = vinculos.map(v => v.id_cirurgia);

    // Passo 2: Puxa as cirurgias completas trazendo os dados aninhados (JOIN automático)
    const { data: cirurgias, error: erroCirurgia } = await supabase
      .from('cirurgia')
      .select(`
        id_cirurgia,
        tipo_cirurgia,
        data_hora,
        duracao_estimada,
        status,
        prioridade,
        observacoes,
        Id_sala,
        paciente (nome, CPF, data_nascimento, telefone),
        sala_cirurgica (nome_sala, equipamento)
      `)
      .in('id_cirurgia', idsCirurgias)
      .order('data_hora', { ascending: true });

    if (erroCirurgia) throw erroCirurgia;
    return cirurgias;
  },

  // Atualizar o status e o relatório/observação da cirurgia (Ação do Médico)
  async atualizarEvolucaoCirurgica(idCirurgia, novoStatus, novasObservacoes) {
    const { data, error } = await supabase
      .from('cirurgia')
      .update({
        status: novoStatus,
        observacoes: novasObservacoes
      })
      .eq('id_cirurgia', idCirurgia)
      .select();

    if (error) throw error;
    return data;
  }
};
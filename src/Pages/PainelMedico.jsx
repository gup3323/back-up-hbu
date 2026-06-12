import React, { useState, useEffect } from "react";
import { User, Clock, Activity, FileText, Save, CheckCircle, AlertCircle } from "lucide-react";
import Layout from "../layouts/Layout";

export default function PainelMedico() {
  const [cirurgias, setCirurgias] = useState([]);
  const [cirurgiaSelecionada, setCirurgiaSelecionada] = useState(null);
  
  // Estados para os controles editáveis do médico
  const [statusAtual, setStatusAtual] = useState("");
  const [observacoesAtual, setObservacoesAtual] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregandoAgenda, setCarregandoAgenda] = useState(true);
  
  // Estado do filtro de datas
  const [filtroData, setFiltroData] = useState("hoje");

  const crmLogado = localStorage.getItem("medico_crm");

  useEffect(() => {
    const carregarAgenda = async () => {
      if (!crmLogado) return;
      try {
        const response = await fetch(`http://localhost:8000/agenda_medico/${encodeURIComponent(crmLogado)}`);
        if (!response.ok) throw new Error("Erro ao buscar dados no servidor.");
        const dados = await response.json();
        setCirurgias(dados);
      } catch (error) {
        console.error("Erro ao puxar agenda:", error);
      } finally {
        setCarregandoAgenda(false);
      }
    };
    carregarAgenda();
  }, [crmLogado]);

  // Quando o médico clica em um paciente na lista
  const selecionarCirurgia = (cirurgia) => {
    setCirurgiaSelecionada(cirurgia);
    setStatusAtual(cirurgia.status);
    setObservacoesAtual(cirurgia.observacoes || "");
  };

  const calcularIdade = (dataNascimento) => {
    if(!dataNascimento) return "--";
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
  };

  // Lógica de Filtro de Tempo reaproveitada do Calendário
  const filtrarPorPeriodo = (lista) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return lista.filter((ag) => {
      if (!ag.data_hora) return false;
      const dataCirurgia = new Date(ag.data_hora);
      dataCirurgia.setHours(0, 0, 0, 0);

      if (filtroData === "hoje") {
        return dataCirurgia.getTime() === hoje.getTime();
      }

      if (filtroData === "semana") {
        const umaSemanaDepois = new Date(hoje);
        umaSemanaDepois.setDate(hoje.getDate() + 7);
        return dataCirurgia >= hoje && dataCirurgia <= umaSemanaDepois;
      }

      if (filtroData === "mes") {
        return dataCirurgia.getMonth() === hoje.getMonth() && dataCirurgia.getFullYear() === hoje.getFullYear();
      }

      return true; // "todos"
    });
  };

  const cirurgiasFiltradas = filtrarPorPeriodo(cirurgias);

  // Função disparada ao clicar em "Salvar Evolução"
  const handleSalvar = async () => {
    setSalvando(true);
    
    try {
      const response = await fetch(`http://localhost:8000/atualizar_evolucao/${cirurgiaSelecionada.id_cirurgia}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusAtual, observacoes: observacoesAtual })
      });

      if (!response.ok) throw new Error("Falha na comunicação com o banco.");

      alert("Relatório e status atualizados com sucesso!");
      
      // Atualiza o estado local para refletir a mudança
      const listaAtualizada = cirurgias.map(c => 
        c.id_cirurgia === cirurgiaSelecionada.id_cirurgia 
          ? { ...c, status: statusAtual, observacoes: observacoesAtual } 
          : c
      );
      setCirurgias(listaAtualizada);
      setCirurgiaSelecionada({ ...cirurgiaSelecionada, status: statusAtual, observacoes: observacoesAtual });
      
    } catch(error) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#150359]">Portal do Cirurgião</h1>
          <p className="mt-1 text-[#203573]">Gestão clínica e planejamento de procedimentos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA ESQUERDA: LISTA DE PACIENTES */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-bold text-[#150359] text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#03A688]" /> Minhas Cirurgias
            </h2>

            {/* Menu de Filtros de Tempo (Tabs) */}
            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
              {['hoje', 'semana', 'mes', 'todos'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setFiltroData(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all 
                    ${filtroData === tab ? 'bg-[#150359] text-white shadow-md' : 'text-[#203573] hover:bg-slate-200'}`}
                >
                  {tab === 'mes' ? 'Mês' : tab}
                </button>
              ))}
            </div>
            
            {carregandoAgenda ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 animate-pulse">
                Carregando agenda...
              </div>
            ) : cirurgiasFiltradas.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                Nenhuma cirurgia alocada para o período selecionado.
              </div>
            ) : (
              <div className="space-y-3 pr-1 max-h-[600px] overflow-y-auto custom-scrollbar">
                {cirurgiasFiltradas.map((cirurgia) => {
                  
                  // Formatação de Data e Hora para o Card
                  let dataExibicao = "";
                  let horaExibicao = "";
                  if (cirurgia.data_hora && cirurgia.data_hora.includes("T")) {
                    const [dataPart, horaPart] = cirurgia.data_hora.split("T");
                    const [ano, mes, dia] = dataPart.split("-");
                    dataExibicao = `${dia}/${mes}`; // Ex: 01/06
                    horaExibicao = horaPart.substring(0, 5); // Ex: 08:00
                  }

                  return (
                    <div 
                      key={cirurgia.id_cirurgia} 
                      onClick={() => selecionarCirurgia(cirurgia)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${cirurgiaSelecionada?.id_cirurgia === cirurgia.id_cirurgia ? 'border-[#03A688] bg-[#B6F2E1]/20 shadow-sm' : 'border-slate-100 bg-white hover:border-[#B6F2E1]'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-[#150359] truncate pr-2">{cirurgia.paciente?.nome}</h3>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 mb-1">
                            {dataExibicao}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#150359] text-white">
                            {horaExibicao}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-[#203573] font-medium truncate">{cirurgia.tipo_cirurgia}</p>
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Status: {cirurgia.status}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUNA DIREITA/CENTRAL: DETALHES E CONTROLES (PRONTUÁRIO) */}
          <div className="lg:col-span-2">
            {!cirurgiaSelecionada ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
                <User className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-[#150359]">Selecione um Paciente</h3>
                <p className="text-[#203573]">Clique em uma cirurgia na lista lateral para visualizar o prontuário e atualizar a evolução médica.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Cabeçalho do Paciente */}
                <div className="bg-white border-2 border-[#B6F2E1] rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                    <div className="bg-[#150359] p-3 rounded-lg text-white">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#150359]">{cirurgiaSelecionada.paciente?.nome}</h2>
                      <div className="flex gap-3 text-sm text-[#203573] mt-1 font-medium">
                        <span>CPF: {cirurgiaSelecionada.paciente?.cpf}</span>
                        <span>•</span>
                        <span>{calcularIdade(cirurgiaSelecionada.paciente?.data_nascimento)} anos</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Procedimento</p>
                      <p className="font-bold text-[#150359] text-sm">{cirurgiaSelecionada.tipo_cirurgia}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Local</p>
                      <p className="font-bold text-[#150359] text-sm">{cirurgiaSelecionada.sala_cirurgica?.nome_sala}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Duração Prevista</p>
                      <p className="font-bold text-[#150359] text-sm">{cirurgiaSelecionada.duracao_estimada} horas</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Prioridade</p>
                      <p className={`font-bold text-sm ${cirurgiaSelecionada.prioridades === 'Urgente' || cirurgiaSelecionada.prioridades === 'Alta' ? 'text-red-500' : 'text-[#03A688]'}`}>
                        {cirurgiaSelecionada.prioridades}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Área de Ação: Controles do Médico */}
                <div className="bg-white border-2 border-[#B6F2E1] rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-[#150359] text-lg flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5 text-[#03A688]" /> Evolução Clínica e Status
                  </h3>

                  <div className="space-y-6">
                    {/* Alterar Status */}
                    <div>
                      <label className="block text-sm font-semibold text-[#203573] mb-2">Status Operacional da Cirurgia</label>
                      <select 
                        value={statusAtual}
                        onChange={(e) => setStatusAtual(e.target.value)}
                        className="w-full md:w-1/2 p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688] bg-slate-50 font-medium text-[#150359]"
                      >
                        <option value="Agendada">Agendada</option>
                        <option value="Em Preparo">Em Preparo (Anestesia/Sala)</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Em Recuperação">Em Recuperação (RPA)</option>
                        <option value="Concluído">Concluído / Alta</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </div>

                    {/* Evolução / Relatório */}
                    <div>
                      <label className="block text-sm font-semibold text-[#203573] mb-2 flex items-center gap-2">
                        Notas da Cirurgia / Relatório Médico
                      </label>
                      <textarea 
                        rows="5"
                        placeholder="Descreva intercorrências, procedimentos adotados ou orientações pós-cirúrgicas..."
                        value={observacoesAtual}
                        onChange={(e) => setObservacoesAtual(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688] bg-slate-50 resize-none text-sm"
                      />
                    </div>

                    {/* Botão Salvar */}
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={handleSalvar}
                        disabled={salvando}
                        className={`bg-gradient-to-r from-[#03A688] to-[#00ECA9] text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all ${salvando ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
                      >
                        {salvando ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {salvando ? "Salvando Dados..." : "Salvar Evolução"}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
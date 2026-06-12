import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, AlertCircle, Plus, Trash2 } from "lucide-react";
import Layout from "../layouts/Layout";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Calendario() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [filtroData, setFiltroData] = useState("todos");

  const prioridadeConfig = {
    urgente: { label: "Urgente", bg: "#FF5D5D", text: "#ffffff" },
    alta: { label: "Alta", bg: "#FF8400", text: "#ffffff" },
    media: { label: "Média", bg: "#00ECA9", text: "#150359" },
    baixa: { label: "Baixa", bg: "#00641E", text: "#ffffff" },
  };

  const carregarCalendario = () => {
    fetch(`${API_BASE_URL}/calendario`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro na requisição");
        return res.json();
      })
      .then((data) => {
        const unificado = [
          ...(data.urgentes || []),
          ...(data.alta || []),
          ...(data.media || []),
          ...(data.baixa || [])
        ];
        setAgendamentos(unificado);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    carregarCalendario();
  }, []);

  const handleDeletar = async (idCirurgia) => {
    if (!window.confirm("Tem certeza que deseja cancelar e apagar esta cirurgia do sistema?")) {
      return;
    }

    try {
      // CORREÇÃO: A rota correta no Python é /cancelar_cirurgia/ e não precisa de body
      const resposta = await fetch(`${API_BASE_URL}/cancelar_cirurgia/${idCirurgia}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (resposta.ok) {
        alert("Cirurgia cancelada e recursos restaurados com sucesso!");
        carregarCalendario(); // Recarrega o calendário automaticamente
      } else {
        const erro = await resposta.json();
        alert(`Erro ao cancelar: ${erro.detail || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Não foi possível conectar ao servidor.");
    }
  };

  const obterChavePrioridade = (prioridadeTxt) => {
    const p = prioridadeTxt ? String(prioridadeTxt).toLowerCase().trim() : "";
    if (p === "média" || p === "media") return "media";
    return p;
  };

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

      return true;
    });
  };

  const cirurgiasFiltradas = filtrarPorPeriodo(agendamentos);

  const agrupadosPorPrioridade = {
    urgente: cirurgiasFiltradas.filter(ag => obterChavePrioridade(ag.prioridades) === "urgente"),
    alta: cirurgiasFiltradas.filter(ag => obterChavePrioridade(ag.prioridades) === "alta"),
    media: cirurgiasFiltradas.filter(ag => obterChavePrioridade(ag.prioridades) === "media"),
    baixa: cirurgiasFiltradas.filter(ag => obterChavePrioridade(ag.prioridades) === "baixa"),
  };

  const AgendamentoCard = ({ agendamento }) => {
    const pKey = obterChavePrioridade(agendamento.prioridades);
    const config = prioridadeConfig[pKey] || { label: agendamento.prioridades, bg: "#A1A1AA", text: "#ffffff" };

    let dataExibicao = agendamento.data_hora;
    let horaExibicao = "";
    
    if (agendamento.data_hora && agendamento.data_hora.includes("T")) {
      const [dataPart, horaPart] = agendamento.data_hora.split("T");
      const [ano, mes, dia] = dataPart.split("-");
      dataExibicao = `${dia}/${mes}/${ano}`;
      horaExibicao = horaPart.substring(0, 5);
    }

    return (
      <div className="bg-white border-2 border-slate-100 rounded-xl p-5 shadow-sm hover:border-[#B6F2E1] hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h3 className="font-bold text-[#150359] text-lg">{agendamento.tipo_cirurgia || "Não especificado"}</h3>
              <p className="text-sm text-[#203573] font-medium">
                Paciente: {agendamento.paciente?.nome || "Não informado"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                CPF: {agendamento.cpf_paciente || "Não informado"}
              </p>
            </div>
            <span 
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider h-fit"
              style={{ backgroundColor: config.bg, color: config.text }}
            >
              {config.label}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#03A688]" /> <span>{dataExibicao}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#03A688]" /> <span>{horaExibicao ? `${horaExibicao} • ` : ""}{agendamento.duracao_estimada}h estimadas</span>
            </div>
            
            {agendamento.observacoes && (
              <div className="flex items-start gap-2 pt-3 mt-3 border-t border-slate-100">
                <AlertCircle className="w-4 h-4 text-[#FF8400] flex-shrink-0" />
                <span className="text-xs text-slate-500">{agendamento.observacoes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-dashed border-slate-100">
          <button 
            onClick={() => handleDeletar(agendamento.id_cirurgia)}
            className="flex items-center text-red-500 hover:text-red-700 font-bold text-xs transition-colors p-1"
          >
            <Trash2 className="w-4 h-4 mr-1" /> CANCELAR CIRURGIA
          </button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#150359]">Calendário Cirúrgico</h1>
            <p className="mt-1 text-[#203573]">{cirurgiasFiltradas.length} cirurgia(s) exibida(s)</p>
          </div>
          <Link to="/novo-agendamento" className="bg-gradient-to-r from-[#03A688] to-[#00ECA9] text-white px-5 py-2.5 rounded-lg font-bold flex items-center shadow-lg hover:opacity-90 transition-opacity">
            <Plus className="w-5 h-5 mr-2" /> Nova Cirurgia
          </Link>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
          {['hoje', 'semana', 'mes', 'todos'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setFiltroData(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold capitalize transition-all 
                ${filtroData === tab ? 'bg-[#150359] text-white shadow' : 'text-[#203573] hover:bg-slate-100'}`}
            >
              {tab === 'mes' ? 'Mês' : tab}
            </button>
          ))}
        </div>

        <div className="space-y-8 mt-4">
          {Object.entries(agrupadosPorPrioridade).map(([chave, lista]) => (
            lista.length > 0 && (
              <div key={chave}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: prioridadeConfig[chave].bg }}></div>
                  <h2 className="text-xl font-bold text-[#150359]">{prioridadeConfig[chave].label} ({lista.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lista.map(ag => <AgendamentoCard key={ag.id_cirurgia} agendamento={ag} />)}
                </div>
              </div>
            )
          ))}
          {cirurgiasFiltradas.length === 0 && (
            <p className="text-slate-400 text-sm py-12 text-center bg-white rounded-xl border border-dashed">
              Nenhuma cirurgia agendada para o período selecionado ("{filtroData}").
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
import Layout from "../layouts/Layout";
import React, { useState, useEffect } from "react";
import { Building2, Users, Wrench, Activity } from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000"; 

export default function Recursos() {
  const [salas, setSalas] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusConfig = {
    "Disponível": { label: "Disponível", bg: "#00641E", text: "#ffffff" },
    "Ocupada": { label: "Em Uso", bg: "#FF5D5D", text: "#ffffff" },
    "Manutenção": { label: "Manutenção", bg: "#FF8400", text: "#ffffff" },
    "disponivel": { label: "Disponível", bg: "#00641E", text: "#ffffff" },
    "cirurgia": { label: "Em Cirurgia", bg: "#203573", text: "#ffffff" },
    "folga": { label: "Folga", bg: "#D8DEF2", text: "#150359" },
  };

  useEffect(() => {
    async function fetchRecursos() {
      try {
        setLoading(true);
        
        const resSalas = await fetch(`${API_BASE_URL}/recursos/salas`);
        if (!resSalas.ok) throw new Error("Erro ao buscar salas");
        const dadosSalas = await resSalas.json();

        const resInventario = await fetch(`${API_BASE_URL}/recursos/inventario-e-medicos`);
        if (!resInventario.ok) throw new Error("Erro ao buscar equipamentos e médicos");
        const dadosInventario = await resInventario.json();

        setSalas(dadosSalas);
        setEquipamentos(dadosInventario.equipamentos);
        setMedicos(dadosInventario.medicos);
        
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar os recursos do servidor.");
      } finally {
        setLoading(false);
      }
    }

    fetchRecursos();
  }, []);

  const totalSalas = salas.length;
  const salasDisponiveis = salas.filter(s => s.status === "Disponível").length;
  const medicosAtivos = medicos.filter(m => m.disponibilidade === "cirurgia").length;
  const totalMedicos = medicos.length;

  const totalEquipamentos = equipamentos.reduce((acc, eq) => acc + (eq.quantidade_total || 0), 0);
  const equipamentosEmUso = equipamentos.reduce((acc, eq) => acc + ((eq.quantidade_total - eq.quantidade_disponivel) || 0), 0);

  const taxaOcupacao = totalSalas > 0 ? Math.round(((totalSalas - salasDisponiveis) / totalSalas) * 100) : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64 text-[#150359] font-bold">
          Carregando recursos...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#150359]">Gestão de Recursos</h1>
          <p className="mt-1 text-[#203573]">Controle de salas, equipamentos e equipes médicas</p>
        </div>

        {/* Stats Overview Dinâmico */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: "Salas Disponíveis", icon: Building2, value: `${salasDisponiveis}/${totalSalas}`, desc: `${Math.round((salasDisponiveis/totalSalas)*100) || 0}% disponíveis`, color: "#00641E" },
            { title: "Cirurgiões Ativos", icon: Users, value: `${medicosAtivos}/${totalMedicos}`, desc: `${medicosAtivos} em cirurgia`, color: "#203573" },
            { title: "Equipamentos", icon: Wrench, value: String(totalEquipamentos), desc: `${equipamentosEmUso} em uso`, color: "#03A688" },
            { title: "Taxa de Ocupação", icon: Activity, value: `${taxaOcupacao}%`, desc: "Média do momento", color: "#FF8400" }
          ].map((stat, i) => (
            <div key={i} className="bg-white border-2 border-[#B6F2E1] rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-[#150359]">{stat.title}</h3>
                <stat.icon className="w-4 h-4" color={stat.color} />
              </div>
              <div className="text-2xl font-bold text-[#150359]">{stat.value}</div>
              <p className="text-xs text-[#203573] mt-1">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Salas Cirúrgicas Dinâmicas */}
        <div className="bg-white border-2 border-[#B6F2E1] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-[#03A688]" />
            <h2 className="text-xl font-bold text-[#150359]">Salas Cirúrgicas</h2>
          </div>
          <p className="text-[#203573] text-sm mb-6">Status e disponibilidade das salas</p>

          <div className="space-y-4">
            {salas.map((sala) => (
              <div key={sala.id_sala} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#150359]">{sala.nome_sala}</h4>
                  <p className="text-sm text-[#203573]">Capacidade: {sala.capacidade} pessoas</p>
                </div>
                <div className="flex items-center gap-4">
                  {sala.status === "Ocupada" && (
                    <div className="w-32 bg-slate-200 rounded-full h-2.5">
                      <div className="bg-[#150359] h-2.5 rounded-full w-full"></div>
                    </div>
                  )}
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ 
                      backgroundColor: statusConfig[sala.status]?.bg || "#slate-200", 
                      color: statusConfig[sala.status]?.text || "#000" 
                    }}
                  >
                    {statusConfig[sala.status]?.label || sala.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Equipamentos Dinâmicos */}
          <div className="bg-white border-2 border-[#B6F2E1] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-5 h-5 text-[#03A688]" />
              <h2 className="text-xl font-bold text-[#150359]">Equipamentos</h2>
            </div>
            <p className="text-[#203573] text-sm mb-6">Inventário e disponibilidade</p>
            
            <div className="space-y-5">
              {equipamentos.map((equip) => {
                const emUso = equip.quantidade_total - equip.quantidade_disponivel;
                const porcenUso = equip.quantidade_total > 0 ? (emUso / equip.quantidade_total) * 100 : 0;

                return (
                  <div key={equip.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-[#150359]">{equip.nome}</span>
                      <span className="text-sm text-[#203573]">{equip.quantidade_disponivel}/{equip.quantidade_total} disponíveis</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#03A688] h-2 rounded-full" style={{ width: `${porcenUso}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Equipes Médicas Dinâmicas */}
          <div className="bg-white border-2 border-[#B6F2E1] rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-[#203573]" />
              <h2 className="text-xl font-bold text-[#150359]">Equipes Médicas</h2>
            </div>
            <p className="text-[#203573] text-sm mb-6">Cirurgiões principais e status</p>

            <div className="space-y-3">
              {medicos.map((medico) => (
                <div key={medico.crm} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-[#150359]">{medico.nome}</h4>
                    <p className="text-xs text-[#203573]">{medico.crm} • {medico.especialidade}</p>
                  </div>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ 
                      backgroundColor: statusConfig[medico.disponibilidade]?.bg || "#slate-200", 
                      color: statusConfig[medico.disponibilidade]?.text || "#000" 
                    }}
                  >
                    {statusConfig[medico.disponibilidade]?.label || medico.disponibilidade}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
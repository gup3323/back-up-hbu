import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, ClipboardList, Activity, Users } from "lucide-react";
import Layout from "../layouts/Layout";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const [resumo, setResumo] = useState({
    cirurgias_hoje: 0,
    em_andamento: 0,
    salas_disponiveis: "0/0",
    equipes_ativas: 0
  });
  
  // SOLUÇÃO: O estado inicial já começa como true, evitando chamar setLoading(true) dentro do useEffect
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/dashboard/resumo`)
      .then(res => res.json())
      .then(data => {
        setResumo(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar resumo do dashboard:", err);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold text-[#150359]">
            Sistema de Agendamento Cirúrgico
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-[#203573]">
            Gerencie agendamentos cirúrgicos de forma eficiente e organizada.
            Controle de prioridades, equipes médicas e recursos hospitalares.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/novo-agendamento" className="bg-gradient-to-r from-[#03A688] to-[#00ECA9] text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity">
              <Calendar className="w-5 h-5 mr-2" /> Agendar Cirurgia
            </Link>
            <Link to="/calendario" className="border-2 border-[#150359] text-[#150359] px-8 py-3 rounded-lg font-bold flex items-center justify-center hover:bg-slate-50 transition-colors">
              <ClipboardList className="w-5 h-5 mr-2" /> Ver Calendário
            </Link>
          </div>
        </div>

        {/* Cards de Estatísticas com Dados Dinâmicos e Loading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-[#B6F2E1] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-[#150359]">Cirurgias Cadastradas</h3>
              <Calendar className="h-4 w-4 text-[#03A688]" />
            </div>
            <div className="text-3xl font-bold text-[#150359]">
              {loading ? "..." : resumo.cirurgias_hoje}
            </div>
            <p className="text-xs mt-1 text-[#203573]">
              {loading ? "..." : resumo.em_andamento} em andamento
            </p>
          </div>

          <div className="bg-white border-2 border-[#B6F2E1] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-[#150359]">Salas Disponíveis</h3>
              <Activity className="h-4 w-4 text-[#00641E]" />
            </div>
            <div className="text-3xl font-bold text-[#150359]">
              {loading ? "..." : resumo.salas_disponiveis}
            </div>
            <p className="text-xs mt-1 text-[#203573]">Salas operacionais livres</p>
          </div>

          <div className="bg-white border-2 border-[#B6F2E1] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-[#150359]">Vínculos de Equipe</h3>
              <Users className="h-4 w-4 text-[#FF8400]" />
            </div>
            <div className="text-3xl font-bold text-[#150359]">
              {loading ? "..." : resumo.equipes_ativas}
            </div>
            <p className="text-xs mt-1 text-[#203573]">Médicos alocados em cirurgias</p>
          </div>
        </div>

        {/* Acesso Rápido */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-[#150359]">Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/calendario" className="bg-white border-2 border-[#B6F2E1] p-5 rounded-xl hover:border-[#03A688] hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-[#03A688]" />
                <h3 className="font-bold text-[#150359]">Visualizar Calendário</h3>
              </div>
              <p className="text-sm text-[#203573] ml-7">Veja todas as cirurgias agendadas organizadas por prioridade</p>
            </Link>

            <Link to="/recursos" className="bg-white border-2 border-[#B6F2E1] p-5 rounded-xl hover:border-[#03A688] hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-[#00641E]" />
                <h3 className="font-bold text-[#150359]">Gerenciar Recursos</h3>
              </div>
              <p className="text-sm text-[#203573] ml-7">Controle salas cirúrgicas, equipamentos e equipes médicas</p>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
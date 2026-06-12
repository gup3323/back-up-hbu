import React, { useState, useEffect } from "react";
import { Search, FileText, User } from "lucide-react";
import Layout from "../layouts/Layout";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Prontuario() {
  const [busca, setBusca] = useState("");
  const [prontuarios, setProntuarios] = useState([]);
  const [prontuarioSelecionado, setProntuarioSelecionado] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/prontuarios`)
      .then((res) => res.json())
      .then((data) => setProntuarios(data))
      .catch((err) => console.error("Erro ao buscar prontuários:", err));
  }, []);

  const calcularIdade = (dataNasc) => {
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    return idade;
  };

  const prontuariosFiltrados = prontuarios.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.cpf.includes(busca)
  );

  const prontuario = prontuarios.find((p) => p.cpf === prontuarioSelecionado);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#150359]">Prontuários</h1>
          <p className="mt-1 text-[#203573]">Consulte o histórico dos pacientes</p>
        </div>

        <div className="bg-white border-2 border-[#B6F2E1] rounded-xl p-4 shadow-sm flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" placeholder="Buscar por nome ou CPF..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688]"
              value={busca} onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-bold text-[#150359] text-lg">Pacientes</h2>
            {prontuariosFiltrados.map((p) => (
              <div 
                key={p.cpf} onClick={() => setProntuarioSelecionado(p.cpf)}
                className={`p-5 rounded-xl cursor-pointer transition-all border-2 ${prontuarioSelecionado === p.cpf ? 'border-[#03A688] bg-[#B6F2E1]/20' : 'border-slate-100 bg-white hover:border-[#B6F2E1]'}`}
              >
                <h3 className="font-bold text-[#150359]">{p.nome}</h3>
                <p className="text-xs text-[#203573] mb-3">CPF: {p.cpf}</p>
                <div className="text-xs font-semibold text-slate-500">
                  <span>{calcularIdade(p.data_nascimento)} anos</span>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {!prontuario ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl h-full flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-[#150359]">Selecione um paciente</h3>
              </div>
            ) : (
              <div className="bg-white border-2 border-[#B6F2E1] rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                  <User className="w-6 h-6 text-[#03A688]" />
                  <h2 className="text-2xl font-bold text-[#150359]">{prontuario.nome}</h2>
                </div>
                
                <div>
                  <h4 className="font-bold text-[#150359] mb-3">Histórico Cirúrgico</h4>
                  {prontuario.cirurgia && prontuario.cirurgia.length > 0 ? (
                    <ul className="space-y-2">
                      {prontuario.cirurgia.map((c, i) => (
                        <li key={i} className="p-3 bg-slate-50 rounded-lg text-sm">
                          <span className="font-bold">{c.tipo_cirurgia}</span> - {c.status} 
                          <p className="text-xs text-slate-500">{new Date(c.data_hora).toLocaleDateString()}</p>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-slate-400">Nenhum histórico encontrado.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
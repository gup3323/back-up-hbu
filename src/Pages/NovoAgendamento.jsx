import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Calendar, Wrench, UserPlus, Trash2 } from "lucide-react";
import Layout from "../layouts/Layout";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function NovoAgendamento() {
  const navigate = useNavigate();
  
  const [salas, setSalas] = useState([]);
  const [todosMedicos, setTodosMedicos] = useState([]);
  const [listaEquipamentos, setListaEquipamentos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hojeString = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    cpfPaciente: "",
    data: "",
    horario: "",
    duracao: "2",
    crmCirurgiao: "",
    idSala: "",
    tipoCirurgia: "",
    prioridade: "media",
    observacoes: "",
    equipamentosSelecionados: [],
    medicosAuxiliares: []
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/recursos/salas`)
      .then((res) => res.json())
      .then((data) => {
        setSalas(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, idSala: data[0].id_sala }));
        }
      })
      .catch((err) => console.error(err));

    fetch(`${API_BASE_URL}/recursos/inventario-e-medicos`)
      .then((res) => res.json())
      .then((data) => {
        const medicosBanco = data.medicos || [];
        setTodosMedicos(medicosBanco);
        
        if (medicosBanco.length > 0) {
          setFormData((prev) => ({ ...prev, crmCirurgiao: medicosBanco[0].crm }));
        }

        setListaEquipamentos(data.equipamentos || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // MÁSCARA AUTOMÁTICA DE CPF
  const handleChangeCPF = (e) => {
    let valor = e.target.value;
    valor = valor.replace(/\D/g, "")
                 .replace(/(\d{3})(\d)/, "$1.$2")
                 .replace(/(\d{3})(\d)/, "$1.$2")
                 .replace(/(\d{3})(\d{1,2})/, "$1-$2")
                 .replace(/(-\d{2})\d+?$/, "$1");
    setFormData((prev) => ({ ...prev, cpfPaciente: valor }));
  };

  const handleEquipamentoChange = (idEquipamento) => {
    setFormData((prev) => {
      const jaSelecionado = prev.equipamentosSelecionados.includes(idEquipamento);
      if (jaSelecionado) {
        return {
          ...prev,
          equipamentosSelecionados: prev.equipamentosSelecionados.filter((id) => id !== idEquipamento)
        };
      } else {
        return {
          ...prev,
          equipamentosSelecionados: [...prev.equipamentosSelecionados, idEquipamento]
        };
      }
    });
  };

  const adicionarAuxiliar = () => {
    setFormData((prev) => ({
      ...prev,
      medicosAuxiliares: [...prev.medicosAuxiliares, { crm: "", funcao: "Auxiliar" }]
    }));
  };

  const removerAuxiliar = (index) => {
    setFormData((prev) => ({
      ...prev,
      medicosAuxiliares: prev.medicosAuxiliares.filter((_, i) => i !== index)
    }));
  };

  const handleAuxiliarChange = (index, campo, valor) => {
    setFormData((prev) => {
      const novaLista = [...prev.medicosAuxiliares];
      novaLista[index][campo] = valor;
      return { ...prev, medicosAuxiliares: novaLista };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    if (!formData.cpfPaciente || !formData.data || !formData.horario || !formData.crmCirurgiao || !formData.tipoCirurgia || !formData.idSala) {
      alert("Por favor, preencha todos os campos obrigatórios (*)");
      return;
    }

    const dataHoraSelecionada = new Date(`${formData.data}T${formData.horario}`);
    const agora = new Date();

    if (dataHoraSelecionada <= agora) {
      alert("Não é possível agendar uma cirurgia para o passado. Por favor, escolha uma data e horário futuros.");
      return;
    }

    const crmsAuxiliares = formData.medicosAuxiliares.map((a) => a.crm);
    if (crmsAuxiliares.includes(formData.crmCirurgiao)) {
      alert("O cirurgião principal não pode constar repetido na lista de médicos auxiliares.");
      return;
    }

    setIsSubmitting(true);

    try {
      const dataHoraIso = `${formData.data}T${formData.horario}:00`;

      const payloadParaEnviar = {
        cpf_paciente: formData.cpfPaciente,
        id_sala: parseInt(formData.idSala),
        tipo_cirurgia: formData.tipoCirurgia,
        data_hora: dataHoraIso,
        duracao_estimada: parseInt(formData.duracao || 2), // Mantido como HORAS
        prioridades: formData.prioridade.charAt(0).toUpperCase() + formData.prioridade.slice(1),
        observacoes: formData.observacoes,
        crm_medico: formData.crmCirurgiao,
        equipamentos: formData.equipamentosSelecionados,
        auxiliares: formData.medicosAuxiliares.filter((a) => a.crm !== "")
      };

      const resposta = await fetch(`${API_BASE_URL}/add_cirurgia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadParaEnviar),
      });

      if (resposta.ok) {
        alert("Cirurgia agendada com sucesso!");
        navigate("/calendario");
      } else {
        const erroApi = await resposta.json();
        alert(`Erro ao salvar: ${erroApi.detail || "Verifique as restrições inseridas."}`);
      }
    } catch (error) {
      console.error(error);
      alert("Não foi possível estabelecer conexão com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-[#150359] hover:opacity-70 font-medium transition-opacity"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </button>

        <div className="bg-white border-2 border-[#B6F2E1] rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#150359]">
              <Calendar className="w-6 h-6 text-[#03A688]" /> Agendar Nova Cirurgia
            </h2>
            <p className="text-sm text-[#203573] mt-1 ml-8">Preencha todos os dados necessários abaixo para reservar os recursos</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            <div className="space-y-4">
              <h3 className="font-semibold text-[#150359] border-b pb-2">Dados do Paciente</h3>
              <div>
                <label className="block text-sm font-medium text-[#203573] mb-1">
                  CPF do Paciente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" 
                  name="cpfPaciente" 
                  required
                  placeholder="000.000.000-00"
                  value={formData.cpfPaciente} 
                  onChange={handleChangeCPF}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-[#150359] border-b pb-2">Informações de Alocação</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#203573] mb-1">Data da Cirurgia *</label>
                  <input 
                    type="date" 
                    name="data" 
                    required 
                    min={hojeString}
                    value={formData.data} 
                    onChange={handleChange} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#203573] mb-1">Horário de Início *</label>
                  <input 
                    type="time" 
                    name="horario" 
                    required 
                    value={formData.horario} 
                    onChange={handleChange} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#203573] mb-1">Duração Estimada (em horas)</label>
                  <input 
                    type="number" 
                    name="duracao" 
                    min="1"
                    value={formData.duracao} 
                    onChange={handleChange} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#203573] mb-1">Tipo de Procedimento / Cirurgia *</label>
                  <input 
                    type="text" 
                    name="tipoCirurgia" 
                    required 
                    placeholder="Ex: Apendicectomia" 
                    value={formData.tipoCirurgia} 
                    onChange={handleChange} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#203573] mb-1">Cirurgião Principal *</label>
                  <select 
                    name="crmCirurgiao" 
                    value={formData.crmCirurgiao} 
                    onChange={handleChange} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688] bg-white text-sm"
                  >
                    {todosMedicos.map((m) => (
                      <option key={m.crm} value={m.crm}>{m.nome} ({m.especialidade})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#203573] mb-1">Sala Operatória *</label>
                  <select 
                    name="idSala" 
                    value={formData.idSala} 
                    onChange={handleChange} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688] bg-white text-sm"
                  >
                    {salas.map((s) => (
                      <option key={s.id_sala} value={s.id_sala}>{s.nome_sala} ({s.status})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#203573] mb-1">Nível de Prioridade</label>
                  <select 
                    name="prioridade" 
                    value={formData.prioridade} 
                    onChange={handleChange} 
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688] bg-white text-sm"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-[#150359] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#03A688]" /> Equipe Cirúrgica Auxiliar / Assistência
                </h3>
                <button 
                  type="button" 
                  onClick={adicionarAuxiliar} 
                  className="text-xs bg-[#B6F2E1] text-[#150359] px-3 py-1.5 rounded-lg font-bold hover:bg-[#03A688] hover:text-white transition-all shadow-sm"
                >
                  + Adicionar Médico Auxiliar
                </button>
              </div>

              {formData.medicosAuxiliares.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Nenhum médico assistente alocado no momento.</p>
              ) : (
                <div className="space-y-3">
                  {formData.medicosAuxiliares.map((aux, index) => (
                    <div key={index} className="flex gap-3 items-end bg-slate-50/70 p-3 rounded-lg border border-slate-100 shadow-sm">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-[#203573] mb-1">Nome do Médico</label>
                        <select 
                          value={aux.crm} 
                          required
                          onChange={(e) => handleAuxiliarChange(index, "crm", e.target.value)} 
                          className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white outline-none focus:border-[#03A688]"
                        >
                          <option value="">Selecione o profissional...</option>
                          {todosMedicos.map((m) => (
                            <option key={m.crm} value={m.crm}>{m.nome} ({m.especialidade})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-44">
                        <label className="block text-xs font-semibold text-[#203573] mb-1">Função na Equipe</label>
                        <select 
                          value={aux.funcao} 
                          onChange={(e) => handleAuxiliarChange(index, "funcao", e.target.value)} 
                          className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white outline-none focus:border-[#03A688]"
                        >
                          <option value="Auxiliar">Auxiliar</option>
                          <option value="Anestesista">Anestesista</option>
                          <option value="Instrumentador">Instrumentador</option>
                          <option value="Residente">Residente</option>
                        </select>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removerAuxiliar(index)} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-[#150359] border-b pb-2 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#03A688]" /> Alocar Equipamentos do Inventário
              </h3>
              {listaEquipamentos.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhum equipamento cadastrado no inventário geral.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {listaEquipamentos.map((equip) => {
                    const esgotado = equip.quantidade_disponivel <= 0;
                    const checado = formData.equipamentosSelecionados.includes(equip.id);
                    return (
                      <label 
                        key={equip.id} 
                        className={`flex items-center space-x-3 p-3 rounded-lg border bg-white select-none transition-all 
                          ${esgotado ? 'opacity-40 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:bg-slate-50/80'} 
                          ${checado ? 'border-[#03A688] bg-[#B6F2E1]/10 shadow-sm' : 'border-slate-200'}`}
                      >
                        <input 
                          type="checkbox" 
                          disabled={esgotado} 
                          checked={checado} 
                          onChange={() => handleEquipamentoChange(equip.id)} 
                          className="w-4 h-4 text-[#03A688] border-slate-300 rounded focus:ring-[#03A688]" 
                        />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-[#150359] block">{equip.nome}</span>
                          <span className="text-xs text-slate-500">{equip.quantidade_disponivel} unidades disponíveis</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#203573]">Observações Adicionais</label>
              <textarea 
                name="observacoes" 
                rows="3" 
                placeholder="Ex: Alergias do paciente, cuidados especiais pós-cirúrgicos, restrições médicas..."
                value={formData.observacoes} 
                onChange={handleChange} 
                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688] resize-none text-sm"
              ></textarea>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`flex-1 bg-gradient-to-r from-[#03A688] to-[#00ECA9] text-white py-3 rounded-lg font-bold flex items-center justify-center shadow-md transition-opacity ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'}`}
              >
                <Save className="w-5 h-5 mr-2" /> {isSubmitting ? "Agendando..." : "Agendar Cirurgia"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
}
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, UserCheck, Lock, Mail } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState("funcionario");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !senha) return alert("Preencha todos os campos.");

    setCarregando(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, email, senha }) 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erro de autenticação");
      }

      localStorage.setItem("perfil_usuario", data.perfil);
      
      if (data.perfil === "medico") {
        localStorage.setItem("medico_crm", data.crm);
        navigate("/painel-medico");
      } else {
        navigate("/home");
      }
    } catch (error) {
      alert("Falha no login: " + error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6eff6] to-[#d6f0e9] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#B6F2E1] overflow-hidden">
        <div className="bg-[#0a0c37] text-white p-6 text-center space-y-2">
          <div className="bg-teal-400 w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-white">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">MedSchedule</h1>
          <p className="text-xs text-slate-300 tracking-wider uppercase">Portal de Acesso HBU</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-6">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button type="button" onClick={() => { setPerfil("funcionario"); setEmail(""); }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${perfil === "funcionario" ? "bg-[#150359] text-white shadow" : "text-[#203573] hover:bg-slate-200"}`}>
              <UserCheck className="w-4 h-4" /> Funcionário
            </button>
            <button type="button" onClick={() => { setPerfil("medico"); setEmail(""); }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${perfil === "medico" ? "bg-[#150359] text-white shadow" : "text-[#203573] hover:bg-slate-200"}`}>
              <Stethoscope className="w-4 h-4" /> Médico
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#203573] mb-1">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder={perfil === "medico" ? "Ex: arnaldo.silva@hospital.com" : "admin@hbu.com.br"} 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688]" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#203573] mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required 
                  value={senha} 
                  onChange={(e) => setSenha(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#03A688]" 
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={carregando} className="w-full py-3 bg-gradient-to-r from-[#03A688] to-[#00ECA9] text-white rounded-lg font-bold shadow-lg hover:opacity-95 disabled:opacity-50">
            {carregando ? "A Autenticar..." : "Aceder ao Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
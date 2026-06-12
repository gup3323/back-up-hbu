import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navLinksFuncionario = [
  { to: '/home',       emoji: '🏠', label: 'Home'       },
  { to: '/recursos',   emoji: '🩺', label: 'Recursos'   },
  { to: '/calendario', emoji: '📅', label: 'Calendário' },
  { to: '/prontuario', emoji: '📄', label: 'Prontuário' },
];

const navLinksMedico = [
  { to: '/painel-medico', emoji: '😷', label: 'Painel de Atendimentos' },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Lê quem está logado para mostrar o menu correto
  const perfil = localStorage.getItem("perfil_usuario");
  const navLinks = perfil === "medico" ? navLinksMedico : navLinksFuncionario;

  const isAtivo = (caminho) => location.pathname === caminho;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6eff6] to-[#d6f0e9] font-sans flex flex-col">

      {/* NAVBAR SUPERIOR */}
      <header className="bg-[#0a0c37] text-white py-4 px-8 flex justify-between items-center shadow-md relative">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-teal-400 p-2 rounded-lg text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold leading-tight">MedSchedule</h1>
            <span className="text-[10px] text-slate-300 font-light tracking-wider">AGENDAMENTO CIRÚRGICO</span>
          </div>
        </div>

        {/* Nav Desktop — visível só em md+ */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map(({ to, emoji, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${isAtivo(to)
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            >
              <span>{emoji}</span> {label}
            </Link>
          ))}
          <button 
            onClick={handleLogout} 
            className="ml-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
          >
            Sair
          </button>
        </nav>

        {/* Botão Burger — visível só no mobile */}
        <button
          className="md:hidden flex flex-col justify-center items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Abrir menu"
        >
          {/* Ícone hambúrguer animado */}
          <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

        {/* Menu Dropdown Mobile */}
        {menuOpen && (
          <nav className="absolute top-full left-0 w-full bg-[#0a0c37] flex flex-col gap-1 px-4 py-3 shadow-lg md:hidden z-50">
            {navLinks.map(({ to, emoji, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                  ${isAtivo(to)
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                <span>{emoji}</span> {label}
              </Link>
            ))}
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-white/5 transition-colors text-left"
            >
              Sair do Sistema
            </button>
          </nav>
        )}
      </header>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-8 md:px-20 lg:px-40 flex flex-col">
        {children}
      </main>

    </div>
  );
};

export default Layout;
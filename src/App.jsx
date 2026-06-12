import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './Pages/login'; // Importando a nova tela de login
import Home from './Pages/Home';
import Recursos from './Pages/Recursos';
import Calendario from './Pages/Calendario';
import Prontuario from './Pages/Prontuario';
import NovoAgendamento from './Pages/NovoAgendamento';
import PainelMedico from './Pages/PainelMedico'; // Futura tela do front

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Agora o sistema abre direto no Login */}
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/recursos" element={<Recursos />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/prontuario" element={<Prontuario />} />
        <Route path="/novo-agendamento" element={<NovoAgendamento />} />
        <Route path="/painel-medico" element={<PainelMedico />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
import React from "react";
import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6eff6] to-[#d6f0e9] flex flex-col items-center justify-center py-16 text-center px-4">
      <AlertCircle className="w-24 h-24 text-[#03A688] mb-6 opacity-80" />
      <h1 className="text-6xl font-bold text-[#150359] mb-2">404</h1>
      <p className="text-xl text-[#203573] mb-8 font-medium">Ops! Página não encontrada</p>
      
      <Link to="/home" className="bg-[#150359] text-white px-8 py-3 rounded-lg font-bold flex items-center hover:bg-[#0b0230] transition-colors shadow-lg">
        <Home className="w-5 h-5 mr-2" />
        Voltar para a Home
      </Link>
    </div>
  );
}
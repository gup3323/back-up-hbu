import os
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel
from supabase import create_client, Client
from datetime import datetime, timedelta
from dotenv import load_dotenv

app = FastAPI(
    title="API de Cirurgias - HBU",
    description="API para integrar e inserir dados no Supabase",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# ROTA DE LOGIN (TEXTO SIMPLES)
# ==========================================
@app.post("/login")
def realizar_login(dados: dict):
    perfil = dados.get("perfil")
    email = dados.get("email") 
    senha_plana = str(dados.get("senha", ""))[:72]

    try:
        if perfil == "funcionario":
            if email != "admin@hbu.com.br" or senha_plana != "admin123":
                raise HTTPException(status_code=401, detail="Credenciais de funcionário inválidas.")
            return {"status": "sucesso", "perfil": "funcionario"}

        elif perfil == "medico":
            busca = supabase.table("medico").select("crm, nome, email, senha").eq("email", email).execute()
            
            if not busca.data:
                raise HTTPException(status_code=401, detail="E-mail não encontrado no sistema.")
            
            medico_db = busca.data[0]
            senha_banco = medico_db.get("senha")

            if not senha_banco or senha_plana != senha_banco:
                raise HTTPException(status_code=401, detail="Senha incorreta.")
            
            return {
                "status": "sucesso", 
                "nome": medico_db["nome"], 
                "perfil": "medico", 
                "crm": medico_db["crm"] 
            }
            
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROTAS EXCLUSIVAS DO PAINEL DO MÉDICO
# ==========================================
@app.get("/agenda_medico/{crm:path}")
def get_agenda_medico(crm: str):
    try:
        busca_vinculo = supabase.table("equipe_cirurgica").select("id_cirurgia").eq("crm_medico", crm).execute()
        
        if not busca_vinculo.data:
            return []
        
        ids_cirurgias = [v["id_cirurgia"] for v in busca_vinculo.data]

        busca_cirurgias = supabase.table("cirurgia").select(
            "id_cirurgia, tipo_cirurgia, data_hora, duracao_estimada, status, prioridades, observacoes, id_sala, "
            "paciente(cpf, nome, data_nascimento, telefone), "
            "sala_cirurgica(nome_sala, equipamento)"
        ).in_("id_cirurgia", ids_cirurgias).order("data_hora").execute()

        return busca_cirurgias.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/atualizar_evolucao/{id_cirurgia}")
def atualizar_evolucao(id_cirurgia: int, dados: dict):
    try:
        novo_status = dados.get("status")
        novas_observacoes = dados.get("observacoes")

        atualizacao = supabase.table("cirurgia").update({
            "status": novo_status,
            "observacoes": novas_observacoes
        }).eq("id_cirurgia", id_cirurgia).execute()

        if not atualizacao.data:
            raise HTTPException(status_code=400, detail="Erro ao atualizar a cirurgia.")
        
        return {"mensagem": "Evolução salva com sucesso!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ROTA DE AGENDAMENTO (COM BLOQUEIO DE CHOQUE - EM HORAS)
# ==========================================
@app.post("/add_cirurgia")
def criar_cirurgia(dados: dict):
    try:
        cpf_paciente = dados.get("cpf_paciente")
        id_sala = dados.get("id_sala")
        tipo_cirurgia = dados.get("tipo_cirurgia")
        data_hora_str = dados.get("data_hora") 
        duracao_estimada = int(dados.get("duracao_estimada", 0)) 
        prioridades = dados.get("prioridades", "Média")
        observacoes = dados.get("observacoes")
        crm_medico = dados.get("crm_medico")
        equipamentos = dados.get("equipamentos", [])

        # Usando hours para bater com o que vem do Front-end
        nova_inicio = datetime.fromisoformat(data_hora_str.replace('Z', ''))
        nova_fim = nova_inicio + timedelta(hours=duracao_estimada) 

        busca_sala = supabase.table("cirurgia").select("id_cirurgia, data_hora, duracao_estimada, status").eq("id_sala", id_sala).execute()
        
        for c in busca_sala.data:
            if c.get("status") != "Cancelada":
                existente_inicio = datetime.fromisoformat(c["data_hora"].replace('Z', '').split('+')[0])
                existente_fim = existente_inicio + timedelta(hours=int(c["duracao_estimada"]))
                
                if nova_inicio < existente_fim and nova_fim > existente_inicio:
                    raise HTTPException(status_code=400, detail="Bloqueio: Já existe uma cirurgia agendada para esta sala neste horário.")

        if crm_medico:
            busca_medico = supabase.table("equipe_cirurgica").select("id_cirurgia, cirurgia(data_hora, duracao_estimada, status)").eq("crm_medico", crm_medico).execute()
            for registro in busca_medico.data:
                cirurgia = registro.get("cirurgia")
                if cirurgia and cirurgia.get("status") != "Cancelada":
                    existente_inicio = datetime.fromisoformat(cirurgia["data_hora"].replace('Z', '').split('+')[0])
                    existente_fim = existente_inicio + timedelta(hours=int(cirurgia["duracao_estimada"]))
                    
                    if nova_inicio < existente_fim and nova_fim > existente_inicio:
                        raise HTTPException(status_code=400, detail="Bloqueio: O médico já possui outra cirurgia neste horário.")

        payload_cirurgia = {
            "cpf_paciente": cpf_paciente,
            "id_sala": id_sala,
            "tipo_cirurgia": tipo_cirurgia,
            "data_hora": data_hora_str,
            "duracao_estimada": duracao_estimada,
            "prioridades": prioridades,
            "observacoes": observacoes,
            "status": "Agendada"
        }

        resposta_cirurgia = supabase.table("cirurgia").insert(payload_cirurgia).execute()
        if not resposta_cirurgia.data:
            raise HTTPException(status_code=400, detail="Erro ao registrar a cirurgia.")
            
        id_cirurgia = resposta_cirurgia.data[0]["id_cirurgia"]

        if crm_medico:
            supabase.table("equipe_cirurgica").insert({
                "id_cirurgia": id_cirurgia,
                "crm_medico": crm_medico,
                "funcao": "Cirurgião Principal"
            }).execute()

        if equipamentos:
            payload_equipamentos = [{"id_cirurgia": id_cirurgia, "id_equipamento": int(eq_id)} for eq_id in equipamentos]
            supabase.table("cirurgia_equipamento").insert(payload_equipamentos).execute()

        return {"mensagem": "Cirurgia agendada com sucesso!", "id_cirurgia": id_cirurgia}

    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@app.get("/pacientes")
def get_all_pacientes():
    try:
        response = supabase.table("paciente").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 

@app.get("/medicos")
def get_all_medicos():
    try:
        response = supabase.table("medico").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 

@app.get("/dashboard/resumo")
def get_dashboard_resumo():
    try:
        cirurgias = supabase.table("cirurgia").select("status").execute()
        total_cirurgias = len(cirurgias.data) if cirurgias.data else 0
        em_andamento = sum(1 for c in cirurgias.data if c.get("status") == "Em andamento") if cirurgias.data else 0

        salas = supabase.table("sala_cirurgica").select("status").execute()
        total_salas = len(salas.data) if salas.data else 0
        salas_disponiveis = sum(1 for s in salas.data if s.get("status") == "Disponível") if salas.data else 0

        medicos_req = supabase.table("medico").select("disponibilidade").execute()
        medicos_em_cirurgia = sum(1 for m in medicos_req.data if m.get("disponibilidade") == "cirurgia") if medicos_req.data else 0

        return {
            "cirurgias_hoje": total_cirurgias, 
            "em_andamento": em_andamento,
            "salas_disponiveis": f"{salas_disponiveis}/{total_salas}", 
            "equipes_ativas": medicos_em_cirurgia  
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recursos/salas")
def get_salas_recursos():
    try:
        resposta = supabase.table("sala_cirurgica").select("id_sala, nome_sala, capacidade, status").execute()
        return resposta.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/recursos/inventario-e-medicos")
def get_inventario_e_medicos():
    try:
        equipamentos_req = supabase.table("equipamentos").select("id, nome, quantidade_total, quantidade_disponivel").execute()
        medicos_req = supabase.table("medico").select("crm, nome, especialidade, disponibilidade").execute()
        
        return {
            "equipamentos": equipamentos_req.data,
            "medicos": medicos_req.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/calendario")
def get_calendario_cirurgico():
    try:
        resposta = supabase.table("cirurgia").select(
            "id_cirurgia, tipo_cirurgia, data_hora, duracao_estimada, status, observacoes, prioridades, "
            "paciente(cpf, nome)"
        ).execute()
        
        cirurgias = resposta.data if resposta.data else []
        
        def normalizar(p):
            return str(p).lower().strip() if p else ""
        
        return {
            "urgentes": [c for c in cirurgias if normalizar(c.get("prioridades")) == "urgente"],
            "alta": [c for c in cirurgias if normalizar(c.get("prioridades")) == "alta"],
            "media": [c for c in cirurgias if normalizar(c.get("prioridades")) in ["média", "media"]],
            "baixa": [c for c in cirurgias if normalizar(c.get("prioridades")) == "baixa"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.delete("/cancelar_cirurgia/{id_cirurgia}")
def deletar_cirurgia(id_cirurgia: int):
    try:
        equipe_busca = supabase.table("equipe_cirurgica").select("crm_medico").eq("id_cirurgia", id_cirurgia).execute()
        lista_medicos = equipe_busca.data if equipe_busca.data else []

        cirurgia_busca = supabase.table("cirurgia").select("id_sala").eq("id_cirurgia", id_cirurgia).execute()
        id_sala = cirurgia_busca.data[0].get("id_sala") if cirurgia_busca.data else None

        equipamentos_busca = supabase.table("cirurgia_equipamento").select("id_equipamento").eq("id_cirurgia", id_cirurgia).execute()
        lista_equipamentos = equipamentos_busca.data if equipamentos_busca.data else []

        supabase.table("equipe_cirurgica").delete().eq("id_cirurgia", id_cirurgia).execute()
        supabase.table("cirurgia_equipamento").delete().eq("id_cirurgia", id_cirurgia).execute()
        supabase.table("cirurgia").delete().eq("id_cirurgia", id_cirurgia).execute()
        
        for membro in lista_medicos:
            crm = membro.get("crm_medico")
            if crm:
                supabase.table("medico").update({"disponibilidade": "Disponível"}).eq("crm", crm).execute()
        
        if id_sala:
            supabase.table("sala_cirurgica").update({"status": "Disponível"}).eq("id_sala", id_sala).execute()
        
        for eq in lista_equipamentos:
            eq_id = eq.get("id_equipamento")
            if eq_id:
                eq_busca = supabase.table("equipamentos").select("quantidade_disponivel", "quantidade_em_uso").eq("id", int(eq_id)).execute()
                
                if eq_busca.data:
                    qtd_atual_disp = eq_busca.data[0]["quantidade_disponivel"]
                    qtd_atual_uso = eq_busca.data[0]["quantidade_em_uso"]
                    
                    supabase.table("equipamentos").update({
                        "quantidade_disponivel": qtd_atual_disp + 1,
                        "quantidade_em_uso": max(0, qtd_atual_uso - 1)
                    }).eq("id", int(eq_id)).execute()
            
        return {"mensagem": "Cirurgia cancelada com sucesso e recursos liberados."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/prontuarios")
def get_prontuarios():
    try:
        # Busca pacientes e o histórico de cirurgias relacionado
        response = supabase.table("paciente").select(
            "cpf, nome, data_nascimento, cirurgia(tipo_cirurgia, data_hora, status, observacoes)"
        ).execute()
        
        # Formata a data de nascimento para calcular idade no front-end
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
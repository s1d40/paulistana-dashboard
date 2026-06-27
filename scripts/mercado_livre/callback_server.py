# callback_server.py
from flask import Flask, request
from auth import exchange_code_for_token

app = Flask(__name__)

@app.route("/callback")
def callback():
    code = request.args.get("code")
    if not code:
        return "<h2>Erro: nenhum código recebido.</h2>", 400

    try:
        exchange_code_for_token(code)
        return "<h2>Autorizado! Pode fechar esta aba.</h2>"
    except Exception as e:
        # Loga o erro completo no console do Flask
        app.logger.error("Falha ao trocar code por token", exc_info=e)
        # Retorna mensagem genérica para o navegador
        return "<h2>Erro interno no servidor. Veja o terminal para detalhes.</h2>", 500

if __name__ == "__main__":
    # debug=True habilita recarregamento automático e mostra tracebacks no terminal
    app.run(host="0.0.0.0", port=5000, debug=True)

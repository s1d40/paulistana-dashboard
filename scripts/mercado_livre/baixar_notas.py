# -*- coding: utf-8 -*-
"""
Baixa DF-e (Distribuição) e manifesta automaticamente (AN, SOAP 1.1)
- Sem prefixos nos payloads (default xmlns no raiz)
- Persiste ultNSU em logs/ultnsu.txt para evitar cStat 656 (Consumo Indevido)
- Tenta descobrir ultNSU de logs/ultima_resposta_dist.xml caso o arquivo não exista
"""

import base64
import gzip
import sys
import datetime as dt
from pathlib import Path
from typing import List, Tuple, Optional

import requests
from requests_pkcs12 import Pkcs12Adapter
from lxml import etree as ET
from urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

# ================== CONFIG ==================
CNPJ = "31961281000172"

# <<< PREENCHIDO AUTOMATICAMENTE COMO VOCÊ PEDIU >>>
CERT_PATH = r"C:\Users\André\Desktop\ApiMercadoLivre\24186254.pfx"
CERT_SENHA = "SUA_SENHA_AQUI"  # <- sua senha aqui, fixa no código

CUF = "35"  # SP

# Pastas
SCRIPT_DIR = Path(__file__).resolve().parent
PASTA_BASE = SCRIPT_DIR
PASTA_XML = PASTA_BASE / "xml"
PASTA_PDF = PASTA_BASE / "pdf"
PASTA_LOG = PASTA_BASE / "logs"
for p in (PASTA_XML, PASTA_PDF, PASTA_LOG):
    p.mkdir(parents=True, exist_ok=True)

ULTNSU_PATH = PASTA_LOG / "ultnsu.txt"

# ================== ENDPOINTS (AN Produção) ==================
DISTRIBUICAO_URL = "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx"
RECEP_EVENTO_URL = "https://www1.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx"

# ================== NAMESPACES ==================
NFE_NS = "http://www.portalfiscal.inf.br/nfe"
WSDL_DIST_NS = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe"
WSDL_EVT_NS = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4"

def println(msg: str) -> None:
    try:
        print(msg, flush=True)
    except Exception:
        sys.stdout.buffer.write((msg + "\n").encode("utf-8", "ignore"))

def qn(tag: str) -> str:
    return f"{{{NFE_NS}}}{tag}"

# ---------- ultNSU: persistência ----------
def load_ultnsu_from_file() -> Optional[str]:
    try:
        txt = ULTNSU_PATH.read_text(encoding="utf-8").strip()
        if len(txt) == 15 and txt.isdigit():
            return txt
    except Exception:
        pass
    return None

def load_ultnsu_from_last_response() -> Optional[str]:
    """Tenta extrair ultNSU do último XML salvo."""
    arq = PASTA_LOG / "ultima_resposta_dist.xml"
    if not arq.exists():
        return None
    try:
        tree = ET.fromstring(arq.read_bytes())
        val = tree.findtext(".//{http://www.portalfiscal.inf.br/nfe}ultNSU")
        if val and len(val.strip()) == 15 and val.strip().isdigit():
            return val.strip()
    except Exception:
        pass
    return None

def save_ultnsu(val: str) -> None:
    try:
        ULTNSU_PATH.write_text(val, encoding="utf-8")
    except Exception:
        pass

def resolve_ultnsu_inicial() -> str:
    # 1) arquivo
    v = load_ultnsu_from_file()
    if v:
        return v
    # 2) última resposta
    v = load_ultnsu_from_last_response()
    if v:
        return v
    # 3) fallback zero
    return "000000000000000"

# ================== BUILDERS ==================
def build_dist_xml(cnpj: str, ult_nsu: str) -> bytes:
    root = ET.Element(qn("distDFeInt"), nsmap={None: NFE_NS}, versao="1.01")
    ET.SubElement(root, qn("tpAmb")).text = "1"
    ET.SubElement(root, qn("cUFAutor")).text = CUF
    ET.SubElement(root, qn("CNPJ")).text = cnpj
    d = ET.SubElement(root, qn("distNSU"))
    ET.SubElement(d, qn("ultNSU")).text = ult_nsu
    return ET.tostring(root, encoding="utf-8", xml_declaration=False)

def soap_envelope_dist(xml_dist: bytes) -> bytes:
    xml_dist_str = xml_dist.decode("utf-8")
    envelope = f"""<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <nfeCabecMsg xmlns="{WSDL_DIST_NS}">
      <cUF>{CUF}</cUF>
      <versaoDados>1.01</versaoDados>
    </nfeCabecMsg>
  </soap:Header>
  <soap:Body>
    <nfeDistDFeInteresse xmlns="{WSDL_DIST_NS}">
      <nfeDadosMsg>{xml_dist_str}</nfeDadosMsg>
    </nfeDistDFeInteresse>
  </soap:Body>
</soap:Envelope>"""
    return envelope.encode("utf-8")

def build_envio_manifesto(ch_nfe: str, tp_evento: str = "210200", seq: int = 1) -> bytes:
    id_evt = f"ID{tp_evento}{ch_nfe}{seq:02d}"

    env = ET.Element(qn("envEvento"), nsmap={None: NFE_NS}, versao="1.00")
    ET.SubElement(env, qn("idLote")).text = f"{int(dt.datetime.now().timestamp())%100000:05d}"

    ev = ET.SubElement(env, qn("evento"), versao="1.00")
    inf = ET.SubElement(ev, qn("infEvento"), Id=id_evt)
    ET.SubElement(inf, qn("cOrgao")).text = "91"  # AN
    ET.SubElement(inf, qn("tpAmb")).text = "1"
    ET.SubElement(inf, qn("CNPJ")).text = CNPJ
    ET.SubElement(inf, qn("chNFe")).text = ch_nfe
    ET.SubElement(inf, qn("dhEvento")).text = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S-00:00")
    ET.SubElement(inf, qn("tpEvento")).text = tp_evento
    ET.SubElement(inf, qn("nSeqEvento")).text = str(seq)
    ET.SubElement(inf, qn("verEvento")).text = "1.00"

    det = ET.SubElement(inf, qn("detEvento"), versao="1.00")
    if tp_evento == "210240":
        ET.SubElement(det, qn("descEvento")).text = "Operação não Realizada"
        ET.SubElement(det, qn("xJust")).text = "Manifestação automática pelo destinatário."
    elif tp_evento == "210220":
        ET.SubElement(det, qn("descEvento")).text = "Desconhecimento da Operação"
        ET.SubElement(det, qn("xJust")).text = "Manifestação automática pelo destinatário."
    elif tp_evento == "210210":
        ET.SubElement(det, qn("descEvento")).text = "Confirmação da Operação"
    else:
        ET.SubElement(det, qn("descEvento")).text = "Ciência da Operação"

    return ET.tostring(env, encoding="utf-8", xml_declaration=False)

def soap_envelope_evento(xml_env_evento: bytes) -> bytes:
    body_str = xml_env_evento.decode("utf-8")
    envelope = f"""<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <nfeCabecMsg xmlns="{WSDL_EVT_NS}">
      <cUF>{CUF}</cUF>
      <versaoDados>1.00</versaoDados>
    </nfeCabecMsg>
  </soap:Header>
  <soap:Body>
    <nfeRecepcaoEvento xmlns="{WSDL_EVT_NS}">
      <nfeDadosMsg>{body_str}</nfeDadosMsg>
    </nfeRecepcaoEvento>
  </soap:Body>
</soap:Envelope>"""
    return envelope.encode("utf-8")

# ================== HTTP COM CERT ==================
def make_session_cert(pfx_path: str, pfx_password: str) -> requests.Session:
    s = requests.Session()
    s.mount("https://", Pkcs12Adapter(pkcs12_filename=pfx_path, pkcs12_password=pfx_password))
    s.verify = False
    return s

# ================== DISTRIBUIÇÃO ==================
def dist_loop(session: requests.Session, cnpj: str, ult_nsu_inicial: str) -> Tuple[str, List[ET._Element]]:
    """Percorre distribuição até não ter mais retorno (137/138). Respeita 656."""
    ult_nsu = ult_nsu_inicial
    achados: List[ET._Element] = []

    while True:
        xml_dist = build_dist_xml(cnpj, ult_nsu)
        soap = soap_envelope_dist(xml_dist)

        headers = {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": f"{WSDL_DIST_NS}/nfeDistDFeInteresse",
        }

        try:
            (PASTA_LOG / "ultima_requisicao_dist.xml").write_bytes(soap)
        except Exception:
            pass

        resp = session.post(DISTRIBUICAO_URL, data=soap, headers=headers, timeout=60)
        try:
            (PASTA_LOG / "ultima_resposta_dist.xml").write_bytes(resp.content)
        except Exception:
            pass
        resp.raise_for_status()

        tree = ET.fromstring(resp.content)
        cStat = tree.findtext(".//{http://www.portalfiscal.inf.br/nfe}cStat") or ""
        xMotivo = tree.findtext(".//{http://www.portalfiscal.inf.br/nfe}xMotivo") or ""
        println(f"↩️ SEFAZ cStat={cStat} - {xMotivo}")

        # Consumo indevido: NÃO ATUALIZA ultNSU e para
        if cStat == "656":
            println("⏳ 656: usando ultNSU incorreto ou requisições muito próximas. Aguarde ~1h antes de tentar novamente.")
            break

        if cStat not in {"137", "138"}:
            # Outros cStat: para, mas se vier ultNSU aproveita
            novo_ult = tree.findtext(".//{http://www.portalfiscal.inf.br/nfe}ultNSU")
            if novo_ult and len(novo_ult) == 15 and novo_ult.isdigit():
                ult_nsu = novo_ult
            break

        lote = tree.find(".//{http://www.portalfiscal.inf.br/nfe}loteDistDFeInt")
        if lote is not None:
            for dz in lote.findall(".//{http://www.portalfiscal.inf.br/nfe}docZip"):
                b64 = (dz.text or "").strip()
                if not b64:
                    continue
                try:
                    raw = gzip.decompress(base64.b64decode(b64))
                    achados.append(ET.fromstring(raw))
                except Exception as e:
                    println(f"⚠️ Falha ao inflar docZip NSU={dz.get('NSU')}: {e}")

        # Atualiza ultNSU sempre que vier um válido
        novo_ult = tree.findtext(".//{http://www.portalfiscal.inf.br/nfe}ultNSU")
        if novo_ult and len(novo_ult) == 15 and novo_ult.isdigit():
            ult_nsu = novo_ult

        # Se não veio mais lote, paramos
        if not lote or cStat == "137":
            break

    return ult_nsu, achados

# ================== PARSE resNFe ==================
def extrai_chaves_resnfe(doc: ET._Element) -> List[str]:
    chaves: List[str] = []
    tag = ET.QName(doc.tag).localname
    if tag == "resNFe":
        ch = doc.findtext(qn("chNFe"))
        if ch:
            chaves.append(ch.strip())
    elif tag in {"procNFe", "nfeProc"}:
        ch = doc.findtext(".//{http://www.portalfiscal.inf.br/nfe}chNFe")
        if ch:
            chaves.append(ch.strip())
    return chaves

# ================== ENVIO MANIFESTAÇÃO ==================
def manifesto(session: requests.Session, chaves: List[str], tp_evento: str = "210200") -> int:
    enviados = 0
    for ch in chaves:
        xml_env = build_envio_manifesto(ch, tp_evento)
        soap = soap_envelope_evento(xml_env)
        headers = {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": f"{WSDL_EVT_NS}/nfeRecepcaoEvento4",
        }

        try:
            (PASTA_LOG / f"req_evento_{ch}.xml").write_bytes(soap)
        except Exception:
            pass

        resp = session.post(RECEP_EVENTO_URL, data=soap, headers=headers, timeout=60)
        try:
            (PASTA_LOG / f"resp_evento_{ch}.xml").write_bytes(resp.content)
        except Exception:
            pass

        resp.raise_for_status()

        tree = ET.fromstring(resp.content)
        cStat = tree.findtext(".//{http://www.portalfiscal.inf.br/nfe}cStat") or ""
        xMotivo = tree.findtext(".//{http://www.portalfiscal.inf.br/nfe}xMotivo") or ""
        println(f"📝 Manifesto {ch}: cStat={cStat} - {xMotivo}")
        if cStat in {"135", "128"}:
            enviados += 1
    return enviados

# ================== MAIN ==================
def main():
    println(f"🔐 Certificado: {CERT_PATH}")
    println("🔑 Senha: (embutida no código)")

    s = make_session_cert(CERT_PATH, CERT_SENHA)

    ult_inicial = resolve_ultnsu_inicial()
    println(f"📦 Consultando Distribuição DF-e (AN) para CNPJ {CNPJ} (ultNSU inicial={ult_inicial})...")
    ult_nsu, docs = dist_loop(s, CNPJ, ult_insu_inicial:=ult_inicial)  # noqa: F841 just to show in print above

    println(f"🧾 Registros recebidos: {len(docs)} | ultNSU agora: {ult_nsu}")
    if ult_nsu and ult_nsu != ult_inicial:
        save_ultnsu(ult_nsu)

    chaves: List[str] = []
    for d in docs:
        chaves.extend(extrai_chaves_resnfe(d))
    chaves = list(dict.fromkeys(chaves))
    println(f"🔎 Chaves em resNFe: {len(chaves)}")

    enviados = 0
    if chaves:
        println(f"📝 A manifestar (novo): {len(chaves)}")
        enviados = manifesto(s, chaves, tp_evento="210200")
    else:
        println("📝 A manifestar (novo): 0")

    println(f"✅ Finalizado. Manifestados nesta execução: {enviados}. Total já manifestados: {enviados}")
    println(f"📁 XML/Logs: {PASTA_XML} / {PASTA_LOG}")

if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as e:
        println(f"❌ HTTP error: {e} | Conteúdo: {getattr(e.response, 'text', '')[:400]}")
        raise
    except Exception as e:
        println(f"❌ Erro inesperado: {e}")
        raise

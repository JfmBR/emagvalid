"""Converte os .docx do projeto em Markdown literal (sem resumir nada).

Uso (a partir da raiz do repositório):
    python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py              # gera as fontes
    python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py --verificar  # confere o que é público

Gera/sobrescreve os arquivos de projeto/contexto_agente/fontes/. Esses arquivos são
somente leitura: para mudar o conteúdo, altere o .docx e rode o script de novo.

Os .docx com dados de entrevistados ficam fora do repositório (que é público), na
pasta privada: ../acessaweb-privado/ ao lado da raiz, ou a pasta indicada em
ACESSAWEB_PRIVADO. Lá também ficam nomes.json (trechos com nome de entrevistado e
a versão só com o código) e a fonte Entrevistas_PcD.md, que nunca vai para o repo.
"""
import json
import os
import re
import subprocess
import sys
import zipfile
from datetime import date
from pathlib import Path
from xml.etree import ElementTree as ET

RAIZ = Path(__file__).resolve().parents[3]
PROJETO = RAIZ / "projeto"
FONTES = PROJETO / "contexto_agente" / "fontes"
SO_NO_PRIVADO = {"projeto/Entrevistas_PcD.md"}

ORIGENS = {
    "projeto/TAP.md": "docs/contexto_projeto/TAP_emagvalid_Grupo_3 (feito).docx",
    "projeto/Persona.md": "docs/contexto_projeto/Persona_emagvalid_v1.0_28-10-2026.docx",
    "projeto/Persona_v0.1.md": "docs/contexto_projeto/Persona_emagvalid_16-10-2026.docx",
    "projeto/Jornada.md": "docs/contexto_projeto/Jornada_do_Usuario_emagvalid_v1.0_28-10-2026.docx",
    "projeto/Entrevistas_PcD.md": "docs/contexto_projeto/ entrevistas EmagValid.docx",
    "projeto/Plano_de_Projeto.md": "docs/contexto_projeto/Plano de Projeto v1.docx",
    "projeto/Artefatos_e_Cronograma.md": "docs/contexto_projeto/Projeto_Integrador_Artefatos_e_Cronograma-ok.docx",
    "modelos/TAP.md": "docs/Modelos/Termo_de_Abertura_de_Projeto_Conecta_Jovem.docx",
    "modelos/Plano_de_Projeto.md": "docs/Modelos/Plano_de_Projeto_Conecta_Jovem.docx",
    "modelos/Persona.md": "docs/Modelos/Persona_Conecta_Jovem.docx",
    "modelos/Jornada.md": "docs/Modelos/Jornada_do_Usuario_Conecta_Jovem.docx",
}

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{%s}" % NS["w"]


def texto(p):
    return "".join(t.text or "" for t in p.iter(W + "t"))


def estilo_titulo(p):
    st = p.find("w:pPr/w:pStyle", NS)
    if st is None:
        return 0
    m = re.match(r"(?i)^(heading|t[ií]tulo)\s*(\d)", st.get(W + "val", ""))
    return int(m.group(2)) if m else 0


def converter_corpo(corpo):
    linhas = []
    for el in corpo:
        if el.tag == W + "p":
            t = texto(el).strip()
            if t:
                n = estilo_titulo(el)
                linhas.append(("#" * n + " " if n else "") + t)
        elif el.tag == W + "tbl":
            linhas.append("[tabela]")
            for tr in el.findall("w:tr", NS):
                celulas = [
                    " / ".join(x for x in (texto(p).strip() for p in tc.findall("w:p", NS)) if x)
                    for tc in tr.findall("w:tc", NS)
                ]
                if any(celulas):
                    linhas.append("- " + " | ".join(celulas))
            linhas.append("[fim da tabela]")
    return linhas


def converter(caminho_docx):
    z = zipfile.ZipFile(caminho_docx)
    corpo = ET.fromstring(z.read("word/document.xml")).find("w:body", NS)
    linhas = converter_corpo(corpo)
    extras = []
    for nome in sorted(z.namelist()):
        if re.match(r"word/(header|footer)\d*\.xml$", nome):
            t = " ".join(x for x in (texto(p).strip() for p in ET.fromstring(z.read(nome)).iter(W + "p")) if x)
            if t:
                extras.append(f"- {nome}: {t}")
    if extras:
        linhas += ["", "## Cabeçalhos e rodapés", *extras]
    return linhas


def privado():
    # lida a cada chamada para a variável de ambiente valer também nos testes
    return Path(os.environ.get("ACESSAWEB_PRIVADO", RAIZ.parent / "acessaweb-privado"))


def carregar_tabela(pasta):
    return json.loads((pasta / "nomes.json").read_text(encoding="utf-8"))


def sanitizar(texto_original, substituicoes):
    texto_novo = texto_original
    for de in sorted(substituicoes, key=len, reverse=True):
        texto_novo = texto_novo.replace(de, substituicoes[de])
    return texto_novo


def verificar(raiz, tabela):
    termos = list(tabela["substituicoes"]) + list(tabela["links_proibidos"])
    padroes = [(p, re.compile(p)) for p in tabela.get("padroes_proibidos", [])]
    arquivos = subprocess.run(
        ["git", "-C", str(raiz), "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        check=True, capture_output=True,
    ).stdout.decode().split("\0")
    achados = []
    for nome in filter(None, arquivos):
        for local, linha in linhas_de(raiz / nome, nome):
            achados += [f"{local}: {t}" for t in termos if t in linha]
            achados += [f"{local}: {p}" for p, rx in padroes if rx.search(linha)]
    return achados


def linhas_de(caminho, nome):
    """Devolve (local, texto) para cada linha de um arquivo de texto, ou o texto de
    cada XML de um .docx/.xlsx/.pptx (sem as tags, que partem nomes em pedaços)."""
    if caminho.suffix.lower() in (".docx", ".xlsx", ".pptx"):
        try:
            with zipfile.ZipFile(caminho) as z:
                return [(f"{nome}:{m}", re.sub(r"<[^>]+>", "", z.read(m).decode("utf-8", "replace")))
                        for m in z.namelist() if m.endswith(".xml")]
        except (zipfile.BadZipFile, FileNotFoundError):
            return []
    try:
        linhas = caminho.read_text(encoding="utf-8").splitlines()
    except (UnicodeDecodeError, FileNotFoundError, IsADirectoryError):
        return []  # binário (.png, .jpg) ou apagado do disco
    return [(f"{nome}:{n}", linha) for n, linha in enumerate(linhas, 1)]


def localizar(origem):
    for base in (PROJETO, privado()):
        if (base / origem).is_file():
            return base / origem
    return None


def main(argv):
    pasta_privada = privado()
    if not (pasta_privada / "nomes.json").is_file():
        print(f"Pasta privada sem nomes.json: {pasta_privada}. Copie-a do Drive do grupo "
              "(ver docs/instalacao.md) ou indique outra em ACESSAWEB_PRIVADO.", file=sys.stderr)
        return 2
    tabela = carregar_tabela(pasta_privada)
    if "--verificar" in argv:
        achados = verificar(RAIZ, tabela)
        print("\n".join(achados) or "ok: nenhum nome de entrevistado nem link privado no que é público")
        return 1 if achados else 0

    faltando = [o for o in ORIGENS.values() if localizar(o) is None]
    if faltando:
        print("Não achei estes .docx nem em projeto/ nem na pasta privada:", *faltando, sep="\n  ", file=sys.stderr)
        return 2
    hoje = date.today().strftime("%d/%m/%Y")
    saidas = {}  # converte tudo antes de gravar: um erro no meio não deixa fontes pela metade
    for destino, origem in ORIGENS.items():
        cabecalho = [
            f"<!-- GERADO por _gerar_fontes.py em {hoje} a partir de {origem}. NÃO EDITAR. -->",
            f"# Fonte literal: {Path(origem).name}",
            f"Origem: `{origem}` · Conversão automática, sem resumo. Linhas `- a | b` são linhas de tabela; células vazias aparecem como vazio.",
            "",
        ]
        texto_md = "\n".join(cabecalho + converter(localizar(origem))) + "\n"
        if destino in SO_NO_PRIVADO:
            saidas[pasta_privada / "fontes" / destino] = texto_md
        else:
            saidas[FONTES / destino] = sanitizar(texto_md, tabela["substituicoes"])
    for saida, texto_md in saidas.items():
        saida.parent.mkdir(parents=True, exist_ok=True)
        saida.write_text(texto_md, encoding="utf-8")
        print("ok", saida.relative_to(saida.parents[2]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

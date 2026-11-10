"""Autoteste do _gerar_fontes.py. Usa só nomes fictícios: este arquivo é público.

Uso (a partir da raiz do repositório):
    python3 -I projeto/contexto_agente/fontes/test_gerar_fontes.py -v
"""
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import _gerar_fontes as g  # noqa: E402

# o domínio é montado em partes para o próprio --verificar não acusar este arquivo
LINK = "drive." + "google.com"
TABELA = {
    "substituicoes": {"Fulano de Tal": "Fulano"},
    "links_proibidos": [LINK],
}


def repo_git(arquivos):
    """Cria um repositório git temporário com os arquivos dados (nome -> bytes)."""
    pasta = Path(tempfile.mkdtemp())
    subprocess.run(["git", "init", "-q", str(pasta)], check=True)
    for nome, conteudo in arquivos.items():
        (pasta / nome).write_bytes(conteudo)
    return pasta


class TestSanitizar(unittest.TestCase):
    def test_sanitizar_troca_mais_longa_primeiro(self):
        t = {"Fulano Beltrano de Tal": "Fulano Beltrano", "de Tal": ""}
        self.assertEqual(
            g.sanitizar("Facilitador: Fulano Beltrano de Tal.", t),
            "Facilitador: Fulano Beltrano.",
        )

    def test_sanitizar_nao_troca_nome_solto(self):
        t = {"Ciclano dos Santos": "Ciclano", "Ctx2, Ciclano,": "Ctx2,"}
        self.assertEqual(
            g.sanitizar("Mentor Ciclano dos Santos; Ctx2, Ciclano, 25 anos", t),
            "Mentor Ciclano; Ctx2, 25 anos",
        )

    def test_sanitizar_preserva_celulas_vazias(self):
        self.assertEqual(g.sanitizar("- a |  | b", {"x": "y"}), "- a |  | b")


class TestVerificar(unittest.TestCase):
    def test_verificar_acha_nome_e_link(self):
        repo = repo_git({"a.md": f"Fulano de Tal\nver https://{LINK}/x\n".encode()})
        self.assertEqual(len(g.verificar(repo, TABELA)), 2)

    def test_verificar_acha_padrao_fora_da_tabela(self):
        tabela = {**TABELA, "padroes_proibidos": [r"\bBeltrana\b"]}
        repo = repo_git({"c.md": "perfil de Beltrana (A1)\nBeltranagem\n".encode()})
        self.assertEqual(g.verificar(repo, tabela), ["c.md:1: \\bBeltrana\\b"])

    def test_verificar_ignora_binario(self):
        repo = repo_git({"b.png": bytes(range(256))})
        self.assertEqual(g.verificar(repo, TABELA), [])


class TestMain(unittest.TestCase):
    def test_main_sem_privado_sai_com_erro(self):
        antes = sorted(g.FONTES.rglob("*.md"))
        mtimes = [p.stat().st_mtime for p in antes]
        os.environ["ACESSAWEB_PRIVADO"] = str(Path(tempfile.mkdtemp()) / "nao-existe")
        try:
            self.assertEqual(g.main([]), 2)
        finally:
            del os.environ["ACESSAWEB_PRIVADO"]
        self.assertEqual(sorted(g.FONTES.rglob("*.md")), antes)
        self.assertEqual([p.stat().st_mtime for p in antes], mtimes)


if __name__ == "__main__":
    unittest.main()

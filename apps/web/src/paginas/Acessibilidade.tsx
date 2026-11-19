// Página de acessibilidade (eMAG 3.1, seção 4.5): os recursos do site e como usá-los
export function Acessibilidade() {
  return (
    <div className="tela estreito">
      <title>Acessibilidade · AcessaWeb</title>
      <h1>Acessibilidade</h1>
      <section className="cabeca">
        <h2>Diretrizes que seguimos</h2>
        <p>
          O AcessaWeb segue o eMAG 3.1, o Modelo de Acessibilidade em Governo Eletrônico, e as
          diretrizes WCAG. A barra no topo de cada tela traz os recursos abaixo.
        </p>
      </section>
      <section className="cabeca">
        <h2>Atalhos de teclado</h2>
        <ul>
          <li>1: ir para o conteúdo</li>
          <li>2: ir para o menu</li>
          <li>4: ir para o rodapé</li>
        </ul>
        <p>
          No Windows e no Linux, use Alt + número (Alt + Shift + número também funciona), fora dos
          campos de texto. No Mac, use Ctrl + Option + número.
        </p>
      </section>
      <section className="cabeca">
        <h2>Alto contraste e modo escuro</h2>
        <p>
          O botão "Alto contraste" deixa o fundo preto, o texto branco e os links em amarelo, sempre
          sublinhados. O botão "Modo escuro" troca o fundo claro por um escuro. A sua escolha fica
          guardada neste navegador.
        </p>
      </section>
      <section className="cabeca">
        <h2>Tamanho do texto</h2>
        <p>
          Use o zoom do navegador: Ctrl e + para aumentar, Ctrl e − para diminuir e Ctrl e 0 para
          voltar ao normal (no Mac, Command no lugar de Ctrl). As telas continuam funcionando com
          até 200% de zoom.
        </p>
      </section>
      <section className="cabeca">
        <h2>Como testamos</h2>
        <p>
          Cada tela passa por uma verificação automática de acessibilidade (axe), e o uso só com o
          teclado é testado nos fluxos principais. A conferência com leitor de tela (NVDA e Orca)
          faz parte da entrega final.
        </p>
      </section>
    </div>
  )
}

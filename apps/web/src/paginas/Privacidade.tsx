// Privacidade (RNF05, LGPD): que dados guardamos e o que vai para a IA
export function Privacidade() {
  return (
    <div className="tela estreito">
      <title>Privacidade · AcessaWeb</title>
      <h1>Privacidade</h1>
      <section className="cabeca">
        <h2>O que guardamos</h2>
        <p>
          Seu nome, seu e-mail e a sua senha. A senha fica guardada de forma protegida: só um código
          calculado a partir dela, nunca a senha em si. Também guardamos os endereços das páginas
          que você avalia e os resultados de cada avaliação.
        </p>
      </section>
      <section className="cabeca">
        <h2>O que vai para a IA</h2>
        <p>
          Para sugerir correções, enviamos ao Google Gemini só o trecho da página pública que tem a
          falha. Nenhum dado seu (nome, e-mail ou senha) é enviado.
        </p>
      </section>
      <section className="cabeca">
        <h2>Cookie</h2>
        <p>
          Usamos um único cookie, para manter você dentro da sua conta. Ele não serve para
          propaganda nem para acompanhar você em outros sites.
        </p>
      </section>
    </div>
  )
}

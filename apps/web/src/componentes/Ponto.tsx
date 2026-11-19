// O "·" na tela; o leitor de tela ouve uma vírgula (o ponto médio seria lido como "ponto médio").
// O espaço do fim fica fora dos spans: dentro deles, o cálculo do nome acessível o corta ("3.6,Recomendação").
export function Ponto() {
  return (
    <>
      <span aria-hidden="true"> ·</span>
      <span className="so-leitor">,</span>{' '}
    </>
  )
}

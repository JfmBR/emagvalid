// O "·" na tela; o leitor de tela ouve uma vírgula (o ponto médio seria lido como "ponto médio").
// O espaço do fim fica fora dos spans: dentro deles, o cálculo do nome acessível o corta ("3.6,Recomendação").
// No Chrome o nome sai "3.6 , Recomendação" (espaço antes da vírgula), e a fala é a mesma pausa.
// user-select: a vírgula escondida não entra quando a pessoa copia o texto.
export function Ponto() {
  return (
    <>
      <span aria-hidden="true"> ·</span>
      <span className="so-leitor" style={{ userSelect: 'none' }}>
        ,
      </span>{' '}
    </>
  )
}

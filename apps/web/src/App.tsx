import { Route, Routes } from 'react-router'
import { Layout } from './componentes/Layout.tsx'
import { Cadastro } from './paginas/Cadastro.tsx'
import { Entrar } from './paginas/Entrar.tsx'
import { Inicial } from './paginas/Inicial.tsx'
import { NaoEncontrada } from './paginas/NaoEncontrada.tsx'
import { Privacidade } from './paginas/Privacidade.tsx'
import { ProvedorSessao } from './sessao.tsx'

// Cada passo do docs/passo-a-passo-mvp.md acrescenta aqui a rota da sua tela
export default function App() {
  return (
    <ProvedorSessao>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicial />} />
          <Route path="cadastro" element={<Cadastro />} />
          <Route path="entrar" element={<Entrar />} />
          <Route path="privacidade" element={<Privacidade />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
      </Routes>
    </ProvedorSessao>
  )
}

import { Route, Routes } from 'react-router'
import { Layout } from './componentes/Layout.tsx'
import { Inicial } from './paginas/Inicial.tsx'
import { NaoEncontrada } from './paginas/NaoEncontrada.tsx'

// Cada passo do docs/passo-a-passo-mvp.md acrescenta aqui a rota da sua tela
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicial />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}

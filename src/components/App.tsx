import Footer from './Footer';
import Chat from './Chat';
import Upload from './Upload';
import { useContext } from 'react';
import { GlobalContext } from '../context/Global';

export default function App() {
  const { globalState } = useContext(GlobalContext)

  return (
    <>
      <main>
        {globalState.mode === 'upload' && <Upload />}
        {globalState.mode === 'chat' && <Chat />}
      </main>
      <Footer />
    </>
  );
}

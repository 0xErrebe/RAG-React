import '../styles/Upload.css'
import SvgContainer from './SvgContainer';
import Loading from '../assets/loading.svg'
import WebWorker from '../workers/WebWorker'
import fileReaderWorker from '../workers/fileReader.worker?url'
import { useContext, useEffect, useRef, useState } from 'react'
import { GlobalContext } from '../context/Global'
import { MemoryVector, MemoryVectorStore } from 'langchain/vectorstores/memory';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';

export default function Upload() {
  const { setGlobalState } = useContext(GlobalContext)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setError('')

    if (!e?.target?.files || e?.target?.files.length < 1) return

    const file = e?.target?.files[0]
 
    if (!file) {
      setError('No se pudo cargar el archivo')
      return
    }

    if (!file.type.includes('pdf') && !file.type.includes('plain')) {
      setError('Solo se admiten archivos de tipo .pdf o .txt')
      return
    }

    setFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setError('')
    const files = e.dataTransfer.files

    if (files.length < 0 && files.length > 1) return

    const file = files[0]

    if (!file) {
      setError('No se pudo cargar el archivo')
      return
    }

    if (!file.type.includes('pdf') && !file.type.includes('plain')) {
      setError('Solo se admiten archivos de tipo .pdf o .txt')
      return
    }
    
    setFile(file)
  }

  useEffect(() => {
    if (!file) return
    
    setLoading(true)

    const worker = new WebWorker(fileReaderWorker) as Worker
    worker.postMessage({ file })
    worker.onmessage = (event) => {
      if (!event.data.vectors) return

      const { vectors }: { vectors: MemoryVector[] } = event.data
      
      const embeddings = new HuggingFaceTransformersEmbeddings()

      const vectorStore = new MemoryVectorStore(embeddings)
      vectorStore.memoryVectors = vectors

      const retriever = vectorStore.asRetriever()

      setLoading(false)
      setGlobalState((prev) => ({...prev, retriever: retriever, mode: 'chat'}))
    }

    return () => {
      worker.terminate()
    }
  }, [file, setGlobalState])

  return (
    <section className='dropzone' onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
      {
        loading
          ? (
            <>
              <h2 className='info'>Leyendo archivo <span>{file?.name}</span></h2>
              <SvgContainer width={50} height={50}>
                <Loading />
              </SvgContainer>
            </>
          )
          : (
            <>
              <h1>Arrastra tu archivo o haz click para subirlo</h1>
              <button onClick={() => fileInput.current?.click()}>Upload</button>
              <input type="file" name="fileInput" ref={fileInput} id="fileInput" onChange={handleInput} accept='application/pdf, text/plain,' multiple/>
            </>
          )
      }
      {error && <p className='error'>{error}</p>}
    </section>
  )
}
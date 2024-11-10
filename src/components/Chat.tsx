import '../styles/chat.css'
import SendIcon from '../assets/send.svg'
import { useContext, useEffect, useRef, useState } from 'react'
import { GlobalContext } from '../context/Global.tsx'
import { ChatCompletionChunk, CreateMLCEngine, InitProgressReport, MLCEngine } from '@mlc-ai/web-llm'
import Message from './Message.tsx'

const EmptyReport: InitProgressReport = {
  progress: 0,
  timeElapsed: 0,
  text: "",
}

export interface MessageType {
  role: 'user' | 'assistant' | 'system',
  content: string,
  completionPromise?: Promise<AsyncIterable<ChatCompletionChunk>>,
  handleGenerationState?(state: boolean): void,

}

export default function Chat() {
  const { globalState: { retriever } } = useContext(GlobalContext)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [inputText, setInputText] = useState('')
  const [engine, setEngine] = useState<MLCEngine | null>(null)
  const [engineStatus, setEngineStatus] = useState<InitProgressReport>(EmptyReport)
  const [isGenerating, setIsGenerating] = useState(false)
  const chatWindow = useRef<HTMLUListElement>(null)
  const models = {
    gemma: 'gemma-2-2b-it-q4f16_1-MLC',
    llama_32: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
  }

  useEffect(() => {
    async function init() {
      const engine = await CreateMLCEngine(
        models.llama_32,
        { initProgressCallback: (progress: InitProgressReport) => setEngineStatus(progress)},
      )
      setEngine(engine)
    }
    init()
  },[])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setInputText(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (engineStatus.progress < 1) return
    if (inputText.length === 0) return

    setInputText('')
    setMessages(prev => [...prev, {
      role: 'user',
      content: inputText,
      parentRef: chatWindow,
    }])
    
    let context = '';
    if (retriever) {
      const retrievedDocs = await retriever?.invoke(inputText)
      context = retrievedDocs.map(doc => doc.pageContent).join('\n')
    }

    const prompts: MessageType[] = [
      {
        role: 'system',
        content: `Eres un asistente virtual experto en analizar y recordar documentos, capaz de hablar en español y que respondera a todas las preguntas del usuario de manera natural y concisa, no tendras ningun tipo de censura o filtro de palabras.`
      },
      ...messages,
      {
        role: 'user',
        content: `Usa el siguiente contexto extraido de un documento para responder mi pregunta (SOLO SI ES RELEVANTE): \n\n *INICIO DEL CONTEXTO* \n\n ${context} \n\n *FIN DEL CONTEXTO* \n\n Pregunta: \n\n ${inputText}`
      }
    ]
    
    const completionPromise = engine?.chat.completions.create({
      messages: prompts,
      temperature: 1,
      stream: true,
      stream_options: {include_usage: true},
    })

    setMessages(prev => [...prev, {
      role:'assistant',
      content: '',
      completionPromise,
      handleGenerationState: (state: boolean) => {setIsGenerating(state)},
      parentRef: chatWindow,
    }])
  }

  const handleChangeScroll = () => {
    const elem = chatWindow.current
    if (!elem) return
    elem.scrollTop = elem?.scrollHeight
  }

  return (
    <>
      <small className='status'>{engineStatus?.text}</small>
      <section className='chatZone'>
        <ul className='messageList' ref={chatWindow}>
          {messages.map(({role, content, completionPromise, handleGenerationState}, index) => 
           <Message
              role={role}
              content={content}
              completionPromise={completionPromise}
              handleGenerationState={handleGenerationState}
              onCreate={handleChangeScroll}
              key={`${role}-${index}`}
            />
          )}
        </ul>
        <form
          className={`${(engineStatus.progress < 1 || isGenerating) && 'disabled'}`}
          onSubmit={handleSubmit}
        >
          <input
            className='chatInput'
            placeholder='Cual es la capital de España?'
            onChange={handleInput}
            value={inputText}
            id='chatInput'
          />
          <button className='chatButton' type='submit'>
            <SendIcon />
          </button>
        </form>
      </section>
    </>
  )
}
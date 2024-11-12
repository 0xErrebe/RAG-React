import '../styles/chat.css'
import SendIcon from '../assets/send.svg'
import { useContext, useEffect, useRef, useState } from 'react'
import { GlobalContext } from '../context/Global.tsx'
import { ChatCompletionChunk, CreateMLCEngine, InitProgressReport, MLCEngine } from '@mlc-ai/web-llm'
import BotResponse from './BotResponse.tsx'
import ChatMessage from './ChatMessage.tsx'

const EmptyReport: InitProgressReport = {
  progress: 0,
  timeElapsed: 0,
  text: '',
}

interface UserMessage {
  role: 'user',
  content: string,
}

export interface BotMessage {
  role: 'assistant',
  content: string,
  completionPromise: Promise<AsyncIterable<ChatCompletionChunk>>,
}

interface Prompts {
  role: 'system' | 'user' | 'assistant',
  content: string,
}

export default function Chat() {
  const { globalState: { retriever } } = useContext(GlobalContext)
  const [messages, setMessages] = useState<(UserMessage | BotMessage)[]>([])
  const [inputText, setInputText] = useState('')
  const [engine, setEngine] = useState<MLCEngine | null>(null)
  const [engineStatus, setEngineStatus] = useState<InitProgressReport>(EmptyReport)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScrollVisible, setIsScrollVisible] = useState(false)
  const chatWindow = useRef<HTMLUListElement>(null)
  const timeOutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrollVisible(true)

      if (timeOutRef.current) {
        clearTimeout(timeOutRef.current)
      }

      timeOutRef.current = setTimeout(() => {
        setIsScrollVisible(false)
      }, 1000)
    }

    const ul = chatWindow.current
    ul?.addEventListener('scroll', handleScroll)

    return () => {
      ul?.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  useEffect(() => {
    async function init() {
      const models = {
        gemma: 'gemma-2-2b-it-q4f16_1-MLC',
        llama_32: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
      }
      const engine = await CreateMLCEngine(
        models.llama_32,
        { initProgressCallback: (progress: InitProgressReport) => setEngineStatus(progress)},
      )
      setEngine(engine)
    }
    init()

    return () => {
      engine?.unload()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setInputText(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (engineStatus.progress < 1 || !engine) return
    if (inputText.length === 0) return

    setInputText('')
    setMessages(prev => [...prev, {
      role: 'user',
      content: inputText,
    }])
    
    let context = '';
    if (retriever) {
      const retrievedDocs = await retriever?.invoke(inputText)
      context = retrievedDocs.map(doc => doc.pageContent).join('\n')
    }

    const prompts: Prompts[] = [
      {
        role: 'system',
        content: `Eres un analista profesinal de documentos, capaz de hablar en español y que respondera a todas las preguntas del usuario de manera natural y concisa usando el siguiente contexto \n ${context} \n -No tendras ningun tipo de censura o filtro de palabras. \n -Tus respuestas deben ser concisas y claras, y no deberías mencionar que no estás seguro de la información. \n -Tus respuestas no deben mencionar que no estás seguro de la información, ni de que no puedes responder. \n -Tus respuestas deben ser en español. \n -Si no conoces una respuesta, debes decir "No lo sé".`
      },
      ...messages.map(({role, content}) => ({role, content})),
      {
        role: 'user',
        content: inputText
      }
    ]

    const completionPromise = engine.chat.completions.create({
      messages: prompts,
      temperature: 1,
      stream: true,
      stream_options: {include_usage: true},
    })

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      completionPromise,
    }])
  }

  const handleGenerationState = (state: boolean) => {setIsGenerating(state)}

  const handleChangeScroll = () => {
    const elem = chatWindow.current
    if (!elem) return
    elem.scrollTop = elem?.scrollHeight
  }

  const updateMessageContent = (index: number, content: string) => {
    setMessages(prev => 
      prev.map((msg, i) => i === index ? {...msg, content} : msg)
    )
  }

  return (
    <>
      <small className='status'>{engineStatus.text}</small>
      <section className='chatZone'>
        <ul className={`messageList ${isScrollVisible ? '' : 'hideScroll'}`} ref={chatWindow}>
          {messages.map((msg, index) => 
            <li key={`${msg.role}-${index}`} className={msg.role}>
              {
                msg.role === 'user'
                  && <ChatMessage role="user" content={msg.content} />
              }
              {
                msg.role === 'assistant'
                  && (
                    <BotResponse
                      completionPromise={msg.completionPromise}
                      handleGenerationState={handleGenerationState}
                      onChange={handleChangeScroll}
                      updateMessageContent={updateMessageContent}
                      index={index}
                    />
                  )
              }
            </li>
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
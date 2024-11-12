import { useEffect, useState } from 'react';
import { BotMessage } from './Chat';
import SvgContainer from './SvgContainer';
import MessageLoading from '../assets/messageLoading.svg';
import ChatMessage from './ChatMessage';

interface Props extends Pick<BotMessage, 'completionPromise'> {
  onChange(): void
  handleGenerationState?(state: boolean): void,
  updateMessageContent(index: number, content: string): void,
  index: number,
}

export default function BotResponse({completionPromise, handleGenerationState, onChange, updateMessageContent, index}: Props) {
  const [messageContent, setMessageContent] = useState('')
  
  useEffect(() => {
    async function resolveCompletion() {
      if (!completionPromise || !handleGenerationState) return;
      console.log('Generando');
      handleGenerationState(true)
      for await (const chunk of await completionPromise) {
        const text = chunk.choices[0]?.delta?.content
        if (!text) {
          continue
        }
        onChange()
        setMessageContent(prev => prev + text)
      }
      handleGenerationState(false)
      console.log('Generacion finalizada');
    }
    resolveCompletion()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    updateMessageContent(index, messageContent)
  }, [messageContent, index]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {
        messageContent.length < 1
          ? (
            <SvgContainer width={50} height={25}>
              <MessageLoading />
            </SvgContainer>
          )
          : <ChatMessage role='assistant' content={messageContent} />
      }
    </>
  )
}
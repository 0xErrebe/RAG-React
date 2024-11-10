import MessageLoading from "../assets/messageLoading.svg";
import { MessageType } from "./Chat";
import { useEffect, useState } from "react";
import SvgContainer from "./SvgContainer";


interface Props extends MessageType {
  onCreate(): void
}

function MessageContent ({ role, content }: Pick<Props, 'role' | 'content'>) {
  return (
    <li className={`${role}`}>
      <span>
        {role === 'user' ? 'You' : 'Assistant'}
      </span>
      <p>{content}</p>
    </li>
  )
}

export default function Message({role, content, completionPromise, handleGenerationState, onCreate}: Props) {
  const [messageContent, setMessageContent] = useState(content)
  
  if (role === 'user') {
    onCreate()
    return <MessageContent role={role} content={content} />
  }

  useEffect(() => {
    async function resolveCompletion() {
      if (!completionPromise || !handleGenerationState) return;
      handleGenerationState(true)
      for await (const chunk of await completionPromise) {
        const text = chunk.choices[0]?.delta?.content
        if (!text) {
          continue
        }
        onCreate()
        setMessageContent(prev => prev + text)
      }
      handleGenerationState(false)
    }
    resolveCompletion()
  }, [])

  return (
    <>
    {
      messageContent.length < 1
        ? (
          <SvgContainer width={50} height={25}>
            <MessageLoading />
          </SvgContainer>
        )
        : <MessageContent role={role} content={messageContent} />
    }
    </>
  )
}
interface Props {
  role: 'user' | 'assistant',
  content: string,
}

export default function ChatMessage({role, content}: Props) {
  return (
    <>
      <span>{role}</span>
      <p>{content}</p>
    </>
  )
}
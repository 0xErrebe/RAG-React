interface Props {
  children: React.ReactNode,
  width: number,
  height: number,
}

export default function SvgContainer({children, width, height}: Props) {
  return (
    <div className='svgContainer' style={{width, height}}>
      {children}
    </div>
  )
}
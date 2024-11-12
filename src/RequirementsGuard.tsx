import './styles/RequirementsGuard.css'

function Modal() {
  return (
    <div className="modal">
      <h2>Your browser does not support WebGPU</h2>
      <p>Sorry your browser does not support <span>WebGPU</span> or <span>the hardware acceleration</span> is disabled.</p>
    </div>
  )
}

interface GPU extends Navigator {
  gpu?: unknown
}

interface Props {
  children: React.ReactNode
}

export default function RequirementsGuard({children}: Props) {
  if (!(navigator as GPU).gpu) {
    return <Modal />
  }

  return <>{children}</>
}
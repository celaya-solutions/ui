export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Escapes the desk shell's padding and header without leaving the root
  // layout, so fonts and tokens still apply.
  return <div className="fixed inset-0 z-50 overflow-auto">{children}</div>
}

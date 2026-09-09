import { useState, useEffect } from 'react'

// Captura o evento beforeinstallprompt (Chrome/Edge) pra oferecer um botão de
// "instalar" próprio, em vez de depender só do ícone que o navegador mostra
// sozinho na barra de endereço — o evento só dispara quando o navegador já
// confirmou que o app atende aos critérios de instalabilidade (manifest + SW).
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredEvent(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptInstall = async () => {
    if (!deferredEvent) return
    deferredEvent.prompt()
    await deferredEvent.userChoice
    // O navegador só permite usar o prompt uma vez por evento capturado.
    setDeferredEvent(null)
  }

  return { canInstall: Boolean(deferredEvent), promptInstall }
}

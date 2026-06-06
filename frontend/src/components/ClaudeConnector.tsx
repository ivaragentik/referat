"use client"

import { useState } from "react"
import { Plug } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import { toast } from "sonner"

export function ClaudeConnector() {
  const [isInstalling, setIsInstalling] = useState(false)

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      await invoke("install_claude_connector")
    } catch (error) {
      toast.error("Kunne ikke åpne koblingen. Er Claude Desktop installert?")
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDownloadClaude = async () => {
    try {
      await invoke("open_external_url", { url: "https://claude.ai/download" })
    } catch {
      // Silently ignore — user can open the URL manually
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <Plug className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Koble til Claude</h3>
          <p className="text-sm text-gray-600 mb-4">
            Spør møtene dine i Claude: &lsquo;Hva ble vi enige om i forrige møte?&rsquo; Referat-koblingen
            gir Claude lesetilgang til møtene dine. Krever Claude Desktop-appen.
            Merk: når du spør Claude om møtene dine, sendes innholdet til Claude (Anthropic) —
            akkurat som i alle skybaserte verktøy. Forskjellen her: det skjer kun når du
            selv velger det.
          </p>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {isInstalling ? "Installerer…" : "Installer Claude-kobling"}
          </button>
          <button
            onClick={handleDownloadClaude}
            className="mt-3 block text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Har du ikke Claude? Last ned Claude Desktop
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import Image from 'next/image';
import { Button } from './ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type UpdateState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'up-to-date' }
  | { kind: 'available'; version: string }
  | { kind: 'downloading'; percentage: number }
  | { kind: 'installing' }
  | { kind: 'error'; message: string };

export function About() {
    const [currentVersion, setCurrentVersion] = useState<string>('0.4.0');
    const [updateState, setUpdateState] = useState<UpdateState>({ kind: 'idle' });

    useEffect(() => {
        getVersion().then(setCurrentVersion).catch(console.error);
    }, []);

    const handleCheckForUpdates = async () => {
        setUpdateState({ kind: 'checking' });
        try {
            const update = await check();
            if (update) {
                setUpdateState({ kind: 'available', version: update.version });
            } else {
                setUpdateState({ kind: 'up-to-date' });
                // Auto-clear the "up to date" notice after 4 seconds
                setTimeout(() => {
                    setUpdateState((prev) =>
                        prev.kind === 'up-to-date' ? { kind: 'idle' } : prev
                    );
                }, 4000);
            }
        } catch (err: any) {
            console.error('[About] Kunne ikke sjekke etter oppdateringer:', err);
            setUpdateState({ kind: 'error', message: err?.message ?? 'Ukjent feil' });
        }
    };

    const handleInstallUpdate = async (version: string) => {
        setUpdateState({ kind: 'downloading', percentage: 0 });
        try {
            const update = await check();
            if (!update) {
                setUpdateState({ kind: 'error', message: 'Oppdatering ikke lenger tilgjengelig' });
                return;
            }

            let downloaded = 0;
            let contentLength = 0;

            await update.downloadAndInstall((event) => {
                switch (event.event) {
                    case 'Started':
                        contentLength = event.data.contentLength ?? 0;
                        setUpdateState({ kind: 'downloading', percentage: 0 });
                        break;
                    case 'Progress':
                        downloaded += event.data.chunkLength ?? 0;
                        setUpdateState({
                            kind: 'downloading',
                            percentage: contentLength > 0
                                ? Math.round((downloaded / contentLength) * 100)
                                : 0,
                        });
                        break;
                    case 'Finished':
                        setUpdateState({ kind: 'installing' });
                        break;
                }
            });

            toast.success('Oppdatering installert. Appen starter på nytt…');
            await relaunch();
        } catch (err: any) {
            console.error('[About] Oppdatering mislyktes:', err);
            setUpdateState({ kind: 'error', message: err?.message ?? 'Ukjent feil' });
            toast.error('Oppdatering mislyktes: ' + (err?.message ?? 'Ukjent feil'));
        }
    };

    const handleAgentikClick = () => {
        invoke('open_external_url', { url: 'https://agentik.no' }).catch(console.error);
    };

    // ── Update button / status area ──────────────────────────────────────────
    const renderUpdateArea = () => {
        switch (updateState.kind) {
            case 'idle':
                return (
                    <Button
                        onClick={handleCheckForUpdates}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                    >
                        Se etter oppdateringer
                    </Button>
                );

            case 'checking':
                return (
                    <Button variant="outline" size="sm" className="text-xs" disabled>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Sjekker…
                    </Button>
                );

            case 'up-to-date':
                return (
                    <span className="text-xs text-green-600 font-medium">
                        Du har nyeste versjon
                    </span>
                );

            case 'available':
                return (
                    <Button
                        onClick={() => handleInstallUpdate(updateState.version)}
                        size="sm"
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Oppdater til v{updateState.version}
                    </Button>
                );

            case 'downloading':
                return (
                    <div className="flex flex-col items-center gap-1">
                        <Button variant="outline" size="sm" className="text-xs" disabled>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Laster ned oppdatering… {updateState.percentage}%
                        </Button>
                        <div className="w-48 bg-gray-200 rounded-full h-1.5">
                            <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(updateState.percentage, 100)}%` }}
                            />
                        </div>
                    </div>
                );

            case 'installing':
                return (
                    <Button variant="outline" size="sm" className="text-xs" disabled>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Installerer – appen starter på nytt
                    </Button>
                );

            case 'error':
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-red-600">
                            Kunne ikke se etter oppdateringer
                        </span>
                        <Button
                            onClick={handleCheckForUpdates}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                        >
                            Prøv igjen
                        </Button>
                    </div>
                );
        }
    };

    return (
        <div className="p-4 space-y-4 h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center">
                <div className="mb-3">
                    <Image
                        src="icon_128x128.png"
                        alt="Referat Logo"
                        width={64}
                        height={64}
                        className="mx-auto"
                    />
                </div>
                <span className="text-sm text-gray-500"> v{currentVersion}</span>
                <p className="text-medium text-gray-600 mt-1">
                    Møtenotater på norsk — helt lokalt på din Mac.
                </p>
                <div className="mt-3 flex flex-col items-center gap-2">
                    {renderUpdateArea()}
                </div>
            </div>

            {/* Feature points */}
            <div className="space-y-3">
                <h2 className="text-base font-semibold text-gray-800">Hva gjør Referat spesielt?</h2>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Norsk transkripsjon i verdensklasse</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">Bruker NB-Whisper fra Nasjonalbiblioteket — trent på norsk tale og optimalisert for bokmål og nynorsk.</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Ingen bot i møtene</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">All lyd fanges opp lokalt på maskinen — ingen ekstern bot eller tjeneste som kobler seg til møtet ditt.</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Alt lokalt som standard</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">Transkripsjon skjer alltid lokalt. Sammendrag kjøres lokalt med mindre du selv velger OpenAI/Claude med egen nøkkel.</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Gratis og åpen kildekode</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">Fri programvare under MIT-lisens. Se koden, bidra, eller tilpass etter egne behov.</p>
                    </div>
                </div>
            </div>

            {/* Agentik CTA */}
            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: '#20252D' }}>
                <p className="text-sm font-semibold text-white">Referat er laget av Agentik</p>
                <p className="text-xs text-gray-300 mt-1 mb-3">
                    Vi er et norsk AI-byrå. Lurer du på hvordan AI kan hjelpe bedriften din?
                    Ta en uforpliktende prat med oss.
                </p>
                <Button
                    onClick={handleAgentikClick}
                    size="sm"
                    className="bg-white text-gray-900 hover:bg-gray-100 text-xs font-medium"
                >
                    Snakk med Agentik
                    <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
            </div>

            {/* Credits */}
            <div className="pt-2 border-t border-gray-200 text-center space-y-1">
                <p className="text-sm font-medium text-gray-600">
                    Laget av Agentik · NB-Whisper fra Nasjonalbiblioteket
                </p>
                <p className="text-xs text-gray-400">
                    Alt skjer lokalt på din Mac. Kobler du til Claude eller bruker egen
                    API-nøkkel, sendes møteinnhold til leverandøren når du bruker de funksjonene
                    — slik all skybasert møteprogramvare fungerer hele tiden. Forskjellen i
                    Referat: det skjer kun når du selv velger det.
                </p>
            </div>

        </div>
    );
}

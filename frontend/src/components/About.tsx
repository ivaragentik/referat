import React, { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import Image from 'next/image';
import { Button } from './ui/button';
import { ExternalLink } from 'lucide-react';


export function About() {
    const [currentVersion, setCurrentVersion] = useState<string>('0.4.0');

    useEffect(() => {
        // Get current version on mount
        getVersion().then(setCurrentVersion).catch(console.error);
    }, []);

    const handleViewLatestRelease = () => {
        invoke('open_external_url', { url: 'https://github.com/ivaragentik/referat/releases/latest' })
            .catch(console.error);
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
                <div className="mt-3">
                    <Button
                        onClick={handleViewLatestRelease}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                    >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Se nyeste versjon
                    </Button>
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

import React, { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import Image from 'next/image';
import AnalyticsConsentSwitch from "./AnalyticsConsentSwitch";
import { UpdateDialog } from "./UpdateDialog";
import { updateService, UpdateInfo } from '@/services/updateService';
import { Button } from './ui/button';
import { Loader2, CheckCircle2, Github } from 'lucide-react';
import { toast } from 'sonner';


export function About() {
    const [currentVersion, setCurrentVersion] = useState<string>('0.4.0');
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);

    useEffect(() => {
        // Get current version on mount
        getVersion().then(setCurrentVersion).catch(console.error);
    }, []);

    const handleGitHubClick = async () => {
        try {
            await invoke('open_external_url', { url: 'https://github.com/keenhound/referat' });
        } catch (error) {
            console.error('Failed to open link:', error);
        }
    };

    const handleCheckForUpdates = async () => {
        setIsChecking(true);
        try {
            const info = await updateService.checkForUpdates(true);
            setUpdateInfo(info);
            if (info.available) {
                setShowUpdateDialog(true);
            } else {
                toast.success('Du har nyeste versjon');
            }
        } catch (error: any) {
            console.error('Failed to check for updates:', error);
            toast.error('Kunne ikke se etter oppdateringer: ' + (error.message || 'Ukjent feil'));
        } finally {
            setIsChecking(false);
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
                <div className="mt-3">
                    <Button
                        onClick={handleCheckForUpdates}
                        disabled={isChecking}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                    >
                        {isChecking ? (
                            <>
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                Sjekker…
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-3 w-3 mr-2" />
                                Se etter oppdateringer
                            </>
                        )}
                    </Button>
                    {updateInfo?.available && (
                        <div className="mt-2 text-xs text-blue-600">
                            Oppdatering tilgjengelig: v{updateInfo.version}
                        </div>
                    )}
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
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Alt lokalt — ingenting forlater maskinen</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">Transkripsjon og sammendrag kjøres på din egen Mac. Ingen sky, ingen datalekkasje.</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Gratis og åpen kildekode</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">Fri programvare under MIT-lisens. Se koden, bidra, eller tilpass etter egne behov.</p>
                    </div>
                </div>
            </div>

            {/* Credits */}
            <div className="pt-2 border-t border-gray-200 text-center space-y-2">
                <p className="text-xs text-gray-400">
                    Bygget på Meetily (MIT) · NB-Whisper fra Nasjonalbiblioteket · Laget av Agentik
                </p>
                <button
                    onClick={handleGitHubClick}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                    <Github className="h-4 w-4" />
                    Se koden på GitHub
                </button>
            </div>

            <AnalyticsConsentSwitch />

            {/* Update Dialog */}
            <UpdateDialog
                open={showUpdateDialog}
                onOpenChange={setShowUpdateDialog}
                updateInfo={updateInfo}
            />
        </div>
    );
}

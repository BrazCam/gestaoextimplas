import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    Html5Qrcode: any;
  }
}

interface RealQRScannerProps {
  onScanSuccess: (code: string) => void;
}

export const RealQRScanner = ({ onScanSuccess }: RealQRScannerProps) => {
  const scannerRef = useRef<any>(null);
  const elementId = "reader-container";
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const scriptId = "html5-qrcode-script";
    let isMounted = true;

    const startScanner = async () => {
      if (window.Html5Qrcode && isMounted) {
        try {
          if (scannerRef.current) {
            try {
              if (scannerRef.current.isScanning) {
                await scannerRef.current.stop();
              }
              scannerRef.current.clear();
            } catch (e) {
              console.warn("Cleanup anterior:", e);
            }
          }

          const html5QrCode = new window.Html5Qrcode(elementId);
          scannerRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };

          try {
            await html5QrCode.start(
              { facingMode: "environment" },
              config,
              (decodedText: string) => {
                html5QrCode.pause();
                if (isMounted) onScanSuccess(decodedText);
              },
              () => {}
            );
            if (isMounted) setCameraError(null);
          } catch (envError) {
            console.warn("Falha ao abrir câmera traseira, tentando modo padrão...", envError);
            try {
              const cameras = await html5QrCode.getCameras();
              if (cameras && cameras.length > 0) {
                const cameraId = cameras[cameras.length - 1].id;
                await html5QrCode.start(
                  cameraId,
                  config,
                  (decodedText: string) => {
                    html5QrCode.pause();
                    if (isMounted) onScanSuccess(decodedText);
                  },
                  () => {}
                );
              } else {
                await html5QrCode.start(
                  { facingMode: "user" },
                  config,
                  (decodedText: string) => {
                    html5QrCode.pause();
                    if (isMounted) onScanSuccess(decodedText);
                  },
                  () => {}
                );
              }
              if (isMounted) setCameraError(null);
            } catch (finalError) {
              console.error("Erro fatal fallback:", finalError);
              if (isMounted) setCameraError("Não foi possível acessar a câmera. Verifique as permissões.");
            }
          }
        } catch (err) {
          console.error("Erro fatal na inicialização:", err);
          if (isMounted) setCameraError("Erro ao inicializar o scanner.");
        }
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      script.onload = () => setTimeout(startScanner, 500);
      document.body.appendChild(script);
    } else {
      setTimeout(startScanner, 300);
    }

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            try { scannerRef.current.clear(); } catch (e) {}
          }).catch((err: any) => {
            console.log("Stop failed during cleanup", err);
          });
        } else {
          try { scannerRef.current.clear(); } catch (e) {}
        }
      }
    };
  }, [onScanSuccess]);

  if (cameraError) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-red-300">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
        <p className="text-red-600 font-bold mb-2">Erro na Câmera</p>
        <p className="text-xs text-gray-500">{String(cameraError)}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-slate-800 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
          <RefreshCw className="w-3 h-3" /> Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center relative">
      <div id={elementId} className="w-full bg-black rounded-lg overflow-hidden min-h-[300px] shadow-inner relative"></div>
      <p className="text-xs text-gray-500 mt-2 absolute bottom-[-25px] flex items-center gap-1">
        <Camera className="w-3 h-3" /> Câmera ativa
      </p>
    </div>
  );
};

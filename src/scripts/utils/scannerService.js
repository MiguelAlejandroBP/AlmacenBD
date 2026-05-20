/**
 * SERVICIO DE ESCANEO DE CÓDIGO DE BARRAS - ALMACENCONTROL
 * Utiliza QuaggaJS para detección de códigos 1D.
 */

// Importar Quagga desde CDN (vía esm.sh para compatibilidad)
import Quagga from "https://esm.sh/quagga";

export const ScannerService = {
    isScanning: false,

    /**
     * Inicia la cámara y el proceso de detección.
     * @param {string} targetSelector - ID del contenedor del video.
     * @param {Function} onDetected - Callback al detectar un código.
     */
    start: (targetSelector, onDetected) => {
        if (ScannerService.isScanning) return;

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector(targetSelector),
                constraints: {
                    facingMode: "environment" // Usar cámara trasera por defecto
                },
            },
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "upc_reader"
                ]
            },
            locate: true
        }, (err) => {
            if (err) {
                console.error("Error al iniciar Quagga:", err);
                alert("No se pudo acceder a la cámara.");
                return;
            }
            Quagga.start();
            ScannerService.isScanning = true;
        });

        Quagga.onDetected((result) => {
            const code = result.codeResult.code;
            if (code) {
                onDetected(code);
                // Detener automáticamente tras detectar con éxito
                ScannerService.stop();
            }
        });
    },

    /**
     * Escanea un código de barras desde un archivo de imagen.
     * @param {File} file - El archivo de imagen.
     * @param {Function} onDetected - Callback al detectar un código.
     */
    decodeImage: (file, onDetected) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            Quagga.decodeSingle({
                src: e.target.result,
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "upc_reader"
                    ]
                },
                locate: true,
                multiple: false
            }, (result) => {
                if (result && result.codeResult) {
                    onDetected(result.codeResult.code);
                } else {
                    alert("No se pudo detectar ningún código de barras en esta imagen.");
                }
            });
        };
        reader.readAsDataURL(file);
    },

    /**
     * Detiene la cámara y libera recursos.
     */
    stop: () => {
        if (!ScannerService.isScanning) return;
        Quagga.stop();
        ScannerService.isScanning = false;
    }
};

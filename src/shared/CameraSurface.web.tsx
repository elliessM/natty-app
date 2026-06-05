import React, { forwardRef, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export type ScanMode = 'plat' | 'etiquette' | 'frigo';
export type BarcodeEvent = { data: string; type: string };

export type CameraSurfaceProps = {
  mode: ScanMode;
  torch: boolean;
  onBarcode?: (e: BarcodeEvent) => void;
};

// Formats décodés selon le mode. ZXing sait lire les codes-barres 1D
// (EAN/UPC/Code128) ET les QR — contrairement à jsQR (QR uniquement)
// utilisé par expo-camera sur web.
const FORMATS: Record<ScanMode, BarcodeFormat[]> = {
  etiquette: [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
  ],
  frigo: [BarcodeFormat.QR_CODE],
  plat: [], // pas de décodage : preview seule (le mode Plat utilise le shutter)
};

/**
 * Surface caméra — version web (PWA).
 * expo-camera sur web ne décode que les QR via jsQR : les codes-barres 1D des
 * produits (EAN/UPC) ne sont jamais détectés. On utilise donc ZXing, qui lit
 * ces formats depuis le flux caméra.
 */
const CameraSurface = forwardRef<unknown, CameraSurfaceProps>(function CameraSurface(
  { mode, torch, onBarcode },
  _ref
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  // Garde la dernière callback sans relancer la caméra à chaque rendu.
  const onBarcodeRef = useRef(onBarcode);
  onBarcodeRef.current = onBarcode;

  // (Re)démarre le décodage à chaque changement de mode.
  useEffect(() => {
    let cancelled = false;
    const hints = new Map();
    const formats = FORMATS[mode];
    if (formats.length) hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      if (!videoRef.current) return;
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          (result) => {
            if (!result) return;
            onBarcodeRef.current?.({
              data: result.getText(),
              type: BarcodeFormat[result.getBarcodeFormat()] ?? 'unknown',
            });
          }
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch {
        // Permission refusée / pas de caméra : l'overlay parent gère ce cas.
      }
    })();

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {}
      controlsRef.current = null;
    };
  }, [mode]);

  // Lampe torche — best effort (non supporté sur iOS Safari).
  useEffect(() => {
    const c = controlsRef.current;
    if (c?.switchTorch) {
      c.switchTorch(torch).catch(() => {});
    }
  }, [torch]);

  return React.createElement('video', {
    ref: videoRef,
    autoPlay: true,
    muted: true,
    playsInline: true,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      backgroundColor: '#0a0a0a',
    },
  });
});

export default CameraSurface;

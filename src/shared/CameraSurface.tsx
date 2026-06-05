import React, { forwardRef } from 'react';
import { CameraView } from 'expo-camera';

export type ScanMode = 'plat' | 'etiquette' | 'frigo';
export type BarcodeEvent = { data: string; type: string };

export type CameraSurfaceProps = {
  mode: ScanMode;
  torch: boolean;
  /** Appelé à chaque détection de code-barres / QR (modes étiquette & frigo). */
  onBarcode?: (e: BarcodeEvent) => void;
};

/**
 * Surface caméra — version native (iOS / Android).
 * Wrappe expo-camera CameraView : la détection de code-barres native gère
 * EAN/UPC/QR sans problème. Le ref est transféré pour `takePictureAsync` (mode Plat).
 */
const CameraSurface = forwardRef<CameraView, CameraSurfaceProps>(function CameraSurface(
  { mode, torch, onBarcode },
  ref
) {
  return (
    <CameraView
      ref={ref}
      style={{ flex: 1 }}
      facing="back"
      enableTorch={torch}
      barcodeScannerSettings={
        mode === 'etiquette'
          ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }
          : mode === 'frigo'
          ? { barcodeTypes: ['qr'] }
          : undefined
      }
      onBarcodeScanned={mode === 'plat' ? undefined : onBarcode}
    />
  );
});

export default CameraSurface;

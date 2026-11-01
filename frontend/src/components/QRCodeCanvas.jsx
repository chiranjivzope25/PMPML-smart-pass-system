import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCodeCanvas({ value, size = 180, darkColor = '#000000', lightColor = '#ffffff' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: darkColor,
            light: lightColor
          }
        },
        (error) => {
          if (error) console.error("QR Code generation error:", error);
        }
      );
    }
  }, [value, size, darkColor, lightColor]);

  return (
    <div style={{ display: 'inline-flex', padding: '10px', background: lightColor, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <canvas ref={canvasRef} style={{ width: size, height: size, display: 'block' }} />
    </div>
  );
}

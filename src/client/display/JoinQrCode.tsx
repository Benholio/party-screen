import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface JoinQrCodeProps {
  joinUrl: string;
}

export function JoinQrCode({ joinUrl }: JoinQrCodeProps) {
  const [imageUrl, setImageUrl] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(joinUrl, { margin: 1, width: 240 }).then((url) => {
      if (!cancelled) setImageUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  return (
    <aside className="join-panel">
      <h2>Join the canvas</h2>
      {imageUrl && <img alt={`QR code for ${joinUrl}`} src={imageUrl} />}
      <p>{joinUrl.replace(/^https?:\/\//, "")}</p>
    </aside>
  );
}

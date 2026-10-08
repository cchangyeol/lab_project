// HLS(.m3u8) 트레일러를 재생하는 부품 (사파리는 네이티브로, 그 외 브라우저는 hls.js로)
'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsVideo({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    if (!Hls.isSupported()) return;
    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
    return () => hls.destroy();
  }, [src]);

  return <video ref={videoRef} className={className} controls />;
}

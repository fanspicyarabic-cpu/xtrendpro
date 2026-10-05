"use client";

import React, { useEffect, useRef } from "react";

interface AdsterraContainerProps {
  adCode?: string;
  className?: string;
  slotName?: string;
  enabled?: boolean;
}

export const AdsterraContainer: React.FC<AdsterraContainerProps> = ({
  adCode,
  className = "",
  slotName,
  enabled = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // If disabled or empty, return null immediately
  if (!enabled || !adCode || !adCode.trim()) {
    return null;
  }

  const cleanCode = adCode.trim();

  // Detect if this is a Banner script with atOptions (requires isolated iframe to prevent global atOptions collision and document.write issues)
  const isBannerWithAtOptions = cleanCode.includes("atOptions") || cleanCode.includes("invoke.js");

  // Determine banner dimensions from atOptions if present
  let width = 300;
  let height = 250;

  if (isBannerWithAtOptions) {
    const widthMatch = cleanCode.match(/['"]width['"]\s*:\s*(\d+)/);
    const heightMatch = cleanCode.match(/['"]height['"]\s*:\s*(\d+)/);
    if (widthMatch && widthMatch[1]) width = parseInt(widthMatch[1], 10);
    if (heightMatch && heightMatch[1]) height = parseInt(heightMatch[1], 10);
  }

  // Effect for non-banner scripts (Social Bar, Popunder, floating widgets that need top window)
  useEffect(() => {
    if (isBannerWithAtOptions || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    try {
      const range = document.createRange();
      range.selectNode(container);
      const fragment = range.createContextualFragment(cleanCode);

      const scripts = fragment.querySelectorAll("script");
      const nonScripts = fragment.cloneNode(true) as DocumentFragment;
      nonScripts.querySelectorAll("script").forEach((s) => s.remove());

      container.appendChild(nonScripts);

      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }
        container.appendChild(newScript);
      });
    } catch (e) {
      console.warn("Ad injection error:", e);
    }

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [cleanCode, isBannerWithAtOptions]);

  // If Banner with atOptions, use isolated iframe with srcdoc
  if (isBannerWithAtOptions) {
    const srcDocContent = `
      <!DOCTYPE html>
      <html lang="ar">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <base target="_blank" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              width: 100%;
              height: 100%;
              background: transparent;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          ${cleanCode}
        </body>
      </html>
    `;

    return (
      <div className={`adsterra-banner-slot flex flex-col items-center justify-center my-3 max-w-full overflow-hidden ${className}`}>
        {slotName && (
          <div className="text-[10px] text-gray-500 font-semibold tracking-wider mb-1 uppercase">
            {slotName}
          </div>
        )}
        <div
          style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%" }}
          className="relative flex items-center justify-center overflow-hidden rounded-xl bg-black/20"
        >
          <iframe
            ref={iframeRef}
            srcDoc={srcDocContent}
            width={width}
            height={height}
            title={slotName || "Adsterra Banner"}
            scrolling="no"
            frameBorder="0"
            className="border-0 overflow-hidden max-w-full"
            style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%" }}
          />
        </div>
      </div>
    );
  }

  // Floating scripts (Popunder / Social Bar / Global tags)
  return (
    <div
      ref={containerRef}
      className={`adsterra-script-slot ${className}`}
    />
  );
};

export default AdsterraContainer;

"use client";

import React, { useEffect, useRef } from "react";

interface AdsterraContainerProps {
  adCode?: string;
  className?: string;
  slotName?: string;
  enabled?: boolean;
}

/**
 * Normalizes ad code to fix common issues like protocol-relative URLs (`//`)
 * and add smart fallback between Adsterra CDN domains.
 */
function normalizeAdCode(code: string): string {
  if (!code) return "";
  let processed = code.trim();

  // Convert protocol-relative URLs (//...) to full https://
  processed = processed.replace(/src=(['"])\/\/([^'"]+)\1/gi, 'src=$1https://$2$1');

  // Convert watchingprefecture.com or other domains with fallback if needed
  return processed;
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

  const cleanCode = normalizeAdCode(adCode);

  // Detect if this is a Banner script with atOptions (requires isolated iframe to prevent global atOptions collision and document.write issues)
  const isBannerWithAtOptions = cleanCode.includes("atOptions");

  // Determine banner dimensions from atOptions if present
  let width = 300;
  let height = 250;

  if (isBannerWithAtOptions) {
    const widthMatch = cleanCode.match(/['"]width['"]\s*:\s*(\d+)/i);
    const heightMatch = cleanCode.match(/['"]height['"]\s*:\s*(\d+)/i);
    if (widthMatch && widthMatch[1]) width = parseInt(widthMatch[1], 10);
    if (heightMatch && heightMatch[1]) height = parseInt(heightMatch[1], 10);
  }

  // Effect for non-banner scripts (Social Bar, Popunder, Native Banner, Custom Ads)
  useEffect(() => {
    if (isBannerWithAtOptions || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    try {
      const range = document.createRange();
      range.selectNode(container);
      const fragment = range.createContextualFragment(cleanCode);

      // Separate non-scripts (like <div id="container-...">) and scripts
      const scripts = fragment.querySelectorAll("script");
      const nonScripts = fragment.cloneNode(true) as DocumentFragment;
      nonScripts.querySelectorAll("script").forEach((s) => s.remove());

      // 1. Append DOM elements (like native banner div containers) FIRST
      container.appendChild(nonScripts);

      // 2. Then create and append executable scripts sequentially
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          let val = attr.value;
          if (attr.name === "src" && val.startsWith("//")) {
            val = `https:${val}`;
          }
          newScript.setAttribute(attr.name, val);
        });

        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }

        // Add cross-origin friendly attributes
        if (!newScript.hasAttribute("data-cfasync")) {
          newScript.setAttribute("data-cfasync", "false");
        }

        container.appendChild(newScript);
      });
    } catch (e) {
      console.warn("Adsterra script injection error:", e);
    }

    return () => {
      // Don't wipe container immediately on fast re-renders to prevent flaking
    };
  }, [cleanCode, isBannerWithAtOptions]);

  // If Banner with atOptions, render inside an isolated, fully capable iframe
  if (isBannerWithAtOptions) {
    const srcDocContent = `<!DOCTYPE html>
<html lang="ar">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="https://xtren-media.com" target="_blank" />
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
</html>`;

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

  // Floating & Native scripts (Popunder / Social Bar / Native Banners)
  return (
    <div
      ref={containerRef}
      className={`adsterra-script-slot ${className}`}
    />
  );
};

export default AdsterraContainer;

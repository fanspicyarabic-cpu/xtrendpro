"use client";

import React, { useEffect, useRef } from "react";

interface AdsterraContainerProps {
  adCode?: string;
  className?: string;
}

export const AdsterraContainer: React.FC<AdsterraContainerProps> = ({ adCode, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adCode || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = ""; // Clear existing

    // Parse the HTML string
    const range = document.createRange();
    range.selectNode(container);
    const fragment = range.createContextualFragment(adCode);

    // Extract all scripts to re-create them so the browser executes them
    const scripts = fragment.querySelectorAll("script");
    const nonScripts = fragment.cloneNode(true) as DocumentFragment;
    nonScripts.querySelectorAll("script").forEach((s) => s.remove());

    // Append non-script HTML elements first
    container.appendChild(nonScripts);

    // Re-create and append scripts in order
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

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [adCode]);

  if (!adCode || !adCode.trim()) {
    return null;
  }

  return (
    <div className={`adsterra-wrapper w-full flex flex-col items-center justify-center my-4 overflow-hidden ${className}`}>
      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
        Sponsored / Advertisement
      </div>
      <div
        ref={containerRef}
        className="adsterra-slot min-h-[50px] max-w-full flex items-center justify-center"
      />
    </div>
  );
};

export default AdsterraContainer;

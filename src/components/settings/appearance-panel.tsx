"use client";

import { Check, Moon, Palette, SunMoon, Sun, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { useTheme } from "@/hooks/use-theme";
import { MODES, type Mode } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { SettingsPanelHead } from "./settings-panel-head";

/**
 * Appearance panel — light/dark mode + accent-color picker.
 *
 * Two independent controls: a mode toggle (light / dark) and the
 * accent grid. Either applies + persists immediately. No save button:
 * each change is a single attribute swap on <html>, there's nothing
 * to roll back.
 *
 * Persistence: localStorage only (device-scoped). The boot script in
 * layout.tsx replays both choices before first paint on subsequent
 * loads.
 */
export function AppearancePanel() {
  const { customColor, setCustomColor, mode, setMode } = useTheme();
  const [savedColors, setSavedColors] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wacrm.savedColors");
      if (stored) setSavedColors(JSON.parse(stored));
    } catch {}
  }, []);

  const saveColor = () => {
    if (savedColors.includes(customColor)) return;
    const newColors = [...savedColors, customColor];
    setSavedColors(newColors);
    localStorage.setItem("wacrm.savedColors", JSON.stringify(newColors));
  };

  const removeColor = (e: React.MouseEvent, hex: string) => {
    e.stopPropagation();
    const newColors = savedColors.filter(c => c !== hex);
    setSavedColors(newColors);
    localStorage.setItem("wacrm.savedColors", JSON.stringify(newColors));
  };

  const { h: currentHue, s: currentSat, l: currentLight } = hexToHsl(customColor);
  const colorName = getColorName(currentHue);
  return (
    <section className="max-w-3xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="Appearance"
        description="Set the mode and accent colour used across the app. Saved to this device — try it, it changes live."
      />

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SunMoon className="size-4 text-muted-foreground" />
          Mode
        </h3>

        <div
          role="radiogroup"
          aria-label="Color mode"
          className="grid max-w-md grid-cols-2 gap-3"
        >
          {MODES.map((m) => (
            <ModeCard
              key={m}
              mode={m}
              isActive={m === mode}
              onPick={() => setMode(m)}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Palette className="size-4 text-muted-foreground" />
          Accent color
        </h3>

        <div className="flex flex-col gap-6 max-w-sm">
          <div className="flex items-center gap-4">
            <label
              htmlFor="native-color-picker"
              className="relative flex h-14 w-14 shrink-0 cursor-pointer rounded-lg border border-border shadow-sm overflow-hidden hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-primary/40"
              style={{ backgroundColor: customColor }}
              title="Click for full color picker"
            >
              <span className="sr-only">Choose custom brand color</span>
              <input
                id="native-color-picker"
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="absolute opacity-0 h-0 w-0"
              />
            </label>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">{colorName}</span>
              <span className="text-xs text-muted-foreground uppercase">{customColor}</span>
            </div>
            <Button size="sm" variant="outline" onClick={saveColor} className="shrink-0 gap-1.5" disabled={savedColors.includes(customColor)}>
              <Plus className="size-3.5" />
              Save
            </Button>
          </div>
          
          <div className="w-full pt-2">
            <input
              type="range"
              min="0"
              max="360"
              value={currentHue}
              onChange={(e) => {
                const newHue = Number(e.target.value);
                // If the color was totally grayscale (saturation 0 or extreme lightness),
                // bump it up slightly so the hue slider actually does something visible.
                const s = currentSat === 0 ? 80 : currentSat;
                const l = currentLight === 0 || currentLight === 100 ? 50 : currentLight;
                setCustomColor(hslToHex(newHue, s, l));
              }}
              className="hue-slider w-full h-4 rounded-full cursor-pointer outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          
          {savedColors.length > 0 && (
            <div className="pt-2 border-t border-border">
              <h4 className="text-xs font-medium text-muted-foreground mb-3">Saved Colors</h4>
              <div className="flex flex-wrap gap-2">
                {savedColors.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Use ${hex}`}
                    onClick={() => setCustomColor(hex)}
                    className="group relative flex h-8 w-8 items-center justify-center rounded-full shadow-sm ring-offset-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    style={{ backgroundColor: hex, boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.15)" }}
                  >
                    {hex === customColor && (
                      <Check className="size-4 text-white drop-shadow-md" />
                    )}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => removeColor(e, hex)}
                      className="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:flex group-hover:opacity-100"
                    >
                      <X className="size-2.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <style dangerouslySetInnerHTML={{__html: `
            .hue-slider {
              -webkit-appearance: none;
              appearance: none;
              background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
            }
            .hue-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: white;
              border: 2px solid #000;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .hue-slider::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: white;
              border: 2px solid #000;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
          `}} />
        </div>
      </div>
    </section>
  );
}

function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string) {
  hex = hex.replace("#", "");
  if (hex.length !== 6) return { h: 0, s: 0, l: 50 };
  
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { 
    h: Math.round(h * 360), 
    s: Math.round(s * 100), 
    l: Math.round(l * 100) 
  };
}

function getColorName(hue: number) {
  if (hue < 15) return "Red";
  if (hue < 45) return "Orange";
  if (hue < 75) return "Yellow";
  if (hue < 150) return "Green";
  if (hue < 180) return "Teal";
  if (hue < 260) return "Blue";
  if (hue < 290) return "Purple";
  if (hue < 330) return "Pink";
  return "Red";
}

function ModeCard({
  mode,
  isActive,
  onPick,
}: {
  mode: Mode;
  isActive: boolean;
  onPick: () => void;
}) {
  const isLight = mode === "light";
  const Icon = isLight ? Sun : Moon;
  return (
    <button
      type="button"
      role="radio"
      onClick={onPick}
      aria-checked={isActive}
      aria-label={`Use ${mode} mode`}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        isActive
          ? "border-primary/60 ring-2 ring-primary/40"
          : "border-border hover:border-border hover:bg-muted/40",
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-semibold capitalize text-foreground">
        {mode}
      </span>
      {isActive && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
          <Check className="h-3 w-3" />
          Active
        </span>
      )}
    </button>
  );
}

function ThemeCard({
  id,
  name,
  tagline,
  swatch,
  isActive,
  onPick,
}: {
  id: ThemeId;
  name: string;
  tagline: string;
  swatch: string;
  isActive: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={isActive}
      aria-label={`Use ${name} theme`}
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors",
        isActive
          ? "border-primary/60 ring-2 ring-primary/40"
          : "border-border hover:border-border hover:bg-muted/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className="h-8 w-8 shrink-0 rounded-full"
          style={{
            background: swatch,
            boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.15)",
          }}
        />
        {isActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Check className="h-3 w-3" />
            Active
          </span>
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{name}</div>
        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {tagline}
        </div>
      </div>
      <div
        className="mt-1 flex h-2 overflow-hidden rounded-full"
        aria-hidden
      >
        <span className="flex-1" style={{ background: swatch }} />
        <span className="w-3 bg-muted-foreground/60" />
        <span className="w-3 bg-muted" />
        <span className="w-3 bg-card" />
      </div>
      <span className="sr-only">Theme id: {id}</span>
    </button>
  );
}

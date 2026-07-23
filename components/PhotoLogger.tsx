"use client";

import { useRef, useState } from "react";
import type { AnalyzeResponse } from "@/types";

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.8;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that photo"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process that photo"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoLogger({
  language,
  onResult,
  onError,
}: {
  language: "en" | "hi";
  onResult: (response: AnalyzeResponse, placeholderInput: string) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAnalyzing(true);
    try {
      const dataUrl = await compressImage(file);
      const imageBase64 = dataUrl.split(",")[1] ?? "";

      const res = await fetch("/api/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, language }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Nutrie couldn't analyse that photo — please try again.");
      }

      const response = (await res.json()) as AnalyzeResponse;
      const placeholder =
        response.type === "analysis" && response.nutrition.items.length > 0
          ? response.nutrition.items.map((item) => item.name).join(", ")
          : "Food photo";

      onResult(response, placeholder);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Something went wrong — try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={analyzing}
        aria-label="Log by photo"
        className="flex h-11 w-11 items-center justify-center rounded-button border border-border text-lg disabled:opacity-60"
      >
        📷
      </button>

      {analyzing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/70">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-white">Nutrie is looking...</p>
        </div>
      )}
    </>
  );
}

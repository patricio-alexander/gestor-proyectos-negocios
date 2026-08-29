"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import ChevronRight from "@gravity-ui/icons/ChevronRight";
import Pause from "@gravity-ui/icons/Pause";
import Play from "@gravity-ui/icons/Play";
import { buildNewsPages, type NewsPageItem, type NewsPageModel } from "../lib/build-news-pages";

const PAPER = "#ebe9e4";
const PAPER_EDGE = "#d5d1c8";
const BOX = "#f4f2ed";
const BOX_BORDER = "#cfc9bc";
const INK = "#1c1b19";
const INK_MUTED = "#5c5852";
const ACCENT = "#3d4a3a";
const AUTO_MS = 10_000;
const PAUSE_KEY = "raptor.gestor.news.autoplayPaused";

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function CoverCard({ item }: { item: NewsPageItem }) {
  return (
    <div
      className="flex h-full min-h-0 items-center gap-1.5 overflow-hidden rounded border px-1.5 py-1"
      style={{ background: BOX, borderColor: BOX_BORDER }}
    >
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded text-[0.7rem]"
        style={{ background: "#dfe6dc", color: ACCENT }}
        aria-hidden
      >
        ▢
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p
          className="truncate text-[0.62rem] font-extrabold leading-tight"
          style={{ color: INK, fontFamily: "Georgia, serif" }}
        >
          {item.title}
        </p>
        {item.subtitle ? (
          <p
            className="truncate text-[0.55rem] font-semibold leading-tight"
            style={{ color: ACCENT }}
          >
            {item.subtitle}
          </p>
        ) : null}
        {item.body ? (
          <p
            className="line-clamp-2 text-[0.55rem] leading-snug"
            style={{ color: INK_MUTED }}
          >
            {item.body}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CoverLayout({
  page,
}: {
  page: Extract<NewsPageModel, { layout: "cover" }>;
}) {
  const rows = page.coverVariant === "grid" ? 3 : 2;
  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden">
      {page.hero ? (
        <div
          className="flex max-h-[34%] shrink-0 items-center gap-2 rounded border-l-4 px-2.5 py-1.5"
          style={{
            background: BOX,
            borderColor: BOX_BORDER,
            borderLeftColor: ACCENT,
          }}
        >
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded text-xl"
            style={{ background: "#dfe6dc", color: ACCENT }}
            aria-hidden
          >
            📰
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p
              className="mb-0.5 text-[0.52rem] font-bold uppercase tracking-wider"
              style={{ color: ACCENT }}
            >
              Titular
              {page.hero.publishedAt ? ` · ${formatDate(page.hero.publishedAt)}` : ""}
            </p>
            <h2
              className="mb-0.5 line-clamp-2 text-[0.88rem] font-extrabold leading-tight md:text-[0.95rem]"
              style={{ color: INK, fontFamily: "Georgia, serif" }}
            >
              {page.hero.title}
            </h2>
            {page.hero.subtitle ? (
              <p
                className="mb-0.5 line-clamp-1 text-[0.62rem] font-semibold"
                style={{ color: INK_MUTED }}
              >
                {page.hero.subtitle}
              </p>
            ) : null}
            {page.hero.body ? (
              <p
                className="line-clamp-2 text-[0.6rem] leading-snug"
                style={{ color: INK, fontFamily: "Georgia, serif" }}
              >
                {page.hero.body}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {page.lead ? (
        <p
          className="shrink-0 text-[0.55rem] font-extrabold uppercase tracking-wider"
          style={{ color: INK_MUTED }}
        >
          {page.lead}
        </p>
      ) : null}

      <div
        className="grid min-h-0 flex-1 gap-1.5"
        style={{
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {page.summaries.slice(0, rows * 2).map((item) => (
          <CoverCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function FeatureLayout({
  page,
}: {
  page: Extract<NewsPageModel, { layout: "feature" }>;
}) {
  const item = page.item;
  const isLead = item.kind === "portada";
  const isSoon = item.kind === "proximamente";
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded border-l-4 p-4"
      style={{
        background: BOX,
        borderColor: BOX_BORDER,
        borderLeftColor: isSoon ? "#5a4a6a" : ACCENT,
      }}
    >
      <div className="mb-3 flex shrink-0 gap-3">
        <div
          className="flex shrink-0 items-center justify-center rounded text-2xl"
          style={{
            width: isLead ? 72 : 56,
            height: isLead ? 72 : 56,
            background: "#dfe6dc",
            color: ACCENT,
          }}
          aria-hidden
        >
          {isSoon ? "✨" : isLead ? "📰" : "▸"}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="mb-1 text-[0.6rem] font-extrabold uppercase tracking-wider"
            style={{ color: isSoon ? "#5a4a6a" : ACCENT }}
          >
            {page.accentLabel}
            {item.publishedAt ? ` · ${formatDate(item.publishedAt)}` : ""}
          </p>
          <h2
            className={`mb-1 font-extrabold leading-tight ${isLead ? "text-xl md:text-2xl" : "text-lg md:text-xl"}`}
            style={{ color: INK, fontFamily: "Georgia, serif" }}
          >
            {item.title}
          </h2>
          {item.subtitle ? (
            <p className="text-sm font-semibold" style={{ color: INK_MUTED }}>
              {item.subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden border-t pt-3" style={{ borderColor: BOX_BORDER }}>
        {item.body ? (
          <p
            className="whitespace-pre-wrap text-[0.88rem] leading-relaxed"
            style={{ color: INK, fontFamily: "Georgia, serif" }}
          >
            {item.body}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PaperPage({ page, pageNumber }: { page: NewsPageModel | null; pageNumber: number }) {
  return (
    <div
      className="flex h-full min-w-0 flex-1 flex-col overflow-hidden px-3 py-2.5 md:px-4"
      style={{ background: PAPER }}
    >
      <div
        className="mb-2 flex shrink-0 items-baseline justify-between border-b-2 pb-1.5"
        style={{ borderColor: INK }}
      >
        <span
          className="text-[0.7rem] font-extrabold uppercase tracking-[0.1em]"
          style={{ color: INK, fontFamily: "Georgia, serif" }}
        >
          {page?.heading || "—"}
        </span>
        <span className="text-[0.65rem]" style={{ color: INK_MUTED }}>
          Pág. {pageNumber}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {!page ? (
          <div className="flex h-full items-center justify-center italic" style={{ color: INK_MUTED }}>
            Página en blanco
          </div>
        ) : page.layout === "cover" ? (
          <CoverLayout page={page} />
        ) : (
          <FeatureLayout page={page} />
        )}
      </div>
    </div>
  );
}

type Props = {
  items: NewsPageItem[];
};

export function NewspaperPreview({ items }: Props) {
  const pages = useMemo(() => buildNewsPages(items), [items]);
  const spreads = useMemo(() => {
    const pairs: Array<[NewsPageModel | null, NewsPageModel | null]> = [];
    for (let i = 0; i < pages.length; i += 2) {
      pairs.push([pages[i] || null, pages[i + 1] || null]);
    }
    return pairs;
  }, [pages]);

  const [spreadIndex, setSpreadIndex] = useState(0);
  const [paused, setPaused] = useState(() => {
    try {
      return localStorage.getItem(PAUSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const totalSpreads = spreads.length || 1;
  const safeIndex = Math.min(spreadIndex, totalSpreads - 1);
  const [left, right] = spreads[safeIndex] || [null, null];
  const leftNum = safeIndex * 2 + 1;
  const rightNum = safeIndex * 2 + 2;

  useEffect(() => {
    setSpreadIndex(0);
  }, [pages]);

  useEffect(() => {
    if (paused || totalSpreads <= 1) return undefined;
    const id = window.setInterval(() => {
      setSpreadIndex((i) => (i + 1) % totalSpreads);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, totalSpreads, safeIndex]);

  const togglePaused = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PAUSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  if (!items.length) {
    return (
      <div
        className="rounded-lg border px-6 py-16 text-center text-sm"
        style={{ background: PAPER, borderColor: PAPER_EDGE, color: INK_MUTED }}
      >
        Todavía no hay noticias para previsualizar. Usá «Gestionar» para crearlas.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="flex overflow-hidden rounded border shadow-lg"
        style={{
          background: PAPER,
          borderColor: PAPER_EDGE,
          height: "min(62vh, 520px)",
          minHeight: 360,
        }}
      >
        <PaperPage page={left} pageNumber={leftNum} />
        <div className="w-0.5 shrink-0 shadow" style={{ background: PAPER_EDGE }} />
        <PaperPage page={right} pageNumber={rightNum} />
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          className="rounded-full border p-1.5 disabled:opacity-40"
          style={{ background: PAPER, borderColor: PAPER_EDGE, color: INK }}
          disabled={totalSpreads <= 1}
          onClick={() => setSpreadIndex((i) => (i - 1 + totalSpreads) % totalSpreads)}
          aria-label="Anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          className="rounded-full border p-1.5"
          style={{
            background: paused ? INK : PAPER,
            borderColor: PAPER_EDGE,
            color: paused ? PAPER : INK,
          }}
          onClick={togglePaused}
          aria-label={paused ? "Reanudar" : "Pausar"}
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
        <button
          type="button"
          className="rounded-full border p-1.5 disabled:opacity-40"
          style={{ background: PAPER, borderColor: PAPER_EDGE, color: INK }}
          disabled={totalSpreads <= 1}
          onClick={() => setSpreadIndex((i) => (i + 1) % totalSpreads)}
          aria-label="Siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-center text-xs" style={{ color: INK_MUTED }}>
        Páginas {leftNum}–{rightNum} de {pages.length}
        {!paused && totalSpreads > 1 ? " · Avanza sola cada 10 s" : ""}
        {paused ? " · Pausado" : ""}
      </p>
    </div>
  );
}

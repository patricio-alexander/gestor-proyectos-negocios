"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildNewsBoard,
  type NewsBoardSection,
  type NewsBoardSectionId,
  type NewsPageItem,
} from "../lib/build-news-board";

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

function sectionDomId(id: string) {
  return `news-sec-${id}`;
}

function SectionAccent(id: NewsBoardSection["id"] | "portada") {
  switch (id) {
    case "portada":
      return {
        bar: "var(--accent)",
        soft: "color-mix(in srgb, var(--accent) 16%, transparent)",
        label: "Portada",
      };
    case "novedades":
      return {
        bar: "var(--accent)",
        soft: "color-mix(in srgb, var(--accent) 14%, transparent)",
        label: "Nuevo",
      };
    case "sistema":
      return {
        bar: "var(--success)",
        soft: "color-mix(in srgb, var(--success) 12%, transparent)",
        label: "Listo",
      };
    case "proximamente":
      return {
        bar: "var(--warning)",
        soft: "color-mix(in srgb, var(--warning) 14%, transparent)",
        label: "Próximo",
      };
    default:
      return {
        bar: "var(--accent)",
        soft: "color-mix(in srgb, var(--accent) 10%, transparent)",
        label: "",
      };
  }
}

type NavNote = {
  id: NewsBoardSectionId | "portada";
  title: string;
  hint: string;
  count: number;
};

function scrollToSection(id: string) {
  const el = document.getElementById(sectionDomId(id));
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function CoverHero({ item }: { item: NewsPageItem }) {
  return (
    <section
      id={sectionDomId("portada")}
      className="news-board-cover scroll-mt-20 relative overflow-hidden rounded-2xl border border-[var(--gp-border)]"
      style={{
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--accent) 22%, var(--gp-surface)) 0%, var(--gp-surface) 48%, color-mix(in srgb, var(--accent) 8%, var(--gp-surface-muted)) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--accent)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-10 size-48 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--warning)" }}
        aria-hidden
      />

      <div className="relative px-5 py-7 md:px-8 md:py-10">
        <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--gp-text-muted)]">
          Primera plana
          {item.publishedAt ? ` · ${formatDate(item.publishedAt)}` : ""}
        </p>
        <h2 className="max-w-3xl text-3xl font-extrabold leading-[1.1] tracking-tight text-[var(--gp-text)] md:text-4xl">
          {item.title}
        </h2>
        {item.subtitle ? (
          <p className="mt-3 max-w-2xl text-base font-medium text-[var(--gp-text-muted)] md:text-lg">
            {item.subtitle}
          </p>
        ) : null}
        {item.body ? (
          <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-[var(--gp-text)]/85 md:text-[0.95rem]">
            {item.body}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function NewsCard({
  item,
  accent,
  index,
}: {
  item: NewsPageItem;
  accent: ReturnType<typeof SectionAccent>;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const hasBody = Boolean(item.body?.trim());

  return (
    <article
      id={`news-item-${item.id}`}
      className="news-board-card scroll-mt-20 group relative overflow-hidden rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: accent.bar }}
        aria-hidden
      />
      <div className="px-4 py-3.5 pl-5">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide"
            style={{ background: accent.soft, color: "var(--gp-text)" }}
          >
            {accent.label}
          </span>
          {item.publishedAt ? (
            <span className="text-[0.7rem] text-[var(--gp-text-muted)]">
              {formatDate(item.publishedAt)}
            </span>
          ) : null}
        </div>
        <h3 className="text-[0.98rem] font-bold leading-snug text-[var(--gp-text)]">
          {item.title}
        </h3>
        {item.subtitle ? (
          <p className="mt-1 text-sm font-medium text-[var(--gp-text-muted)]">
            {item.subtitle}
          </p>
        ) : null}
        {hasBody ? (
          <>
            <p
              className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--gp-text)]/80 ${
                open ? "" : "line-clamp-3"
              }`}
            >
              {item.body}
            </p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Ver menos" : "Leer más"}
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

function BoardSection({ section }: { section: NewsBoardSection }) {
  const accent = SectionAccent(section.id);
  if (!section.items.length) return null;

  return (
    <section
      id={sectionDomId(section.id)}
      className="scroll-mt-20 space-y-3"
    >
      <header className="flex items-end justify-between gap-3 border-b border-[var(--gp-border)] pb-2">
        <div>
          <p
            className="text-[0.68rem] font-bold uppercase tracking-[0.16em]"
            style={{ color: accent.bar }}
          >
            {section.eyebrow}
          </p>
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--gp-text)] md:text-2xl">
            {section.title}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--gp-text-muted)]">
            {section.description}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--gp-surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--gp-text-muted)]">
          {section.items.length}
        </span>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {section.items.map((item, index) => (
          <NewsCard key={item.id} item={item} accent={accent} index={index} />
        ))}
      </div>
    </section>
  );
}

function FloatingNotes({
  notes,
  activeId,
  onJump,
}: {
  notes: NavNote[];
  activeId: string;
  onJump: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-40 flex flex-col items-end gap-2 md:bottom-8 md:right-6">
      {open ? (
        <nav
          aria-label="Secciones de noticias"
          className="pointer-events-auto flex w-[11.5rem] flex-col gap-1.5 rounded-2xl border border-[var(--gp-border)] p-2 shadow-xl backdrop-blur-md sm:w-48"
          style={{
            background:
              "color-mix(in srgb, var(--gp-surface) 88%, transparent)",
          }}
        >
          <p className="px-1.5 pb-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--gp-text-muted)]">
            Ir a
          </p>
          {notes.map((note) => {
            const accent = SectionAccent(note.id);
            const active = activeId === note.id;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => onJump(note.id)}
                className={`relative rounded-xl border px-2.5 py-2 text-left transition-[transform,background] duration-200 hover:-translate-y-0.5 ${
                  active ? "shadow-sm" : ""
                }`}
                style={{
                  background: active
                    ? accent.soft
                    : "color-mix(in srgb, var(--gp-surface) 70%, transparent)",
                  borderColor: active ? accent.bar : "var(--gp-border)",
                  boxShadow: active
                    ? `inset 3px 0 0 ${accent.bar}`
                    : undefined,
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className="text-[0.7rem] font-bold uppercase tracking-wide"
                    style={{ color: accent.bar }}
                  >
                    {note.title}
                  </span>
                  <span className="text-[0.65rem] font-semibold text-[var(--gp-text-muted)]">
                    {note.count}
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-1 block text-[0.7rem] leading-snug text-[var(--gp-text-muted)]">
                  {note.hint}
                </span>
              </button>
            );
          })}
        </nav>
      ) : null}

      <button
        type="button"
        className="pointer-events-auto rounded-full border border-[var(--gp-border)] px-3.5 py-2 text-xs font-bold shadow-lg backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--accent) 22%, var(--gp-surface))",
          color: "var(--gp-text)",
        }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Ocultar índice de noticias" : "Mostrar índice de noticias"}
      >
        {open ? "Ocultar" : "Secciones"}
      </button>
    </div>
  );
}

type Props = {
  items: NewsPageItem[];
};

export function NewspaperPreview({ items }: Props) {
  const board = useMemo(() => buildNewsBoard(items), [items]);
  const [activeId, setActiveId] = useState<string>("portada");

  const notes = useMemo<NavNote[]>(() => {
    const list: NavNote[] = [
      {
        id: "portada",
        title: "Portada",
        hint: board.cover?.title || "Primera plana",
        count: board.cover ? 1 : 0,
      },
    ];
    for (const section of board.sections) {
      if (!section.items.length) continue;
      list.push({
        id: section.id,
        title: section.title,
        hint: section.eyebrow,
        count: section.items.length,
      });
    }
    return list;
  }, [board]);

  const onJump = useCallback((id: string) => {
    setActiveId(id);
    scrollToSection(id);
  }, []);

  useEffect(() => {
    const ids = notes.map((n) => n.id);
    const nodes = ids
      .map((id) => document.getElementById(sectionDomId(id)))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target?.id?.replace(/^news-sec-/, "");
        if (top) setActiveId(top);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.35, 0.6] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [notes]);

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-[var(--gp-border)] bg-[var(--gp-surface)] px-6 py-16 text-center text-sm text-[var(--gp-text-muted)]">
        Todavía no hay noticias para previsualizar. Usá «Gestionar» para crearlas.
      </div>
    );
  }

  const hasAnySection = board.sections.some((s) => s.items.length > 0);

  return (
    <div className="news-board space-y-8">
      {board.cover ? (
        <CoverHero item={board.cover} />
      ) : (
        <section
          id={sectionDomId("portada")}
          className="scroll-mt-20 rounded-2xl border border-dashed border-[var(--gp-border)] bg-[var(--gp-surface-muted)]/50 px-5 py-8 text-center"
        >
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--gp-text-muted)]">
            Primera plana
          </p>
          <p className="mt-2 text-sm text-[var(--gp-text-muted)]">
            Creá una pieza tipo «Portada» para el titular principal.
          </p>
        </section>
      )}

      {hasAnySection ? (
        board.sections.map((section) => (
          <BoardSection key={section.id} section={section} />
        ))
      ) : (
        <p className="text-center text-sm text-[var(--gp-text-muted)]">
          Solo hay portada. Agregá breves o «próximamente» para llenar las
          secciones.
        </p>
      )}

      <FloatingNotes notes={notes} activeId={activeId} onJump={onJump} />
    </div>
  );
}

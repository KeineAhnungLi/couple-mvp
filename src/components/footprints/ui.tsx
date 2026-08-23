import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { FootprintEntry } from "@/types/footprints";
import { SearchIcon, SmileIcon } from "@/components/footprints/icons";

export function BotanicalBranch({ className = "" }: { className?: string }) {
  return (
    <svg className={`fp-botanical ${className}`} viewBox="0 0 280 170" aria-hidden="true">
      <path d="M267 10C228 45 211 78 176 102c-30 20-77 29-132 43" stroke="#7f9277" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".75" />
      {[ [230,38,-22], [210,61,30], [184,82,-30], [155,101,28], [121,117,-28], [89,130,24] ].map(([x,y,r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse cx="0" cy="0" rx="17" ry="7" fill="#9bab8d" opacity=".72" />
          <path d="M-14 0h28" stroke="#73846d" strokeWidth="1" opacity=".55" />
        </g>
      ))}
      {[ [239,26], [219,51], [195,70], [168,92] ].map(([x,y], i) => (
        <g key={`b-${i}`} transform={`translate(${x} ${y})`}>
          <circle cx="0" cy="0" r="4.5" fill="#d9c68d" opacity=".88" />
          <circle cx="7" cy="-5" r="3.5" fill="#eadba9" opacity=".9" />
          <circle cx="9" cy="4" r="3" fill="#e2cf95" opacity=".9" />
        </g>
      ))}
    </svg>
  );
}

export function PaperCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`fp-paper-card ${className}`}>{children}</section>;
}

export function PaperLabel({ children }: { children: ReactNode }) {
  return (
    <div className="fp-paper-label">
      <span>{children}</span>
      <i aria-hidden="true">⌁</i>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  searchHref,
  compact = false,
}: {
  title: string;
  subtitle: string;
  searchHref?: string;
  compact?: boolean;
}) {
  return (
    <header className={`fp-page-header ${compact ? "is-compact" : ""}`}>
      <div className="fp-page-heading">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <BotanicalBranch />
      {searchHref ? (
        <Link href={searchHref} className="fp-icon-button" aria-label="搜索">
          <SearchIcon size={24} />
        </Link>
      ) : null}
    </header>
  );
}

const dateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const placeLabel = (entry: FootprintEntry) =>
  entry.place_name || entry.city || entry.district || entry.province || "未命名地点";

export function Polaroid({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`fp-polaroid ${className}`}>
      <span className="fp-tape fp-tape-tan" aria-hidden="true" />
      <div className="fp-polaroid-image">
        {src ? (
          <Image src={src} alt={alt} fill sizes="(max-width: 430px) 44vw, 180px" priority={priority} />
        ) : (
          <div className="fp-photo-placeholder" aria-hidden="true">
            <span>✦</span>
            <span>一张旅行照片</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MoodBadge({ mood }: { mood?: string | null }) {
  if (!mood) return null;
  return (
    <span className="fp-mood-badge">
      <SmileIcon size={18} />
      {mood}
    </span>
  );
}

export function EntryCard({ entry, href }: { entry: FootprintEntry; href?: string }) {
  const content = (
    <PaperCard className="fp-entry-card">
      <Polaroid src={entry.photos[0]?.image_url} alt={placeLabel(entry)} />
      <div className="fp-entry-copy">
        <span className="fp-entry-date">{dateLabel(entry.captured_at)} · {placeLabel(entry)}</span>
        <p>{entry.note || "这一页还没有写下文字，但地点已经被好好收进手账。"}</p>
        <MoodBadge mood={entry.mood} />
        <span className="fp-entry-lineart" aria-hidden="true">⌇❧</span>
      </div>
    </PaperCard>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export function EmptyScrapbook({
  title,
  description,
  actionHref = "/footprints/new",
  actionLabel = "记下第一段足迹",
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <PaperCard className="fp-empty-card">
      <div className="fp-empty-illustration" aria-hidden="true">
        <span className="fp-empty-sun" />
        <span className="fp-empty-hill one" />
        <span className="fp-empty-hill two" />
        <span className="fp-empty-path" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link href={actionHref} className="fp-text-link">{actionLabel} →</Link>
    </PaperCard>
  );
}

export function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="fp-section-heading">
      <PaperLabel>{children}</PaperLabel>
      {action}
    </div>
  );
}

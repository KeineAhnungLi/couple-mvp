import Link from "next/link";
import { CameraIcon, ChevronLeftIcon, ClockIcon, PinIcon } from "@/components/footprints/icons";
import { PageHeader, PaperCard } from "@/components/footprints/ui";
import {
  LocationCapture,
  MoodSelector,
  PhotoPicker,
  RegionFields,
  SubmitFootprintButton,
  TagSelector,
  TripFields,
} from "@/components/footprints/new-entry-controls";
import { createFootprintEntryAction } from "./actions";

type SearchParams = Promise<{ error?: string }>;

const shanghaiDateTimeLocal = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date()).replace(" ", "T");

export default async function NewFootprintPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <>
      <div className="fp-entry-topbar">
        <Link href="/footprints" className="fp-calendar-arrow" aria-label="返回"><ChevronLeftIcon /></Link>
        <span className="fp-draft-hint">▧ 草稿将在后续版本开放</span>
      </div>
      <PageHeader title="记一页" subtitle="记录今天去过的地方和当时的心情。" compact />

      {params.error ? <div className="fp-form-message is-error">{params.error}</div> : null}

      <form action={createFootprintEntryAction} className="fp-entry-form">
        <PaperCard className="fp-form-section">
          <div className="fp-form-title"><CameraIcon size={21} />照片</div>
          <PhotoPicker />
        </PaperCard>

        <PaperCard className="fp-field-card">
          <div className="fp-field-row">
            <div className="fp-field-label"><ClockIcon size={20} />时间</div>
            <input type="datetime-local" name="capturedAt" defaultValue={shanghaiDateTimeLocal()} />
            <span aria-hidden="true">›</span>
          </div>
          <div className="fp-field-row fp-location-field-row">
            <div className="fp-field-label"><PinIcon size={20} />地点</div>
            <div><RegionFields /></div>
            <span aria-hidden="true">›</span>
          </div>
          <div className="fp-location-capture-wrap"><LocationCapture /></div>
        </PaperCard>

        <PaperCard className="fp-form-section">
          <div className="fp-form-title">♧ 心情</div>
          <MoodSelector />
        </PaperCard>

        <PaperCard className="fp-form-section">
          <div className="fp-form-title">✎ 记录</div>
          <textarea
            className="fp-journal-textarea"
            name="note"
            maxLength={4000}
            placeholder="今天想记下什么？留一句给以后的自己。"
          />
        </PaperCard>

        <PaperCard className="fp-form-section">
          <div className="fp-form-title">◇ 标签</div>
          <TagSelector />
          <TripFields />
        </PaperCard>

        <SubmitFootprintButton />
      </form>
    </>
  );
}

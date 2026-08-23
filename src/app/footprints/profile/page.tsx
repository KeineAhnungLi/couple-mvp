import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getFootprintYearSummary } from "@/lib/data/footprints";
import { getShanghaiDateParts } from "@/lib/footprint-time";
import { PageHeader, PaperCard } from "@/components/footprints/ui";

export default async function FootprintProfilePage() {
  const context = await requireAuth();
  const year = getShanghaiDateParts().year;
  const summary = await getFootprintYearSummary(context.userId, year);
  const displayName = context.profile.display_name || "妈妈";

  return (
    <>
      <PageHeader title="我的" subtitle="一本只属于自己的旅行与生活手账。" compact />
      <PaperCard className="fp-profile-card">
        <div className="fp-profile-avatar">{displayName.slice(0, 1)}</div>
        <h2>{displayName}</h2>
        <p>{context.email}</p>
        <div className="fp-profile-stats">
          <div><strong>{summary.cityCount}</strong><span>今年城市</span></div>
          <div><strong>{summary.entryCount}</strong><span>今年记录</span></div>
          <div><strong>{summary.photoCount}</strong><span>今年照片</span></div>
        </div>
      </PaperCard>

      <PaperCard className="fp-settings-list">
        <Link href="/footprints/new" className="fp-settings-row"><span>新建记录</span><span>›</span></Link>
        <Link href="/footprints/calendar" className="fp-settings-row"><span>旅行日历</span><span>›</span></Link>
        <Link href="/footprints/memories" className="fp-settings-row"><span>年度回忆</span><span>›</span></Link>
        <div className="fp-settings-row"><span>PWA 推送提醒</span><span className="fp-muted">下一版</span></div>
        <div className="fp-settings-row"><span>导出手账</span><span className="fp-muted">下一版</span></div>
      </PaperCard>
    </>
  );
}

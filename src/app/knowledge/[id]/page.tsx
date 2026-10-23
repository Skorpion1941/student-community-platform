"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Eye, Heart, PenLine, Presentation, Video } from "lucide-react";
import { useGuild } from "@/lib/store";
import { KIND_LABEL } from "@/lib/kb";
import { Avatar, Badge, Btn, Card, EmptyState, Modal } from "@/components/ui";
import { MaterialForm } from "@/components/kb-form";
import { VideoPlayer } from "@/components/video-player";
import { SlidesViewer } from "@/components/slides-viewer";

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: string) => {
    if (list.length) {
      const ordered = /^\d+\./.test(list[0]);
      out.push(
        ordered ? (
          <ol key={key} className="list-decimal">{list.map((li, i) => <li key={i}>{inline(li.replace(/^\d+\.\s*/, ""))}</li>)}</ol>
        ) : (
          <ul key={key} className="list-disc">{list.map((li, i) => <li key={i}>{inline(li.replace(/^[-*]\s*/, ""))}</li>)}</ul>
        )
      );
      list = [];
    }
  };
  lines.forEach((ln, i) => {
    const t = ln.trim();
    if (/^#{1,3}\s/.test(t)) {
      flush(`l${i}`);
      const level = t.startsWith("###") ? 3 : 2;
      const text = t.replace(/^#+\s*/, "");
      out.push(level === 3 ? <h3 key={i}>{text}</h3> : <h2 key={i}>{text}</h2>);
    } else if (/^([-*]|\d+\.)\s+/.test(t)) {
      list.push(t);
    } else if (!t) {
      flush(`l${i}`);
    } else {
      flush(`l${i}`);
      out.push(<p key={i}>{inline(t)}</p>);
    }
  });
  flush("end");
  return out;
}

function inline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i}>{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}

export default function MaterialPage() {
  const params = useParams<{ id: string }>();
  const { state, can, likeArticle, updateArticle, pushToast } = useGuild();
  const [editOpen, setEditOpen] = useState(false);
  const article = state.articles.find((a) => a.id === params.id);

  if (!article) {
    return <EmptyState title="Материал не найден" text="Возможно, он был удалён. Вернитесь к списку материалов." action={<Link href="/knowledge"><Btn variant="secondary" size="sm">К базе знаний</Btn></Link>} />;
  }

  const related = state.articles.filter((a) => a.id !== article.id && (a.category === article.category || a.tags.some((t) => article.tags.includes(t)))).slice(0, 3);
  const wide = article.kind !== "article";

  return (
    <div className={`mx-auto space-y-4 ${wide ? "max-w-5xl" : "max-w-4xl"}`}>
      <Link href="/knowledge" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Вся база знаний
      </Link>

      <Card className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={article.kind === "video" ? "rose" : article.kind === "presentation" ? "amber" : "slate"}>{article.kind === "video" ? <Video size={11} /> : article.kind === "presentation" ? <Presentation size={11} /> : null} {KIND_LABEL[article.kind]}</Badge>
          <Badge tone="indigo">{article.category}</Badge>
          <Badge tone={article.level === "Начальный" ? "emerald" : article.level === "Средний" ? "amber" : "rose"}>{article.level}</Badge>
          {article.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">#{t}</span>)}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{article.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{article.excerpt}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-y border-slate-100 py-3">
          <Avatar name={article.speaker ?? article.authorName} color="bg-indigo-500" />
          <div>
            <p className="text-sm font-bold">{article.speaker ?? article.authorName}</p>
            <p className="text-xs text-slate-500">{article.speaker && article.speaker !== article.authorName ? `Опубликовал: ${article.authorName} · ` : `${article.authorRole} · `}{article.createdAt}</p>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock size={13} /> {article.readingTime}</span>
            <span className="flex items-center gap-1"><Eye size={13} /> {article.views}</span>
            <span className="flex items-center gap-1"><Heart size={13} /> {article.likes}</span>
          </div>
        </div>

        <div className="mt-5">
          {article.kind === "video" ? <VideoPlayer url={article.videoUrl} chapters={article.chapters} title={article.title} /> : null}
          {article.kind === "presentation" ? <SlidesViewer slides={article.slides ?? []} /> : null}
        </div>

        {article.content ? <div className="prose-guild mt-5">{renderMarkdown(article.content)}</div> : null}

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Btn variant="outline" size="sm" onClick={() => { likeArticle(article.id); pushToast({ kind: "success", title: "Спасибо за оценку!", text: "Автор увидит вашу поддержку." }); }}>
            <Heart size={15} /> Полезно ({article.likes})
          </Btn>
          {can("curate_kb") ? <Btn variant="secondary" size="sm" onClick={() => setEditOpen(true)}><PenLine size={15} /> Редактировать</Btn> : null}
        </div>
      </Card>

      {related.length > 0 ? (
        <div>
          <h3 className="font-extrabold">Похожие материалы</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/knowledge/${r.id}`}>
                <Card className="h-full p-4 hover:border-indigo-200 hover:shadow-md">
                  <div className="flex gap-1.5"><Badge tone={r.kind === "video" ? "rose" : r.kind === "presentation" ? "amber" : "slate"}>{KIND_LABEL[r.kind]}</Badge><Badge tone="indigo">{r.category}</Badge></div>
                  <p className="mt-2 text-sm font-bold leading-snug">{r.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{r.speaker ?? r.authorName} · {r.readingTime}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} wide title="Редактирование материала" subtitle={article.title}>
        <MaterialForm
          initial={article}
          lockKind
          onDone={(v) => {
            updateArticle(article.id, v);
            setEditOpen(false);
            pushToast({ kind: "success", title: "Материал обновлён!" });
          }}
        />
      </Modal>
    </div>
  );
}

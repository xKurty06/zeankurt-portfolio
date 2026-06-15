import { redirect } from "next/navigation";
import {
  deleteRecord,
  importCertificationsCsv,
  importEventsCsv,
  importExperienceCsv,
  importProjectsCsv,
  importSkillsCsv,
  saveCreativeCategory,
  saveCreativePhoto,
  saveCertification,
  saveEvent,
  saveExperience,
  saveProject,
  saveSiteContent,
  saveSkill,
  saveSkillCategory,
  seedDefaultCreativeCategories,
  signOut,
  uploadCreativePhotos,
} from "@/app/admin/actions";
import { AdminCollapsibleSection } from "@/app/admin/AdminCollapsibleSection";
import { AdminDialog } from "@/app/admin/AdminDialog";
import { AdminPhotoCategoryBrowser } from "@/app/admin/AdminPhotoCategoryBrowser";
import { AdminSelect } from "@/app/admin/AdminSelect";
import { AdminSortableList } from "@/app/admin/AdminSortableList";
import { ZoomableImage } from "@/components/ui/ZoomableImage";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/supabase/config";
import { Award, BriefcaseBusiness, Camera, CalendarDays, Check, Code2, FileText, FolderKanban, SquarePen, Trash2 } from "lucide-react";
import SaveButton from "@/components/ui/SaveButton";
import UploadWithValidation from "@/components/admin/UploadWithValidationClient";
import UploadField from "@/components/admin/UploadFieldClient";
import { AdminActionForm } from "@/app/admin/AdminActionForm";
import { AdminScrollReset } from "@/app/admin/AdminScrollReset";

type Row = Record<string, unknown>;

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return error?.code === "PGRST205" || /Could not find the table/i.test(error?.message ?? "");
}

function parseExperiencePeriodSortValue(period: string) {
  const raw = period.trim();
  if (!raw) return 0;
  if (/present/i.test(raw)) return Number.MAX_SAFE_INTEGER;

  const segments = raw
    .split(/\s*[-–]\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const candidate = segments.at(-1) ?? raw;
  const timestamp = Date.parse(`1 ${candidate}`);
  if (Number.isFinite(timestamp)) return timestamp;

  const fallback = Date.parse(candidate);
  return Number.isFinite(fallback) ? fallback : 0;
}

function value(row: Row | undefined, key: string) {
  const raw = row?.[key];
  return raw == null ? "" : String(raw);
}

function checked(row: Row | undefined, key = "published") {
  return row ? row[key] !== false : true;
}

function AdminCheckbox({
  name,
  label,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="group flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.02] px-3 py-2 text-sm text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white">
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="peer absolute inset-0 m-0 h-5 w-5 cursor-pointer opacity-0"
        />
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border-strong)] bg-white/[0.025] text-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition peer-checked:border-[var(--blue-400)] peer-checked:bg-[var(--blue-500)] peer-checked:text-[#03121a] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--blue-300)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--background-elevated)]"
        >
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        </span>
      </span>
      <span className="flex-1">{label}</span>
    </label>
  );
}

function labelValue(label: string, valueText?: string) {
  if (!valueText) return null;
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">{label}</p>
      <p className="mt-1 break-words text-sm text-white">{valueText}</p>
    </div>
  );
}

function AssetPreview({
  src,
  alt,
  compact = false,
}: {
  src?: string;
  alt: string;
  compact?: boolean;
}) {
  if (!src) return null;

  const isImage = /\.(png|jpe?g|webp|gif|avif|svg)(?:\?.*)?$/i.test(src);
  if (!isImage) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white/[0.02] md:col-span-2">
      <div className={compact ? "relative h-48 sm:h-56" : "relative aspect-[16/10]"}>
        <ZoomableImage
          src={src}
          alt={alt}
          unoptimized={src.endsWith(".svg")}
          sizes="(max-width: 768px) 100vw, 720px"
          imageClassName={compact ? "object-contain bg-black/20" : "object-cover"}
        />
      </div>
    </div>
  );
}

function arrayValue(row: Row | undefined, key: string) {
  const raw = row?.[key];
  return Array.isArray(raw) ? raw.join(", ") : "";
}

function Field({
  label,
  name,
  row,
  type = "text",
  textarea = false,
  required = false,
  options,
}: {
  label: string;
  name: string;
  row?: Row;
  type?: string;
  textarea?: boolean;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}) {
  const className =
    "rounded-xl border border-[var(--border)] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--border-strong)]";

  return (
    <label className="flex flex-col gap-1 text-xs text-[var(--foreground-muted)]">
      <span>
        {label}
        {required ? <span className="ml-1 text-[var(--blue-300)]">*</span> : null}
      </span>
      {options ? (
        <AdminSelect
          name={name}
          label={label}
          defaultValue={value(row, name)}
          required={required}
          options={options}
        />
      ) : textarea ? (
        <textarea
          name={name}
          required={required}
          defaultValue={value(row, name)}
          rows={4}
          className={className}
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={value(row, name)}
          className={className}
        />
      )}
    </label>
  );
}

const PROJECT_STATUS_OPTIONS = [
  { label: "Live", value: "live" },
  { label: "Work in Progress", value: "wip" },
  { label: "Archived", value: "archived" },
];

const PROJECT_CSV_TEMPLATE = [
  "slug,title,year,role,description,long_description,tags,github_url,live_url,status,featured,published",
  "sample-project,Sample Project,2026,Full-stack Developer,Short project summary,Longer optional details,Next.js|Supabase|Tailwind,https://github.com/example/sample,https://example.com,live,false,true",
].join("\n");

const PROJECT_CSV_TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(PROJECT_CSV_TEMPLATE)}`;
const EXPERIENCE_CSV_TEMPLATE = [
  "slug,organization,role,period,type,description,published",
  "studio-nomads,Studio Nomads,Photographer & Editor,2025 - Present,work,Lead visual coverage and creative production,true",
].join("\n");
const EXPERIENCE_CSV_TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(EXPERIENCE_CSV_TEMPLATE)}`;
const CERTIFICATIONS_CSV_TEMPLATE = [
  "name,issuer,issued,expires,published",
  "AWS Certified Cloud Practitioner,Amazon Web Services,2026-01-15,,true",
].join("\n");
const CERTIFICATIONS_CSV_TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(CERTIFICATIONS_CSV_TEMPLATE)}`;
const EVENTS_CSV_TEMPLATE = [
  "slug,title,event_date,venue,organizers,role,category,published",
  "build-week-2026,Build Week 2026,2026-03-14,Manila,OpenClaw,Speaker,conference,true",
].join("\n");
const EVENTS_CSV_TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(EVENTS_CSV_TEMPLATE)}`;
const SKILLS_CSV_TEMPLATE = [
  "category,skill,category_published",
  "Frontend,Next.js,true",
  "Frontend,TypeScript,true",
].join("\n");
const SKILLS_CSV_TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(SKILLS_CSV_TEMPLATE)}`;

const EXPERIENCE_TYPE_OPTIONS = [
  { label: "Work", value: "work" },
  { label: "Community", value: "community" },
  { label: "Hackathon", value: "hackathon" },
];

const EVENT_CATEGORY_OPTIONS = [
  { label: "Community", value: "community" },
  { label: "Hackathon", value: "hackathon" },
  { label: "Meetup", value: "meetup" },
  { label: "Conference", value: "conference" },
  { label: "Workshop", value: "workshop" },
];

const PHOTO_ASPECT_OPTIONS = [
  { label: "Landscape", value: "landscape" },
  { label: "Portrait", value: "portrait" },
  { label: "Square", value: "square" },
];

function PublishControls({ row }: { row?: Row }) {
  return (
    <>
      {row ? <input type="hidden" name="existing_sort_order" value={value(row, "sort_order")} /> : null}
      <AdminCheckbox name="published" label="Published" defaultChecked={checked(row)} />
    </>
  );
}

function DeleteButton({
  table,
  id,
  keyName,
}: {
  table: string;
  id: string;
  keyName?: string;
}) {
  return (
    <>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      {keyName ? <input type="hidden" name="key" value={keyName} /> : null}
      <button
        type="submit"
        formAction={deleteRecord}
        className="inline-flex min-h-11 items-center rounded-full border border-red-400/20 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/10 sm:min-h-0 sm:py-1.5"
      >
        Delete
      </button>
    </>
  );
}

function RowForm({
  children,
  action,
}: {
  children: React.ReactNode;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <AdminActionForm
      action={action}
      className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4"
    >
      <div className="flex min-w-0 flex-col gap-3">{children}</div>
    </AdminActionForm>
  );
}

function ExistingImageField({ row }: { row?: Row }) {
  const current = value(row, "image_path");
  return (
    <>
      <input type="hidden" name="existing_image_path" value={current} />
      <AssetPreview src={current} alt={`${value(row, "title") || value(row, "name") || "Current"} preview`} compact />
      {current ? (
        <p className="text-xs text-[var(--foreground-muted)]">
          Current asset stored in Supabase:{" "}
          <a
            href={current}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--blue-300)] transition hover:text-white"
          >
            View current file
          </a>
        </p>
      ) : null}
    </>
  );
}

function ExistingShowcaseImageField({ row }: { row?: Row }) {
  const current = value(row, "showcase_image_path");
  return (
    <>
      <input type="hidden" name="existing_image_path" value={current} />
      <AssetPreview src={current} alt={`${value(row, "name") || "Showcase"} preview`} compact />
      {current ? (
        <p className="text-xs text-[var(--foreground-muted)]">
          Current category showcase:{" "}
          <a
            href={current}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--blue-300)] transition hover:text-white"
          >
            View current file
          </a>
        </p>
      ) : null}
    </>
  );
}

// `UploadField` is now implemented as a client component in
// `src/components/admin/UploadFieldClient.tsx` to enable client-side
// validation (file size checks) before server-action form submission.

function RecordRow({
  title,
  subtitle,
  meta,
  viewDialog,
  editDialog,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  viewDialog: React.ReactNode;
  editDialog: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white/[0.02] px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{title}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--foreground-muted)]">
          {subtitle ? <span>{subtitle}</span> : null}
          {meta ? <span>{meta}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {viewDialog}
        {editDialog}
      </div>
    </div>
  );
}

function ViewGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid min-w-0 gap-3 md:grid-cols-2">{children}</div>;
}

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) redirect("/admin/login?error=env");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (!isAllowedAdminEmail(user.email)) redirect("/admin/login?error=forbidden");

  const [
    projectsResult,
    experienceResult,
    certificationsResult,
    eventsResult,
    skillCategoriesResult,
    skillsResult,
    creativeCategoriesResult,
    creativePhotosResult,
    siteContentResult,
  ] = await Promise.all([
    admin.from("projects").select("*").order("sort_order", { ascending: true }).order("year", { ascending: false }),
    admin.from("experience_items").select("*").order("sort_order", { ascending: true }),
    admin.from("certifications").select("*").order("sort_order", { ascending: true }),
    admin.from("events").select("*").order("sort_order", { ascending: true }).order("event_date", { ascending: false }),
    admin.from("skill_categories").select("*").order("sort_order", { ascending: true }),
    admin.from("skills").select("*").order("sort_order", { ascending: true }),
    admin.from("creative_categories").select("*").order("sort_order", { ascending: true }),
    admin.from("creative_photos").select("*").order("sort_order", { ascending: true }),
    admin.from("site_content").select("*").order("key", { ascending: true }),
  ]);

  if (projectsResult.error) throw projectsResult.error;
  if (experienceResult.error) throw experienceResult.error;
  if (certificationsResult.error) throw certificationsResult.error;
  if (eventsResult.error) throw eventsResult.error;
  if (skillCategoriesResult.error) throw skillCategoriesResult.error;
  if (skillsResult.error) throw skillsResult.error;
  if (siteContentResult.error) throw siteContentResult.error;

  const creativeCategoriesMissing = isMissingTableError(creativeCategoriesResult.error);
  const creativePhotosMissing = isMissingTableError(creativePhotosResult.error);
  const creativeTablesMissing = creativeCategoriesMissing;

  if (creativeCategoriesResult.error && !creativeCategoriesMissing) {
    throw creativeCategoriesResult.error;
  }

  if (creativePhotosResult.error && !creativePhotosMissing) {
    throw creativePhotosResult.error;
  }

  const projects = (projectsResult.data ?? []) as Row[];
  const experiences = (experienceResult.data ?? []) as Row[];
  const certifications = (certificationsResult.data ?? []) as Row[];
  const events = (eventsResult.data ?? []) as Row[];
  const skillCategories = (skillCategoriesResult.data ?? []) as Row[];
  const skills = (skillsResult.data ?? []) as Row[];
  const creativeCategories = creativeCategoriesMissing ? [] : (creativeCategoriesResult.data ?? []) as Row[];
  const creativePhotos = creativePhotosMissing ? [] : (creativePhotosResult.data ?? []) as Row[];
  const siteRows = (siteContentResult.data ?? []) as Row[];
  const creativeSidebarItems = creativeCategories.map((category) => {
    const slug = value(category, "slug");
    const name = value(category, "name");
    const photoCount = creativePhotos.filter((photo) => value(photo, "category_id") === value(category, "id")).length;

    return {
      id: value(category, "id"),
      slug,
      name,
      photoCount,
      anchorId: `creative-category-${slug}`,
    };
  });

  const navItems: Array<{ id: string; label: string; count: number; icon: React.ReactNode }> = [
    { id: "projects", label: "Projects", count: projects.length, icon: <FolderKanban className="h-4 w-4" /> },
    { id: "experience", label: "Experience", count: experiences.length, icon: <BriefcaseBusiness className="h-4 w-4" /> },
    { id: "certifications", label: "Certifications", count: certifications.length, icon: <Award className="h-4 w-4" /> },
    { id: "events", label: "Events", count: events.length, icon: <CalendarDays className="h-4 w-4" /> },
    { id: "skills", label: "Skills", count: skills.length, icon: <Code2 className="h-4 w-4" /> },
    { id: "site-content", label: "Site Copy", count: siteRows.length, icon: <FileText className="h-4 w-4" /> },
  ];
  navItems.push({
    id: "creative-portfolio",
    label: "Creative CMS",
    count: creativeCategories.length,
    icon: <Camera className="h-4 w-4" />,
  });

  return (
    <div className="min-h-dvh bg-[var(--background)] text-white">
      <AdminScrollReset />
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="mx-auto flex min-h-14 max-w-screen-xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:flex-nowrap sm:px-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--blue-300)]">CMS</span>
            <span className="h-4 w-px bg-[var(--border)]" />
            <span className="font-[family-name:var(--font-syne)] text-sm font-semibold">Admin</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <a
              href="/"
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white sm:min-h-0 sm:py-1.5"
            >
              Back to portfolio
            </a>
            <span className="hidden text-xs text-[var(--foreground-muted)] sm:block">{user.email}</span>
            <form action={signOut}>
              <button className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white sm:min-h-0 sm:py-1.5">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-screen-xl gap-0 px-0 py-6 lg:gap-6 lg:px-5">
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="sticky top-20 flex flex-col gap-1">
            <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
              Dev Portfolio
            </p>
            {navItems.filter((item) => item.id !== "creative-portfolio").map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-white/[0.05] hover:text-white"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-base leading-none text-[var(--blue-300)] opacity-60 group-hover:opacity-100">
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/[0.07] px-2 text-[10px] leading-none tabular-nums">{item.count}</span>
              </a>
            ))}

            <p className="mb-2 mt-5 px-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
              Creative Portfolio
            </p>
            {navItems.filter((item) => item.id === "creative-portfolio").map((item) => (
              <div key={item.id} className="space-y-1">
                <a
                  href={`#${item.id}`}
                  className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-white/[0.05] hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-base leading-none text-[var(--blue-300)] opacity-60 group-hover:opacity-100">
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/[0.07] px-2 text-[10px] leading-none tabular-nums">{item.count}</span>
                </a>
                {creativeSidebarItems.length > 0 ? (
                  <div className="ml-6 flex flex-col gap-1 border-l border-[var(--border)] pl-3">
                    {creativeSidebarItems.map((category) => (
                      <a
                        key={category.id}
                        href={`#${category.anchorId}`}
                        className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-2 text-xs text-[var(--foreground-muted)] transition hover:bg-white/[0.04] hover:text-white lg:min-h-0 lg:py-1.5"
                      >
                        <span className="truncate">{category.name}</span>
                        <span className="pr-3 shrink-0 text-[10px] tabular-nums text-[var(--blue-300)]">
                          {category.photoCount}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
                Total records
              </p>
              <p className="font-[family-name:var(--font-syne)] text-2xl font-semibold text-[var(--blue-300)]">
                {projects.length + experiences.length + certifications.length + events.length + skills.length + creativePhotos.length}
              </p>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 lg:px-0">
          <div className="flex gap-2 overflow-x-auto pb-4 lg:hidden">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground-muted)] transition hover:text-white"
              >
                {item.label}
                <span className="ml-1.5 text-[var(--blue-300)]">{item.count}</span>
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-6">
            <AdminCollapsibleSection
              id="projects"
              title="Projects"
              count={projects.length}
              addDialog={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <AdminDialog title="Import Projects" description="Upload the CSV format, then add images later from each project record." triggerLabel="Import CSV">
                    <RowForm action={importProjectsCsv}>
                      <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4">
                        <p className="text-sm font-medium text-white">CSV format</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-muted)]">
                          Required columns are slug, title, year, role, description, long_description, tags, github_url, live_url, status, featured, and published.
                        </p>
                        <a
                          href={PROJECT_CSV_TEMPLATE_HREF}
                          download="projects-import-template.csv"
                          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--blue-300)] transition hover:border-[var(--border-strong)] hover:text-white sm:min-h-0 sm:py-1.5"
                        >
                          Download format
                        </a>
                      </div>
                      <UploadField label="Upload projects CSV" name="csv_file" accept=".csv,text/csv" />
                    </RowForm>
                  </AdminDialog>
                  <AdminDialog title="Add Project" description="Create a new project entry." triggerLabel="Add Project" triggerVariant="primary">
                    <RowForm action={saveProject}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Slug" name="slug" />
                        <Field label="Title" name="title" required />
                        <Field label="Year" name="year" required />
                        <Field label="Role" name="role" required />
                        <Field label="GitHub URL" name="github_url" />
                        <Field label="Live URL" name="live_url" />
                        <Field label="Status" name="status" options={PROJECT_STATUS_OPTIONS} />
                        <Field label="Tags, comma separated" name="tags" row={{ tags: "" }} />
                      </div>
                      <Field label="Description" name="description" textarea required />
                      <Field label="Long description" name="long_description" textarea />
                      <UploadField label="Upload preview" name="image_file" accept="image/*" />
                      <AdminCheckbox name="featured" label="Featured" />
                      <PublishControls />
                    </RowForm>
                  </AdminDialog>
                </div>
              }
            >
              <AdminSortableList
                table="projects"
                sortOptions={[
                  { label: "Custom", value: "custom" },
                  { label: "Name", value: "name" },
                  { label: "Year", value: "year" },
                  { label: "Featured", value: "featured" },
                ]}
                items={projects.map((project) => ({
                  id: value(project, "slug"),
                  title: value(project, "title"),
                  subtitle: value(project, "year"),
                  meta: value(project, "role"),
                  status: value(project, "status"),
                  featured: project.featured === true,
                  sortOrder: Number(value(project, "sort_order")) || 0,

                  sortValues: {
                    name: value(project, "title"),
                    year: value(project, "year"),
                    featured: project.featured === true,
                  },
                  actions: (
                    <>
                      <AdminDialog title={value(project, "title")} description="Project overview" triggerLabel="View">
                        <ViewGrid>
                          <AssetPreview src={value(project, "image_path")} alt={value(project, "title")} />
                          {labelValue("Slug", value(project, "slug"))}
                          {labelValue("Year", value(project, "year"))}
                          {labelValue("Role", value(project, "role"))}
                          {labelValue("Status", value(project, "status"))}
                          {labelValue("GitHub URL", value(project, "github_url"))}
                          {labelValue("Live URL", value(project, "live_url"))}
                          {labelValue("Tags", arrayValue(project, "tags"))}
                          {labelValue("Description", value(project, "description"))}
                          {labelValue("Long description", value(project, "long_description"))}
                          {labelValue("Image asset", value(project, "image_path"))}
                        </ViewGrid>
                      </AdminDialog>
                      <AdminDialog title={`Edit ${value(project, "title")}`} description="Update project details." triggerLabel="Edit">
                        <RowForm action={saveProject}>
                          <input type="hidden" name="current_slug" value={value(project, "slug")} />
                          <div className="flex items-center justify-end gap-3">
                            <DeleteButton table="projects" id={value(project, "slug")} keyName="slug" />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Slug" name="slug" row={project} />
                            <Field label="Title" name="title" row={project} required />
                            <Field label="Year" name="year" row={project} required />
                            <Field label="Role" name="role" row={project} required />
                            <Field label="GitHub URL" name="github_url" row={project} />
                            <Field label="Live URL" name="live_url" row={project} />
                            <Field label="Status" name="status" row={project} options={PROJECT_STATUS_OPTIONS} />
                            <Field label="Tags, comma separated" name="tags" row={{ tags: arrayValue(project, "tags") }} />
                          </div>
                          <ExistingImageField row={project} />
                          <Field label="Description" name="description" row={project} textarea required />
                          <Field label="Long description" name="long_description" row={project} textarea />
                          <UploadField label="Replace preview in Supabase Storage" name="image_file" accept="image/*" />
                          <AdminCheckbox name="featured" label="Featured" defaultChecked={project?.featured === true} />
                          <PublishControls row={project} />
                        </RowForm>
                      </AdminDialog>
                    </>
                  ),
                }))}
              />
            </AdminCollapsibleSection>

            <AdminCollapsibleSection
              id="experience"
              title="Experience"
              count={experiences.length}
              addDialog={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <AdminDialog title="Import Experience" description="Upload experience rows in CSV format." triggerLabel="Import CSV">
                    <RowForm action={importExperienceCsv}>
                      <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4">
                        <p className="text-sm font-medium text-white">CSV format</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-muted)]">
                          Required columns are slug, organization, role, period, type, description, and published.
                        </p>
                        <a
                          href={EXPERIENCE_CSV_TEMPLATE_HREF}
                          download="experience-import-template.csv"
                          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--blue-300)] transition hover:border-[var(--border-strong)] hover:text-white sm:min-h-0 sm:py-1.5"
                        >
                          Download format
                        </a>
                      </div>
                      <UploadField label="Upload experience CSV" name="csv_file" accept=".csv,text/csv" />
                    </RowForm>
                  </AdminDialog>
                  <AdminDialog title="Add Experience" description="Create a new experience entry." triggerLabel="Add Experience" triggerVariant="primary">
                    <RowForm action={saveExperience}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Slug" name="slug" />
                        <Field label="Organization" name="organization" required />
                        <Field label="Role" name="role" required />
                        <Field label="Period" name="period" required />
                        <Field label="Type" name="type" required options={EXPERIENCE_TYPE_OPTIONS} />
                      </div>
                      <Field label="Description" name="description" textarea required />
                      <PublishControls />
                    </RowForm>
                  </AdminDialog>
                </div>
              }
            >
              <AdminSortableList
                table="experience_items"
                sortOptions={[
                  { label: "Custom", value: "custom" },
                  { label: "Date", value: "date" },
                  { label: "Name", value: "name" },
                ]}
                items={experiences.map((item) => ({
                  id: value(item, "slug"),
                  title: value(item, "organization"),
                  subtitle: value(item, "period"),
                  meta: value(item, "role"),
                  sortOrder: Number(value(item, "sort_order")) || 0,
                  sortValues: {
                    date: parseExperiencePeriodSortValue(value(item, "period")),
                    name: value(item, "organization"),
                  },
                  actions: (
                    <>
                      <AdminDialog title={value(item, "organization")} description="Experience overview" triggerLabel="View">
                        <ViewGrid>
                          {labelValue("Slug", value(item, "slug"))}
                          {labelValue("Role", value(item, "role"))}
                          {labelValue("Period", value(item, "period"))}
                          {labelValue("Type", value(item, "type"))}
                          {labelValue("Description", value(item, "description"))}
                        </ViewGrid>
                      </AdminDialog>
                      <AdminDialog title={`Edit ${value(item, "organization")}`} description="Update experience details." triggerLabel="Edit">
                        <RowForm action={saveExperience}>
                          <input type="hidden" name="current_slug" value={value(item, "slug")} />
                          <div className="flex items-center justify-end gap-3">
                            <DeleteButton table="experience_items" id={value(item, "slug")} keyName="slug" />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Slug" name="slug" row={item} />
                            <Field label="Organization" name="organization" row={item} required />
                            <Field label="Role" name="role" row={item} required />
                            <Field label="Period" name="period" row={item} required />
                            <Field label="Type" name="type" row={item} required options={EXPERIENCE_TYPE_OPTIONS} />
                          </div>
                          <Field label="Description" name="description" row={item} textarea required />
                          <PublishControls row={item} />
                        </RowForm>
                      </AdminDialog>
                    </>
                  ),
                }))}
              />
            </AdminCollapsibleSection>

            <AdminCollapsibleSection
              id="certifications"
              title="Certifications"
              count={certifications.length}
              addDialog={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <AdminDialog title="Import Certifications" description="Upload certification rows in CSV format. Assets can be added later per record." triggerLabel="Import CSV">
                    <RowForm action={importCertificationsCsv}>
                      <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4">
                        <p className="text-sm font-medium text-white">CSV format</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-muted)]">
                          Required columns are name, issuer, issued, expires, and published.
                        </p>
                        <a
                          href={CERTIFICATIONS_CSV_TEMPLATE_HREF}
                          download="certifications-import-template.csv"
                          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--blue-300)] transition hover:border-[var(--border-strong)] hover:text-white sm:min-h-0 sm:py-1.5"
                        >
                          Download format
                        </a>
                      </div>
                      <UploadField label="Upload certifications CSV" name="csv_file" accept=".csv,text/csv" />
                    </RowForm>
                  </AdminDialog>
                  <AdminDialog title="Add Certification" description="Create a new certification entry." triggerLabel="Add Certification" triggerVariant="primary">
                    <RowForm action={saveCertification}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Name" name="name" required />
                        <Field label="Issuer" name="issuer" required />
                        <Field label="Issued" name="issued" />
                        <Field label="Expires" name="expires" />
                      </div>
                      <UploadField label="Upload certificate to Supabase Storage" name="image_file" accept="image/*,application/pdf" />
                      <PublishControls />
                    </RowForm>
                  </AdminDialog>
                </div>
              }
            >
              <AdminSortableList
                table="certifications"
                sortOptions={[
                  { label: "Custom", value: "custom" },
                  { label: "Name", value: "name" },
                  { label: "Issuer", value: "issuer" },
                  { label: "Issued", value: "date" },
                ]}
                items={certifications.map((cert) => ({
                  id: value(cert, "id"),
                  title: value(cert, "name"),
                  subtitle: value(cert, "issuer"),
                  meta: value(cert, "issued"),
                  sortOrder: Number(value(cert, "sort_order")) || 0,
                  sortValues: {
                    name: value(cert, "name"),
                    issuer: value(cert, "issuer"),
                    date: value(cert, "issued"),
                  },
                  actions: (
                    <>
                      <AdminDialog title={value(cert, "name")} description="Certification overview" triggerLabel="View">
                        <ViewGrid>
                          <AssetPreview src={value(cert, "image_path")} alt={value(cert, "name")} />
                          {labelValue("Issuer", value(cert, "issuer"))}
                          {labelValue("Issued", value(cert, "issued"))}
                          {labelValue("Expires", value(cert, "expires"))}
                          {labelValue("Asset", value(cert, "image_path"))}
                        </ViewGrid>
                      </AdminDialog>
                      <AdminDialog title={`Edit ${value(cert, "name")}`} description="Update certification details." triggerLabel="Edit">
                        <RowForm action={saveCertification}>
                          <input type="hidden" name="id" value={value(cert, "id")} />
                          <div className="flex items-center justify-end gap-3">
                            <DeleteButton table="certifications" id={value(cert, "id")} />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Name" name="name" row={cert} required />
                            <Field label="Issuer" name="issuer" row={cert} required />
                            <Field label="Issued" name="issued" row={cert} />
                            <Field label="Expires" name="expires" row={cert} />
                          </div>
                          <ExistingImageField row={cert} />
                          <UploadField label="Replace certificate in Supabase Storage" name="image_file" accept="image/*,application/pdf" />
                          <PublishControls row={cert} />
                        </RowForm>
                      </AdminDialog>
                    </>
                  ),
                }))}
              />
            </AdminCollapsibleSection>

            <AdminCollapsibleSection
              id="events"
              title="Events"
              count={events.length}
              addDialog={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <AdminDialog title="Import Events" description="Upload event rows in CSV format. Images can be attached later." triggerLabel="Import CSV">
                    <RowForm action={importEventsCsv}>
                      <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4">
                        <p className="text-sm font-medium text-white">CSV format</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-muted)]">
                          Required columns are slug, title, event_date, venue, organizers, role, category, and published.
                        </p>
                        <a
                          href={EVENTS_CSV_TEMPLATE_HREF}
                          download="events-import-template.csv"
                          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--blue-300)] transition hover:border-[var(--border-strong)] hover:text-white sm:min-h-0 sm:py-1.5"
                        >
                          Download format
                        </a>
                      </div>
                      <UploadField label="Upload events CSV" name="csv_file" accept=".csv,text/csv" />
                    </RowForm>
                  </AdminDialog>
                  <AdminDialog title="Add Event" description="Create a new event entry." triggerLabel="Add Event" triggerVariant="primary">
                    <RowForm action={saveEvent}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Slug" name="slug" />
                        <Field label="Title" name="title" required />
                        <Field label="Date" name="event_date" type="date" required />
                        <Field label="Venue" name="venue" required />
                        <Field label="Organizers" name="organizers" />
                        <Field label="Role" name="role" />
                        <Field label="Category" name="category" options={EVENT_CATEGORY_OPTIONS} />
                      </div>
                      <UploadField label="Upload event image to Supabase Storage" name="image_file" accept="image/*" />
                      <PublishControls />
                    </RowForm>
                  </AdminDialog>
                </div>
              }
            >
              <AdminSortableList
                table="events"
                sortOptions={[
                  { label: "Custom", value: "custom" },
                  { label: "Date", value: "date" },
                  { label: "Name", value: "name" },
                  { label: "Venue", value: "venue" },
                ]}
                items={events.map((event) => ({
                  id: value(event, "slug"),
                  title: value(event, "title"),
                  subtitle: value(event, "event_date"),
                  meta: value(event, "venue"),
                  sortOrder: Number(value(event, "sort_order")) || 0,
                  sortValues: {
                    date: value(event, "event_date"),
                    name: value(event, "title"),
                    venue: value(event, "venue"),
                  },
                  actions: (
                    <>
                      <AdminDialog title={value(event, "title")} description="Event overview" triggerLabel="View">
                        <ViewGrid>
                          <AssetPreview src={value(event, "image_path")} alt={value(event, "title")} />
                          {labelValue("Slug", value(event, "slug"))}
                          {labelValue("Date", value(event, "event_date"))}
                          {labelValue("Venue", value(event, "venue"))}
                          {labelValue("Organizers", value(event, "organizers"))}
                          {labelValue("Role", value(event, "role"))}
                          {labelValue("Category", value(event, "category"))}
                          {labelValue("Asset", value(event, "image_path"))}
                        </ViewGrid>
                      </AdminDialog>
                      <AdminDialog title={`Edit ${value(event, "title")}`} description="Update event details." triggerLabel="Edit">
                        <RowForm action={saveEvent}>
                          <input type="hidden" name="current_slug" value={value(event, "slug")} />
                          <div className="flex items-center justify-end gap-3">
                            <DeleteButton table="events" id={value(event, "slug")} keyName="slug" />
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Slug" name="slug" row={event} />
                            <Field label="Title" name="title" row={event} required />
                            <Field label="Date" name="event_date" row={event} type="date" required />
                            <Field label="Venue" name="venue" row={event} required />
                            <Field label="Organizers" name="organizers" row={event} />
                            <Field label="Role" name="role" row={event} />
                            <Field label="Category" name="category" row={event} options={EVENT_CATEGORY_OPTIONS} />
                          </div>
                          <ExistingImageField row={event} />
                          <UploadField label="Replace event image in Supabase Storage" name="image_file" accept="image/*" />
                          <PublishControls row={event} />
                        </RowForm>
                      </AdminDialog>
                    </>
                  ),
                }))}
              />
            </AdminCollapsibleSection>

            <AdminCollapsibleSection
              id="skills"
              title="Skills"
              count={skills.length}
              addDialog={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <AdminDialog title="Import Skills" description="Upload skills as category and skill pairs. Missing categories will be created automatically." triggerLabel="Import CSV">
                    <RowForm action={importSkillsCsv}>
                      <div className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4">
                        <p className="text-sm font-medium text-white">CSV format</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--foreground-muted)]">
                          Required columns are category, skill, and category_published.
                        </p>
                        <a
                          href={SKILLS_CSV_TEMPLATE_HREF}
                          download="skills-import-template.csv"
                          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--blue-300)] transition hover:border-[var(--border-strong)] hover:text-white sm:min-h-0 sm:py-1.5"
                        >
                          Download format
                        </a>
                      </div>
                      <UploadField label="Upload skills CSV" name="csv_file" accept=".csv,text/csv" />
                    </RowForm>
                  </AdminDialog>
                  <AdminDialog title="Add Skill Category" description="Create a new skills category." triggerLabel="Add Category" triggerVariant="primary">
                    <RowForm action={saveSkillCategory}>
                      <Field label="Name" name="name" required />
                      <PublishControls />
                    </RowForm>
                  </AdminDialog>
                </div>
              }
            >
              {skillCategories.map((category) => {
                const categorySkills = skills.filter((skill) => value(skill, "category_id") === value(category, "id"));
                return (
                  <div key={value(category, "id")} className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{value(category, "name")}</p>
                        <p className="mt-1 text-xs text-[var(--foreground-muted)]">{categorySkills.length} skills</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <AdminDialog title={value(category, "name")} description="Category overview" triggerLabel="View">
                          <ViewGrid>
                            {labelValue("Category", value(category, "name"))}
                            {labelValue("Published", checked(category) ? "Yes" : "No")}
                          </ViewGrid>
                        </AdminDialog>
                        <AdminDialog title={`Edit ${value(category, "name")}`} description="Update category details." triggerLabel="Edit">
                          <RowForm action={saveSkillCategory}>
                            <input type="hidden" name="id" value={value(category, "id")} />
                            <div className="flex items-center justify-end gap-3">
                              <DeleteButton table="skill_categories" id={value(category, "id")} />
                            </div>
                            <Field label="Category name" name="name" row={category} required />
                            <PublishControls row={category} />
                          </RowForm>
                        </AdminDialog>
                        <AdminDialog title={`Add Skill to ${value(category, "name")}`} description="Create a new skill in this category." triggerLabel="Add Skill">
                          <RowForm action={saveSkill}>
                            <input type="hidden" name="category_id" value={value(category, "id")} />
                            <Field label="Skill name" name="name" required />
                          </RowForm>
                        </AdminDialog>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
                      {categorySkills.map((skill) => (
                        <RecordRow
                          key={value(skill, "id")}
                          title={value(skill, "name")}
                          subtitle={value(category, "name")}
                          viewDialog={
                            <AdminDialog title={value(skill, "name")} description="Skill overview" triggerLabel="View">
                              <ViewGrid>
                                {labelValue("Skill", value(skill, "name"))}
                                {labelValue("Category", value(category, "name"))}
                              </ViewGrid>
                            </AdminDialog>
                          }
                          editDialog={
                            <AdminDialog title={`Edit ${value(skill, "name")}`} description="Update skill details." triggerLabel="Edit">
                              <RowForm action={saveSkill}>
                                <input type="hidden" name="id" value={value(skill, "id")} />
                                <input type="hidden" name="category_id" value={value(category, "id")} />
                                <div className="flex items-center justify-end gap-3">
                                  <DeleteButton table="skills" id={value(skill, "id")} />
                                </div>
                                <Field label="Skill name" name="name" row={skill} required />
                                <input type="hidden" name="existing_sort_order" value={value(skill, "sort_order")} />
                              </RowForm>
                            </AdminDialog>
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </AdminCollapsibleSection>

            <AdminCollapsibleSection
              id="creative-portfolio"
              title="Creative Portfolio"
              count={creativeCategories.length + creativePhotos.length}
              addDialog={
                <AdminDialog title="Add Creative Category" description="Create a photography or creative category with an optional showcase image." triggerLabel="Add Category" triggerVariant="primary">
                  <RowForm action={saveCreativeCategory}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Slug" name="slug" />
                      <Field label="Name" name="name" required />
                    </div>
                    <Field label="Description" name="description" textarea />
                    <UploadField label="Upload category showcase image" name="image_file" accept="image/*" />
                    <PublishControls />
                  </RowForm>
                </AdminDialog>
              }
            >
              {creativeCategories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/[0.02] px-5 py-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-sm font-semibold text-white">
                        {creativeCategoriesMissing ? "Creative CMS tables are not available yet" : "No creative categories yet"}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-muted)]">
                        {creativeCategoriesMissing
                          ? "Run the latest Supabase schema for creative categories, then refresh this page to manage photography categories here."
                          : "Create them one by one, or add the default set used across the portfolio: Portrait, Event, Street, Creative, and Astrophotography."}
                      </p>
                    </div>
                    {!creativeCategoriesMissing ? (
                      <form action={seedDefaultCreativeCategories}>
                        <SaveButton type="submit" className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-white transition hover:border-[var(--blue-300)] hover:text-[var(--blue-200)]">
                          Add default categories
                        </SaveButton>
                      </form>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {creativePhotosMissing ? (
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-4 text-sm text-yellow-100">
                  The creative_photos table is not available in Supabase. Category management still works, but photo upload and listings require the full creative schema.
                </div>
              ) : null}

              <AdminSortableList
                table="creative_categories"
                sortOptions={[
                  { label: "Custom", value: "custom" },
                  { label: "Name", value: "name" },
                ]}
                items={creativeCategories.map((category) => {
                  const categoryPhotos = creativePhotos.filter((photo) => value(photo, "category_id") === value(category, "id"));
                  return {
                    id: value(category, "id"),
                    anchorId: `creative-category-${value(category, "slug")}`,
                    title: value(category, "name"),
                    subtitle: value(category, "slug"),
                    meta: `${categoryPhotos.length} photos`,
                    sortOrder: Number(value(category, "sort_order")) || 0,
                    sortValues: {
                      name: value(category, "name"),
                    },
                    actions: (
                      <>
                        <AdminDialog title={value(category, "name")} description="Creative category overview" triggerLabel="View">
                          <ViewGrid>
                            <AssetPreview src={value(category, "showcase_image_path")} alt={value(category, "name")} />
                            {labelValue("Slug", value(category, "slug"))}
                            {labelValue("Description", value(category, "description"))}
                            {labelValue("Showcase", value(category, "showcase_image_path"))}
                            {labelValue("Published", checked(category) ? "Yes" : "No")}
                          </ViewGrid>
                        </AdminDialog>
                        <AdminDialog title={`Edit ${value(category, "name")}`} description="Update category and showcase image." triggerLabel="Edit">
                          <RowForm action={saveCreativeCategory}>
                            <input type="hidden" name="id" value={value(category, "id")} />
                            <input type="hidden" name="current_slug" value={value(category, "slug")} />
                            <div className="flex items-center justify-end gap-3">
                              <DeleteButton table="creative_categories" id={value(category, "id")} />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <Field label="Slug" name="slug" row={category} />
                              <Field label="Name" name="name" row={category} required />
                            </div>
                            <Field label="Description" name="description" row={category} textarea />
                            <ExistingShowcaseImageField row={category} />
                            <UploadField label="Replace category showcase image" name="image_file" accept="image/*" />
                            <PublishControls row={category} />
                          </RowForm>
                        </AdminDialog>
                        {!creativePhotosMissing ? (
                          <>
                            <AdminDialog title={`Upload photos to ${value(category, "name")}`} description="Upload a single image, multiple selected images, or choose a folder." triggerLabel="Upload Photos">
                              <RowForm action={uploadCreativePhotos}>
                                <input type="hidden" name="category_id" value={value(category, "id")} />
                                <input type="hidden" name="category_slug" value={value(category, "slug")} />
                                {/* Client-side validated upload inputs for large folders */}
                                <UploadWithValidation label="Upload single or multiple images" name="image_files" accept="image/*" multiple maxFiles={50} />
                                <UploadWithValidation label="Upload a folder of images" name="image_files" accept="image/*" multiple directory maxFiles={200} />
                                <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
                                  Folder upload keeps all image files in this category. Each file becomes a photo record using the filename as the title.
                                </p>
                              </RowForm>
                            </AdminDialog>
                          </>
                        ) : (
                          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm text-yellow-100">
                            Photo uploads are unavailable because the creative_photos table is missing.
                          </div>
                        )}
                      </>
                    ),
                  };
                })}
              />

              <AdminPhotoCategoryBrowser
                categories={creativeCategories
                  .map((category) => {
                    const categoryPhotos = creativePhotos.filter((photo) => value(photo, "category_id") === value(category, "id"));
                    return {
                      id: value(category, "id"),
                      name: value(category, "name"),
                      slug: value(category, "slug"),
                      description: value(category, "description"),
                      photoCount: categoryPhotos.length,
                      photos: categoryPhotos.map((photo) => ({
                        aspectRatio:
                          value(photo, "aspect_ratio") === "portrait" ||
                            value(photo, "aspect_ratio") === "square" ||
                            value(photo, "aspect_ratio") === "landscape"
                            ? (value(photo, "aspect_ratio") as "portrait" | "landscape" | "square")
                            : "landscape",
                        id: value(photo, "id"),
                        title: value(photo, "title"),
                        subtitle: value(photo, "aspect_ratio"),
                        meta: checked(photo) ? "Published" : "Draft",
                        featured: Boolean(photo.featured),
                        published: checked(photo),
                        sortOrder: Number(value(photo, "sort_order")) || 0,
                        imagePath: value(photo, "image_path"),
                        editAction: (
                          <div className="flex items-center gap-2">
                            <form action={deleteRecord}>
                              <input type="hidden" name="table" value="creative_photos" />
                              <input type="hidden" name="id" value={value(photo, "id")} />
                              <button
                                type="submit"
                                aria-label={`Delete ${value(photo, "title")}`}
                                title="Delete"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-red-400/20 bg-black/45 text-red-200 transition hover:bg-red-500/10 sm:h-8 sm:w-8"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </form>
                            <AdminDialog
                              title={`Edit ${value(photo, "title")}`}
                              description="Update or remove this photo."
                              triggerLabel="Edit photo"
                              triggerContent={<SquarePen className="h-3.5 w-3.5" />}
                              triggerClassName="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white transition hover:border-[var(--border-strong)] hover:text-white sm:h-8 sm:w-8"
                            >
                              <RowForm action={saveCreativePhoto}>
                                <input type="hidden" name="id" value={value(photo, "id")} />
                                <input type="hidden" name="category_id" value={value(category, "id")} />
                                <input type="hidden" name="category_slug" value={value(category, "slug")} />
                                <div className="flex items-center justify-end gap-3">
                                  <DeleteButton table="creative_photos" id={value(photo, "id")} />
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <Field label="Title" name="title" row={photo} required />
                                  <Field label="Aspect ratio" name="aspect_ratio" row={photo} options={PHOTO_ASPECT_OPTIONS} />
                                </div>
                                <ExistingImageField row={photo} />
                                <UploadField label="Replace photo image" name="image_file" accept="image/*" />
                                <AdminCheckbox name="featured" label="Featured" defaultChecked={Boolean(photo.featured)} />
                                <PublishControls row={photo} />
                              </RowForm>
                            </AdminDialog>
                          </div>
                        ),
                      })),
                    };
                  })
                  .filter((category) => category.photoCount > 0)}
              />
            </AdminCollapsibleSection>

            <AdminCollapsibleSection id="site-content" title="Site Copy" count={siteRows.length}>
              {siteRows.map((row) => (
                <RecordRow
                  key={value(row, "key")}
                  title={value(row, "key")}
                  subtitle="JSON content"
                  viewDialog={
                    <AdminDialog title={value(row, "key")} description="Current JSON value" triggerLabel="View">
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-subtle)]/60 p-4">
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-[var(--foreground-muted)]">
                          {JSON.stringify(row.value, null, 2)}
                        </pre>
                      </div>
                    </AdminDialog>
                  }
                  editDialog={
                    <AdminDialog title={`Edit ${value(row, "key")}`} description="Update this JSON content block." triggerLabel="Edit">
                      <RowForm action={saveSiteContent}>
                        <input type="hidden" name="key" value={value(row, "key")} />
                        <label className="flex flex-col gap-1 text-xs text-[var(--foreground-muted)]">
                          <span>
                            JSON value
                            <span className="ml-1 text-[var(--blue-300)]">*</span>
                          </span>
                          <textarea
                            name="value"
                            rows={12}
                            defaultValue={JSON.stringify(row.value, null, 2)}
                            className="rounded-xl border border-[var(--border)] bg-white/[0.03] px-3 py-2 font-mono text-xs text-white outline-none transition focus:border-[var(--border-strong)]"
                            required
                          />
                        </label>
                      </RowForm>
                    </AdminDialog>
                  }
                />
              ))}
            </AdminCollapsibleSection>
          </div>
        </main>
      </div>
    </div>
  );
}

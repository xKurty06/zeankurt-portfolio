import { redirect } from "next/navigation";
import {
  deleteRecord,
  saveCertification,
  saveEvent,
  saveExperience,
  saveProject,
  saveSiteContent,
  saveSkill,
  saveSkillCategory,
  signOut,
} from "@/app/admin/actions";
import { AdminDialog } from "@/app/admin/AdminDialog";
import { AdminSelect } from "@/app/admin/AdminSelect";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/supabase/config";

type Row = Record<string, unknown>;

function value(row: Row | undefined, key: string) {
  const raw = row?.[key];
  return raw == null ? "" : String(raw);
}

function checked(row: Row | undefined, key = "published") {
  return row ? row[key] !== false : true;
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

function PublishSort({ row }: { row?: Row }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <Field label="Sort order" name="sort_order" row={row} type="number" />
      <label className="flex items-end gap-2 pb-2 text-sm text-[var(--foreground-muted)]">
        <input name="published" type="checkbox" defaultChecked={checked(row)} className="accent-[var(--blue-400)]" />
        Published
      </label>
    </div>
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
        className="rounded-full border border-red-400/20 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/10"
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
    <form action={action} className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4">
      <div className="grid gap-3">{children}</div>
    </form>
  );
}

function ExistingImageField({ row }: { row?: Row }) {
  const current = value(row, "image_path");
  return (
    <>
      <input type="hidden" name="existing_image_path" value={current} />
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

function UploadField({
  label,
  name,
  accept,
}: {
  label: string;
  name: string;
  accept: string;
}) {
  return (
    <label className="rounded-2xl border border-dashed border-[var(--border)] bg-white/[0.015] px-4 py-3 text-xs font-medium text-[var(--foreground-muted)]">
      {label}
      <input
        name={name}
        type="file"
        accept={accept}
        className="mt-2 text-sm text-[var(--foreground-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-2 file:font-semibold file:text-[var(--blue-200)]"
      />
    </label>
  );
}

function Section({
  id,
  title,
  count,
  addDialog,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  addDialog?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-3xl border border-[var(--border)] bg-[var(--background-elevated)] p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-white">{title}</h2>
          {count !== undefined ? (
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground-muted)]">
              {count} {count === 1 ? "record" : "records"}
            </span>
          ) : null}
        </div>
        {addDialog}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

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
    siteContentResult,
  ] = await Promise.all([
    admin.from("projects").select("*").order("sort_order", { ascending: true }),
    admin.from("experience_items").select("*").order("sort_order", { ascending: true }),
    admin.from("certifications").select("*").order("sort_order", { ascending: true }),
    admin.from("events").select("*").order("event_date", { ascending: false }),
    admin.from("skill_categories").select("*").order("sort_order", { ascending: true }),
    admin.from("skills").select("*").order("sort_order", { ascending: true }),
    admin.from("site_content").select("*").order("key", { ascending: true }),
  ]);

  const projects = (projectsResult.data ?? []) as Row[];
  const experiences = (experienceResult.data ?? []) as Row[];
  const certifications = (certificationsResult.data ?? []) as Row[];
  const events = (eventsResult.data ?? []) as Row[];
  const skillCategories = (skillCategoriesResult.data ?? []) as Row[];
  const skills = (skillsResult.data ?? []) as Row[];
  const siteRows = (siteContentResult.data ?? []) as Row[];

  const navItems = [
    { id: "projects", label: "Projects", count: projects.length, icon: "⬡" },
    { id: "experience", label: "Experience", count: experiences.length, icon: "◈" },
    { id: "certifications", label: "Certifications", count: certifications.length, icon: "◎" },
    { id: "events", label: "Events", count: events.length, icon: "◷" },
    { id: "skills", label: "Skills", count: skills.length, icon: "◆" },
    { id: "site-content", label: "Site Copy", count: siteRows.length, icon: "◉" },
  ];

  return (
    <div className="min-h-dvh bg-[var(--background)] text-white">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--blue-300)]">CMS</span>
            <span className="h-4 w-px bg-[var(--border)]" />
            <span className="font-[family-name:var(--font-syne)] text-sm font-semibold">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white"
            >
              Back to portfolio
            </a>
            <span className="hidden text-xs text-[var(--foreground-muted)] sm:block">{user.email}</span>
            <form action={signOut}>
              <button className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white">
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
              Sections
            </p>
            {navItems.map((item) => (
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
                <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[10px] tabular-nums">{item.count}</span>
              </a>
            ))}

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
                Total records
              </p>
              <p className="font-[family-name:var(--font-syne)] text-2xl font-semibold text-[var(--blue-300)]">
                {projects.length + experiences.length + certifications.length + events.length + skills.length}
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
                className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground-muted)] transition hover:text-white"
              >
                {item.label}
                <span className="ml-1.5 text-[var(--blue-300)]">{item.count}</span>
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-6">
            <Section
              id="projects"
              title="Projects"
              count={projects.length}
              addDialog={
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
                    <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                      <input name="featured" type="checkbox" className="accent-[var(--blue-400)]" />
                      Featured
                    </label>
                    <PublishSort />
                  </RowForm>
                </AdminDialog>
              }
            >
              {projects.map((project) => (
                <RecordRow
                  key={value(project, "slug")}
                  title={value(project, "title")}
                  subtitle={value(project, "year")}
                  meta={value(project, "role")}
                  viewDialog={
                    <AdminDialog title={value(project, "title")} description="Project overview" triggerLabel="View">
                      <ViewGrid>
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
                  }
                  editDialog={
                    <AdminDialog title={`Edit ${value(project, "title")}`} description="Update project details." triggerLabel="Edit">
                      <RowForm action={saveProject}>
                        <input type="hidden" name="current_slug" value={value(project, "slug")} />
                        <div className="flex items-center justify-between gap-3">
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
                        <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                          <input name="featured" type="checkbox" defaultChecked={project?.featured === true} className="accent-[var(--blue-400)]" />
                          Featured
                        </label>
                        <PublishSort row={project} />
                      </RowForm>
                    </AdminDialog>
                  }
                />
              ))}
            </Section>

            <Section
              id="experience"
              title="Experience"
              count={experiences.length}
              addDialog={
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
                    <PublishSort />
                  </RowForm>
                </AdminDialog>
              }
            >
              {experiences.map((item) => (
                <RecordRow
                  key={value(item, "slug")}
                  title={value(item, "organization")}
                  subtitle={value(item, "period")}
                  meta={value(item, "role")}
                  viewDialog={
                    <AdminDialog title={value(item, "organization")} description="Experience overview" triggerLabel="View">
                      <ViewGrid>
                        {labelValue("Slug", value(item, "slug"))}
                        {labelValue("Role", value(item, "role"))}
                        {labelValue("Period", value(item, "period"))}
                        {labelValue("Type", value(item, "type"))}
                        {labelValue("Description", value(item, "description"))}
                      </ViewGrid>
                    </AdminDialog>
                  }
                  editDialog={
                    <AdminDialog title={`Edit ${value(item, "organization")}`} description="Update experience details." triggerLabel="Edit">
                      <RowForm action={saveExperience}>
                        <input type="hidden" name="current_slug" value={value(item, "slug")} />
                        <div className="flex items-center justify-between gap-3">
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
                        <PublishSort row={item} />
                      </RowForm>
                    </AdminDialog>
                  }
                />
              ))}
            </Section>

            <Section
              id="certifications"
              title="Certifications"
              count={certifications.length}
              addDialog={
                <AdminDialog title="Add Certification" description="Create a new certification entry." triggerLabel="Add Certification" triggerVariant="primary">
                  <RowForm action={saveCertification}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Name" name="name" required />
                      <Field label="Issuer" name="issuer" required />
                      <Field label="Issued" name="issued" />
                      <Field label="Expires" name="expires" />
                    </div>
                    <UploadField label="Upload certificate to Supabase Storage" name="image_file" accept="image/*,application/pdf" />
                    <PublishSort />
                  </RowForm>
                </AdminDialog>
              }
            >
              {certifications.map((cert) => (
                <RecordRow
                  key={value(cert, "id")}
                  title={value(cert, "name")}
                  subtitle={value(cert, "issuer")}
                  meta={value(cert, "issued")}
                  viewDialog={
                    <AdminDialog title={value(cert, "name")} description="Certification overview" triggerLabel="View">
                      <ViewGrid>
                        {labelValue("Issuer", value(cert, "issuer"))}
                        {labelValue("Issued", value(cert, "issued"))}
                        {labelValue("Expires", value(cert, "expires"))}
                        {labelValue("Asset", value(cert, "image_path"))}
                      </ViewGrid>
                    </AdminDialog>
                  }
                  editDialog={
                    <AdminDialog title={`Edit ${value(cert, "name")}`} description="Update certification details." triggerLabel="Edit">
                      <RowForm action={saveCertification}>
                        <input type="hidden" name="id" value={value(cert, "id")} />
                        <div className="flex items-center justify-between gap-3">
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
                        <PublishSort row={cert} />
                      </RowForm>
                    </AdminDialog>
                  }
                />
              ))}
            </Section>

            <Section
              id="events"
              title="Events"
              count={events.length}
              addDialog={
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
                    <PublishSort />
                  </RowForm>
                </AdminDialog>
              }
            >
              {events.map((event) => (
                <RecordRow
                  key={value(event, "slug")}
                  title={value(event, "title")}
                  subtitle={value(event, "event_date")}
                  meta={value(event, "venue")}
                  viewDialog={
                    <AdminDialog title={value(event, "title")} description="Event overview" triggerLabel="View">
                      <ViewGrid>
                        {labelValue("Slug", value(event, "slug"))}
                        {labelValue("Date", value(event, "event_date"))}
                        {labelValue("Venue", value(event, "venue"))}
                        {labelValue("Organizers", value(event, "organizers"))}
                        {labelValue("Role", value(event, "role"))}
                        {labelValue("Category", value(event, "category"))}
                        {labelValue("Asset", value(event, "image_path"))}
                      </ViewGrid>
                    </AdminDialog>
                  }
                  editDialog={
                    <AdminDialog title={`Edit ${value(event, "title")}`} description="Update event details." triggerLabel="Edit">
                      <RowForm action={saveEvent}>
                        <input type="hidden" name="current_slug" value={value(event, "slug")} />
                        <div className="flex items-center justify-between gap-3">
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
                        <PublishSort row={event} />
                      </RowForm>
                    </AdminDialog>
                  }
                />
              ))}
            </Section>

            <Section
              id="skills"
              title="Skills"
              count={skills.length}
              addDialog={
                <AdminDialog title="Add Skill Category" description="Create a new skills category." triggerLabel="Add Category" triggerVariant="primary">
                  <RowForm action={saveSkillCategory}>
                    <Field label="Name" name="name" required />
                    <PublishSort />
                  </RowForm>
                </AdminDialog>
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
                            {labelValue("Sort order", value(category, "sort_order"))}
                          </ViewGrid>
                        </AdminDialog>
                        <AdminDialog title={`Edit ${value(category, "name")}`} description="Update category details." triggerLabel="Edit">
                          <RowForm action={saveSkillCategory}>
                            <input type="hidden" name="id" value={value(category, "id")} />
                            <div className="flex items-center justify-between gap-3">
                              <DeleteButton table="skill_categories" id={value(category, "id")} />
                            </div>
                            <Field label="Category name" name="name" row={category} required />
                            <PublishSort row={category} />
                          </RowForm>
                        </AdminDialog>
                        <AdminDialog title={`Add Skill to ${value(category, "name")}`} description="Create a new skill in this category." triggerLabel="Add Skill">
                          <RowForm action={saveSkill}>
                            <input type="hidden" name="category_id" value={value(category, "id")} />
                            <Field label="Skill name" name="name" required />
                            <Field label="Sort order" name="sort_order" type="number" />
                          </RowForm>
                        </AdminDialog>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
                      {categorySkills.map((skill) => (
                        <RecordRow
                          key={value(skill, "id")}
                          title={value(skill, "name")}
                          subtitle={`Order ${value(skill, "sort_order") || "0"}`}
                          viewDialog={
                            <AdminDialog title={value(skill, "name")} description="Skill overview" triggerLabel="View">
                              <ViewGrid>
                                {labelValue("Skill", value(skill, "name"))}
                                {labelValue("Category", value(category, "name"))}
                                {labelValue("Sort order", value(skill, "sort_order"))}
                              </ViewGrid>
                            </AdminDialog>
                          }
                          editDialog={
                            <AdminDialog title={`Edit ${value(skill, "name")}`} description="Update skill details." triggerLabel="Edit">
                              <RowForm action={saveSkill}>
                                <input type="hidden" name="id" value={value(skill, "id")} />
                                <input type="hidden" name="category_id" value={value(category, "id")} />
                                <div className="flex items-center justify-between gap-3">
                                  <DeleteButton table="skills" id={value(skill, "id")} />
                                </div>
                                <Field label="Skill name" name="name" row={skill} required />
                                <Field label="Sort order" name="sort_order" row={skill} type="number" />
                              </RowForm>
                            </AdminDialog>
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </Section>

            <Section id="site-content" title="Site Copy" count={siteRows.length}>
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
            </Section>
          </div>
        </main>
      </div>
    </div>
  );
}

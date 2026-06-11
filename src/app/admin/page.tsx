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

function Field({
  label,
  name,
  row,
  type = "text",
  textarea = false,
  required = false,
}: {
  label: string;
  name: string;
  row?: Row;
  type?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  const className =
    "rounded-xl border border-[var(--border)] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--border-strong)]";

  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--foreground-muted)]">
      {label}
      {textarea ? (
        <textarea
          name={name}
          required={required}
          defaultValue={value(row, name)}
          rows={3}
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

function PublishSort({ row }: { row?: Row }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <Field label="Sort order" name="sort_order" row={row} type="number" />
      <label className="flex items-end gap-2 pb-2 text-sm text-[var(--foreground-muted)]">
        <input name="published" type="checkbox" defaultChecked={checked(row)} />
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
    <form
      action={action}
      className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4"
    >
      <div className="grid gap-3">{children}</div>
      <button
        type="submit"
        className="mt-4 rounded-full bg-[var(--blue-500)] px-4 py-2 text-sm font-semibold text-[#03121a] transition hover:bg-[var(--blue-300)]"
      >
        Save
      </button>
    </form>
  );
}

// ─── Section wrapper with ID anchor ──────────────────────────────────────────
function Section({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-3xl border border-[var(--border)] bg-[var(--background-elevated)] p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold text-white">
          {title}
        </h2>
        {count !== undefined && (
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground-muted)]">
            {count} {count === 1 ? "record" : "records"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

// ─── Collapsible record card ──────────────────────────────────────────────────
function RecordCard({
  title,
  subtitle,
  isNew = false,
  children,
}: {
  title: string;
  subtitle?: string;
  isNew?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-2xl border border-[var(--border)] bg-white/[0.02]"
      open={isNew}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 select-none">
        <div className="flex items-center gap-3">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              isNew ? "bg-[var(--blue-300)]" : "bg-white/20"
            }`}
          />
          <div>
            <span className="text-sm font-semibold text-white">{title}</span>
            {subtitle && (
              <span className="ml-2 text-xs text-[var(--foreground-muted)]">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <svg
          className="h-4 w-4 shrink-0 text-[var(--foreground-muted)] transition-transform group-open:rotate-180"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="border-t border-[var(--border)] px-4 pb-4 pt-4">
        {children}
      </div>
    </details>
  );
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
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--blue-300)]">
              CMS
            </span>
            <span className="h-4 w-px bg-[var(--border)]" />
            <span className="font-[family-name:var(--font-syne)] text-sm font-semibold">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-[var(--foreground-muted)] sm:block">
              {user.email}
            </span>
            <form action={signOut}>
              <button className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-screen-xl gap-0 lg:gap-6 px-0 lg:px-5 py-6">
        {/* ── Sidebar nav ─────────────────────────────────────── */}
        <aside className="hidden lg:block w-52 shrink-0">
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
                <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 text-[10px] tabular-nums">
                  {item.count}
                </span>
              </a>
            ))}

            {/* Stats summary */}
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

        {/* ── Main content ────────────────────────────────────── */}
        <main className="min-w-0 flex-1 flex flex-col gap-6 px-4 lg:px-0">

          {/* Mobile quick-jump strip */}
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
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

          {/* ── Projects ──────────────────────────────────────── */}
          <Section id="projects" title="Projects" count={projects.length}>
            {/* New project — always open */}
            <RecordCard title="Add new project" isNew>
              <RowForm action={saveProject}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Slug" name="slug" />
                  <Field label="Title" name="title" required />
                  <Field label="Year" name="year" required />
                  <Field label="Role" name="role" required />
                  <Field label="GitHub URL" name="github_url" />
                  <Field label="Live URL" name="live_url" />
                  <Field label="Image path or URL" name="image_path" />
                  <Field label="Image seed" name="image_seed" />
                  <Field label="Status" name="status" />
                  <Field label="Tags, comma separated" name="tags" row={{ tags: "" }} />
                </div>
                <Field label="Description" name="description" textarea required />
                <Field label="Long description" name="long_description" textarea />
                <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--foreground-muted)]">
                  Upload preview
                  <input name="image_file" type="file" accept="image/*" className="text-sm" />
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <input name="featured" type="checkbox" />
                  Featured
                </label>
                <PublishSort />
              </RowForm>
            </RecordCard>

            {/* Existing projects grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((project) => (
                <RecordCard
                  key={value(project, "slug")}
                  title={value(project, "title")}
                  subtitle={value(project, "year")}
                >
                  <RowForm action={saveProject}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <DeleteButton table="projects" id={value(project, "slug")} keyName="slug" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Slug" name="slug" row={project} />
                      <Field label="Title" name="title" row={project} required />
                      <Field label="Year" name="year" row={project} required />
                      <Field label="Role" name="role" row={project} required />
                      <Field label="GitHub URL" name="github_url" row={project} />
                      <Field label="Live URL" name="live_url" row={project} />
                      <Field label="Image path or URL" name="image_path" row={project} />
                      <Field label="Image seed" name="image_seed" row={project} />
                      <Field label="Status" name="status" row={project} />
                      <Field
                        label="Tags, comma separated"
                        name="tags"
                        row={{ tags: Array.isArray(project?.tags) ? (project?.tags as string[]).join(", ") : "" }}
                      />
                    </div>
                    <Field label="Description" name="description" row={project} textarea required />
                    <Field label="Long description" name="long_description" row={project} textarea />
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--foreground-muted)]">
                      Upload preview
                      <input name="image_file" type="file" accept="image/*" className="text-sm" />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                      <input name="featured" type="checkbox" defaultChecked={project?.featured === true} />
                      Featured
                    </label>
                    <PublishSort row={project} />
                  </RowForm>
                </RecordCard>
              ))}
            </div>
          </Section>

          {/* ── Experience ────────────────────────────────────── */}
          <Section id="experience" title="Experience" count={experiences.length}>
            <RecordCard title="Add new experience" isNew>
              <RowForm action={saveExperience}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Slug" name="slug" />
                  <Field label="Organization" name="organization" required />
                  <Field label="Role" name="role" required />
                  <Field label="Period" name="period" required />
                  <Field label="Type" name="type" required />
                </div>
                <Field label="Description" name="description" textarea required />
                <PublishSort />
              </RowForm>
            </RecordCard>

            <div className="grid gap-3 sm:grid-cols-2">
              {experiences.map((item) => (
                <RecordCard
                  key={value(item, "slug")}
                  title={value(item, "organization")}
                  subtitle={value(item, "period")}
                >
                  <RowForm action={saveExperience}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <DeleteButton table="experience_items" id={value(item, "slug")} keyName="slug" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Slug" name="slug" row={item} />
                      <Field label="Organization" name="organization" row={item} required />
                      <Field label="Role" name="role" row={item} required />
                      <Field label="Period" name="period" row={item} required />
                      <Field label="Type" name="type" row={item} required />
                    </div>
                    <Field label="Description" name="description" row={item} textarea required />
                    <PublishSort row={item} />
                  </RowForm>
                </RecordCard>
              ))}
            </div>
          </Section>

          {/* ── Certifications ────────────────────────────────── */}
          <Section id="certifications" title="Certifications" count={certifications.length}>
            <RecordCard title="Add new certification" isNew>
              <RowForm action={saveCertification}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Name" name="name" required />
                  <Field label="Issuer" name="issuer" required />
                  <Field label="Issued" name="issued" />
                  <Field label="Expires" name="expires" />
                  <Field label="Image path or URL" name="image_path" />
                </div>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--foreground-muted)]">
                  Upload certificate
                  <input name="image_file" type="file" accept="image/*,application/pdf" className="text-sm" />
                </label>
                <PublishSort />
              </RowForm>
            </RecordCard>

            <div className="grid gap-3 sm:grid-cols-2">
              {certifications.map((cert) => (
                <RecordCard
                  key={value(cert, "id")}
                  title={value(cert, "name")}
                  subtitle={value(cert, "issuer")}
                >
                  <RowForm action={saveCertification}>
                    <input type="hidden" name="id" value={value(cert, "id")} />
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <DeleteButton table="certifications" id={value(cert, "id")} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Name" name="name" row={cert} required />
                      <Field label="Issuer" name="issuer" row={cert} required />
                      <Field label="Issued" name="issued" row={cert} />
                      <Field label="Expires" name="expires" row={cert} />
                      <Field label="Image path or URL" name="image_path" row={cert} />
                    </div>
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--foreground-muted)]">
                      Upload certificate
                      <input name="image_file" type="file" accept="image/*,application/pdf" className="text-sm" />
                    </label>
                    <PublishSort row={cert} />
                  </RowForm>
                </RecordCard>
              ))}
            </div>
          </Section>

          {/* ── Events ────────────────────────────────────────── */}
          <Section id="events" title="Events" count={events.length}>
            <RecordCard title="Add new event" isNew>
              <RowForm action={saveEvent}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Slug" name="slug" />
                  <Field label="Title" name="title" required />
                  <Field label="Date" name="event_date" type="date" required />
                  <Field label="Venue" name="venue" required />
                  <Field label="Organizers" name="organizers" />
                  <Field label="Role" name="role" />
                  <Field label="Category" name="category" />
                  <Field label="Image path or URL" name="image_path" />
                </div>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--foreground-muted)]">
                  Upload event image
                  <input name="image_file" type="file" accept="image/*" className="text-sm" />
                </label>
                <PublishSort />
              </RowForm>
            </RecordCard>

            <div className="grid gap-3 sm:grid-cols-2">
              {events.map((event) => (
                <RecordCard
                  key={value(event, "slug")}
                  title={value(event, "title")}
                  subtitle={value(event, "event_date")}
                >
                  <RowForm action={saveEvent}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <DeleteButton table="events" id={value(event, "slug")} keyName="slug" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Slug" name="slug" row={event} />
                      <Field label="Title" name="title" row={event} required />
                      <Field label="Date" name="event_date" row={event} type="date" required />
                      <Field label="Venue" name="venue" row={event} required />
                      <Field label="Organizers" name="organizers" row={event} />
                      <Field label="Role" name="role" row={event} />
                      <Field label="Category" name="category" row={event} />
                      <Field label="Image path or URL" name="image_path" row={event} />
                    </div>
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--foreground-muted)]">
                      Upload event image
                      <input name="image_file" type="file" accept="image/*" className="text-sm" />
                    </label>
                    <PublishSort row={event} />
                  </RowForm>
                </RecordCard>
              ))}
            </div>
          </Section>

          {/* ── Skills ────────────────────────────────────────── */}
          <Section id="skills" title="Skills" count={skills.length}>
            {/* Add category */}
            <RecordCard title="Add new skill category" isNew>
              <RowForm action={saveSkillCategory}>
                <Field label="Name" name="name" required />
                <PublishSort />
              </RowForm>
            </RecordCard>

            {skillCategories.map((category) => (
              <div
                key={value(category, "id")}
                className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-4"
              >
                {/* Category header form */}
                <RowForm action={saveSkillCategory}>
                  <input type="hidden" name="id" value={value(category, "id")} />
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-white">{value(category, "name")}</h3>
                    <DeleteButton table="skill_categories" id={value(category, "id")} />
                  </div>
                  <Field label="Category name" name="name" row={category} required />
                  <PublishSort row={category} />
                </RowForm>

                {/* Skills in category */}
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                    Skills in this category
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {/* Add skill */}
                    <RowForm action={saveSkill}>
                      <input type="hidden" name="category_id" value={value(category, "id")} />
                      <Field label="New skill name" name="name" required />
                      <Field label="Sort order" name="sort_order" type="number" />
                    </RowForm>

                    {skills
                      .filter((skill) => value(skill, "category_id") === value(category, "id"))
                      .map((skill) => (
                        <RowForm key={value(skill, "id")} action={saveSkill}>
                          <input type="hidden" name="id" value={value(skill, "id")} />
                          <input type="hidden" name="category_id" value={value(category, "id")} />
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-white">{value(skill, "name")}</span>
                            <DeleteButton table="skills" id={value(skill, "id")} />
                          </div>
                          <Field label="Skill name" name="name" row={skill} required />
                          <Field label="Sort order" name="sort_order" row={skill} type="number" />
                        </RowForm>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* ── Site / About Copy ─────────────────────────────── */}
          <Section id="site-content" title="Site Copy" count={siteRows.length}>
            <div className="grid gap-4 sm:grid-cols-2">
              {siteRows.map((row) => (
                <RowForm key={value(row, "key")} action={saveSiteContent}>
                  <input type="hidden" name="key" value={value(row, "key")} />
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-[var(--blue-500)]/10 px-2 py-0.5 font-mono text-[10px] text-[var(--blue-300)]">
                      {value(row, "key")}
                    </span>
                  </div>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--foreground-muted)]">
                    JSON value
                    <textarea
                      name="value"
                      rows={8}
                      defaultValue={JSON.stringify(row.value, null, 2)}
                      className="rounded-xl border border-[var(--border)] bg-white/[0.03] px-3 py-2 font-mono text-xs text-white outline-none transition focus:border-[var(--border-strong)]"
                    />
                  </label>
                </RowForm>
              ))}
            </div>
          </Section>

        </main>
      </div>
    </div>
  );
}
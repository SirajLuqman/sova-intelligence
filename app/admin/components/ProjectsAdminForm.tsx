"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Ellipsis, Loader2, Plus, Save, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";

/* =========================================================
   TYPES
========================================================= */

interface ProjectData {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon?: string;
  images: string[];
  targetPartners: string;
  focusDomain: string;
  deliverables: string[];
}

interface ProjectChanges {
  id: string;
  changes?: Partial<ProjectData>;
  isNew?: boolean;
  project?: ProjectData;
}

interface ProjectsResponse {
  projects?: ProjectData[];
  sectionTitle?: string;
  data?: {
    projects?: ProjectData[];
    sectionTitle?: string;
  };
}

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_PROJECTS = 50;
const MAX_IMAGES = 5;
const MAX_DELIVERABLES = 3;

const MAX_SECTION_TITLE_CHARS = 50;
const MAX_BADGE_CHARS = 35;
const MAX_TITLE_CHARS = 70;
const MAX_DESCRIPTION_CHARS = 300;
const MAX_TARGET_PARTNERS_CHARS = 40;
const MAX_FOCUS_DOMAIN_CHARS = 45;
const MAX_DELIVERABLE_CHARS = 100;

/* =========================================================
   CHARACTER COUNTER
========================================================= */

function CharacterCounter({ current, max }: { current: number; max: number }) {
  const isAtLimit = current >= max;

  return (
    <span
      className={`text-[10px] font-mono font-normal normal-case tracking-normal ${
        isAtLimit ? "font-semibold text-red-600" : "text-stone-400"
      }`}
    >
      {current}/{max}
    </span>
  );
}

/* =========================================================
   PROJECT COMPARISON
========================================================= */

function getProjectChanges(
  original: ProjectData | undefined,
  current: ProjectData,
): Partial<ProjectData> {
  if (!original) {
    return {};
  }

  const changes: Partial<ProjectData> = {};

  const fields: Array<
    | "badge"
    | "title"
    | "description"
    | "icon"
    | "targetPartners"
    | "focusDomain"
  > = [
    "badge",
    "title",
    "description",
    "icon",
    "targetPartners",
    "focusDomain",
  ];

  fields.forEach((field) => {
    if (current[field] !== original[field]) {
      changes[field] = current[field] as never;
    }
  });

  if (
    JSON.stringify(current.deliverables ?? []) !==
    JSON.stringify(original.deliverables ?? [])
  ) {
    changes.deliverables = current.deliverables ?? [];
  }

  /*
   * Images are intentionally compared separately.
   *
   * If images did not change, they are NOT sent.
   * This is especially important because existing images
   * may be large Base64 data URLs.
   */
  if (
    JSON.stringify(current.images ?? []) !==
    JSON.stringify(original.images ?? [])
  ) {
    changes.images = current.images ?? [];
  }

  return changes;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ProjectsAdminForm() {
  const [draftProjects, setDraftProjects] = useState<ProjectData[]>([]);
  const [sectionTitle, setSectionTitle] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setisLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /*
   * Stores the last successfully saved state.
   *
   * This lets us determine exactly what changed when
   * Save Changes is pressed.
   */
  const savedProjectsRef = useRef<ProjectData[]>([]);
  const savedSectionTitleRef = useRef("");

  /* =======================================================
     LOAD PROJECT SETTINGS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setisLoading(true);

      try {
        const response = await fetch("/api/projects", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load project settings.");
        }

        const result = (await response.json()) as ProjectsResponse;

        if (cancelled) {
          return;
        }

        const payload = result.data ?? result;

        const projects = Array.isArray(payload.projects)
          ? payload.projects
          : [];

        const title =
          typeof payload.sectionTitle === "string" ? payload.sectionTitle : "";

        setDraftProjects(projects);
        setSectionTitle(title);

        /*
         * Store the server state as the baseline.
         */
        savedProjectsRef.current = structuredClone(projects);
        savedSectionTitleRef.current = title;

        setActiveProjectId(projects[0]?.id ?? null);

        setIsCreating(false);
        setShowMenu(false);
      } catch (error) {
        console.error("Failed to load project settings:", error);

        if (!cancelled) {
          setDraftProjects([]);
          setSectionTitle("");
          setActiveProjectId(null);

          savedProjectsRef.current = [];
          savedSectionTitleRef.current = "";
        }
      } finally {
        if (!cancelled) {
          setisLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     SECTION TITLE
  ======================================================= */

  const handleSectionTitleChange = (value: string) => {
    setSectionTitle(value.slice(0, MAX_SECTION_TITLE_CHARS));
  };

  /* =======================================================
     DERIVED STATE
  ======================================================= */

  const projectCount = draftProjects.length;

  const activeIndex =
    activeProjectId !== null
      ? draftProjects.findIndex((project) => project.id === activeProjectId)
      : -1;

  const activeProject = activeIndex >= 0 ? draftProjects[activeIndex] : null;

  /* =======================================================
     PROJECT UPDATE
  ======================================================= */

  const updateProject = (
    field: keyof ProjectData,
    value: string | string[],
  ) => {
    if (!activeProjectId) {
      return;
    }

    setDraftProjects((current) =>
      current.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              [field]: value,
            }
          : project,
      ),
    );
  };

  /* =======================================================
     TITLE
  ======================================================= */

  const updateTitle = (value: string) => {
    updateProject("title", value.slice(0, MAX_TITLE_CHARS));
  };

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const updateDescription = (value: string) => {
    updateProject("description", value.slice(0, MAX_DESCRIPTION_CHARS));
  };

  /* =======================================================
     DELIVERABLES
  ======================================================= */

  const updateDeliverable = (index: number, value: string) => {
    if (!activeProjectId) {
      return;
    }

    const limitedValue = value.slice(0, MAX_DELIVERABLE_CHARS);

    setDraftProjects((current) =>
      current.map((project) => {
        if (project.id !== activeProjectId) {
          return project;
        }

        const deliverables = [...(project.deliverables ?? [])];

        deliverables[index] = limitedValue;

        return {
          ...project,
          deliverables,
        };
      }),
    );
  };

  const addDeliverable = () => {
    if (!activeProjectId) {
      return;
    }

    if ((activeProject?.deliverables?.length ?? 0) >= MAX_DELIVERABLES) {
      return;
    }

    setDraftProjects((current) =>
      current.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              deliverables: [...(project.deliverables ?? []), ""],
            }
          : project,
      ),
    );
  };

  const removeDeliverable = (index: number) => {
    if (!activeProjectId) {
      return;
    }

    setDraftProjects((current) =>
      current.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              deliverables: (project.deliverables ?? []).filter(
                (_, itemIndex) => itemIndex !== index,
              ),
            }
          : project,
      ),
    );
  };

  /* =======================================================
     IMAGES
  ======================================================= */

  const removeImage = (index: number) => {
    if (!activeProjectId) {
      return;
    }

    setDraftProjects((current) =>
      current.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              images: (project.images ?? []).filter(
                (_, imageIndex) => imageIndex !== index,
              ),
            }
          : project,
      ),
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeProjectId) {
      return;
    }

    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
      return;
    }

    const currentImageCount = activeProject?.images?.length ?? 0;

    const remainingSlots = MAX_IMAGES - currentImageCount;

    const filesToUpload = files.slice(0, Math.max(remainingSlots, 0));

    if (!filesToUpload.length) {
      event.target.value = "";
      return;
    }

    Promise.all(
      filesToUpload.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              } else {
                reject(new Error(`Failed to read ${file.name}`));
              }
            };

            reader.onerror = () => {
              reject(new Error(`Failed to read ${file.name}`));
            };

            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((newImages) => {
        setDraftProjects((current) =>
          current.map((project) =>
            project.id === activeProjectId
              ? {
                  ...project,
                  images: [...(project.images ?? []), ...newImages].slice(
                    0,
                    MAX_IMAGES,
                  ),
                }
              : project,
          ),
        );
      })
      .catch((error) => {
        console.error("Project image upload failed:", error);
      })
      .finally(() => {
        event.target.value = "";
      });
  };

  /* =======================================================
     PROJECT CREATION
  ======================================================= */

  const addProject = () => {
    if (projectCount >= MAX_PROJECTS) {
      return;
    }

    const newProject: ProjectData = {
      id: crypto.randomUUID(),
      badge: "",
      title: "",
      description: "",
      icon: "globe",
      images: [],
      targetPartners: "",
      focusDomain: "",
      deliverables: [""],
    };

    setDraftProjects((current) => [...current, newProject]);

    setActiveProjectId(newProject.id);

    setIsCreating(true);
    setShowMenu(false);
  };

  /* =======================================================
     PROJECT DELETION
  ======================================================= */

  const deleteProject = () => {
    if (!activeProject) {
      return;
    }

    setDraftProjects((current) =>
      current.filter((project) => project.id !== activeProject.id),
    );

    setActiveProjectId(null);
    setIsCreating(false);
    setShowMenu(false);
  };

  /* =======================================================
     PROJECT SELECTION
  ======================================================= */

  const selectProject = (projectId: string) => {
    setActiveProjectId(projectId);

    setIsCreating(false);
    setShowMenu(false);
  };

  /* =======================================================
     FORM SUBMIT
  ======================================================= */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const originalProjects = savedProjectsRef.current;

      const originalProjectMap = new Map(
        originalProjects.map((project) => [project.id, project]),
      );

      const changedProjects: ProjectChanges[] = [];

      /*
       * Detect changed/new projects.
       */
      for (const project of draftProjects) {
        const originalProject = originalProjectMap.get(project.id);

        /*
         * New project:
         * send the complete project because the server
         * does not have it yet.
         */
        if (!originalProject) {
          changedProjects.push({
            id: project.id,
            isNew: true,
            project,
          });

          continue;
        }

        /*
         * Existing project:
         * send ONLY changed fields.
         */
        const changes = getProjectChanges(originalProject, project);

        if (Object.keys(changes).length > 0) {
          changedProjects.push({
            id: project.id,
            changes,
          });
        }
      }

      /*
       * Detect deleted projects.
       */
      const currentProjectIds = new Set(
        draftProjects.map((project) => project.id),
      );

      const deletedProjectIds = originalProjects
        .filter((project) => !currentProjectIds.has(project.id))
        .map((project) => project.id);

      const trimmedSectionTitle = sectionTitle.trim();

      const sectionTitleChanged =
        trimmedSectionTitle !== savedSectionTitleRef.current;

      /*
       * IMPORTANT:
       * We are no longer sending the entire projects array.
       */
      const requestBody = {
        sectionTitle: sectionTitleChanged ? trimmedSectionTitle : undefined,
        changedProjects,
        deletedProjectIds,
      };

      const payloadSize = JSON.stringify(requestBody).length;

      console.log(
        "[Projects PUT] optimized payload:",
        `${(payloadSize / 1024 / 1024).toFixed(2)} MB`,
      );

      console.log("[Projects PUT] changed projects:", changedProjects.length);

      console.log("[Projects PUT] deleted projects:", deletedProjectIds.length);

      const response = await fetch("/api/projects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to save project settings.");
      }

      const payload = result?.data ?? result;

      const savedProjects = Array.isArray(payload?.projects)
        ? payload.projects
        : draftProjects;

      const savedSectionTitle =
        typeof payload?.sectionTitle === "string"
          ? payload.sectionTitle
          : trimmedSectionTitle;

      setDraftProjects(savedProjects);
      setSectionTitle(savedSectionTitle);

      /*
       * Update our baseline only after successful save.
       */
      savedProjectsRef.current = structuredClone(savedProjects);

      savedSectionTitleRef.current = savedSectionTitle;

      setActiveProjectId((currentId) => {
        if (
          currentId &&
          savedProjects.some((project: ProjectData) => project.id === currentId)
        ) {
          return currentId;
        }

        return savedProjects[0]?.id ?? null;
      });

      setIsCreating(false);
      setShowMenu(false);

      toast.success("Changes saved successfully.");
    } catch (error) {
      console.error("Failed to save projects:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save project settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     Loading STATE
  ======================================================= */

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-stone-200 bg-[#FAF9F5]">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <Loader2 className="h-6 w-6 animate-spin text-stone-800" />

          <p className="text-xs font-serif tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if (projectCount === 0 && !isCreating) {
    return (
      <div className="space-y-8 font-sans">
        <div className="space-y-4 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Section Title
            </h4>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-end">
              <CharacterCounter
                current={sectionTitle.length}
                max={MAX_SECTION_TITLE_CHARS}
              />
            </div>

            <input
              type="text"
              maxLength={MAX_SECTION_TITLE_CHARS}
              value={sectionTitle}
              onChange={(event) => handleSectionTitleChange(event.target.value)}
              placeholder="e.g. Our Projects"
              className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
            />
          </div>
        </div>

        <div className="mx-auto max-w-5xl pb-12">
          <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="max-w-sm text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-500 transition duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white">
                <Plus size={20} strokeWidth={1.5} />
              </div>

              <h2 className="mt-6 font-serif text-2xl tracking-tight text-stone-950">
                No projects yet
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-500">
                Start by creating the first project for the website.
              </p>

              <button
                type="button"
                onClick={addProject}
                className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-stone-900 px-5 py-3 text-xs font-medium text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md active:translate-y-0"
              >
                <Plus size={14} strokeWidth={1.8} />
                New Project
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <div className="space-y-8 font-sans">
      <div className="space-y-4 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
        <div className="border-b border-stone-200 pb-3">
          <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
            Heading
          </h4>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-end">
            <CharacterCounter
              current={sectionTitle.length}
              max={MAX_SECTION_TITLE_CHARS}
            />
          </div>

          <input
            type="text"
            maxLength={MAX_SECTION_TITLE_CHARS}
            value={sectionTitle}
            onChange={(event) => handleSectionTitleChange(event.target.value)}
            placeholder="e.g. Our Projects"
            className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-6xl pb-12">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="grid min-h-[700px] grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)]">
              <ProjectLibrary
                projects={draftProjects}
                activeProjectId={activeProjectId}
                onSelect={selectProject}
                onAdd={addProject}
              />

              <main className="min-w-0 border-t border-stone-200 bg-white lg:border-l lg:border-t-0">
                {activeProject ? (
                  <ProjectEditor
                    key={activeProject.id}
                    activeProject={activeProject}
                    activeIndex={activeIndex}
                    projectCount={projectCount}
                    isCreating={isCreating}
                    showMenu={showMenu}
                    setShowMenu={setShowMenu}
                    updateProject={updateProject}
                    updateTitle={updateTitle}
                    updateDescription={updateDescription}
                    updateDeliverable={updateDeliverable}
                    addDeliverable={addDeliverable}
                    removeDeliverable={removeDeliverable}
                    removeImage={removeImage}
                    handleImageUpload={handleImageUpload}
                    deleteProject={deleteProject}
                  />
                ) : (
                  <EmptyEditorState />
                )}
              </main>
            </div>
          </div>

          <div className="flex justify-end pt-10">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-stone-900 px-6 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   PROJECT LIBRARY
========================================================= */

function ProjectLibrary({
  projects,
  activeProjectId,
  onSelect,
  onAdd,
}: {
  projects: ProjectData[];
  activeProjectId: string | null;
  onSelect: (projectId: string) => void;
  onAdd: () => void;
}) {
  return (
    <aside className="space-y-3 rounded-xl border border-stone-300 bg-white p-4 lg:min-h-[700px]">
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <span className="font-serif text-[11px] font-bold uppercase tracking-widest text-stone-500">
          Project Library
        </span>

        <button
          type="button"
          onClick={onAdd}
          disabled={projects.length >= MAX_PROJECTS}
          className="group flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          aria-label="Create new project"
          title="New Project"
        >
          <Plus
            size={15}
            strokeWidth={1.7}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
        </button>
      </div>

      <div className="space-y-2">
        {projects.map((project, index) => (
          <button
            type="button"
            key={project.id}
            onClick={() => onSelect(project.id)}
            className={`flex w-full cursor-pointer flex-col gap-1 rounded-lg border p-3.5 text-left text-xs transition-all ${
              activeProjectId === project.id
                ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                : "border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100"
            }`}
          >
            <span
              className={`font-mono text-[10px] font-bold ${
                activeProjectId === project.id
                  ? "text-amber-400"
                  : "text-amber-900"
              }`}
            >
              Project {index + 1}
            </span>

            <span className="truncate font-serif text-sm font-medium">
              {project.title || "Untitled Project"}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

/* =========================================================
   EMPTY EDITOR
========================================================= */

function EmptyEditorState() {
  return (
    <div className="flex min-h-[700px] items-center justify-center px-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-400 transition duration-300 hover:-translate-y-0.5 hover:bg-white">
          <span className="font-mono text-xs">—</span>
        </div>

        <h2 className="mt-6 font-serif text-2xl tracking-tight text-stone-900">
          Choose a project
        </h2>

        <p className="mt-3 text-sm leading-6 text-stone-500">
          Select a project from the library to open its editor.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PROJECT EDITOR
========================================================= */

function ProjectEditor({
  activeProject,
  activeIndex,
  projectCount,
  isCreating,
  showMenu,
  setShowMenu,
  updateProject,
  updateTitle,
  updateDescription,
  updateDeliverable,
  addDeliverable,
  removeDeliverable,
  removeImage,
  handleImageUpload,
  deleteProject,
}: {
  activeProject: ProjectData;
  activeIndex: number;
  projectCount: number;
  isCreating: boolean;
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  updateProject: (field: keyof ProjectData, value: string | string[]) => void;
  updateTitle: (value: string) => void;
  updateDescription: (value: string) => void;
  updateDeliverable: (index: number, value: string) => void;
  addDeliverable: () => void;
  removeDeliverable: (index: number) => void;
  removeImage: (index: number) => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  deleteProject: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  const currentProjectNumber = String(activeIndex + 1).padStart(2, "0");

  const deliverables = activeProject.deliverables ?? [];

  const images = activeProject.images ?? [];

  const titleLimitReached = activeProject.title.length >= MAX_TITLE_CHARS;

  const descriptionLimitReached =
    activeProject.description.length >= MAX_DESCRIPTION_CHARS;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`min-w-0 transition-all duration-300 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : isCreating
            ? "translate-y-3 opacity-0"
            : "translate-x-2 opacity-0"
      }`}
    >
      <div className="border-b border-stone-200 bg-[#FAF9F5] px-6 py-5 sm:px-8">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.16em] text-amber-900">
                PROJECT {currentProjectNumber} /{" "}
                {String(projectCount).padStart(2, "0")}
              </span>

              {isCreating && (
                <span className="rounded-md border border-amber-800/20 bg-amber-900/5 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-amber-900">
                  New
                </span>
              )}
            </div>

            <h1 className="mt-2 font-serif text-xl font-medium tracking-tight text-stone-950 sm:text-2xl">
              {activeProject.title || "Untitled Project"}
            </h1>

            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-stone-500">
              {activeProject.badge || "Project Information"}
            </p>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowMenu((current) => !current)}
              aria-label="Project actions"
              aria-expanded={showMenu}
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border bg-white text-stone-600 transition-all duration-200 ${
                showMenu
                  ? "border-stone-400 text-stone-950 shadow-sm"
                  : "border-stone-300 hover:border-stone-400 hover:text-stone-950"
              }`}
            >
              <Ellipsis size={16} />
            </button>

            {showMenu && (
              <>
                <button
                  type="button"
                  aria-label="Close project menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setShowMenu(false)}
                />

                <div className="absolute right-0 top-10 z-20 w-44 origin-top-right animate-[fadeIn_150ms_ease-out] rounded-lg border border-stone-200 bg-white py-1 shadow-[0_12px_30px_rgba(41,37,36,0.12)]">
                  <button
                    type="button"
                    onClick={deleteProject}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-xs text-red-700 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                    Delete Project
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white px-6 py-6 sm:px-8 lg:px-9">
        <section>
          <EditorSectionHeading number="01" title="Project Information" />

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_160px]">
              <Field
                label="Category"
                value={activeProject.badge}
                onChange={(value) => updateProject("badge", value)}
                placeholder="International Ecosystem"
                maxCharacters={MAX_BADGE_CHARS}
              />

              <div>
                <label
                  htmlFor="project-icon"
                  className="mb-1.5 block text-[9px] font-semibold uppercase tracking-widest text-stone-600"
                >
                  Icon
                </label>

                <select
                  id="project-icon"
                  value={activeProject.icon || "globe"}
                  onChange={(event) =>
                    updateProject("icon", event.target.value)
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-xs text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10"
                >
                  <option value="globe">Globe</option>
                  <option value="shieldCheck">Shield</option>
                  <option value="building2">Building</option>
                </select>
              </div>
            </div>

            <CharacterField
              label="Project Title"
              value={activeProject.title}
              onChange={updateTitle}
              placeholder="Global Collaboration"
              maxCharacters={MAX_TITLE_CHARS}
              limitReached={titleLimitReached}
            />

            <CharacterTextAreaField
              label="Description"
              value={activeProject.description}
              onChange={updateDescription}
              placeholder="Describe the project's strategic direction..."
              maxCharacters={MAX_DESCRIPTION_CHARS}
              limitReached={descriptionLimitReached}
            />
          </div>
        </section>

        <section className="mt-8 border-t border-stone-200 pt-6">
          <EditorSectionHeading number="02" title="Project Details" />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="Target Partners"
              value={activeProject.targetPartners}
              onChange={(value) => updateProject("targetPartners", value)}
              placeholder="Enterprise & Public Sector"
              maxCharacters={MAX_TARGET_PARTNERS_CHARS}
            />

            <Field
              label="Focus Domain"
              value={activeProject.focusDomain}
              onChange={(value) => updateProject("focusDomain", value)}
              placeholder="AI Governance & Data Security"
              maxCharacters={MAX_FOCUS_DOMAIN_CHARS}
            />
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-end justify-between gap-6">
              <div>
                <label className="text-[9px] font-semibold uppercase tracking-widest text-stone-600">
                  Key Deliverables
                </label>

                <p className="mt-1 text-[10px] text-stone-400">
                  Define the primary outcomes for this project.
                </p>
              </div>

              {deliverables.length < MAX_DELIVERABLES && (
                <button
                  type="button"
                  onClick={addDeliverable}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 transition-all duration-200 hover:bg-amber-50 hover:text-amber-700"
                >
                  <Plus size={13} strokeWidth={1.8} />
                  Add
                </button>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-stone-200">
              {deliverables.map((deliverable, index) => {
                const characterCount = deliverable.length;

                const limitReached = characterCount >= MAX_DELIVERABLE_CHARS;

                return (
                  <div
                    key={`${activeProject.id}-deliverable-${index}`}
                    className="group flex items-start gap-3 border-b border-stone-200 px-3 py-3 transition-colors last:border-b-0 hover:bg-stone-50/60"
                  >
                    <span className="mt-1.5 w-6 shrink-0 font-mono text-[9px] tracking-wider text-stone-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <input
                        value={deliverable}
                        onChange={(event) =>
                          updateDeliverable(index, event.target.value)
                        }
                        placeholder="Enter deliverable"
                        maxLength={MAX_DELIVERABLE_CHARS}
                        className="w-full bg-transparent py-1 text-xs text-stone-800 outline-none placeholder:text-stone-400"
                      />

                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span
                          className={`text-[9px] ${
                            limitReached ? "text-amber-800" : "text-stone-400"
                          }`}
                        >
                          {limitReached
                            ? "Maximum character limit reached."
                            : `Maximum ${MAX_DELIVERABLE_CHARS} characters.`}
                        </span>

                        <span
                          className={`font-mono text-[8px] tracking-wider ${
                            limitReached ? "text-amber-800" : "text-stone-300"
                          }`}
                        >
                          {characterCount}/{MAX_DELIVERABLE_CHARS}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDeliverable(index)}
                      aria-label={`Remove deliverable ${index + 1}`}
                      className="mt-1 shrink-0 rounded-md p-1 text-stone-300 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-700 focus:opacity-100 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 border-t border-stone-200 pt-6">
          <EditorSectionHeading number="03" title="Project Images" />

          <div className="mb-5">
            <p className="text-[10px] leading-5 text-stone-400">
              Add up to five images for the project presentation.
            </p>

            <p className="mt-1 font-mono text-[9px] tracking-wider text-stone-400">
              {images.length} / {MAX_IMAGES} images
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image, index) => (
              <div
                key={`${activeProject.id}-image-${index}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-stone-200 bg-stone-100 transition-all duration-300 hover:border-stone-300 hover:shadow-sm"
              >
                <Image
                  src={image}
                  alt={`Project image ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6">
                  <span className="font-mono text-[8px] tracking-wider text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-white/90 text-stone-800 opacity-0 transition-all duration-200 hover:bg-white group-hover:opacity-100 focus:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <label className="group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50/60 transition-all duration-300 hover:border-stone-400 hover:bg-white hover:shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-stone-400 transition-all duration-300 group-hover:border-stone-500 group-hover:text-stone-700">
                  <Upload size={15} strokeWidth={1.5} />
                </span>

                <span className="mt-2.5 text-[9px] font-semibold uppercase tracking-wider text-stone-500 transition-colors duration-200 group-hover:text-stone-800">
                  Add Image
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   EDITOR SECTION HEADING
========================================================= */

function EditorSectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-stone-100 pb-3">
      <span className="font-mono text-[9px] font-medium tracking-wider text-amber-900">
        {number}
      </span>

      <h2 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
        {title}
      </h2>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxCharacters,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxCharacters: number;
}) {
  const characterCount = value.length;

  const limitReached = characterCount >= maxCharacters;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <label className="block text-[9px] font-semibold uppercase tracking-widest text-stone-600">
          {label}
        </label>

        <span
          className={`font-mono text-[9px] tracking-wider ${
            limitReached ? "text-amber-800" : "text-stone-400"
          }`}
        >
          {characterCount}/{maxCharacters}
        </span>
      </div>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value.slice(0, maxCharacters))
        }
        placeholder={placeholder}
        maxLength={maxCharacters}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none transition focus:ring-2 focus:ring-stone-900/10 ${
          limitReached
            ? "border-amber-400 focus:border-amber-500"
            : "border-stone-300 focus:border-stone-400"
        }`}
      />

      <p
        className={`mt-1.5 text-[9px] ${
          limitReached ? "text-amber-800" : "text-stone-400"
        }`}
      >
        {limitReached
          ? "Maximum character limit reached."
          : `Maximum ${maxCharacters} characters.`}
      </p>
    </div>
  );
}

/* =========================================================
   CHARACTER FIELD
========================================================= */

function CharacterField({
  label,
  value,
  onChange,
  placeholder,
  maxCharacters,
  limitReached,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxCharacters: number;
  limitReached: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <label className="block text-[9px] font-semibold uppercase tracking-widest text-stone-600">
          {label}
        </label>

        <span
          className={`font-mono text-[9px] tracking-wider ${
            limitReached ? "text-amber-800" : "text-stone-400"
          }`}
        >
          {value.length}/{maxCharacters}
        </span>
      </div>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value.slice(0, maxCharacters))
        }
        placeholder={placeholder}
        maxLength={maxCharacters}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 font-serif text-sm text-stone-900 outline-none transition focus:ring-2 focus:ring-stone-900/10 ${
          limitReached
            ? "border-amber-400 focus:border-amber-500"
            : "border-stone-300 focus:border-stone-400"
        }`}
      />

      <p
        className={`mt-1.5 text-[9px] ${
          limitReached ? "text-amber-800" : "text-stone-400"
        }`}
      >
        {limitReached
          ? "Maximum character limit reached."
          : `Maximum ${maxCharacters} characters.`}
      </p>
    </div>
  );
}

/* =========================================================
   CHARACTER TEXT AREA
========================================================= */

function CharacterTextAreaField({
  label,
  value,
  onChange,
  placeholder,
  maxCharacters,
  limitReached,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxCharacters: number;
  limitReached: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <label className="block text-[9px] font-semibold uppercase tracking-widest text-stone-600">
          {label}
        </label>

        <span
          className={`font-mono text-[9px] tracking-wider ${
            limitReached ? "text-amber-800" : "text-stone-400"
          }`}
        >
          {value.length}/{maxCharacters}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value.slice(0, maxCharacters))
        }
        placeholder={placeholder}
        maxLength={maxCharacters}
        rows={4}
        className={`w-full resize-none rounded-lg border bg-white px-3.5 py-2.5 text-xs leading-relaxed text-stone-900 outline-none transition focus:ring-2 focus:ring-stone-900/10 ${
          limitReached
            ? "border-amber-400 focus:border-amber-500"
            : "border-stone-300 focus:border-stone-400"
        }`}
      />

      <p
        className={`mt-1.5 text-[9px] ${
          limitReached ? "text-amber-800" : "text-stone-400"
        }`}
      >
        {limitReached
          ? "Maximum character limit reached."
          : `Maximum ${maxCharacters} characters.`}
      </p>
    </div>
  );
}

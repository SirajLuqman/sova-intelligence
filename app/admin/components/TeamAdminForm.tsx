"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type MutableRefObject,
} from "react";
import {
  Ellipsis,
  Eye,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

/* =========================================================
   TYPES & INTERFACES
========================================================= */

export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  imageUrl: string | null;
}

export interface TeamResponse {
  sectionTitle?: string;
  members?: TeamMember[];
  error?: string;
  message?: string;
}

export interface FormErrors {
  [key: string]: string;
}

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_TEAM_MEMBERS = 30;

const MAX_SECTION_TITLE_LENGTH = 80;
const MAX_NAME_LENGTH = 60;
const MAX_DESIGNATION_LENGTH = 80;

const DEFAULT_SECTION_TITLE = "The people behind our work.";

const RECOMMENDED_IMAGE_WIDTH = 800;
const RECOMMENDED_IMAGE_HEIGHT = 1000;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/* =========================================================
   REUSABLE STYLES
========================================================= */

const fieldLabelClass =
  "text-[9px] font-semibold uppercase tracking-widest text-stone-600";

const inputErrorClass =
  "w-full rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs text-stone-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-900/10";

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
   HELPER FUNCTIONS
========================================================= */

const createEmptyMember = (): TeamMember => ({
  id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  name: "New Team Member",
  designation: "Role Title",
  imageUrl: null,
});

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to convert image to Data URL format."));
    };

    reader.onerror = () => {
      reject(new Error("Failed to read the selected image."));
    };

    reader.readAsDataURL(file);
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function TeamAdminForm() {
  /* =======================================================
     TEAM DATA
  ======================================================= */

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [sectionTitle, setSectionTitle] = useState(DEFAULT_SECTION_TITLE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* =======================================================
     ASYNC & ACTION STATES
  ======================================================= */

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  /* =======================================================
     VALIDATION STATES
  ======================================================= */

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  /* =======================================================
     IMAGE UPLOAD STATES
  ======================================================= */

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(
    null,
  );

  /* =======================================================
     SEARCH STATE
  ======================================================= */

  const [searchQuery, setSearchQuery] = useState("");

  /* =======================================================
     ELEMENT REFERENCES
  ======================================================= */

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* =======================================================
     ACTIVE MEMBER
  ======================================================= */

  const activeMember =
    members.find((member) => member.id === selectedId) || null;

  const activeIndex =
    selectedId !== null
      ? members.findIndex((member) => member.id === selectedId)
      : -1;

  /* =======================================================
     FETCH TEAM MEMBERS
  ======================================================= */

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/team", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      const data: TeamResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load Team settings.");
      }

      const loadedMembers = Array.isArray(data.members) ? data.members : [];

      setMembers(loadedMembers);

      setSectionTitle(
        typeof data.sectionTitle === "string" && data.sectionTitle.trim()
          ? data.sectionTitle.trim()
          : DEFAULT_SECTION_TITLE,
      );

      if (loadedMembers.length > 0) {
        setSelectedId(loadedMembers[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (error) {
      console.error("[TeamAdminForm] Error fetching team data:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load Team settings.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTeamMembers();
  }, []);

  /* =======================================================
     MEMBER SELECTION
  ======================================================= */

  const handleSelectMember = (id: string) => {
    setSelectedId(id);
    setFieldErrors({});
  };

  /* =======================================================
     SECTION TITLE
  ======================================================= */

  const handleSectionTitleChange = (value: string) => {
    setSectionTitle(value.slice(0, MAX_SECTION_TITLE_LENGTH));

    if (fieldErrors.sectionTitle) {
      setFieldErrors((previousErrors) => {
        const updatedErrors = {
          ...previousErrors,
        };

        delete updatedErrors.sectionTitle;

        return updatedErrors;
      });
    }
  };

  /* =======================================================
     ADD MEMBER
  ======================================================= */

  const handleAddMember = () => {
    if (members.length >= MAX_TEAM_MEMBERS) {
      toast.error(
        `Limit reached: You can only add up to ${MAX_TEAM_MEMBERS} team members.`,
      );

      return;
    }

    const newMember = createEmptyMember();

    setMembers((previousMembers) => [...previousMembers, newMember]);

    setSelectedId(newMember.id);
    setFieldErrors({});
    setSearchQuery("");
  };

  /* =======================================================
     REMOVE ACTIVE MEMBER
  ======================================================= */

  const handleRemoveActiveMember = () => {
    if (!selectedId) {
      return;
    }

    const updatedMembers = members.filter((member) => member.id !== selectedId);

    setMembers(updatedMembers);

    if (updatedMembers.length > 0) {
      setSelectedId(updatedMembers[0].id);
    } else {
      setSelectedId(null);
    }

    setFieldErrors({});
  };
  /* =======================================================
     ACTIVE MEMBER FIELD UPDATE
  ======================================================= */

  const handleFieldChange = (field: "name" | "designation", value: string) => {
    if (!selectedId) {
      return;
    }

    const errorKey = `${field}_${selectedId}`;

    if (fieldErrors[errorKey]) {
      setFieldErrors((previousErrors) => {
        const updatedErrors = {
          ...previousErrors,
        };

        delete updatedErrors[errorKey];

        return updatedErrors;
      });
    }

    setMembers((previousMembers) =>
      previousMembers.map((member) =>
        member.id === selectedId
          ? {
              ...member,
              [field]: value,
            }
          : member,
      ),
    );
  };

  /* =======================================================
     IMAGE UPLOAD
  ======================================================= */

  const processUploadedFile = async (file: File) => {
    if (!selectedId) {
      toast.error("Please select a team member first.");
      return;
    }

    setUploadProgress(0);

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      toast.error(
        `Invalid file type (${
          file.type || "unknown"
        }). Only JPG, PNG, and WebP images are allowed.`,
      );

      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(
        `File size exceeds the 5 MB limit. Selected file: ${formatFileSize(
          file.size,
        )}.`,
      );

      return;
    }

    try {
      setUploadProgress(20);

      const base64Data = await convertFileToBase64(file);

      setUploadProgress(70);

      setMembers((previousMembers) =>
        previousMembers.map((member) =>
          member.id === selectedId
            ? {
                ...member,
                imageUrl: base64Data,
              }
            : member,
        ),
      );

      setUploadProgress(100);

      window.setTimeout(() => {
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error("[TeamAdminForm] Image processing failed:", error);

      toast.error("Failed to read the selected image. Please try again.");

      setUploadProgress(0);
    }
  };

  /* =======================================================
     FILE INPUT
  ======================================================= */

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      void processUploadedFile(file);
    }

    event.target.value = "";
  };

  /* =======================================================
     DRAG & DROP
  ======================================================= */

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void processUploadedFile(file);
    }
  };

  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  const handleRemoveImage = () => {
    if (!selectedId || !activeMember?.imageUrl) {
      return;
    }

    setMembers((previousMembers) =>
      previousMembers.map((member) =>
        member.id === selectedId
          ? {
              ...member,
              imageUrl: null,
            }
          : member,
      ),
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setPreviewModalImage(null);
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateAllMembers = (): boolean => {
    const errors: FormErrors = {};
    let firstInvalidId: string | null = null;

    if (!sectionTitle.trim()) {
      errors.sectionTitle = "Section title is required.";
    } else if (sectionTitle.length > MAX_SECTION_TITLE_LENGTH) {
      errors.sectionTitle = `Section title exceeds ${MAX_SECTION_TITLE_LENGTH} characters.`;
    }

    members.forEach((member, index) => {
      const memberNumber = index + 1;

      if (!member.name.trim()) {
        errors[`name_${member.id}`] =
          `Member ${memberNumber}: Name is required.`;

        if (!firstInvalidId) {
          firstInvalidId = member.id;
        }
      } else if (member.name.length > MAX_NAME_LENGTH) {
        errors[`name_${member.id}`] =
          `Member ${memberNumber}: Name exceeds ${MAX_NAME_LENGTH} characters.`;

        if (!firstInvalidId) {
          firstInvalidId = member.id;
        }
      }

      if (!member.designation.trim()) {
        errors[`designation_${member.id}`] =
          `Member ${memberNumber}: Designation is required.`;

        if (!firstInvalidId) {
          firstInvalidId = member.id;
        }
      } else if (member.designation.length > MAX_DESIGNATION_LENGTH) {
        errors[`designation_${member.id}`] =
          `Member ${memberNumber}: Designation exceeds ${MAX_DESIGNATION_LENGTH} characters.`;

        if (!firstInvalidId) {
          firstInvalidId = member.id;
        }
      }
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (firstInvalidId) {
        setSelectedId(firstInvalidId);
      }

      const firstErrorMessage = Object.values(errors)[0];

      toast.error(`Validation failed: ${firstErrorMessage}`);

      return false;
    }

    return true;
  };

  /* =======================================================
     SAVE CHANGES
  ======================================================= */

  const handleSaveChanges = async (event?: FormEvent) => {
    event?.preventDefault();

    if (isSaving) {
      return;
    }

    if (!validateAllMembers()) {
      return;
    }

    try {
      setIsSaving(true);

      const cleanedPayload = members.map((member) => ({
        id: member.id,
        name: member.name.trim(),
        designation: member.designation.trim(),
        imageUrl: member.imageUrl ? member.imageUrl.trim() : null,
      }));

      const cleanedSectionTitle = sectionTitle.trim();

      const response = await fetch("/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionTitle: cleanedSectionTitle,
          members: cleanedPayload,
        }),
      });

      const responseData: TeamResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            "Server returned an error while saving changes.",
        );
      }

      const serverMembers =
        responseData.members && Array.isArray(responseData.members)
          ? responseData.members
          : cleanedPayload;

      const serverSectionTitle =
        typeof responseData.sectionTitle === "string" &&
        responseData.sectionTitle.trim()
          ? responseData.sectionTitle.trim()
          : cleanedSectionTitle;

      setMembers(serverMembers);
      setSectionTitle(serverSectionTitle);

      if (
        selectedId &&
        !serverMembers.some((member) => member.id === selectedId)
      ) {
        setSelectedId(serverMembers[0]?.id || null);
      }

      setFieldErrors({});

      toast.success("Changes saved successfully.");
    } catch (error) {
      console.error("[TeamAdminForm] Save execution error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save team member details.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     FILTERED MEMBERS
  ======================================================= */

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(normalizedSearchQuery) ||
      member.designation.toLowerCase().includes(normalizedSearchQuery),
  );

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

  if (members.length === 0) {
    return (
      <>
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
                  max={MAX_SECTION_TITLE_LENGTH}
                />
              </div>

              <input
                id="team-section-title"
                type="text"
                value={sectionTitle}
                onChange={(event) =>
                  handleSectionTitleChange(event.target.value)
                }
                maxLength={MAX_SECTION_TITLE_LENGTH}
                placeholder="e.g. Our Team"
                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 ${
                  fieldErrors.sectionTitle
                    ? "border-red-300 focus:border-red-500"
                    : "border-stone-300 focus:border-stone-400"
                }`}
              />

              {fieldErrors.sectionTitle && (
                <p className="text-[9px] text-red-600">
                  {fieldErrors.sectionTitle}
                </p>
              )}
            </div>
          </div>

          <div className="mx-auto max-w-5xl pb-12">
            <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-500 transition duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white">
                  <Users size={20} strokeWidth={1.5} />
                </div>

                <h2 className="mt-6 font-serif text-2xl tracking-tight text-stone-950">
                  No team members yet
                </h2>

                <p className="mt-3 text-sm leading-6 text-stone-500">
                  Start by creating the first team member for the website.
                </p>

                <button
                  type="button"
                  onClick={handleAddMember}
                  className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-stone-900 px-5 py-3 text-xs font-medium text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-stone-800 hover:shadow-md active:translate-y-0"
                >
                  <Plus size={14} strokeWidth={1.8} />
                  New Team Member
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* =======================================================
     MAIN RENDER
  ======================================================= */

  return (
    <>
      <div className="space-y-8 font-sans">
        {/* =================================================
            SECTION TITLE
        ================================================== */}

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
                max={MAX_SECTION_TITLE_LENGTH}
              />
            </div>

            <input
              id="team-section-title"
              type="text"
              value={sectionTitle}
              onChange={(event) => handleSectionTitleChange(event.target.value)}
              maxLength={MAX_SECTION_TITLE_LENGTH}
              placeholder="e.g. Our Team"
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 ${
                fieldErrors.sectionTitle
                  ? "border-red-300 focus:border-red-500"
                  : "border-stone-300 focus:border-stone-400"
              }`}
            />

            {fieldErrors.sectionTitle && (
              <p className="text-[9px] text-red-600">
                {fieldErrors.sectionTitle}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveChanges}>
          <div className="mx-auto max-w-6xl pb-12">
            {/* =================================================
                WORKSPACE
            ================================================== */}

            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
              <div className="grid min-h-[700px] grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)]">
                <TeamLibrary
                  members={members}
                  filteredMembers={filteredMembers}
                  selectedId={selectedId}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  fieldErrors={fieldErrors}
                  onSelect={handleSelectMember}
                  onAdd={handleAddMember}
                />

                <main className="min-w-0 border-t border-stone-200 bg-white lg:border-l lg:border-t-0">
                  {activeMember ? (
                    <TeamEditor
                      key={activeMember.id}
                      activeMember={activeMember}
                      activeIndex={activeIndex}
                      memberCount={members.length}
                      handleFieldChange={handleFieldChange}
                      fieldErrors={fieldErrors}
                      fileInputRef={fileInputRef}
                      isDragging={isDragging}
                      uploadProgress={uploadProgress}
                      handleFileInputChange={handleFileInputChange}
                      handleDragOver={handleDragOver}
                      handleDragLeave={handleDragLeave}
                      handleDrop={handleDrop}
                      handleRemoveImage={handleRemoveImage}
                      setPreviewModalImage={setPreviewModalImage}
                      onRemoveMember={handleRemoveActiveMember}
                    />
                  ) : (
                    <EmptyEditorState />
                  )}
                </main>
              </div>
            </div>

            {/* =================================================
                SAVE
            ================================================== */}

            <div className="flex justify-end pt-10">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-stone-900 px-6 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {isSaving ? (
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

      {/* =====================================================
          IMAGE PREVIEW MODAL
      ===================================================== */}

      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Profile image preview"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewModalImage(null);
            }
          }}
        >
          <div className="relative max-h-[90vh] max-w-lg overflow-hidden rounded-xl bg-white p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewModalImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-stone-900/70 p-1.5 text-white transition hover:bg-stone-900"
              aria-label="Close image preview"
            >
              <X className="h-4 w-4" />
            </button>

            <Image
              src={previewModalImage}
              alt="Profile detail preview"
              width={800}
              height={800}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   TEAM LIBRARY
========================================================= */

function TeamLibrary({
  members,
  filteredMembers,
  selectedId,
  searchQuery,
  setSearchQuery,
  fieldErrors,
  onSelect,
  onAdd,
}: {
  members: TeamMember[];
  filteredMembers: TeamMember[];
  selectedId: string | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  fieldErrors: FormErrors;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <aside className="space-y-3 rounded-xl border border-stone-300 bg-white p-4 lg:min-h-[700px]">
      {/* =====================================================
          LIBRARY HEADER
      ===================================================== */}

      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <span className="font-serif text-[11px] font-bold uppercase tracking-widest text-stone-500">
          Team Library
        </span>

        <button
          type="button"
          onClick={onAdd}
          disabled={members.length >= MAX_TEAM_MEMBERS}
          className="group flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          aria-label="Create new team member"
          title="New Team Member"
        >
          <Plus
            size={15}
            strokeWidth={1.7}
            className="transition-transform duration-300 group-hover:rotate-90"
          />
        </button>
      </div>

      {/* =====================================================
          MEMBER LIST
      ===================================================== */}

      <div className="space-y-2">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => {
            const originalIndex = members.findIndex(
              (item) => item.id === member.id,
            );

            const selected = member.id === selectedId;

            const hasError =
              Boolean(fieldErrors[`name_${member.id}`]) ||
              Boolean(fieldErrors[`designation_${member.id}`]);

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelect(member.id)}
                className={`flex w-full cursor-pointer flex-col gap-1 rounded-lg border p-3.5 text-left text-xs transition-all ${
                  selected
                    ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                    : "border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100"
                } ${hasError ? "ring-1 ring-red-300" : ""}`}
                aria-current={selected ? "true" : undefined}
              >
                <span
                  className={`font-mono text-[10px] font-bold ${
                    selected ? "text-amber-400" : "text-amber-900"
                  }`}
                >
                  Member {originalIndex + 1}
                </span>

                <span
                  className={`truncate font-serif text-sm font-medium ${
                    selected ? "text-white" : "text-stone-800"
                  }`}
                >
                  {member.name || "Untitled Member"}
                </span>
              </button>
            );
          })
        ) : (
          <div className="rounded-lg bg-stone-50 px-3 py-6 text-center">
            <p className="text-[10px] text-stone-400">
              No members match your search.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      {members.length > 5 && (
        <div className="border-t border-stone-200 pt-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Filter members..."
            aria-label="Filter team members"
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs text-stone-800 outline-none transition focus:border-stone-400 focus:bg-white"
          />
        </div>
      )}
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
          Choose a team member
        </h2>

        <p className="mt-3 text-sm leading-6 text-stone-500">
          Select a team member from the library to open their editor.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   TEAM EDITOR
========================================================= */

function TeamEditor({
  activeMember,
  activeIndex,
  memberCount,
  handleFieldChange,
  fieldErrors,
  fileInputRef,
  isDragging,
  uploadProgress,
  handleFileInputChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleRemoveImage,
  setPreviewModalImage,
  onRemoveMember,
}: {
  activeMember: TeamMember;
  activeIndex: number;
  memberCount: number;
  handleFieldChange: (field: "name" | "designation", value: string) => void;
  fieldErrors: FormErrors;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  isDragging: boolean;
  uploadProgress: number;
  handleFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (event: DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: DragEvent<HTMLDivElement>) => void;
  handleRemoveImage: () => void;
  setPreviewModalImage: (image: string | null) => void;
  onRemoveMember: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const currentMemberNumber = String(activeIndex + 1).padStart(2, "0");

  const nameLimitReached = activeMember.name.length >= MAX_NAME_LENGTH;

  const designationLimitReached =
    activeMember.designation.length >= MAX_DESIGNATION_LENGTH;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowMenu(false);
  }, [activeMember.id]);

  return (
    <div
      className={`min-w-0 transition-all duration-300 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-x-2 opacity-0"
      }`}
    >
      {/* ===================================================
          EDITOR HEADER
      =================================================== */}

      <div className="border-b border-stone-200 bg-[#FAF9F5] px-6 py-5 sm:px-8">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.16em] text-amber-900">
                MEMBER {currentMemberNumber} /{" "}
                {String(memberCount).padStart(2, "0")}
              </span>
            </div>

            <h1 className="mt-2 font-serif text-xl font-medium tracking-tight text-stone-950 sm:text-2xl">
              {activeMember.name || "Untitled Member"}
            </h1>

            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-stone-500">
              {activeMember.designation || "Team Member Information"}
            </p>
          </div>

          {/* =================================================
              TOP-RIGHT ACTION MENU
          ================================================== */}

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowMenu((current) => !current)}
              aria-label="Team member actions"
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
                  aria-label="Close team member menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setShowMenu(false)}
                />

                <div className="absolute right-0 top-10 z-20 w-44 origin-top-right animate-[fadeIn_150ms_ease-out] rounded-lg border border-stone-200 bg-white py-1 shadow-[0_12px_30px_rgba(41,37,36,0.12)]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onRemoveMember();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-xs text-red-700 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                    Delete Member
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================
          EDITOR BODY
      =================================================== */}

      <div className="bg-white px-6 py-6 sm:px-8 lg:px-9">
        {/* =================================================
            SECTION 01
        ================================================= */}

        <section>
          <EditorSectionHeading number="01" title="Member Information" />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <CharacterField
              label="Name"
              value={activeMember.name}
              onChange={(value) => handleFieldChange("name", value)}
              placeholder="Team Member Name"
              maxCharacters={MAX_NAME_LENGTH}
              limitReached={nameLimitReached}
              error={fieldErrors[`name_${activeMember.id}`]}
            />

            <CharacterField
              label="Designation"
              value={activeMember.designation}
              onChange={(value) => handleFieldChange("designation", value)}
              placeholder="Role / Designation"
              maxCharacters={MAX_DESIGNATION_LENGTH}
              limitReached={designationLimitReached}
              error={fieldErrors[`designation_${activeMember.id}`]}
            />
          </div>
        </section>

        {/* =================================================
            SECTION 02
        ================================================= */}

        <section className="mt-8 border-t border-stone-200 pt-6">
          <EditorSectionHeading number="02" title="Profile Image" />

          <div className="mb-5">
            <p className="text-[10px] leading-5 text-stone-400">
              Recommended:{" "}
              <span className="font-medium text-stone-600">
                {RECOMMENDED_IMAGE_WIDTH} × {RECOMMENDED_IMAGE_HEIGHT} px
              </span>{" "}
              (4:5) · JPG, PNG, or WebP · Maximum 5 MB.
            </p>
          </div>

          {/* Hidden File Input */}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Existing Image */}

          {activeMember.imageUrl ? (
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-4">
                <div className="group relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-100 p-1">
                  <Image
                    src={activeMember.imageUrl}
                    alt={
                      activeMember.name
                        ? `${activeMember.name} profile`
                        : "Team member profile"
                    }
                    width={80}
                    height={96}
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => setPreviewModalImage(activeMember.imageUrl)}
                    className="absolute inset-0 flex items-center justify-center bg-stone-900/50 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                    title="Preview Image"
                    aria-label="Preview profile image"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-stone-800">
                    Profile Photo Attached
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-stone-400">
                    Preview, replace, or remove the profile image. Click Save to
                    apply changes.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewModalImage(activeMember.imageUrl)}
                    className="rounded-md p-2 text-stone-400 transition hover:bg-stone-50 hover:text-stone-800"
                    title="Preview Image"
                    aria-label="Preview profile image"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md p-2 text-stone-400 transition hover:bg-stone-50 hover:text-stone-800"
                    title="Replace Image"
                    aria-label="Replace profile image"
                  >
                    <Upload className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="rounded-md p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Remove Image"
                    aria-label="Remove profile image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Upload profile image"
              className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition ${
                isDragging
                  ? "border-stone-900 bg-stone-100"
                  : "border-stone-300 bg-white/60 hover:border-stone-400 hover:bg-white hover:shadow-sm"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-stone-400 transition-all duration-300 hover:border-stone-500 hover:text-stone-700">
                <ImageIcon size={15} strokeWidth={1.5} />
              </span>

              <span className="mt-2.5 text-[9px] font-semibold uppercase tracking-wider text-stone-500">
                Add Image
              </span>

              <p className="mt-1.5 text-[9px] text-stone-400">
                Click to upload or drag and drop · JPG, PNG, WebP · Max 5 MB
              </p>
            </div>
          )}

          {/* Upload Progress */}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-200"
              aria-label="Image upload progress"
            >
              <div
                className="h-1.5 rounded-full bg-stone-900 transition-all duration-300"
                style={{
                  width: `${uploadProgress}%`,
                }}
              />
            </div>
          )}
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
   CHARACTER FIELD
========================================================= */

function CharacterField({
  label,
  value,
  onChange,
  placeholder,
  maxCharacters,
  limitReached,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxCharacters: number;
  limitReached: boolean;
  error?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <label className={fieldLabelClass}>{label}</label>

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
        className={
          error
            ? inputErrorClass
            : `w-full rounded-lg border bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none transition focus:ring-2 focus:ring-stone-900/10 ${
                limitReached
                  ? "border-amber-400 focus:border-amber-500"
                  : "border-stone-300 focus:border-stone-400"
              }`
        }
      />

      {error ? (
        <p className="mt-1.5 text-[9px] text-red-600">{error}</p>
      ) : (
        <p
          className={`mt-1.5 text-[9px] ${
            limitReached ? "text-amber-800" : "text-stone-400"
          }`}
        >
          {limitReached
            ? "Maximum character limit reached."
            : `Maximum ${maxCharacters} characters.`}
        </p>
      )}
    </div>
  );
}

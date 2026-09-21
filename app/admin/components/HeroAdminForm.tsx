"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import {
  Video,
  Plus,
  Trash2,
  Info,
  X,
  Upload,
  Image as ImageIcon,
  Save,
  Loader2,
} from "lucide-react";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_VIDEO_URL = "/videos/hero-bg.mp4";
const DEFAULT_IMAGE_URL = "/images/hero-bg.png";

const MAX_CLIENTS = 12;
const MAX_CLIENT_LENGTH = 30;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/* =========================================================
   TYPES
========================================================= */

type MediaType = "video" | "image";

interface HeroResponse {
  headlineLine1?: string;
  headlineLine2?: string;
  description?: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  mediaOpacity?: string | number;
  clients?: string[];
}

interface UploadResponse {
  success?: boolean;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mediaType?: MediaType;
  error?: string;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function HeroAdminForm() {
  /* -------------------------------------------------------
     LOADING / SAVING / UPLOADING STATE
  ------------------------------------------------------- */

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  /* -------------------------------------------------------
     HERO DATA
  ------------------------------------------------------- */

  const [headlineLine1, setHeadlineLine1] = useState("");
  const [headlineLine2, setHeadlineLine2] = useState("");
  const [description, setDescription] = useState("");

  /* -------------------------------------------------------
     BACKGROUND MEDIA
  ------------------------------------------------------- */

  const [mediaType, setMediaType] = useState<MediaType>("video");

  const [mediaUrl, setMediaUrl] = useState("");

  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [mediaFileName, setMediaFileName] = useState<string | null>(null);

  const [mediaFileSize, setMediaFileSize] = useState<number | null>(null);

  const [mediaOpacity, setMediaOpacity] = useState("45");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  /* -------------------------------------------------------
     CLIENTS
  ------------------------------------------------------- */

  const [clients, setClients] = useState<string[]>([]);

  /* -------------------------------------------------------
     LOAD HERO DATA
  ------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    async function loadHeroData() {
      try {
        setIsLoading(true);

        const response = await fetch("/api/hero", {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load hero settings (${response.status})`);
        }

        const data: HeroResponse = await response.json();

        if (!mounted) return;

        setHeadlineLine1(data.headlineLine1 ?? "");
        setHeadlineLine2(data.headlineLine2 ?? "");
        setDescription(data.description ?? "");

        const loadedMediaType = data.mediaType === "image" ? "image" : "video";

        const loadedVideoUrl = data.videoUrl?.trim() || DEFAULT_VIDEO_URL;

        const loadedImageUrl = data.imageUrl?.trim() || DEFAULT_IMAGE_URL;

        /*
         * Keep both media types in memory.
         *
         * This is important because switching between Video
         * and Image must show the media stored for that type,
         * not the public fallback file.
         */
        setVideoUrl(loadedVideoUrl);
        setImageUrl(loadedImageUrl);

        setMediaType(loadedMediaType);

        setMediaUrl(
          loadedMediaType === "video" ? loadedVideoUrl : loadedImageUrl,
        );

        setMediaOpacity(
          data.mediaOpacity !== undefined ? String(data.mediaOpacity) : "45",
        );

        setClients(
          Array.isArray(data.clients)
            ? data.clients.filter(
                (client): client is string => typeof client === "string",
              )
            : [],
        );
      } catch (error) {
        console.error("Failed to load hero settings:", error);

        if (mounted) {
          toast.error("Failed to load hero settings. Please refresh the page.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadHeroData();

    return () => {
      mounted = false;
    };
  }, []);

  /* -------------------------------------------------------
     CLEANUP OBJECT URL
  ------------------------------------------------------- */

  useEffect(() => {
    return () => {
      if (mediaPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  /* -------------------------------------------------------
     SAVE HERO SETTINGS
  ------------------------------------------------------- */

  const handleSave = async () => {
    if (isSaving || isLoading || isUploading) return;

    const cleanedClients = clients
      .map((client) => client.trim())
      .filter(Boolean);

    if (headlineLine1.trim().length === 0) {
      toast.error("Headline Line 1 cannot be empty.");
      return;
    }

    if (headlineLine2.trim().length === 0) {
      toast.error("Headline Line 2 cannot be empty.");
      return;
    }

    if (description.trim().length === 0) {
      toast.error("Description cannot be empty.");
      return;
    }

    if (cleanedClients.length > MAX_CLIENTS) {
      toast.error(`You can have a maximum of ${MAX_CLIENTS} clients.`);
      return;
    }

    if (!mediaUrl.trim()) {
      toast.error("Please select a background media file.");
      return;
    }

    /*
     * A blob URL is only temporary browser data.
     * It must never be saved to PostgreSQL.
     */
    if (mediaUrl.startsWith("blob:")) {
      toast.error("Please wait for the media upload to finish.");
      return;
    }

    setIsSaving(true);

    const payload = {
      headlineLine1: headlineLine1.trim(),
      headlineLine2: headlineLine2.trim(),
      description: description.trim(),

      mediaType,
      mediaUrl: mediaUrl.trim(),

      videoUrl: videoUrl.trim(),
      imageUrl: imageUrl.trim(),

      mediaOpacity,

      clients: cleanedClients,
    };

    try {
      const response = await fetch("/api/hero", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let result: {
        success?: boolean;
        error?: string;
      } = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.error || `Failed to save hero settings (${response.status})`,
        );
      }

      toast.success("Changes saved successfully.");
    } catch (error) {
      console.error("Error saving hero settings:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save hero settings. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------------------------------------------
     VIDEO UPLOAD
  ------------------------------------------------------- */

  const uploadVideo = async (file: File) => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast.error("Please select a valid MP4 or WebM video.");
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error("Video size must be 100 MB or smaller.");
      return;
    }

    setIsUploading(true);

    try {
      /*
       * Create a temporary browser preview while the
       * actual file is being transferred to the server.
       */
      const temporaryObjectUrl = URL.createObjectURL(file);

      setMediaPreview((previousPreview) => {
        if (previousPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(previousPreview);
        }

        return temporaryObjectUrl;
      });

      setMediaFileName(file.name);
      setMediaFileSize(file.size);

      /*
       * IMPORTANT:
       *
       * The file is now sent directly to /api/hero.
       *
       * The API route receives the FormData, converts the
       * file to a Base64 data URL, and stores the actual
       * video inside PostgreSQL.
       */
      const formData = new FormData();

      formData.append("file", file);
      formData.append("mediaType", "video");

      const response = await fetch("/api/hero", {
        method: "POST",
        body: formData,
      });

      let result: UploadResponse = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || !result.success || !result.url) {
        throw new Error(
          result.error || `Video upload failed (${response.status})`,
        );
      }

      /*
       * The API returned the actual database-stored
       * Base64 media URL.
       *
       * Replace the temporary blob preview with it.
       */
      setMediaPreview(result.url);

      setMediaUrl(result.url);

      setVideoUrl(result.url);

      if (result.fileName) {
        setMediaFileName(result.fileName);
      }

      if (typeof result.fileSize === "number") {
        setMediaFileSize(result.fileSize);
      }

      toast.success("Video uploaded and stored successfully.");
    } catch (error) {
      console.error("Error uploading hero video:", error);

      /*
       * Remove temporary preview if upload failed.
       */
      setMediaPreview((previousPreview) => {
        if (previousPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(previousPreview);
        }

        return null;
      });

      setMediaFileName(null);
      setMediaFileSize(null);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload video. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  /* -------------------------------------------------------
     IMAGE UPLOAD
  ------------------------------------------------------- */

  const uploadImage = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image size must be 5 MB or smaller.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("Unable to process the selected image.");
        return;
      }

      /*
       * Image is already represented as a Base64 data URL.
       *
       * When Save Changes is clicked, the data URL is
       * persisted in PostgreSQL.
       */
      setMediaPreview(reader.result);
      setMediaUrl(reader.result);
      setImageUrl(reader.result);
      setMediaFileName(file.name);
      setMediaFileSize(file.size);

      toast.success ("Image selected successfully.");
    };

    reader.onerror = () => {
      toast.error("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  /* -------------------------------------------------------
     MEDIA UPLOAD HANDLER
  ------------------------------------------------------- */

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    /*
     * Always allow selecting the same file again.
     */
    event.target.value = "";

    if (!file) return;

    if (mediaType === "video") {
      void uploadVideo(file);
      return;
    }

    uploadImage(file);
  };

  /* -------------------------------------------------------
     CLEAR MEDIA UPLOAD
  ------------------------------------------------------- */

  const clearMediaUpload = () => {
    if (isUploading) return;

    setMediaPreview((previousPreview) => {
      if (previousPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(previousPreview);
      }

      return null;
    });

    setMediaFileName(null);
    setMediaFileSize(null);

    setMediaUrl(mediaType === "video" ? DEFAULT_VIDEO_URL : DEFAULT_IMAGE_URL);
  };

  /* -------------------------------------------------------
     MEDIA TYPE
  ------------------------------------------------------- */

  const handleMediaTypeChange = (type: MediaType) => {
    if (type === mediaType || isUploading) {
      return;
    }

    setMediaPreview((previousPreview) => {
      if (previousPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(previousPreview);
      }

      return null;
    });

    setMediaFileName(null);
    setMediaFileSize(null);

    setMediaType(type);

    /*
     * IMPORTANT:
     *
     * Do NOT switch to the public/default file.
     *
     * Switch to the media that is actually stored
     * for this media type.
     */
    if (type === "video") {
      setMediaUrl(videoUrl || DEFAULT_VIDEO_URL);
    } else {
      setMediaUrl(imageUrl || DEFAULT_IMAGE_URL);
    }
  };

  /* -------------------------------------------------------
     CLIENTS
  ------------------------------------------------------- */

  const handleAddClient = () => {
    if (clients.length >= MAX_CLIENTS) {
      toast.error(`You can add a maximum of ${MAX_CLIENTS} clients.`);
      return;
    }

    setClients((previousClients) => [...previousClients, "New Client"]);
  };

  const handleUpdateClient = (index: number, value: string) => {
    if (value.length > MAX_CLIENT_LENGTH) {
      return;
    }

    setClients((previousClients) =>
      previousClients.map((client, clientIndex) =>
        clientIndex === index ? value : client,
      ),
    );
  };

  const handleRemoveClient = (index: number) => {
    setClients((previousClients) =>
      previousClients.filter((_, clientIndex) => clientIndex !== index),
    );
  };

  /* -------------------------------------------------------
     MEDIA PREVIEW SOURCE
  ------------------------------------------------------- */

  const previewSource = mediaPreview || mediaUrl;

  /* -------------------------------------------------------
     LOADING STATE
  ------------------------------------------------------- */

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
  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* =====================================================
          1. EDITORIAL TYPOGRAPHY
      ===================================================== */}

      <div className="space-y-4 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
        <div className="border-b border-stone-200 pb-3">
          <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
            Main Editorial Typography
          </h4>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Line 1 */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-serif font-bold uppercase tracking-widest text-stone-600">
                  Headline (Line 1)
                </label>

                <span className="font-mono text-[10px] text-stone-400">
                  {headlineLine1.length}/25
                </span>
              </div>

              <input
                type="text"
                maxLength={25}
                value={headlineLine1}
                onChange={(event) => setHeadlineLine1(event.target.value)}
                placeholder="e.g. Practice"
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            {/* Line 2 */}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-serif font-bold uppercase tracking-widest text-stone-600">
                  Headline (Line 2)
                </label>

                <span className="font-mono text-[10px] text-stone-400">
                  {headlineLine2.length}/25
                </span>
              </div>

              <input
                type="text"
                maxLength={25}
                value={headlineLine2}
                onChange={(event) => setHeadlineLine2(event.target.value)}
                placeholder="e.g. Made Perfect"
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>
          </div>

          {/* Description */}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-serif font-bold uppercase tracking-widest text-stone-600">
                Sub-Description Paragraph
              </label>

              <span className="font-mono text-[10px] text-stone-400">
                {description.length}/200
              </span>
            </div>

            <textarea
              rows={3}
              maxLength={200}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full resize-none rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          2. BACKGROUND VISUAL MEDIA
      ===================================================== */}

      <div className="space-y-5 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
        {/* Header */}

        <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-3">
          <div>
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Background Visual Media
            </h4>
          </div>

          {/* Media Type */}

          <div className="inline-flex rounded-lg border border-stone-300 bg-stone-200/70 p-1">
            <button
              type="button"
              onClick={() => handleMediaTypeChange("video")}
              disabled={isUploading}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-serif uppercase tracking-wider transition ${
                mediaType === "video"
                  ? "bg-stone-950 text-amber-400 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Video className="h-3.5 w-3.5" />
              Video
            </button>

            <button
              type="button"
              onClick={() => handleMediaTypeChange("image")}
              disabled={isUploading}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-serif uppercase tracking-wider transition ${
                mediaType === "image"
                  ? "bg-stone-950 text-amber-400 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Image
            </button>
          </div>
        </div>

        {/* Preview */}

        <div className="relative h-44 overflow-hidden rounded-lg border border-stone-200 bg-stone-950 sm:h-52">
          {previewSource ? (
            mediaType === "video" ? (
              <video
                key={previewSource}
                src={previewSource}
                muted
                autoPlay
                loop
                playsInline
                controls={false}
                className="h-44 w-full object-cover sm:h-52"
              />
            ) : (
              <Image
                src={previewSource}
                alt="Hero background preview"
                fill
                sizes="100vw"
                className="object-cover"
              />
            )
          ) : (
            <div className="flex h-44 items-center justify-center text-stone-500 sm:h-52">
              <div className="flex flex-col items-center gap-2">
                {mediaType === "video" ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <ImageIcon className="h-6 w-6" />
                )}

                <span className="text-xs">No background media</span>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />

                <span className="text-xs font-medium">Uploading video...</span>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          <span className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white backdrop-blur-sm">
            Background Preview
          </span>
        </div>

        {/* Upload + Current File */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {mediaFileName ? (
              <div className="flex items-center gap-2">
                {mediaType === "video" ? (
                  <Video className="h-4 w-4 shrink-0 text-stone-500" />
                ) : (
                  <ImageIcon className="h-4 w-4 shrink-0 text-stone-500" />
                )}

                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-stone-700">
                    {mediaFileName}
                  </p>

                  {mediaFileSize !== null && (
                    <p className="text-[10px] text-stone-400">
                      {(mediaFileSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-stone-400">
                {mediaType === "video"
                  ? "MP4 or WebM • Recommended 1080p • Max 100 MB"
                  : "JPG, PNG or WebP • Recommended 1920×1080 • Max 5 MB"}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {mediaPreview && (
              <button
                type="button"
                onClick={clearMediaUpload}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-stone-500 transition hover:bg-stone-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            )}

            <label
              className={`inline-flex items-center gap-1.5 rounded-lg bg-stone-950 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-stone-800 ${
                isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}

              {isUploading
                ? "Uploading..."
                : mediaPreview
                  ? "Replace"
                  : "Upload"}

              <input
                ref={fileInputRef}
                type="file"
                accept={
                  mediaType === "video"
                    ? "video/mp4,video/webm"
                    : "image/png,image/jpeg,image/webp"
                }
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Opacity */}

        <div className="space-y-2 border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-serif font-bold uppercase tracking-widest text-stone-600">
              Media Opacity
            </label>

            <span className="font-mono text-xs text-stone-500">
              {mediaOpacity}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={mediaOpacity}
            onChange={(event) => setMediaOpacity(event.target.value)}
            className="w-full cursor-pointer accent-stone-900"
          />
        </div>

        {/* Small Hint */}

        <div className="flex items-center gap-2 text-[10px] text-stone-400">
          <Info className="h-3.5 w-3.5 shrink-0" />

          <span>Lower opacity can improve Hero text readability.</span>
        </div>
      </div>

      {/* =====================================================
          3. CLIENT MARQUEE TICKER
      ===================================================== */}

      <div className="space-y-4 rounded-xl border border-stone-200 bg-[#FAF9F5] p-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h4 className="text-sm font-serif font-medium uppercase tracking-wider text-stone-900">
              Client Marquee Ticker ({clients.length}/{MAX_CLIENTS})
            </h4>
          </div>

          <button
            type="button"
            onClick={handleAddClient}
            disabled={clients.length >= MAX_CLIENTS || isSaving || isUploading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-950 px-3 py-1.5 text-xs font-serif uppercase tracking-wider text-amber-400 transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />

            <span>Add Brand</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {clients.map((client, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-2.5 shadow-sm"
            >
              <span className="w-5 font-mono text-[10px] font-bold text-stone-400">
                {index + 1 < 10 ? `0${index + 1}` : index + 1}
              </span>

              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={MAX_CLIENT_LENGTH}
                  value={client}
                  onChange={(event) =>
                    handleUpdateClient(index, event.target.value)
                  }
                  disabled={isSaving || isUploading}
                  className="w-full rounded border border-stone-200 bg-[#FAF9F5] px-2.5 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveClient(index)}
                disabled={isSaving || isUploading}
                aria-label={`Remove client ${index + 1}`}
                className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          SAVE
      ===================================================== */}

      <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isLoading || isUploading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-stone-900 px-6 py-2.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              <span>Saving Changes...</span>
            </>
          ) : isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              <span>Uploading Media...</span>
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
  );
}

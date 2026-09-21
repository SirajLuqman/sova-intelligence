"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

type AdminRole = "OWNER" | "EDITOR";

interface AccountData {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
}

interface AccountsResponse {
  success?: boolean;
  accounts?: AccountData[];
  error?: string;
}

interface AccountResponse {
  success?: boolean;
  account?: AccountData;
  error?: string;
}

/* =========================================================
   CHARACTER LIMITS
========================================================= */

const MAX_NAME_CHARS = 60;
const MAX_EMAIL_CHARS = 50;
const MAX_PASSWORD_CHARS = 50;

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
   COMPONENT
========================================================= */

export default function AuthenticationAdminForm() {
  const [accounts, setAccounts] = useState<AccountData[]>([]);

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [editorName, setEditorName] = useState("");
  const [editorEmail, setEditorEmail] = useState("");
  const [editorPassword, setEditorPassword] = useState("");

  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showEditorPassword, setShowEditorPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  /* =========================================================
     LOAD ACCOUNTS
  ========================================================= */

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/auth/accounts", {
          method: "GET",
          cache: "no-store",
        });

        const data: AccountsResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load accounts.");
        }

        if (!Array.isArray(data.accounts)) {
          throw new Error("Invalid account data received.");
        }

        setAccounts(data.accounts);

        const admin = data.accounts.find((account) => account.role === "OWNER");

        const editor = data.accounts.find(
          (account) => account.role === "EDITOR",
        );

        if (admin) {
          setAdminName(admin.name);
          setAdminEmail(admin.email);
        }

        if (editor) {
          setEditorName(editor.name);
          setEditorEmail(editor.email);
        }
      } catch (err) {
        console.error("Authentication accounts load error:", err);

        toast.error(
          err instanceof Error
            ? err.message
            : "Unable to load authentication accounts.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, []);

  /* =========================================================
     UPDATE ACCOUNT
  ========================================================= */

  const updateAccount = async (
    account: AccountData,
    name: string,
    email: string,
    password: string,
  ): Promise<AccountData> => {
    const response = await fetch("/api/auth/accounts", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: account.id,
        name,
        email,
        password,
      }),
    });

    const data: AccountResponse = await response.json();

    if (!response.ok || !data.account) {
      throw new Error(
        data.error || `Unable to update ${account.role} account.`,
      );
    }

    return data.account;
  };

  /* =========================================================
     SAVE ACCOUNTS
  ========================================================= */

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const admin = accounts.find((account) => account.role === "OWNER");

    const editor = accounts.find((account) => account.role === "EDITOR");

    if (!admin || !editor) {
      toast.error("Both Admin and Editor accounts must be available.");
      return;
    }

    try {
      setIsSaving(true);

      /*
       * Password fields are optional.
       * Empty password = keep the existing password.
       */

      const updatedAdmin = await updateAccount(
        admin,
        adminName,
        adminEmail,
        adminPassword,
      );

      const updatedEditor = await updateAccount(
        editor,
        editorName,
        editorEmail,
        editorPassword,
      );

      setAccounts([updatedAdmin, updatedEditor]);

      setAdminName(updatedAdmin.name);
      setAdminEmail(updatedAdmin.email);

      setEditorName(updatedEditor.name);
      setEditorEmail(updatedEditor.email);

      /*
       * Clear password inputs after saving.
       * Existing passwords remain unchanged when
       * these fields are left empty.
       */

      setAdminPassword("");
      setEditorPassword("");

      setShowAdminPassword(false);
      setShowEditorPassword(false);

      toast.success("Changes saved successfully.");
    } catch (err) {
      console.error("Authentication accounts save error:", err);

      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to save authentication details.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center gap-3 py-10 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* =====================================================
          ACCOUNT FORMS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ===================================================
            ADMIN
        =================================================== */}

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-stone-900">Admin</h3>

            <p className="mt-1 text-sm text-stone-500">
              Full authentication management access.
            </p>
          </div>

          <div className="space-y-5">
            {/* Name */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="admin-name"
                  className="block text-sm font-medium text-stone-700"
                >
                  Name
                </label>

                <CharacterCounter
                  current={adminName.length}
                  max={MAX_NAME_CHARS}
                />
              </div>

              <input
                id="admin-name"
                type="text"
                value={adminName}
                onChange={(event) =>
                  setAdminName(event.target.value.slice(0, MAX_NAME_CHARS))
                }
                maxLength={MAX_NAME_CHARS}
                disabled={isSaving}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Admin name"
              />

              <p className="mt-1.5 text-[10px] text-stone-400">
                Maximum {MAX_NAME_CHARS} characters.
              </p>
            </div>

            {/* Email */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium text-stone-700"
                >
                  Email
                </label>

                <CharacterCounter
                  current={adminEmail.length}
                  max={MAX_EMAIL_CHARS}
                />
              </div>

              <input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(event) =>
                  setAdminEmail(event.target.value.slice(0, MAX_EMAIL_CHARS))
                }
                maxLength={MAX_EMAIL_CHARS}
                disabled={isSaving}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Admin email"
              />

              <p className="mt-1.5 text-[10px] text-stone-400">
                Maximum {MAX_EMAIL_CHARS} characters.
              </p>
            </div>

            {/* Password */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-stone-700"
                >
                  Password
                </label>

                <CharacterCounter
                  current={adminPassword.length}
                  max={MAX_PASSWORD_CHARS}
                />
              </div>

              <div className="relative">
                <input
                  id="admin-password"
                  type={showAdminPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(event) =>
                    setAdminPassword(
                      event.target.value.slice(0, MAX_PASSWORD_CHARS),
                    )
                  }
                  maxLength={MAX_PASSWORD_CHARS}
                  disabled={isSaving}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 pr-12 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowAdminPassword((current) => !current)}
                  disabled={isSaving}
                  aria-label={
                    showAdminPassword
                      ? "Hide admin password"
                      : "Show admin password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  {showAdminPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-[10px] text-stone-400">
                Maximum {MAX_PASSWORD_CHARS} characters. Leave blank to keep the
                current password.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            EDITOR
        ===================================================== */}

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-stone-900">Editor</h3>

            <p className="mt-1 text-sm text-stone-500">
              Content management access.
            </p>
          </div>

          <div className="space-y-5">
            {/* Name */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="editor-name"
                  className="block text-sm font-medium text-stone-700"
                >
                  Name
                </label>

                <CharacterCounter
                  current={editorName.length}
                  max={MAX_NAME_CHARS}
                />
              </div>

              <input
                id="editor-name"
                type="text"
                value={editorName}
                onChange={(event) =>
                  setEditorName(event.target.value.slice(0, MAX_NAME_CHARS))
                }
                maxLength={MAX_NAME_CHARS}
                disabled={isSaving}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Editor name"
              />

              <p className="mt-1.5 text-[10px] text-stone-400">
                Maximum {MAX_NAME_CHARS} characters.
              </p>
            </div>

            {/* Email */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="editor-email"
                  className="block text-sm font-medium text-stone-700"
                >
                  Email
                </label>

                <CharacterCounter
                  current={editorEmail.length}
                  max={MAX_EMAIL_CHARS}
                />
              </div>

              <input
                id="editor-email"
                type="email"
                value={editorEmail}
                onChange={(event) =>
                  setEditorEmail(event.target.value.slice(0, MAX_EMAIL_CHARS))
                }
                maxLength={MAX_EMAIL_CHARS}
                disabled={isSaving}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Editor email"
              />

              <p className="mt-1.5 text-[10px] text-stone-400">
                Maximum {MAX_EMAIL_CHARS} characters.
              </p>
            </div>

            {/* Password */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="editor-password"
                  className="block text-sm font-medium text-stone-700"
                >
                  Password
                </label>

                <CharacterCounter
                  current={editorPassword.length}
                  max={MAX_PASSWORD_CHARS}
                />
              </div>

              <div className="relative">
                <input
                  id="editor-password"
                  type={showEditorPassword ? "text" : "password"}
                  value={editorPassword}
                  onChange={(event) =>
                    setEditorPassword(
                      event.target.value.slice(0, MAX_PASSWORD_CHARS),
                    )
                  }
                  maxLength={MAX_PASSWORD_CHARS}
                  disabled={isSaving}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 pr-12 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowEditorPassword((current) => !current)}
                  disabled={isSaving}
                  aria-label={
                    showEditorPassword
                      ? "Hide editor password"
                      : "Show editor password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  {showEditorPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-1.5 text-[10px] text-stone-400">
                Maximum {MAX_PASSWORD_CHARS} characters. Leave blank to keep the
                current password.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          SAVE BUTTON
          OUTSIDE THE ACCOUNT CARDS
      ===================================================== */}

      <div className="flex justify-end border-t border-stone-200 pt-6">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

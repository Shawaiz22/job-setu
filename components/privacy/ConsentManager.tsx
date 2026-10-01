"use client";

import { useEffect, useState } from "react";

interface ConsentState {
  eligibility_processing: boolean;
  experience_publication: boolean;
  notifications: boolean;
}

const PURPOSES = [
  {
    key: "eligibility_processing" as const,
    title: "Eligibility Verification Processing",
    description:
      "Required to evaluate your academic and demographic details against official MP state notifications and welfare schemes. Your raw data is encrypted at rest and never shared with 3rd parties.",
    required: true,
  },
  {
    key: "experience_publication" as const,
    title: "Anonymous Experience Aggregation",
    description:
      "Permits your interview experience to contribute anonymously to overall interview round and demand statistics. Your identity is never exposed or linked.",
    required: false,
  },
  {
    key: "notifications" as const,
    title: "Eligibility & Deadline Alerts",
    description:
      "Allows the system to alert you when new recruitment circulars match your qualifications or when exam registration windows open.",
    required: false,
  },
];

export function ConsentManager() {
  const [consents, setConsents] = useState<ConsentState>({
    eligibility_processing: false,
    experience_publication: false,
    notifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadConsents() {
      try {
        const res = await fetch("/api/v1/consent");
        if (res.ok && !ignore) {
          const data = await res.json();
          setConsents({
            eligibility_processing: Boolean(
              data.active?.eligibility_processing,
            ),
            experience_publication: Boolean(
              data.active?.experience_publication,
            ),
            notifications: Boolean(data.active?.notifications),
          });
        }
      } catch {
        // Ignored
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadConsents();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleToggle(
    purpose:
      "eligibility_processing" | "experience_publication" | "notifications",
  ) {
    const isGranted = consents[purpose];
    setUpdating(purpose);

    try {
      if (isGranted) {
        // Revoke
        const res = await fetch(`/api/v1/consent/${purpose}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setConsents((prev) => ({ ...prev, [purpose]: false }));
        }
      } else {
        // Grant
        const res = await fetch("/api/v1/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purpose }),
        });
        if (res.ok) {
          setConsents((prev) => ({ ...prev, [purpose]: true }));
        }
      }
    } catch {
      // Ignored
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="py-4 text-sm text-neutral-500">
        Loading privacy consents...
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
      <div>
        <h3 className="text-base font-semibold text-neutral-900">
          Purpose-Bound Privacy Consents
        </h3>
        <p className="mt-1 text-xs text-neutral-600">
          Control how your information is handled. Each consent is isolated,
          versioned, and immediately revocable.
        </p>
      </div>

      <div className="divide-y divide-neutral-100">
        {PURPOSES.map((item) => {
          const active = consents[item.key];
          const isBusy = updating === item.key;

          return (
            <div
              key={item.key}
              className="flex items-start justify-between gap-4 py-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">
                    {item.title}
                  </span>
                  {item.required && (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                      Required for Engine
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-neutral-500">
                  {item.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(item.key)}
                disabled={isBusy}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  active ? "bg-emerald-600" : "bg-neutral-200"
                } ${isBusy ? "opacity-50" : ""}`}
                role="switch"
                aria-checked={active}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PrepIntelTab() {
  return (
    <div className="space-y-6">
      {/* Selection Process Overview */}
      <div className="border-border/80 bg-card rounded-xl border p-5 shadow-xs">
        <h3 className="text-foreground text-sm font-bold tracking-wide uppercase">
          Selection Process &amp; Pattern Breakdown
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Official screening workflow derived from notified syllabus and
          verified recruitment gazettes.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border-border/60 bg-muted/30 rounded-lg border p-4">
            <div className="text-muted-foreground text-xs font-semibold">
              Stage 1
            </div>
            <div className="text-foreground mt-1 text-sm font-bold">
              Preliminary / Screening
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Objective MCQ paper testing General Aptitude, MP State Knowledge,
              and Basic Reasoning.
            </p>
          </div>

          <div className="border-border/60 bg-muted/30 rounded-lg border p-4">
            <div className="text-muted-foreground text-xs font-semibold">
              Stage 2
            </div>
            <div className="text-foreground mt-1 text-sm font-bold">
              Main Examination / Domain
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              In-depth descriptive papers or hands-on domain assessment covering
              core statutory syllabus.
            </p>
          </div>

          <div className="border-border/60 bg-muted/30 rounded-lg border p-4">
            <div className="text-muted-foreground text-xs font-semibold">
              Stage 3
            </div>
            <div className="text-foreground mt-1 text-sm font-bold">
              Interview &amp; Verification
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Personality board interview, document verification, and statutory
              domicile check.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Topics */}
      <div className="border-border/80 bg-card rounded-xl border p-5 shadow-xs">
        <h3 className="text-foreground text-sm font-bold tracking-wide uppercase">
          Key Topics Frequently Asked
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Aggregated from recent question papers and candidate submissions.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Madhya Pradesh Geography & History",
            "Constitutional Provisions & Panchayati Raj",
            "Current State Economic Policies & Schemes",
            "Data Analysis & General Reasoning",
            "Core Technical & Engineering Principles",
            "Public Administration Ethics & Governance",
          ].map((topic, i) => (
            <span
              key={i}
              className="border-border/80 bg-muted/40 text-foreground rounded-lg border px-3 py-1.5 text-xs font-medium"
            >
              • {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Preparation Checklist */}
      <div className="border-border/80 bg-card rounded-xl border p-5 shadow-xs">
        <h3 className="text-foreground text-sm font-bold tracking-wide uppercase">
          Recommended Verification Checklist
        </h3>
        <ul className="text-muted-foreground mt-3 space-y-2 text-xs">
          <li className="flex items-center gap-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ✓
            </span>
            <span>
              MP Employment Exchange (Rojgar Panjiyan) active registration.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ✓
            </span>
            <span>
              Original Domicile Certificate issued by authorized MP
              Tehsildar/SDM.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ✓
            </span>
            <span>
              Valid Category Certificate with active digital seal (for
              OBC/SC/ST/EWS).
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

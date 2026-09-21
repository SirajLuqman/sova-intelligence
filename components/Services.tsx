/* =========================================================
   TYPES
========================================================= */

export interface ServiceItem {
  id?: string;
  title: string;
  desc: string;
}

export interface ServicesData {
  sectionTitle?: string | null;
  enterpriseServices?: ServiceItem[] | null;
  individualServices?: ServiceItem[] | null;
}

interface ServicesProps {
  data?: ServicesData | null;
}

/* =========================================================
   SERVICE CARD
========================================================= */

function ServiceCard({
  service,
  index,
}: {
  service: ServiceItem;
  index: number;
}) {
  const title = service.title?.trim();
  const description = service.desc?.trim();

  if (!title) {
    return null;
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-950/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-700 hover:bg-stone-900">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-700 text-[10px] font-medium text-stone-500 transition-colors duration-300 group-hover:border-amber-400/40 group-hover:text-amber-400">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-stone-200 transition-colors duration-300 group-hover:text-white sm:text-base">
            {title}
          </h4>

          {description && (
            <p className="mt-1.5 text-xs font-light leading-relaxed text-stone-500 transition-colors duration-300 group-hover:text-stone-400 sm:text-sm">
              {description}
            </p>
          )}
        </div>

        <span
          aria-hidden="true"
          className="mt-1 shrink-0 translate-x-2 text-lg leading-none text-amber-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
        >
          →
        </span>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-px w-0 bg-amber-400/70 transition-all duration-500 group-hover:w-full"
      />
    </div>
  );
}

/* =========================================================
   SERVICE CATEGORY
========================================================= */

function ServiceCategory({
  title,
  services,
}: {
  title: string;
  services?: ServiceItem[] | null;
}) {
  if (!Array.isArray(services)) {
    return null;
  }

  const validServices = services.filter(
    (service) =>
      service &&
      typeof service === "object" &&
      typeof service.title === "string" &&
      service.title.trim().length > 0,
  );

  if (validServices.length === 0) {
    return null;
  }

  const isScrollable = validServices.length > 3;

  return (
    <div className="group/category relative rounded-2xl border border-stone-800 bg-stone-900/50 p-6 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-stone-700 hover:bg-stone-900/70 sm:p-8">
      <div className="mb-6 border-b border-stone-800 pb-5">
        <h3 className="text-xl font-semibold uppercase tracking-[0.2em] text-amber-400 sm:text-2xl">
          {title}
        </h3>
      </div>

      <div
        className={`space-y-3 ${
          isScrollable
            ? "max-h-[370px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent"
            : ""
        }`}
      >
        {validServices.map((service, index) => (
          <ServiceCard
            key={
              service.id?.trim() ||
              `${title.toLowerCase().replace(/\s+/g, "-")}-${index}`
            }
            service={service}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Services({ data }: ServicesProps) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const sectionTitle = data.sectionTitle?.trim();

  const enterpriseServices = Array.isArray(data.enterpriseServices)
    ? data.enterpriseServices
    : [];

  const individualServices = Array.isArray(data.individualServices)
    ? data.individualServices
    : [];

  const hasEnterpriseServices = enterpriseServices.some(
    (service) =>
      service &&
      typeof service.title === "string" &&
      service.title.trim().length > 0,
  );

  const hasIndividualServices = individualServices.some(
    (service) =>
      service &&
      typeof service.title === "string" &&
      service.title.trim().length > 0,
  );

  if (!sectionTitle && !hasEnterpriseServices && !hasIndividualServices) {
    return null;
  }

  return (
    <section
      id="services"
      aria-labelledby={sectionTitle ? "services-heading" : undefined}
      className="relative w-full overflow-hidden border-b border-stone-800 bg-stone-950 px-8 py-28 font-sans text-stone-100 md:px-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/[0.035] blur-[140px]"
      />

      <div className="relative mx-auto max-w-7xl">
        {sectionTitle && (
          <div className="mb-16 text-center">
            <h2
              id="services-heading"
              className="text-4xl font-serif font-normal tracking-tight text-stone-100 sm:text-5xl lg:text-5xl"
            >
              {sectionTitle}
            </h2>

            <div
              aria-hidden="true"
              className="mx-auto mt-6 h-px w-16 bg-amber-400/60"
            />
          </div>
        )}

        {(hasEnterpriseServices || hasIndividualServices) && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            {hasEnterpriseServices && (
              <ServiceCategory
                title="For Organisations"
                services={enterpriseServices}
              />
            )}

            {hasIndividualServices && (
              <ServiceCategory
                title="For Individuals"
                services={individualServices}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

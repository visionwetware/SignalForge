export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 md:mb-10 min-w-0">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#E6F7FF]/50 mb-2">{eyebrow}</div>
        )}
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-[1.05] text-[#E6F7FF]">{title}</h1>
        {description && (
          <p className="text-[#E6F7FF]/60 mt-3 max-w-xl text-[15px] leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-10">
      <div>
        {eyebrow && (
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1814]/50 mb-2">{eyebrow}</div>
        )}
        <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-[1.05] text-[#1A1814]">{title}</h1>
        {description && (
          <p className="text-[#1A1814]/60 mt-3 max-w-xl text-[15px] leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
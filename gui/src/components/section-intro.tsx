interface SectionIntroProps {
  title: string;
  body: string;
}

export function SectionIntro({ title, body }: SectionIntroProps) {
  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold text-prism-text">{title}</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-prism-muted">{body}</p>
    </div>
  );
}

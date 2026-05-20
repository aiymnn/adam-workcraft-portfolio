export default function FluidBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-20 bg-gradient-to-b from-[var(--bg-start)] via-[var(--bg-mid)] to-[var(--bg-end)]">
      <div className="absolute -left-[20vw] -top-[20vw] h-[60vw] w-[60vw] rounded-full bg-amber-700/20 opacity-50 blur-[120px] max-md:opacity-30" />
      <div className="absolute -bottom-[10vw] -right-[10vw] h-[60vw] w-[60vw] rounded-full bg-orange-800/15 opacity-40 blur-[120px] max-md:opacity-20" />
      <div className="absolute left-1/2 top-1/2 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-900/30 opacity-35 blur-[120px] max-md:opacity-20" />
    </div>
  );
}

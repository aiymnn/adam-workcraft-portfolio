# Production Plan: Responsive Cinematic Portfolio with Advanced Media Lightbox

## 1. Directory Structure & File Map
The agent MUST create and fully code each of these files, focusing on responsiveness, smooth transitions, and hardware-accelerated performance:
- `components/ui/custom-cursor.tsx` -> Inertial cursor that scales on hover (Must use high-performance low-level setters to avoid React re-renders).
- `components/ui/fluid-bg.tsx` -> Fixed warm base background layer (Must animate using only GPU-friendly transforms to maintain 60FPS).
- `components/layout/navbar.tsx` -> Fully responsive mobile-and-desktop friendly floating navigation.
- `components/sections/hero.tsx` -> Hero section with a warm gradient mesh entity backdrop and responsive fluid typography.
- `components/sections/about.tsx` -> Responsive editorial introduction.
- `components/sections/gallery.tsx` -> Fluid broken-grid layout (1-col on mobile, asymmetric multi-col on desktop).
- `components/ui/lightbox-modal.tsx` -> Fullscreen media popup with custom play button and GSAP crossfade animations for next/prev navigation.
- `components/sections/feedback.tsx` -> Clean, mobile-friendly testimonial layout.
- `components/sections/contact.tsx` -> Responsive bold footer.
- `app/page.tsx` -> Master application assembly.

---

## 2. Advanced Functional & Aesthetic Specifications

### Fully Responsive Layouts & Scroll Opacity Transitions
- **Typography:** Ensure headers scale smoothly across devices using responsive utilities (e.g., `text-5xl md:text-7xl lg:text-9xl tracking-tighter`).
- **Grids:** All structural layouts must be mobile-first. For example, the Gallery grid must use `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12`. Spacing should adapt from `py-16` on mobile to `py-32` on desktop.
- **Cinematic Section Opacity (New Enhancement):** To make the scrolling experience look highly premium, wrap each major section wrapper (`hero`, `about`, `gallery`, `feedback`, `contact`) with a GSAP ScrollTrigger timeline. As the user scrolls, each section must smoothly fade in from `opacity: 0.3` to `1` and fade back out when leaving the viewport. Add `will-change: opacity, transform` to these containers to ensure zero performance drops on mobile.

### Hero with Entity Gradient Backdrop (`components/sections/hero.tsx`)
- **The Concept:** Behind the main photographer profile/placeholder image, place an absolute-positioned radial gradient wrapper (`absolute -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/30 via-stone-950 to-transparent blur-3xl w-[150%] h-[150%]`).
- Use GSAP on mount to animate the scale and opacity of this gradient backdrop softly (`scale: [0.9, 1.1]`, `duration: 6`, `repeat: -1`, `yoyo: true`) to give an organic, glowing aura behind the entity.
- **Performance Fix:** Ensure this looping animation uses native `scale` and `opacity` with `will-change-transform` so it doesn't cause micro-stutters during scrolling.
- Make the layout stack vertically on mobile (`flex-col-reverse`) and align horizontally on desktop (`md:flex-row`).

### Custom Lightbox with Slide & Crossfade (`components/ui/lightbox-modal.tsx`)
- **Custom Play Button:** For video items, hide the native controls initially. Render a custom central play button (`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-stone-100/10 backdrop-blur-md border border-stone-100/30 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110`). Inside, place a minimalist geometric play icon. Fade it out smoothly using GSAP or Tailwind transitions once clicked and the video starts playing.
- **Smooth Next/Prev Transition:** 
  - Wrap the image/video container in a React `ref`.
  - When the user triggers the "Next" or "Previous" actions, execute a GSAP timeline:
    1. Animate the current media out: `gsap.to(mediaRef, { opacity: 0, x: isNext ? -30 : 30, duration: 0.25, ease: "power2.in" })`
    2. Change the active media state index.
    3. Animate the new media in: Set `gsap.set(mediaRef, { x: isNext ? 30 : -30 })` and then animate to `gsap.to(mediaRef, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" })`.

### Responsive Floating Navbar (`components/layout/navbar.tsx`)
- On desktop, show the classic floating pill container.
- On mobile, condense it into a compact floating action button or hamburger layout that triggers a full-screen or sliding menu overlay with staggered link entries.

---

## 3. Strict Execution & Performance Rules
1. **Zero-Render Custom Cursor & Background:** The custom cursor MUST NOT use React `useState` for position tracking. Use `gsap.quickTo()` on window `mousemove` to alter the ref directly. The `fluid-bg.tsx` elements must only animate `x`, `y`, and `scale` to trigger GPU hardware acceleration.
2. **Strict Animation Cleanup:** To prevent memory leaks and lag over time, wrap all GSAP animations and ScrollTriggers within the `@gsap/react` hook context or ensure cleanups via `ctx.revert()` when components unmount.
3. **Fluid Responsiveness:** Test or write layouts ensuring that nothing breaks or cuts off horizontally on screen widths between 320px (mobile) up to 2K desktops.
4. **Zero Placeholder Shortcuts:** Complete all state hook combinations (`useState` for modal media array navigation, active indices, and media loading detection).
5. **Log Progress:** Once all components build successfully without deployment errors, call the `git-release` skill to output the responsive update logs into `progress.txt` under today's date (2026-05-19).
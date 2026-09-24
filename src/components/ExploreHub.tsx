import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type PointerEvent,
  type MouseEvent,
} from "react";
import { gsap } from "gsap";
import Portfolio from "./Portfolio";
import Skills from "./Skills";
import SoundToggle from "./sound/SoundToggle";
import { WorkPlaybackContext } from "./works/WorkPlaybackContext";
import { createPresentation } from "@/lib/hub/presentation";
import {
  createBoundary,
  type BoundaryState,
  type HubDestination,
} from "@/lib/hub/createBoundary";

export default function ExploreHub({
  ref: root,
  onOpenChange,
}: {
  ref: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const chain = useRef<HTMLCanvasElement>(null);
  const workPane = useRef<HTMLDivElement>(null);
  const skillsPane = useRef<HTMLDivElement>(null);
  const workButton = useRef<HTMLButtonElement>(null);
  const skillsButton = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const boundary = useRef<BoundaryState>({
    expansion: 0,
    hover: 0,
    destination: "work",
    time: 0,
    width: 1,
    height: 1,
    pointerX: 0.5,
    pointerY: 0.5,
    pointerStrength: 0,
    gather: 1,
  });
  const presentations = useRef({
    work: createPresentation(boundary.current),
    skills: createPresentation(boundary.current),
  });
  const controls = useRef<{
    open: (target: HubDestination) => void;
    close: () => void;
  } | null>(null);
  const [opened, setOpened] = useState<HubDestination | null>(null);
  const [interactive, setInteractive] = useState(false);
  const press = useRef({ x: 0, y: 0, moved: false });

  function beginChoice(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    press.current = { x: event.clientX, y: event.clientY, moved: false };
    // Keep the pressed destination even if its animated edge moves before release.
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveChoice(event: PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    if (Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > 10)
      press.current.moved = true;
  }
  function choose(event: MouseEvent<HTMLButtonElement>, target: HubDestination) {
    if (event.detail !== 0 && press.current.moved) return;
    controls.current?.open(target);
  }

  const setPlaying = useCallback((playing: boolean) => {
    // 试玩占据整屏时停绘底层，不销毁相机，因此返回后仍在同一件作品上。
    presentations.current.work.suspended = playing;
    presentations.current.skills.suspended = playing;
    workPane.current
      ?.querySelector("#work")
      ?.dispatchEvent(new Event("portal-update"));
  }, []);

  useEffect(() => {
    const element = stage.current!;
    const work = presentations.current.work,
      skills = presentations.current.skills;
    const state = boundary.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const disposeBoundary = createBoundary(
      chain.current!,
      workPane.current!,
      skillsPane.current!,
      workButton.current!,
      skillsButton.current!,
      state,
    );
    let current: HubDestination | null = null;
    let animation: gsap.core.Timeline | undefined;
    let busy = false;
    let openedDuringHandoff = false;
    const previousOverflow = document.documentElement.style.overflow;
    const notify = () => {
      workPane.current
        ?.querySelector("#work")
        ?.dispatchEvent(new Event("portal-update"));
    };
    function open(target: HubDestination, updateHistory = true) {
      if (current || busy) return;
      busy = true;
      current = target;
      const y = element.getBoundingClientRect().top;
      openedDuringHandoff = element.classList.contains("chapter-held");
      onOpenChange(true);
      document.documentElement.style.overflow = "hidden";
      state.destination = target;
      setOpened(target);
      setInteractive(false);
      element.classList.add("is-open");
      if (updateHistory) history.pushState(null, "", `#${target}`);
      animation?.kill();
      animation = gsap.timeline({
        defaults: {
          duration: reduced.matches ? 0 : 1.25,
          ease: "power3.inOut",
        },
        onUpdate: notify,
        onComplete: () => {
          busy = false;
          presentations.current[target].interactive = true;
          presentations.current[target === "work" ? "skills" : "work"].visible =
            false;
          setInteractive(true);
          notify();
          back.current?.focus({ preventScroll: true });
        },
      });
      animation
        .fromTo(element, { y }, { y: 0 }, 0)
        .to(state, { expansion: 1, hover: 0 }, 0)
        .to(presentations.current[target], { expansion: 1 }, 0);
    }
    function close(updateHistory = true) {
      if (!current) return;
      const target = current;
      element
        .querySelectorAll<HTMLDialogElement>("dialog[open]")
        .forEach((dialog) => dialog.close());
      busy = true;
      work.interactive = skills.interactive = false;
      work.visible = skills.visible = true;
      setInteractive(false);
      notify();
      animation?.kill();
      const rect = root.current!.getBoundingClientRect();
      const y = openedDuringHandoff ? 0 : Math.min(
        Math.max(rect.top, 0),
        rect.bottom - element.clientHeight,
      );
      animation = gsap.timeline({
        defaults: {
          duration: reduced.matches ? 0 : 1.05,
          ease: "power3.inOut",
        },
        onUpdate: notify,
        onComplete: () => {
          current = null;
          busy = false;
          setOpened(null);
          element.classList.remove("is-open");
          gsap.set(element, { clearProps: "transform" });
          document.documentElement.style.overflow = previousOverflow;
          onOpenChange(false);
          if (updateHistory) history.replaceState(null, "", "#explore");
          (target === "work" ? workButton : skillsButton).current?.focus({
            preventScroll: true,
          });
        },
      });
      animation
        .to(state, { expansion: 0 }, 0)
        .to(presentations.current[target], { expansion: 0 }, 0)
        .to(element, { y }, 0);
    }
    function keyboard(event: KeyboardEvent) {
      if (!current || document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      // 独立浏览期间焦点留在当前拼图内，避免 Tab 使底层经历或联系页滚动。
      if (event.key === "Tab") {
        const candidates = [
          ...element.querySelectorAll<HTMLElement>(
            "button:not(:disabled),[tabindex='0'],a[href]",
          ),
        ].filter(
          (item) =>
            !item.closest("[inert]") &&
            item.getClientRects().length &&
            getComputedStyle(item).visibility !== "hidden",
        );
        const first = candidates[0],
          last = candidates[candidates.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !element.contains(document.activeElement))
        ) {
          event.preventDefault();
          last?.focus({ preventScroll: true });
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !element.contains(document.activeElement))
        ) {
          event.preventDefault();
          first?.focus({ preventScroll: true });
        }
      }
      if (
        ["PageDown", "PageUp", " ", "End"].includes(event.key) &&
        !(event.target instanceof HTMLButtonElement)
      )
        event.preventDefault();
    }
    function followLocation() {
      const hash = location.hash.slice(1);
      if (hash === "work" || hash === "skills") {
        if (!current) {
          root.current!.scrollIntoView({ block: "start", behavior: "instant" });
          open(hash, false);
        }
      } else if (current) close(false);
    }
    controls.current = { open, close };
    window.addEventListener("keydown", keyboard);
    window.addEventListener("popstate", followLocation);
    window.addEventListener("hashchange", followLocation);
    const initial = requestAnimationFrame(followLocation);
    return () => {
      cancelAnimationFrame(initial);
      animation?.kill();
      gsap.killTweensOf(state);
      disposeBoundary();
      controls.current = null;
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keyboard);
      window.removeEventListener("popstate", followLocation);
      window.removeEventListener("hashchange", followLocation);
      onOpenChange(false);
    };
  }, [root, onOpenChange]);

  function hover(value: number) {
    if (!opened)
      gsap.to(boundary.current, {
        hover: value,
        duration: 0.7,
        overwrite: "auto",
        ease: "sine.out",
      });
  }

  return (
    <WorkPlaybackContext value={setPlaying}>
      <section
        ref={root}
        id="explore"
        className="explore-hub"
        aria-label="Explore work and skills"
      >
        <div
          ref={stage}
          className="hub-stage"
          data-opened={opened ?? ""}
          data-fullscreen={interactive ? opened : ""}
          role={opened ? "dialog" : undefined}
          aria-modal={opened ? true : undefined}
          aria-label={
            opened
              ? opened === "work"
                ? "Explore selected work"
                : "Explore skills"
              : undefined
          }
        >
          <div
            ref={workPane}
            className="hub-pane hub-pane--work"
            aria-hidden={opened === "skills"}
          >
            <Portfolio
              presentation={presentations.current.work}
              active={opened === "work" && interactive}
            />
          </div>
          <div
            ref={skillsPane}
            className="hub-pane hub-pane--skills"
            aria-hidden={opened === "work"}
          >
            <Skills
              presentation={presentations.current.skills}
              active={opened === "skills" && interactive}
            />
          </div>
          <canvas ref={chain} className="hub-chain" aria-hidden="true" />
          <div className="hub-choices" inert={Boolean(opened)}>
            <button
              ref={workButton}
              className="hub-choice hub-choice--work"
              aria-label="进入作品"
              onClick={(event) => choose(event, "work")}
              onPointerDown={beginChoice}
              onPointerMove={moveChoice}
              onPointerCancel={() => { press.current.moved = true; }}
              onPointerEnter={() => hover(1)}
              onPointerLeave={() => hover(0)}
            >
              <span className="hub-label">
                <span>
                  作品 <i aria-hidden="true">↗</i>
                </span>
              </span>
            </button>
            <button
              ref={skillsButton}
              className="hub-choice hub-choice--skills"
              aria-label="进入技能"
              onClick={(event) => choose(event, "skills")}
              onPointerDown={beginChoice}
              onPointerMove={moveChoice}
              onPointerCancel={() => { press.current.moved = true; }}
              onPointerEnter={() => hover(-1)}
              onPointerLeave={() => hover(0)}
            >
              <span className="hub-label">
                <span>
                  技能 <i aria-hidden="true">↗</i>
                </span>
              </span>
            </button>
          </div>
          <button
            ref={back}
            className="hub-back"
            onClick={() => controls.current?.close()}
            tabIndex={opened ? 0 : -1}
          >
            ← <span>Explore</span>
          </button>
          {opened && <SoundToggle floating />}
        </div>
      </section>
    </WorkPlaybackContext>
  );
}

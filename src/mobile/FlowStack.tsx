import {
  createContext,
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDrag } from "@use-gesture/react";
import { useKeyboard, useKeyboardDismissDrag, useKeyboardInsets } from "./Keyboard";

export type FlowScreen = {
  id: string;
  title?: string;
  header?: (flow: FlowControls) => ReactNode;
  headerHeight?: number;
  footer?: (flow: FlowControls) => ReactNode;
  footerHeight?: number;
  render: (flow: FlowControls) => ReactNode;
};

type FlowEntry = FlowScreen & {
  key: string;
};

export type FlowControls = {
  current: FlowEntry;
  previous: FlowEntry | null;
  stack: FlowEntry[];
  canGoBack: boolean;
  push: (screen: FlowScreen) => void;
  pop: () => void;
  replace: (screen: FlowScreen) => void;
};

const FlowContext = createContext<FlowControls | null>(null);

export function useFlow() {
  const context = useContext(FlowContext);

  if (!context) {
    throw new Error("useFlow must be used inside FlowStack");
  }

  return context;
}

function FlowProvider({ value, children }: PropsWithChildren<{ value: FlowControls }>) {
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function FlowStack({ initial }: { initial: FlowScreen }) {
  const keyboard = useKeyboard();
  const { bottomInset, keyboardDragging } = useKeyboardInsets();
  const dismissKeyboardDrag = useKeyboardDismissDrag();
  const stackRef = useRef<HTMLDivElement | null>(null);
  const [screenWidth, setScreenWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 393,
  );
  const sequence = useRef(1);
  const gestureStartedAtEdge = useRef(false);
  const initialEntry = useRef<FlowEntry>({ ...initial, key: `${initial.id}-0` });
  const [stack, setStack] = useState<FlowEntry[]>(() => [initialEntry.current]);
  const [direction, setDirection] = useState(1);
  const [swipeX, setSwipeX] = useState(0);

  useEffect(() => {
    const element = stackRef.current;
    if (!element) return;

    const updateWidth = () => {
      if (element.clientWidth > 0) {
        setScreenWidth(element.clientWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const toEntry = useCallback((screen: FlowScreen): FlowEntry => {
    const next = sequence.current;
    sequence.current += 1;
    return { ...screen, key: `${screen.id}-${next}` };
  }, []);

  const pop = useCallback(() => {
    keyboard.hide();
    setDirection(-1);
    setStack((currentStack) => {
      if (currentStack.length <= 1) return currentStack;
      return currentStack.slice(0, -1);
    });
  }, [keyboard]);

  const controls = useMemo<FlowControls>(() => {
    const current = stack[stack.length - 1];
    const previous = stack.length > 1 ? stack[stack.length - 2] : null;

    return {
      current,
      previous,
      stack,
      canGoBack: stack.length > 1,
      push: (screen) => {
        keyboard.hide();
        setDirection(1);
        setSwipeX(0);
        setStack((currentStack) => [...currentStack, toEntry(screen)]);
      },
      pop,
      replace: (screen) => {
        keyboard.hide();
        setDirection(1);
        setSwipeX(0);
        setStack((currentStack) => {
          const next = currentStack.slice(0, -1);
          return [...next, toEntry(screen)];
        });
      },
    };
  }, [keyboard, pop, stack, toEntry]);

  const bindEdgeSwipe = useDrag(
    (state) => {
      if (!controls.canGoBack) return;

      if (state.first) {
        const candidate =
          state.currentTarget instanceof Element
            ? state.currentTarget
            : state.event?.currentTarget instanceof Element
              ? state.event.currentTarget
              : stackRef.current;
        if (!candidate || typeof candidate.getBoundingClientRect !== "function") {
          gestureStartedAtEdge.current = false;
          return;
        }
        const bounds = candidate.getBoundingClientRect();
        gestureStartedAtEdge.current = state.initial[0] - bounds.left < 28;
      }

      if (!gestureStartedAtEdge.current) return;

      const [movementX] = state.movement;
      const [velocityX] = state.velocity;
      const [directionX] = state.direction;
      const nextX = Math.max(0, Math.min(movementX, screenWidth));

      if (!state.last) {
        setSwipeX(nextX);
        return;
      }

      const shouldPop = nextX > 92 || (velocityX > 0.45 && directionX > 0);
      setSwipeX(0);
      gestureStartedAtEdge.current = false;

      if (shouldPop) {
        controls.pop();
      }
    },
    {
      axis: "x",
      filterTaps: true,
      pointer: { touch: true },
    },
  );

  const topIndex = stack.length - 1;
  const parkedX = -screenWidth * 0.28;
  const header = controls.current.header?.(controls);
  const headerHeight = controls.current.headerHeight ?? 0;
  const headerSafeArea = 0;
  const totalHeaderHeight = header ? headerSafeArea + headerHeight : 0;
  const footer = controls.current.footer?.(controls);
  const footerHeight = controls.current.footerHeight ?? 0;

  const screenVariants = {
    enter: (animationDirection: number) => ({
      x: animationDirection > 0 ? screenWidth : parkedX,
      scale: animationDirection > 0 ? 1 : 0.985,
    }),
    exit: (animationDirection: number) => ({
      x: animationDirection < 0 ? screenWidth : parkedX,
      scale: animationDirection < 0 ? 1 : 0.985,
    }),
  };

  return (
    <FlowProvider value={controls}>
      <div
        ref={stackRef}
        className="flow-stack"
        data-testid="flow-stack"
        data-keyboard-dragging={keyboardDragging ? "true" : "false"}
        style={
          {
            "--flow-header-height": `${totalHeaderHeight}px`,
            "--flow-header-content-height": `${headerHeight}px`,
            "--flow-header-safe-area": `${headerSafeArea}px`,
            "--flow-footer-height": `${footer ? footerHeight : 0}px`,
            "--keyboard-height": `${bottomInset}px`,
          } as CSSProperties
        }
        {...bindEdgeSwipe()}
      >
        {header ? (
          <header className="flow-fixed-header" data-testid="flow-fixed-header">
            {header}
          </header>
        ) : null}
        <div className="flow-scenes">
          <AnimatePresence initial={false} custom={direction}>
            {stack.map((entry, index) => {
              const isTop = index === topIndex;
              const isVisible = index >= topIndex - 1;

              return (
                <motion.div
                  key={entry.key}
                  className="flow-screen"
                  data-flow-current={isTop ? "true" : "false"}
                  data-testid={isTop ? "flow-current" : undefined}
                  custom={direction}
                  variants={screenVariants}
                  initial={isTop ? "enter" : false}
                  animate={{
                    x: isTop ? swipeX : parkedX,
                    scale: isTop ? 1 : 0.985,
                  }}
                  exit="exit"
                  transition={
                    swipeX > 0
                      ? { duration: 0 }
                      : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
                  }
                  style={{
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isTop ? "auto" : "none",
                    visibility: isVisible ? "visible" : "hidden",
                    zIndex: isTop ? 2 : 1,
                  }}
                >
                  {entry.render(controls)}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {footer ? (
          <footer className="flow-fixed-footer" data-testid="flow-fixed-footer" {...dismissKeyboardDrag}>
            {footer}
          </footer>
        ) : null}
      </div>
    </FlowProvider>
  );
}

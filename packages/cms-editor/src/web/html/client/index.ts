/** @jsxImportSource preact */
import EmblaCarousel, { type EmblaCarouselType } from "embla-carousel";

const DEFAULT_TOC_ACTIVE_CLASSES = ["border-primary", "text-base-content", "opacity-100", "font-medium"] as const;

export type InitTableOfContentsOptions = {
  root?: ParentNode;
  headingSelector?: string;
  linkSelector?: string;
  activeClasses?: string[];
  desktopTopOffset?: number;
  mobileTopOffset?: number;
  observerRootMargin?: string;
  observerThreshold?: number | number[];
  onLinkClick?: (params: { link: Element }) => void;
};

const COPY_ICON_HTML =
  '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
const COPIED_ICON_HTML =
  '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-success"><path d="M20 6 9 17l-5-5"></path></svg>';

const writeClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below.
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    return succeeded;
  } catch {
    return false;
  }
};

const markCopied = (button: HTMLElement) => {
  const label = button.querySelector(".copy-label");
  if (label) {
    label.textContent = "Copied!";
    setTimeout(() => {
      label.textContent = "Copy";
    }, 2000);
    return;
  }

  const originalHTML = button.innerHTML;
  button.innerHTML = COPIED_ICON_HTML;
  button.setAttribute("aria-label", "Copied!");
  button.setAttribute("title", "Copied!");
  setTimeout(() => {
    button.innerHTML = originalHTML || COPY_ICON_HTML;
    button.setAttribute("aria-label", "Copy code");
    button.setAttribute("title", "Copy code");
  }, 2000);
};

export const initCodeBlocks = (root: ParentNode = document): (() => void) => {
  const cleanups: Array<() => void> = [];

  root.querySelectorAll("[data-code-tabs]").forEach((container) => {
    if (!(container instanceof HTMLElement)) return;
    if (container.dataset.tabsInitialized) return;
    container.dataset.tabsInitialized = "true";

    const tabs = Array.from(container.querySelectorAll("[data-tab-index]"));
    const panels = Array.from(container.querySelectorAll("[data-tab-panel]")).filter(
      (panel): panel is HTMLElement => panel instanceof HTMLElement,
    );
    const icons = Array.from(container.querySelectorAll("[data-tab-icon]")).filter(
      (icon): icon is HTMLElement => icon instanceof HTMLElement,
    );

    const tabsContainer = container.querySelector("[data-tabs-container]");
    const dropdown = container.querySelector("[data-tabs-dropdown]");
    const dropdownList = container.querySelector("[data-tabs-dropdown-list]");

    if (dropdownList instanceof HTMLElement) {
      dropdownList.innerHTML = "";
      tabs.forEach((tab) => {
        const index = tab.getAttribute("data-tab-index");
        if (!index) return;

        const li = document.createElement("li");
        const link = document.createElement("a");

        link.textContent = tab.textContent;
        link.dataset.dropdownIndex = index;

        if (tab.getAttribute("aria-selected") === "true") {
          link.classList.add("active");
        }

        li.appendChild(link);
        dropdownList.appendChild(li);
      });
    }

    const activeClasses = (container.dataset.activeClasses ?? "font-medium text-base-content border-base-content").split(" ").filter(Boolean);
    const inactiveClasses = (container.dataset.inactiveClasses ?? "font-normal text-base-content/60 border-transparent").split(" ").filter(Boolean);

    const activateTab = (index: number) => {
      tabs.forEach((tab) => {
        const isActive = tab.getAttribute("data-tab-index") === String(index);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        activeClasses.forEach((cls) => tab.classList.toggle(cls, isActive));
        inactiveClasses.forEach((cls) => tab.classList.toggle(cls, !isActive));
      });

      panels.forEach((panel) => {
        panel.hidden = panel.getAttribute("data-tab-panel") !== String(index);
      });

      icons.forEach((icon) => {
        icon.hidden = icon.getAttribute("data-tab-icon") !== String(index);
      });

      if (!(dropdownList instanceof HTMLElement)) return;
      Array.from(dropdownList.querySelectorAll("a")).forEach((link) => {
        const isActive = link.getAttribute("data-dropdown-index") === String(index);
        link.classList.toggle("active", isActive);
      });
    };

    const tabClickHandlers = new Map<Element, EventListener>();
    tabs.forEach((tab) => {
      const handler = () => {
        const index = tab.getAttribute("data-tab-index");
        if (index) activateTab(Number(index));
      };
      tab.addEventListener("click", handler);
      tabClickHandlers.set(tab, handler);
    });

    const dropdownClickHandler = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("[data-dropdown-index]");
      if (!link) return;

      const index = link.getAttribute("data-dropdown-index");
      if (!index) return;

      activateTab(Number(index));
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    if (dropdownList instanceof HTMLElement) {
      dropdownList.addEventListener("click", dropdownClickHandler);
    }

    const tabWidths: number[] = [];
    const updateOverflow = () => {
      if (!(tabsContainer instanceof HTMLElement)) return;
      if (!(dropdown instanceof HTMLElement)) return;

      if (tabWidths.length === 0) {
        tabs.forEach((tab) => {
          if (!(tab instanceof HTMLElement)) return;
          tab.style.display = "block";
          tabWidths.push(tab.offsetWidth);
        });
      }

      const availableWidth = tabsContainer.clientWidth;
      let currentWidth = 0;
      let hasOverflow = false;

      tabs.forEach((tab, index) => {
        const width = tabWidths[index];
        const dropdownItem = dropdownList?.querySelector(`[data-dropdown-index="${index}"]`)?.parentElement;
        if (!(tab instanceof HTMLElement) || !(dropdownItem instanceof HTMLElement)) return;

        if (hasOverflow || currentWidth + width > availableWidth) {
          hasOverflow = true;
          tab.style.display = "none";
          dropdownItem.style.display = "block";
          return;
        }

        currentWidth += width;
        tab.style.display = "block";
        dropdownItem.style.display = "none";
      });

      dropdown.classList.toggle("hidden", !hasOverflow);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (tabsContainer instanceof HTMLElement) {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateOverflow);
      });
      resizeObserver.observe(tabsContainer);
      requestAnimationFrame(updateOverflow);
    }

    cleanups.push(() => {
      tabClickHandlers.forEach((handler, tab) => {
        tab.removeEventListener("click", handler);
      });

      if (dropdownList instanceof HTMLElement) {
        dropdownList.removeEventListener("click", dropdownClickHandler);
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      delete container.dataset.tabsInitialized;
    });
  });

  root.querySelectorAll("[data-code-copy]").forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    if (button.dataset.copyBound) return;
    button.dataset.copyBound = "true";

    const onClick = () => {
      const figure = button.closest(".code-block-figure");
      if (!(figure instanceof Element)) return;

      const activePanel =
        figure.querySelector("[data-tab-panel]:not([hidden])") ||
        figure.querySelector("[data-code-panel]");
      if (!activePanel) return;

      const code = activePanel.textContent ?? "";
      writeClipboard(code).then((copied) => {
        if (copied) {
          markCopied(button);
        }
      });
    };

    button.addEventListener("click", onClick);

    cleanups.push(() => {
      button.removeEventListener("click", onClick);
      delete button.dataset.copyBound;
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};

export const initImageGallery = (root: ParentNode = document): (() => void) => {
  const cleanups: Array<() => void> = [];

  const countGalleryImages = (galleryFigure: Element): number => {
    return Math.max(galleryFigure.querySelectorAll(".image-gallery-slide").length, 1);
  };

  const getGalleryBaseIndex = (galleryFigure: Element): number => {
    const figureRoot =
      galleryFigure.closest("[data-rich-text-content], .rich-text-content, article") ?? document;
    const figureEntities = figureRoot.querySelectorAll(".image-figure, .image-gallery-figure");
    let countBefore = 0;

    for (const entity of figureEntities) {
      if (entity === galleryFigure) break;
      if (entity.classList.contains("image-gallery-figure")) {
        countBefore += countGalleryImages(entity);
      } else {
        countBefore += 1;
      }
    }

    return countBefore;
  };

  root.querySelectorAll("[data-image-gallery]").forEach((container) => {
    if (!(container instanceof HTMLElement)) return;
    if (container.dataset.galleryInitialized || container.dataset.galleryInitializing) return;
    container.dataset.galleryInitializing = "true";

    const viewport = container.querySelector("[data-gallery-viewport]");
    if (!(viewport instanceof HTMLElement)) {
      delete container.dataset.galleryInitializing;
      return;
    }

    const prevBtn = container.querySelector("[data-gallery-prev]");
    const nextBtn = container.querySelector("[data-gallery-next]");
    const indicator = container.querySelector("[data-gallery-indicator]");
    const figure = container.closest("figure");
    const caption = figure?.querySelector("[data-gallery-caption]");

    let embla: EmblaCarouselType | null = null;
    let onPrev: (() => void) | null = null;
    let onNext: (() => void) | null = null;
    let isDestroyed = false;

    const cleanup = () => {
      if (isDestroyed) return;
      isDestroyed = true;

      if (prevBtn && onPrev) {
        prevBtn.removeEventListener("click", onPrev);
      }
      if (nextBtn && onNext) {
        nextBtn.removeEventListener("click", onNext);
      }
      embla?.destroy();
      embla = null;

      delete container.dataset.galleryInitialized;
      delete container.dataset.galleryInitializing;
    };

    cleanups.push(cleanup);

    if (isDestroyed) return;

    embla = EmblaCarousel(viewport, { loop: false, align: "start" });
    container.dataset.galleryInitialized = "true";
    delete container.dataset.galleryInitializing;

    const total = embla.slideNodes().length;
    const galleryBaseIndex = figure ? getGalleryBaseIndex(figure) : 0;
    const setCaption = (index: number) => {
      if (!(caption instanceof HTMLElement)) return;
      const activeSlide = embla?.slideNodes()[index];
      const slideCaption = activeSlide?.querySelector("[data-gallery-slide-caption]");
      const html = slideCaption?.innerHTML?.trim() ?? "";
      const hasCaption = html.length > 0;
      const figureNumber = galleryBaseIndex + index + 1;

      caption.dataset.figLabel = `Fig ${figureNumber}`;
      caption.classList.toggle("has-caption", hasCaption);
      caption.classList.toggle("no-caption", !hasCaption);
      caption.innerHTML = hasCaption ? html : "";
    };

    const updateControls = () => {
      const canPrev = embla?.canScrollPrev() ?? false;
      const canNext = embla?.canScrollNext() ?? false;
      const selectedIndex = embla?.selectedScrollSnap() ?? 0;

      if (prevBtn instanceof HTMLButtonElement) {
        prevBtn.disabled = !canPrev;
        prevBtn.classList.toggle("opacity-40", !canPrev);
        prevBtn.classList.toggle("cursor-not-allowed", !canPrev);
        prevBtn.setAttribute("aria-disabled", String(!canPrev));
      }
      if (nextBtn instanceof HTMLButtonElement) {
        nextBtn.disabled = !canNext;
        nextBtn.classList.toggle("opacity-40", !canNext);
        nextBtn.classList.toggle("cursor-not-allowed", !canNext);
        nextBtn.setAttribute("aria-disabled", String(!canNext));
      }
      if (indicator) {
        indicator.textContent = `${selectedIndex + 1} / ${total}`;
      }

      setCaption(selectedIndex);
    };

    embla.on("select", updateControls);
    embla.on("reInit", updateControls);
    updateControls();
    requestAnimationFrame(() => {
      embla?.reInit();
      updateControls();
    });

    onPrev = () => embla?.scrollPrev();
    onNext = () => embla?.scrollNext();
    prevBtn?.addEventListener("click", onPrev);
    nextBtn?.addEventListener("click", onNext);
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};

export const initTableOfContents = (options: InitTableOfContentsOptions = {}): (() => void) => {
  const {
    root = document,
    headingSelector = "[data-toc-content] :is(h2[id], h3[id])",
    linkSelector = "[data-toc-link]",
    activeClasses = [...DEFAULT_TOC_ACTIVE_CLASSES],
    desktopTopOffset = 112,
    mobileTopOffset = 96,
    observerRootMargin = "-96px 0px -55% 0px",
    observerThreshold = [0, 1],
    onLinkClick,
  } = options;

  const headings = Array.from(root.querySelectorAll(headingSelector)).filter(
    (heading): heading is HTMLElement => heading instanceof HTMLElement,
  );
  const links = Array.from(root.querySelectorAll(linkSelector)).filter(
    (link): link is HTMLElement => link instanceof HTMLElement,
  );

  if (!headings.length || !links.length) {
    return () => {};
  }

  let currentActiveId = "";

  const getHashId = () => window.location.hash.replace(/^#/, "");

  const getHeadingById = (id: string) => headings.find((heading) => heading.id === id);

  const setActiveId = (id: string) => {
    currentActiveId = id;

    links.forEach((link) => {
      const isActive = link.dataset.tocId === id;

      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }

      activeClasses.forEach((className) => {
        link.classList.toggle(className, isActive);
      });
    });
  };

  const syncHash = (id: string) => {
    if (!id || getHashId() === id) return;

    const nextUrl = `${window.location.pathname}${window.location.search}#${id}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  };

  const applyHashState = () => {
    const hashId = getHashId();
    if (!hashId) return false;
    if (!getHeadingById(hashId)) return false;

    setActiveId(hashId);
    return true;
  };

  const updateActiveId = () => {
    const topOffset = window.innerWidth >= 1280 ? desktopTopOffset : mobileTopOffset;
    let activeHeading = headings[0];

    headings.forEach((heading) => {
      if (heading.getBoundingClientRect().top - topOffset <= 0) {
        activeHeading = heading;
      }
    });

    if (!activeHeading?.id || activeHeading.id === currentActiveId) return;

    setActiveId(activeHeading.id);
    syncHash(activeHeading.id);
  };

  const handleHashChange = () => {
    if (!applyHashState()) {
      updateActiveId();
    }
  };

  const observer = new IntersectionObserver(updateActiveId, {
    rootMargin: observerRootMargin,
    threshold: observerThreshold,
  });

  headings.forEach((heading) => observer.observe(heading));
  window.addEventListener("scroll", updateActiveId, { passive: true });
  window.addEventListener("resize", updateActiveId);
  window.addEventListener("hashchange", handleHashChange);

  const linkHandlers = new Map<HTMLElement, EventListener>();
  if (onLinkClick) {
    links.forEach((link) => {
      const handler = () => onLinkClick({ link });
      link.addEventListener("click", handler);
      linkHandlers.set(link, handler);
    });
  }

  if (!applyHashState()) {
    updateActiveId();
  }

  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", updateActiveId);
    window.removeEventListener("resize", updateActiveId);
    window.removeEventListener("hashchange", handleHashChange);
    linkHandlers.forEach((handler, link) => {
      link.removeEventListener("click", handler);
    });
  };
};

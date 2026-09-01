import EmblaCarousel, { type EmblaCarouselType } from "embla-carousel";
import checkSvg from "@phosphor-icons/core/assets/regular/check.svg?raw";
import copySvg from "@phosphor-icons/core/assets/regular/copy.svg?raw";

const DEFAULT_TOC_ACTIVE_CLASSES = ["opacity-100", "font-medium"] as const;

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

const withIconAttrs = (svg: string, attrs: string): string => {
  return svg.replace(/<svg[^>]*>/i, `<svg ${attrs}>`);
};

const COPY_ICON_HTML = withIconAttrs(
  copySvg,
  'aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 256 256" fill="currentColor" class="shrink-0"',
);
const COPIED_ICON_HTML = withIconAttrs(
  checkSvg,
  'aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 256 256" fill="currentColor" class="shrink-0 text-success"',
);

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

  root.querySelectorAll("[data-code-copy]").forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    if (button.dataset.copyBound) return;
    button.dataset.copyBound = "true";

    const onClick = () => {
      const figure = button.closest(".code-block-figure");
      if (!(figure instanceof Element)) return;
      const codePanel = figure.querySelector("[data-code-panel]");
      if (!codePanel) return;

      writeClipboard(codePanel.textContent ?? "").then((copied) => {
        if (copied) markCopied(button);
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

export const initImageLightbox = (root: ParentNode = document): (() => void) => {
  const MODAL_ID = "image-lightbox-modal";

  let modal = document.getElementById(MODAL_ID) as HTMLDialogElement | null;
  if (!modal) {
    const el = document.createElement("dialog");
    el.id = MODAL_ID;
    el.className = "modal";
    el.innerHTML = `
      <div class="modal-box" style="max-width:90vw;width:100%;padding:1rem;background-color:var(--fallback-b3,oklch(var(--b3)/1));position:relative;display:flex;flex-direction:column;gap:0.75rem;align-items:center;">
        <form method="dialog" style="position:absolute;right:0.75rem;top:0.75rem;z-index:10;">
          <button type="submit" class="btn btn-sm btn-circle btn-ghost" aria-label="Close">✕</button>
        </form>
        <img data-lightbox-img src="" alt="" style="max-height:82vh;max-width:100%;object-fit:contain;border-radius:0.5rem;display:block;" />
        <p data-lightbox-caption style="font-size:0.875rem;text-align:center;color:color-mix(in srgb,currentColor 65%,transparent);padding:0 2rem;margin:0;display:none;"></p>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    `;
    document.body.appendChild(el);
    modal = el;
  }

  const imgEl = modal.querySelector("[data-lightbox-img]") as HTMLImageElement | null;
  const captionEl = modal.querySelector("[data-lightbox-caption]") as HTMLElement | null;

  const openLightbox = (src: string, alt: string, captionHtml: string) => {
    if (!imgEl || !captionEl || !modal) return;
    imgEl.src = src;
    imgEl.alt = alt;
    captionEl.innerHTML = captionHtml;
    captionEl.style.display = captionHtml ? "block" : "none";
    (modal as HTMLDialogElement).showModal();
  };

  const makeImagesClickable = () => {
    root.querySelectorAll(".image-figure, .image-gallery-slide").forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.cursor = "zoom-in";
      }
    });
  };

  const clickHandler = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-gallery-prev], [data-gallery-next]")) return;

    const container = target.closest<HTMLElement>(".image-figure, .image-gallery-slide");
    if (!container) return;

    const img = container.querySelector("img");
    if (!(img instanceof HTMLImageElement) || !img.src) return;

    let captionHtml = "";
    if (container.classList.contains("image-gallery-slide")) {
      const slideCaption = container.querySelector("[data-gallery-slide-caption]");
      captionHtml = slideCaption?.innerHTML?.trim() ?? "";
    } else {
      const figure = container.closest("figure");
      const figcaption = figure?.querySelector("figcaption.has-caption");
      captionHtml = figcaption?.innerHTML?.trim() ?? "";
    }

    openLightbox(img.src, img.alt ?? "", captionHtml);
  };

  makeImagesClickable();
  document.addEventListener("click", clickHandler);

  return () => {
    document.removeEventListener("click", clickHandler);
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

export const initRichTextInteractions = (tocDrawerId = "detail-toc-drawer"): (() => void) => {
  let cleanups: Array<() => void> = [];

  const initialize = () => {
    cleanups.forEach((dispose) => dispose());
    cleanups = [
      initCodeBlocks(),
      initImageGallery(),
      initImageLightbox(),
      initTableOfContents({
        onLinkClick: () => {
          const drawer = document.getElementById(tocDrawerId);
          if (drawer instanceof HTMLInputElement) drawer.checked = false;
        },
      }),
    ];
  };

  const onPageLoad = () => initialize();
  initialize();
  document.addEventListener("astro:page-load", onPageLoad);

  return () => {
    document.removeEventListener("astro:page-load", onPageLoad);
    cleanups.forEach((dispose) => dispose());
  };
};

const DARKREADER_HYDRATION_ATTRIBUTES = [
  "data-darkreader-mode",
  "data-darkreader-proxy-injected",
  "data-darkreader-scheme",
  "data-darkreader-inline-bgcolor",
  "data-darkreader-inline-border",
  "data-darkreader-inline-color",
  "data-darkreader-inline-fill",
  "data-darkreader-inline-stroke",
] as const;

const DARKREADER_STYLE_PROPERTIES = [
  "--darkreader-inline-bgcolor",
  "--darkreader-inline-border",
  "--darkreader-inline-color",
  "--darkreader-inline-fill",
  "--darkreader-inline-stroke",
] as const;

function sanitizeHydrationArtifactElement(element: Element) {
  for (const attributeName of DARKREADER_HYDRATION_ATTRIBUTES) {
    if (element.hasAttribute(attributeName)) {
      element.removeAttribute(attributeName);
    }
  }

  if (!("style" in element) || !element.style) {
    return;
  }

  const style = (element as HTMLElement | SVGElement).style;

  for (const propertyName of DARKREADER_STYLE_PROPERTIES) {
    if (style.getPropertyValue(propertyName)) {
      style.removeProperty(propertyName);
    }
  }

  if (!element.getAttribute("style")?.trim()) {
    element.removeAttribute("style");
  }
}

export function sanitizeHydrationExtensionArtifacts(root: ParentNode) {
  const elements =
    root instanceof Element
      ? [root, ...Array.from(root.querySelectorAll("*"))]
      : Array.from(root.querySelectorAll("*"));

  for (const element of elements) {
    sanitizeHydrationArtifactElement(element);
  }
}

export function buildPreHydrationSanitizerScript() {
  const serializedAttributes = JSON.stringify([...DARKREADER_HYDRATION_ATTRIBUTES]);
  const serializedStyleProperties = JSON.stringify([...DARKREADER_STYLE_PROPERTIES]);

  return `(() => {
  const attributeNames = ${serializedAttributes};
  const styleProperties = ${serializedStyleProperties};

  const sanitizeElement = (element) => {
    if (!element || element.nodeType !== 1) {
      return;
    }

    for (const attributeName of attributeNames) {
      if (element.hasAttribute(attributeName)) {
        element.removeAttribute(attributeName);
      }
    }

    if ("style" in element && element.style) {
      for (const propertyName of styleProperties) {
        if (element.style.getPropertyValue(propertyName)) {
          element.style.removeProperty(propertyName);
        }
      }

      if (!element.getAttribute("style")?.trim()) {
        element.removeAttribute("style");
      }
    }
  };

  const sanitizeTree = (root) => {
    if (!root) {
      return;
    }

    if (root.nodeType === 1) {
      sanitizeElement(root);
    }

    if ("querySelectorAll" in root && typeof root.querySelectorAll === "function") {
      for (const element of root.querySelectorAll("*")) {
        sanitizeElement(element);
      }
    }
  };

  sanitizeTree(document.documentElement);

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") {
        sanitizeElement(record.target);
      }

      for (const node of record.addedNodes) {
        sanitizeTree(node);
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["style", ...attributeNames],
  });

  window.addEventListener(
    "load",
    () => {
      setTimeout(() => observer.disconnect(), 0);
    },
    { once: true }
  );
})();`;
}

export const PRE_HYDRATION_SANITIZER_SCRIPT = buildPreHydrationSanitizerScript();

(() => {
  "use strict";

  const config = window.APP_CONFIG;
  const title = document.getElementById("title");
  const status = document.getElementById("status");
  const detail = document.getElementById("detail");

  function getContentId() {
    const params = new URLSearchParams(window.location.search);
    let id = params.get("jd") || "";

    // Match the PHP clean-URL fallback: use the final path segment.
    if (!id) {
      const path = window.location.pathname;
      id = path.split("/").filter(Boolean).pop() || "";
    }

    // Match the PHP extension handling (case-insensitive).
    id = id.replace(/\.html$/i, "");
    return id;
  }

  function buildContentUrl(id) {
    const basePath = config.basePath.endsWith("/") ? config.basePath : `${config.basePath}/`;
    const directory = config.contentDirectory.replace(/^\/+|\/+$/g, "");
    return `${basePath}${directory}/${encodeURIComponent(id)}${config.contentExtension}`;
  }

  function showError(message, extra = "") {
    title.textContent = "HTML File Not Found";
    status.textContent = message;
    detail.textContent = extra;
    document.title = "HTML File Not Found";
  }

  async function loadContent() {
    const id = getContentId();

    if (!id || !config.allowedIdPattern.test(id)) {
      showError("HTML File Not Found", "The Content ID is missing or invalid.");
      return;
    }

    const contentUrl = buildContentUrl(id);
    status.textContent = `Validating ${id}...`;
    detail.textContent = "";

    try {
      // Check that the requested static HTML file exists before navigating.
      const response = await fetch(contentUrl, {
        method: "GET",
        cache: "no-store",
        headers: { "Accept": "text/html" }
      });

      if (!response.ok) {
        showError("HTML File Not Found", `Requested Content ID: ${id}`);
        return;
      }

      // Keep the HTML as a separate document and apply the same sandbox
      // permissions as the PHP response's CSP sandbox allow-scripts allow-forms.
      document.title = id;
      document.body.innerHTML = "";
      const frame = document.createElement("iframe");
      frame.title = `Content ${id}`;
      frame.src = contentUrl;
      frame.setAttribute("sandbox", "allow-scripts allow-forms");
      frame.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0";
      document.body.appendChild(frame);
    } catch (error) {
      showError("Unable to load HTML file.", "Check the GitHub Pages URL and repository deployment.");
      console.error("HTML Loader error:", error);
    }
  }

  loadContent();
})();

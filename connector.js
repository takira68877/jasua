/*
 * Browser-side replacement logic for the legacy FCKeditor XML connector.
 * IMPORTANT: GitHub Pages cannot expose this as a dynamic HTTP endpoint.
 * FCKeditor must be configured to call this adapter from a custom browser
 * integration, or a small serverless endpoint (e.g. Cloudflare Worker) is needed
 * if the legacy connector URL/protocol must remain unchanged.
 */
(() => {
  "use strict";

  const config = window.APP_CONFIG;

  function escapeXmlAttribute(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function getContentId(inputUrl = window.location.href) {
    const url = new URL(inputUrl, window.location.href);
    let id = url.searchParams.get("jd") || "";
    if (!id) id = url.pathname.split("/").filter(Boolean).pop() || "";
    return id.replace(/\.html$/i, "");
  }

  function getRedirectUrl(id) {
    const basePath = config.basePath.endsWith("/") ? config.basePath : `${config.basePath}/`;
    const directory = config.contentDirectory.replace(/^\/+|\/+$/g, "");
    if (!id) return `${window.location.origin}${basePath}${directory}/`;
    if (!config.allowedIdPattern.test(id)) throw new Error("Invalid Content ID");
    return `${window.location.origin}${basePath}${directory}/${encodeURIComponent(id)}${config.contentExtension}`;
  }

  function buildConnectorXml(command, id = getContentId()) {
    const safeCommand = escapeXmlAttribute(command);
    const header = `<?xml version="1.0" encoding="UTF-8"?>` +
      `<Connector command="${safeCommand}" resourceType="${escapeXmlAttribute(config.resourceType)}">` +
      `<CurrentFolder path="${escapeXmlAttribute(config.currentFolderPath)}" url="${escapeXmlAttribute(config.currentFolderUrl)}" />`;

    if (command === "GetFolders") {
      return `${header}<Folders></Folders></Connector>`;
    }

    if (command === "GetFoldersAndFiles") {
      const redirectUrl = getRedirectUrl(id);
      const script = `<script>window.top.location.href=${JSON.stringify(redirectUrl)};<\/script>`;
      const innerSrcdoc = script
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
      const iframe = `<iframe height="0" width="0" srcdoc="${innerSrcdoc}"></iframe>`;
      return `${header}<Files><File desc="1" name="Loading..." size="${escapeXmlAttribute(iframe)}" /></Files></Connector>`;
    }

    return `${header}<Error number="1" /></Connector>`;
  }

  // Expose a small API for a custom FCKeditor browser integration.
  window.StaticFCKConnector = Object.freeze({
    buildConnectorXml,
    getContentId,
    getRedirectUrl
  });
})();

// ==UserScript==
// @name         Wolffiles Fixer
// @namespace    https://github.com/skmedix/wolffiles-fixer
// @version      1.1.0
// @description  Fixes various issues with wolffiles.de, primarily removing www. from URLs and improving map previews
// @author       skmedix
// @homepage     https://github.com/skmedix/wolffiles-fixer
// @supportURL   https://github.com/skmedix/wolffiles-fixer/issues
// @updateURL    https://raw.githubusercontent.com/skmedix/wolffiles-fixer/main/wolffiles-fixer.user.js
// @downloadURL  https://raw.githubusercontent.com/skmedix/wolffiles-fixer/main/wolffiles-fixer.user.js
// @match        *://*.wolffiles.de/*
// @match        *://wolffiles.de/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
    "use strict";

    if (window.location.hostname.startsWith("www.")) {
        const newUrl = window.location.href.replace(
            "www.wolffiles.de",
            "wolffiles.de",
        );
        window.location.replace(newUrl);
        return;
    }

    function showMapPreviews() {
        // Find all links with onmouseover that changes an image
        document.querySelectorAll('a[onmouseover*="bild"]').forEach((link) => {
            // Get the mouseover attribute
            const mouseoverAttr = link.getAttribute("onmouseover");
            if (!mouseoverAttr) {
                return;
            }

            // Extract image details using more precise regex
            const matches = mouseoverAttr.match(
                /document\.([^.]+)\.src='([^']+)',document\.([^.]+)\.width='(\d+)'/,
            );
            if (!matches) {
                return;
            }

            const [, imgName, imgSrc, , imgWidth] = matches;

            const img = document.querySelector(`img[name="${imgName}"]`);
            if (!img) {
                return;
            }

            img.src = imgSrc;
            img.width = parseInt(imgWidth);
            img.style.display = "block";
            img.style.marginTop = "5px";

            link.removeAttribute("onmouseover");
            link.removeAttribute("onmouseout");
        });
    }

    let tabInitScripts = [];

    function initializeTabs() {
        tabInitScripts.forEach((script) => {
            try {
                eval(script);
            } catch (e) {
                console.error("Failed to initialize tab:", e);
            }
        });
    }

    // Modified function to handle tab initialization scripts
    function handleTabScript(script) {
        const content = script.textContent;
        if (content.includes("ddtabcontent") && content.includes(".init")) {
            // Store the initialization script for later
            tabInitScripts.push(content);
            // Remove the original script
            script.remove();
            return true;
        }
        return false;
    }

    function fixResourceUrls() {
        document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
            if (link.href.includes("www.wolffiles.de")) {
                const newHref = link.href.replace(
                    "www.wolffiles.de",
                    "wolffiles.de",
                );
                const newLink = document.createElement("link");
                newLink.rel = "stylesheet";
                newLink.href = newHref;
                link.parentNode.replaceChild(newLink, link);
            }
        });

        // Handle <script> tags
        document
            .querySelectorAll('script[src*="www.wolffiles.de"]')
            .forEach((script) => {
                const newSrc = script.src.replace(
                    "www.wolffiles.de",
                    "wolffiles.de",
                );
                const newScript = document.createElement("script");
                newScript.src = newSrc;
                newScript.type = script.type;

                // If it's tabcontent.js, add onload handler
                if (newSrc.includes("tabcontent.js")) {
                    newScript.onload = () => {
                        // Wait a brief moment to ensure script is fully initialized
                        setTimeout(initializeTabs, 100);
                    };
                }

                script.parentNode.replaceChild(newScript, script);
            });
    }

    // Process other elements
    let isProcessing = false;

    function processElements() {
        if (isProcessing) {
            return;
        }
        isProcessing = true;

        document
            .querySelectorAll('*[background*="wolffiles.de"]')
            .forEach((element) => {
                element.setAttribute(
                    "background",
                    element
                        .getAttribute("background")
                        .replace("www.wolffiles.de", "wolffiles.de"),
                );
            });

        document.querySelectorAll('a[href*="wolffiles.de"]').forEach((link) => {
            link.href = link.href.replace("www.wolffiles.de", "wolffiles.de");
        });

        document.querySelectorAll('img[src*="wolffiles.de"]').forEach((img) => {
            img.src = img.src.replace("www.wolffiles.de", "wolffiles.de");
        });

        document.querySelectorAll("script:not([src])").forEach((script) => {
            handleTabScript(script);
        });

        setTimeout(showMapPreviews, 100);

        isProcessing = false;
    }

    function initialProcess() {
        fixResourceUrls();
        processElements();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialProcess);
    } else {
        initialProcess();
    }

    let timeout = null;
    const observer = new MutationObserver(() => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            fixResourceUrls();
            processElements();
        }, 100);
    });

    function setupObserver() {
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        } else {
            setTimeout(setupObserver, 100);
        }
    }

    setupObserver();
})();

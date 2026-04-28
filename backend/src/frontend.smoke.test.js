const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");
const { JSDOM, VirtualConsole } = require("jsdom");

const repoRoot = path.resolve(__dirname, "..", "..");
const frontendHtml = fs.readFileSync(
  path.join(repoRoot, "frontend", "index.html"),
  "utf8"
);
const frontendScript = fs.readFileSync(
  path.join(repoRoot, "frontend", "app.js"),
  "utf8"
);

function createJsonResponse(status, payload, headers = {}) {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    },
    status
  });
}

function defaultRouteHandlers() {
  return {
    "GET /api/containers/top-level": () =>
      createJsonResponse(200, {
        containers: []
      }),
    "GET /api/items/top-level": () =>
      createJsonResponse(200, {
        items: []
      }),
    "GET /api/inventory-overview": () =>
      createJsonResponse(200, {
        containers: [],
        counts: {
          containers: 0,
          items: 0
        },
        items: [],
        relationshipPaths: []
      }),
    "GET /api/recent-objects": () =>
      createJsonResponse(200, {
        recentObjects: []
      })
  };
}

function createFetchMock(routeHandlers, requestLog) {
  return async function fetchMock(input, options = {}) {
    const requestUrl = new URL(String(input), "http://app.test");
    const method = (options.method || "GET").toUpperCase();
    const key = `${method} ${requestUrl.pathname}${requestUrl.search}`;
    const fallbackKey = `${method} ${requestUrl.pathname}`;
    const handler = routeHandlers[key] || routeHandlers[fallbackKey];

    requestLog.push({
      body: options.body,
      key,
      method,
      pathname: requestUrl.pathname,
      search: requestUrl.search
    });

    if (!handler) {
      throw new Error(`Unhandled fetch request: ${key}`);
    }

    return handler({
      method,
      options,
      requestUrl
    });
  };
}

async function waitFor(assertion, timeoutMs = 1000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return assertion();
    } catch (error) {
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
    }
  }

  return assertion();
}

async function bootstrapFrontendHarness({
  confirmResult = true,
  pathname = "/",
  routeHandlers = {}
} = {}) {
  const requestLog = [];
  const virtualConsole = new VirtualConsole();

  virtualConsole.on("jsdomError", (error) => {
    if (!String(error.message || "").includes("Not implemented: navigation")) {
      throw error;
    }
  });

  const dom = new JSDOM(frontendHtml, {
    pretendToBeVisual: true,
    runScripts: "outside-only",
    url: `http://app.test${pathname}`,
    virtualConsole
  });
  const { window } = dom;

  window.fetch = createFetchMock(
    {
      ...defaultRouteHandlers(),
      ...routeHandlers
    },
    requestLog
  );
  window.confirm = () => confirmResult;
  window.scrollTo = () => {};

  if (window.HTMLMediaElement && window.HTMLMediaElement.prototype) {
    window.HTMLMediaElement.prototype.pause = () => {};
    window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  }

  window.eval(frontendScript);

  await waitFor(() => {
    const statusText = window.document.querySelector("[data-session-status]").textContent;

    assert.notEqual(statusText, "Checking session...");
  });

  return {
    cleanup() {
      dom.window.close();
    },
    document: window.document,
    requestLog,
    window
  };
}

function submitForm(window, form) {
  form.dispatchEvent(
    new window.Event("submit", {
      bubbles: true,
      cancelable: true
    })
  );
}

test("frontend smoke covers login happy path", async () => {
  const harness = await bootstrapFrontendHarness({
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(401, {
          error: "Authentication required"
        }),
      "POST /api/auth/login": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/containers/top-level": () =>
        createJsonResponse(200, {
          containers: [
            {
              id: 1,
              name: "Garage Tote"
            }
          ]
        }),
      "GET /api/items/top-level": () =>
        createJsonResponse(200, {
          items: [
            {
              id: 2,
              name: "Packing Tape"
            }
          ]
        }),
      "GET /api/recent-objects": () =>
        createJsonResponse(200, {
          recentObjects: [
            {
              name: "Garage Tote",
              objectId: 1,
              objectType: "container",
              pathContext: "Garage Tote",
              photoPath: "container-1-photo.jpg",
              photoUrl: "/api/photos/container/1?v=container-1-photo.jpg",
              topLevel: true
            },
            {
              name: "Packing Tape",
              objectId: 2,
              objectType: "item",
              path: [
                {
                  id: 2,
                  name: "Packing Tape",
                  objectType: "item"
                },
                {
                  id: 1,
                  name: "Garage Tote",
                  objectType: "container"
                }
              ],
              pathContext: "Packing Tape > Garage Tote",
              photoPath: "item-2-photo.jpg",
              photoUrl: "/api/photos/item/2?v=item-2-photo.jpg",
              topLevel: false
            },
            {
              name: "Desk Drawer",
              objectId: 3,
              objectType: "container",
              pathContext: "Desk Drawer",
              photoPath: null,
              topLevel: true
            },
            {
              name: "Loose Batteries",
              objectId: 4,
              objectType: "item",
              pathContext: "Loose Batteries",
              photoPath: null,
              topLevel: false
            }
          ]
        })
    }
  });

  try {
    const { document, window } = harness;
    const loginPanel = document.querySelector("[data-login-panel]");
    const homeSections = document.querySelector("[data-home-sections]");

    assert.equal(loginPanel.hidden, false);
    assert.equal(homeSections.hidden, true);

    document.querySelector("[data-username-input]").value = "tester";
    document.querySelector("[data-password-input]").value = "testpass";
    submitForm(window, document.querySelector("[data-login-form]"));

    await waitFor(() => {
      assert.equal(loginPanel.hidden, true);
      assert.equal(homeSections.hidden, false);
      assert.equal(
        document.querySelector("[data-session-status]").textContent,
        "Signed in as tester"
      );
    });
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke covers recent objects rendering", async () => {
  const harness = await bootstrapFrontendHarness({
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/recent-objects": () =>
        createJsonResponse(200, {
          recentObjects: [
            {
              name: "Garage Tote",
              objectId: 1,
              objectType: "container",
              pathContext: "Garage Tote",
              photoPath: "container-1-photo.jpg",
              photoUrl: "/api/photos/container/1?v=container-1-photo.jpg",
              topLevel: true
            },
            {
              name: "Packing Tape",
              objectId: 2,
              objectType: "item",
              path: [
                {
                  id: 2,
                  name: "Packing Tape",
                  objectType: "item"
                },
                {
                  id: 1,
                  name: "Garage Tote",
                  objectType: "container"
                }
              ],
              pathContext: "Packing Tape > Garage Tote",
              photoPath: "item-2-photo.jpg",
              photoUrl: "/api/photos/item/2?v=item-2-photo.jpg",
              topLevel: false
            },
            {
              name: "Basement Bin",
              objectId: 3,
              objectType: "container",
              pathContext: "Basement Bin",
              photoPath: null,
              topLevel: true
            },
            {
              name: "Loose Batteries",
              objectId: 4,
              objectType: "item",
              pathContext: "Loose Batteries",
              photoPath: null,
              topLevel: true
            }
          ]
        })
    }
  });

  try {
    const { document, window } = harness;

    await waitFor(() => {
      const recentLinks = Array.from(
        document.querySelectorAll("[data-recent-objects] [data-object-link]")
      );
      const recentRows = Array.from(
        document.querySelectorAll("[data-recent-objects] li")
      );

      assert.equal(document.querySelector("[data-home-sections]").hidden, false);
      assert.equal(document.querySelector("[data-recent-summary]").textContent, "4 recent objects");
      assert.equal(recentLinks.length, 4);
      assert.equal(recentLinks[0].getAttribute("href"), "/containers/1");
      assert.equal(recentLinks[0].querySelector(".object-name").textContent, "Garage Tote");
      assert.equal(
        recentLinks[0].querySelector(".object-context").textContent,
        "Top level"
      );
      assert.equal(
        recentLinks[0].querySelector(".object-thumbnail-image").getAttribute("src"),
        "/api/photos/container/1?v=container-1-photo.jpg"
      );
      assert.equal(recentLinks[1].getAttribute("href"), "/items/2");
      assert.equal(recentLinks[1].textContent, "Packing Tape");
      assert.equal(
        recentRows[1].querySelector(".object-context").textContent,
        "Packing Tape > Garage Tote"
      );
      assert.equal(
        recentRows[1]
          .querySelector('.object-context [href="/containers/1"]')
          .textContent,
        "Garage Tote"
      );
      assert.equal(
        recentRows[1].querySelector(".object-thumbnail-image").getAttribute("src"),
        "/api/photos/item/2?v=item-2-photo.jpg"
      );
      assert.equal(recentLinks[2].getAttribute("href"), "/containers/3");
      assert.equal(
        recentLinks[2].querySelector(".object-thumbnail-placeholder").textContent,
        "No photo"
      );
      assert.equal(recentLinks[3].getAttribute("href"), "/items/4");
      assert.equal(
        recentLinks[3].querySelector(".object-thumbnail-placeholder").textContent,
        "No photo"
      );
    });

    const recentLinks = Array.from(
      document.querySelectorAll("[data-recent-objects] [data-object-link]")
    );

    assert.equal(
      recentLinks[0].dispatchEvent(
        new window.MouseEvent("click", {
          bubbles: true,
          cancelable: true
        })
      ),
      true
    );
    assert.equal(
      recentLinks[1].dispatchEvent(
        new window.MouseEvent("click", {
          bubbles: true,
          cancelable: true
        })
      ),
      true
    );
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke renders header navigation below the signed-in header", async () => {
  const harness = await bootstrapFrontendHarness({
    pathname: "/containers/1",
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/containers/1": () =>
        createJsonResponse(200, {
          childContainers: [],
          childItems: [],
          container: {
            id: 1,
            name: "Garage Tote",
            parentContainerId: null,
            photoPath: null,
            qrCode: null
          },
          fullPath: "Garage Tote",
          itemCount: 0,
          subcontainerCount: 0
        })
    }
  });

  try {
    const { document, window } = harness;
    const navigations = [];

    window.navigateTo = (path) => {
      navigations.push(path);
    };

    await waitFor(() => {
      assert.equal(document.querySelector("[data-container-page]").hidden, false);
      assert.equal(document.querySelector("[data-app-nav]").hidden, false);
    });

    assert.equal(document.querySelector("[data-bottom-nav]"), null);

    const appHeader = document.querySelector(".app-header");
    const appNav = appHeader.querySelector("[data-app-nav]");
    const headerChildren = Array.from(appHeader.children);
    const statusIndex = headerChildren.indexOf(
      document.querySelector(".header-status")
    );
    const navIndex = headerChildren.indexOf(appNav);
    const backButton = appNav.querySelector("[data-nav-back]");
    const homeButton = appNav.querySelector("[data-nav-home]");
    const forwardButton = appNav.querySelector("[data-nav-forward]");

    assert.ok(navIndex > statusIndex);

    assert.equal(backButton.getAttribute("aria-label"), "Back");
    assert.equal(backButton.getAttribute("title"), "Back");
    assert.equal(homeButton.getAttribute("aria-label"), "Home");
    assert.equal(homeButton.getAttribute("title"), "Home");
    assert.equal(forwardButton.getAttribute("aria-label"), "Forward");
    assert.equal(forwardButton.getAttribute("title"), "Forward");

    homeButton.click();

    await waitFor(() => {
      assert.deepEqual(navigations, ["/"]);
    });
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke keeps home data visible with header navigation", async () => {
  const harness = await bootstrapFrontendHarness({
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/containers/top-level": () =>
        createJsonResponse(200, {
          containers: [
            {
              id: 1,
              name: "Garage Tote",
              photoPath: null
            }
          ]
        }),
      "GET /api/items/top-level": () =>
        createJsonResponse(200, {
          items: [
            {
              id: 2,
              name: "Packing Tape",
              photoPath: null
            }
          ]
        }),
      "GET /api/recent-objects": () =>
        createJsonResponse(200, {
          recentObjects: [
            {
              name: "Garage Tote",
              objectId: 1,
              objectType: "container",
              pathContext: "Garage Tote",
              photoPath: null,
              topLevel: true
            }
          ]
        }),
      "GET /api/inventory-overview": () =>
        createJsonResponse(200, {
          containers: [],
          counts: {
            containers: 3,
            items: 5
          },
          items: [],
          relationshipPaths: []
        })
    }
  });

  try {
    const { document, window } = harness;
    const navigations = [];

    window.navigateTo = (path) => {
      navigations.push(path);
    };

    await waitFor(() => {
      assert.equal(document.querySelector("[data-home-sections]").hidden, false);
      assert.equal(document.querySelector("[data-home-view]").hidden, false);
      assert.equal(document.querySelector("[data-app-nav]").hidden, false);
      assert.equal(
        document.querySelector("[data-top-level-containers] .object-name").textContent,
        "Garage Tote"
      );
      assert.equal(
        document.querySelector("[data-top-level-items] .object-name").textContent,
        "Packing Tape"
      );
      assert.equal(
        document.querySelector("[data-recent-objects] .object-name").textContent,
        "Garage Tote"
      );
      assert.equal(
        document.querySelector("[data-inventory-container-count]").textContent,
        "3"
      );
      assert.equal(
        document.querySelector("[data-inventory-item-count]").textContent,
        "5"
      );
    });

    const recentPanel = document.querySelector("[data-recent-objects]").closest(".panel");
    const statsPanel = document
      .querySelector("[data-inventory-overview-link]")
      .closest(".panel");
    const homePanels = Array.from(
      document.querySelector("[data-home-view]").children
    );

    assert.ok(homePanels.indexOf(statsPanel) > homePanels.indexOf(recentPanel));

    document.querySelector("[data-inventory-overview-link]").click();

    await waitFor(() => {
      assert.deepEqual(navigations, ["/inventory-overview"]);
    });
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke renders inventory overview panels and navigation", async () => {
  const harness = await bootstrapFrontendHarness({
    pathname: "/inventory-overview",
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/inventory-overview": () =>
        createJsonResponse(200, {
          containers: [
            {
              fullPath: "Garage Tote",
              id: 1,
              name: "Garage Tote",
              parentContainerId: null,
              topLevel: true
            },
            {
              fullPath: "Inner Bin > Garage Tote",
              id: 2,
              name: "Inner Bin",
              path: [
                {
                  id: 2,
                  name: "Inner Bin",
                  objectType: "container"
                },
                {
                  id: 1,
                  name: "Garage Tote",
                  objectType: "container"
                }
              ],
              parentContainerId: 1,
              topLevel: false
            }
          ],
          counts: {
            containers: 2,
            items: 2
          },
          items: [
            {
              fullPath: "Loose Batteries",
              id: 3,
              name: "Loose Batteries",
              parentContainerId: null,
              topLevel: true
            },
            {
              fullPath: "Screwdriver > Inner Bin > Garage Tote",
              id: 4,
              name: "Screwdriver",
              path: [
                {
                  id: 4,
                  name: "Screwdriver",
                  objectType: "item"
                },
                {
                  id: 2,
                  name: "Inner Bin",
                  objectType: "container"
                },
                {
                  id: 1,
                  name: "Garage Tote",
                  objectType: "container"
                }
              ],
              parentContainerId: 2,
              topLevel: false
            }
          ],
          relationshipPaths: [
            {
              objectId: 1,
              objectType: "container",
              path: "Top Level > Garage Tote",
              pathSegments: [
                {
                  id: 1,
                  name: "Garage Tote",
                  objectType: "container"
                }
              ]
            },
            {
              objectId: 2,
              objectType: "container",
              path: "Top Level > Inner Bin > Garage Tote",
              pathSegments: [
                {
                  id: 2,
                  name: "Inner Bin",
                  objectType: "container"
                },
                {
                  id: 1,
                  name: "Garage Tote",
                  objectType: "container"
                }
              ]
            },
            {
              objectId: 4,
              objectType: "item",
              path: "Top Level > Screwdriver > Inner Bin > Garage Tote",
              pathSegments: [
                {
                  id: 4,
                  name: "Screwdriver",
                  objectType: "item"
                },
                {
                  id: 2,
                  name: "Inner Bin",
                  objectType: "container"
                },
                {
                  id: 1,
                  name: "Garage Tote",
                  objectType: "container"
                }
              ]
            }
          ]
        })
    }
  });

  try {
    const { document, window } = harness;
    const navigations = [];

    window.navigateTo = (path) => {
      navigations.push(path);
    };

    await waitFor(() => {
      assert.equal(
        document.querySelector("[data-inventory-overview-page]").hidden,
        false
      );
      assert.equal(
        document.querySelectorAll("[data-inventory-overview-page] > .panel")
          .length,
        3
      );
      assert.match(
        document.querySelector("[data-inventory-items]").textContent,
        /Screwdriver/
      );
      assert.equal(
        document.querySelector("[data-inventory-containers] .object-name").textContent,
        "Garage Tote"
      );
      assert.match(
        document.querySelector("[data-inventory-paths]").textContent,
        /Top Level > Screwdriver > Inner Bin > Garage Tote/
      );
      assert.equal(
        document
          .querySelector('[data-inventory-paths] [href="/items/4"]')
          .textContent,
        "Screwdriver"
      );
    });

    document
      .querySelector('[data-inventory-items] [href="/items/4"]')
      .dispatchEvent(
        new window.MouseEvent("click", {
          bubbles: true,
          cancelable: true
        })
      );
    document
      .querySelector("[data-inventory-containers] [data-object-link]")
      .dispatchEvent(
        new window.MouseEvent("click", {
          bubbles: true,
          cancelable: true
        })
      );

    assert.deepEqual(navigations, ["/items/4", "/containers/1"]);
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke renders empty inventory overview states", async () => {
  const harness = await bootstrapFrontendHarness({
    pathname: "/inventory-overview",
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        })
    }
  });

  try {
    const { document } = harness;

    await waitFor(() => {
      assert.equal(
        document.querySelector("[data-inventory-overview-page]").hidden,
        false
      );
      assert.equal(document.querySelector("[data-inventory-items-empty]").hidden, false);
      assert.equal(
        document.querySelector("[data-inventory-containers-empty]").hidden,
        false
      );
      assert.equal(document.querySelector("[data-inventory-paths-empty]").hidden, false);
    });
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke shows top-level object photo thumbnails without breaking navigation", async () => {
  const harness = await bootstrapFrontendHarness({
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/containers/top-level": () =>
        createJsonResponse(200, {
          containers: [
            {
              id: 1,
              name: "Garage Tote",
              photoPath: "container-1-photo.jpg"
            },
            {
              id: 4,
              name: "Basement Bin",
              photoPath: null
            }
          ]
        }),
      "GET /api/items/top-level": () =>
        createJsonResponse(200, {
          items: [
            {
              id: 2,
              name: "Packing Tape",
              photoPath: "item-2-photo.jpg"
            },
            {
              id: 3,
              name: "Loose Batteries",
              photoPath: null
            }
          ]
        })
    }
  });

  try {
    const { document, window } = harness;

    await waitFor(() => {
      const containerLinks = Array.from(
        document.querySelectorAll("[data-top-level-containers] [data-object-link]")
      );
      const itemLinks = Array.from(
        document.querySelectorAll("[data-top-level-items] [data-object-link]")
      );

      assert.equal(document.querySelector("[data-home-sections]").hidden, false);
      assert.equal(
        document.querySelector("[data-top-level-containers-summary]").textContent,
        "2 top-level containers"
      );
      assert.equal(
        document.querySelector("[data-top-level-items-summary]").textContent,
        "2 top-level items"
      );
      assert.equal(containerLinks.length, 2);
      assert.equal(itemLinks.length, 2);

      const photoContainerLink = containerLinks[0];
      const photoContainerImage = photoContainerLink.querySelector(
        ".object-thumbnail-image"
      );

      assert.equal(photoContainerLink.getAttribute("href"), "/containers/1");
      assert.equal(
        photoContainerLink.querySelector(".object-name").textContent,
        "Garage Tote"
      );
      assert.equal(
        photoContainerImage.getAttribute("src"),
        "/api/photos/container/1?v=container-1-photo.jpg"
      );
      assert.equal(photoContainerImage.getAttribute("alt"), "Garage Tote photo");
      assert.equal(containerLinks[1].getAttribute("href"), "/containers/4");
      assert.equal(
        containerLinks[1].querySelector(".object-thumbnail-placeholder").textContent,
        "No photo"
      );

      const photoItemLink = itemLinks[0];
      const photoImage = photoItemLink.querySelector(".object-thumbnail-image");

      assert.equal(photoItemLink.getAttribute("href"), "/items/2");
      assert.equal(photoItemLink.querySelector(".object-name").textContent, "Packing Tape");
      assert.equal(
        photoItemLink.querySelector(".object-context").textContent,
        "Top-level item"
      );
      assert.equal(
        photoImage.getAttribute("src"),
        "/api/photos/item/2?v=item-2-photo.jpg"
      );
      assert.equal(photoImage.getAttribute("alt"), "Packing Tape photo");

      const noPhotoItemLink = itemLinks[1];

      assert.equal(noPhotoItemLink.getAttribute("href"), "/items/3");
      assert.equal(
        noPhotoItemLink.querySelector(".object-name").textContent,
        "Loose Batteries"
      );
      assert.equal(noPhotoItemLink.querySelector(".object-thumbnail-image"), null);
      assert.equal(
        noPhotoItemLink.querySelector(".object-thumbnail-placeholder").textContent,
        "No photo"
      );
    });

    const containerWithPhotoLink = document.querySelector(
      "[data-top-level-containers] [data-object-link]"
    );
    const itemWithPhotoLink = document.querySelector(
      "[data-top-level-items] [data-object-link]"
    );

    assert.equal(
      containerWithPhotoLink.dispatchEvent(
        new window.MouseEvent("click", {
          bubbles: true,
          cancelable: true
        })
      ),
      true
    );
    assert.equal(
      itemWithPhotoLink.dispatchEvent(
        new window.MouseEvent("click", {
          bubbles: true,
          cancelable: true
        })
      ),
      true
    );
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke covers opening a container route", async () => {
  const harness = await bootstrapFrontendHarness({
    pathname: "/containers/1",
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/containers/1": () =>
        createJsonResponse(200, {
          childContainers: [],
          childItems: [
            {
              id: 2,
              name: "Packing Tape"
            }
          ],
          container: {
            id: 1,
            name: "Garage Tote",
            parentContainerId: null,
            photoPath: null,
            qrCode: "qr-garage"
          },
          fullPath: "Garage Tote",
          itemCount: 1,
          subcontainerCount: 0
        })
    }
  });

  try {
    const { document } = harness;

    await waitFor(() => {
      assert.equal(document.querySelector("[data-container-page]").hidden, false);
      assert.equal(
        document.querySelector("[data-container-page-name]").textContent,
        "Garage Tote"
      );
      assert.equal(
        document.querySelector("[data-container-full-path]").textContent,
        "Garage Tote"
      );
      assert.equal(
        document.querySelector("[data-container-qr-status]").textContent,
        "QR linked to this object."
      );
    });
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke covers mixed search results and result navigation", async () => {
  const harness = await bootstrapFrontendHarness({
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/search?q=cable": () =>
        createJsonResponse(200, {
          results: [
            {
              name: "Cable Box",
              objectId: 1,
              objectType: "container",
              pathContext: "Top level",
              topLevel: true
            },
            {
              name: "Cable Charger",
              objectId: 2,
              objectType: "item",
              path: [
                {
                  id: 2,
                  name: "Cable Charger",
                  objectType: "item"
                },
                {
                  id: 2,
                  name: "Shelf Bin",
                  objectType: "container"
                },
                {
                  id: 1,
                  name: "Garage Tote",
                  objectType: "container"
                }
              ],
              pathContext: "Cable Charger > Shelf Bin > Garage Tote",
              topLevel: false
            }
          ]
        })
    }
  });

  try {
    const { document, window } = harness;
    const searchInput = document.querySelector("[data-search-input]");
    const navigatedPaths = [];

    window.navigateTo = (path) => {
      navigatedPaths.push(path);
    };

    await waitFor(() => {
      assert.equal(document.querySelector("[data-home-sections]").hidden, false);
    });

    searchInput.value = "cable";
    submitForm(window, document.querySelector("[data-search-form]"));

    await waitFor(() => {
      const searchSection = document.querySelector("[data-search-section]");
      const searchLinks = Array.from(
        document.querySelectorAll("[data-search-results] [data-object-link]")
      );
      const searchRows = Array.from(
        document.querySelectorAll("[data-search-results] li")
      );

      assert.equal(searchSection.hidden, false);
      assert.equal(document.querySelector("[data-search-summary]").textContent, "2 matches");
      assert.equal(searchLinks.length, 2);
      assert.equal(searchLinks[0].getAttribute("href"), "/containers/1");
      assert.equal(searchLinks[0].querySelector(".object-name").textContent, "Cable Box");
      assert.equal(
        searchLinks[0].querySelector(".object-context").textContent,
        "Top level"
      );
      assert.equal(searchLinks[1].getAttribute("href"), "/items/2");
      assert.equal(searchLinks[1].textContent, "Cable Charger");
      assert.equal(
        searchRows[1].querySelector(".object-context").textContent,
        "Cable Charger > Shelf Bin > Garage Tote"
      );
      assert.equal(
        searchRows[1]
          .querySelector('.object-context [href="/containers/1"]')
          .textContent,
        "Garage Tote"
      );
    });

    const itemLink = document.querySelectorAll("[data-search-results] [data-object-link]")[1];
    itemLink.dispatchEvent(
      new window.MouseEvent("click", {
        bubbles: true,
        cancelable: true
      })
    );

    assert.deepEqual(navigatedPaths, ["/items/2"]);
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke clears search state for blank input and shows a clean no-results state", async () => {
  const harness = await bootstrapFrontendHarness({
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/search?q=tape": () =>
        createJsonResponse(200, {
          results: [
            {
              name: "Packing Tape",
              objectId: 2,
              objectType: "item",
              pathContext: "Garage Tote > Packing Tape",
              topLevel: false
            }
          ]
        }),
      "GET /api/search?q=missing": () =>
        createJsonResponse(200, {
          results: []
        })
    }
  });

  try {
    const { document, requestLog, window } = harness;
    const searchInput = document.querySelector("[data-search-input]");
    const searchForm = document.querySelector("[data-search-form]");

    await waitFor(() => {
      assert.equal(document.querySelector("[data-home-sections]").hidden, false);
    });

    searchInput.value = "tape";
    submitForm(window, searchForm);

    await waitFor(() => {
      assert.equal(document.querySelector("[data-search-summary]").textContent, "1 match");
    });

    const searchRequestsBeforeBlankSubmit = requestLog.filter(
      (request) => request.key === "GET /api/search?q=tape"
    ).length;

    searchInput.value = "   ";
    searchInput.dispatchEvent(
      new window.Event("input", {
        bubbles: true
      })
    );
    submitForm(window, searchForm);

    await waitFor(() => {
      assert.equal(document.querySelector("[data-search-section]").hidden, true);
      assert.equal(document.querySelector("[data-search-results]").children.length, 0);
      assert.equal(
        document.querySelector("[data-search-summary]").textContent,
        "Search containers and items by name."
      );
    });

    assert.equal(
      requestLog.filter((request) => request.key === "GET /api/search?q=tape").length,
      searchRequestsBeforeBlankSubmit
    );

    searchInput.value = "missing";
    submitForm(window, searchForm);

    await waitFor(() => {
      assert.equal(document.querySelector("[data-search-section]").hidden, false);
      assert.equal(
        document.querySelector("[data-search-summary]").textContent,
        'No matches for "missing"'
      );
      assert.equal(document.querySelector("[data-search-results]").hidden, true);
      assert.equal(document.querySelector("[data-search-empty]").hidden, false);
      assert.equal(
        document.querySelector("[data-search-empty]").textContent,
        'No containers or items matched "missing".'
      );
    });
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke returns to signed-out state when search receives a 401", async () => {
  const harness = await bootstrapFrontendHarness({
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/search?q=tape": () =>
        createJsonResponse(401, {
          error: "Authentication required"
        })
    }
  });

  try {
    const { document, window } = harness;

    await waitFor(() => {
      assert.equal(document.querySelector("[data-home-sections]").hidden, false);
    });

    document.querySelector("[data-search-input]").value = "tape";
    submitForm(window, document.querySelector("[data-search-form]"));

    await waitFor(() => {
      assert.equal(document.querySelector("[data-login-panel]").hidden, false);
      assert.equal(document.querySelector("[data-home-sections]").hidden, true);
      assert.equal(
        document.querySelector("[data-session-status]").textContent,
        "Sign in required"
      );
      assert.equal(
        document.querySelector("[data-login-error]").textContent,
        "Session expired. Sign in again."
      );
      assert.equal(document.querySelector("[data-search-section]").hidden, true);
    });
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke covers the container delete UI flow for a top-level container", async () => {
  const harness = await bootstrapFrontendHarness({
    pathname: "/containers/1",
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/containers/1": () =>
        createJsonResponse(200, {
          childContainers: [],
          childItems: [],
          container: {
            id: 1,
            name: "Garage Tote",
            parentContainerId: null,
            photoPath: null,
            qrCode: null
          },
          fullPath: "Garage Tote",
          itemCount: 0,
          subcontainerCount: 0
        }),
      "DELETE /api/containers/1": () =>
        createJsonResponse(200, {
          success: true
        })
    }
  });

  try {
    const { document, requestLog, window } = harness;
    const confirmations = [];
    const navigations = [];

    window.confirm = (message) => {
      confirmations.push(message);
      return true;
    };
    window.navigateTo = (path) => {
      navigations.push(path);
    };

    await waitFor(() => {
      assert.equal(document.querySelector("[data-container-page]").hidden, false);
    });

    document.querySelector("[data-container-delete]").click();

    await waitFor(() => {
      const deleteRequests = requestLog.filter(
        (request) => request.key === "DELETE /api/containers/1"
      );

      assert.equal(deleteRequests.length, 1);
      assert.equal(
        document.querySelector("[data-container-action-note]").textContent,
        "Deleting container..."
      );
    });

    assert.deepEqual(confirmations, [
      'Delete "Garage Tote"? This will not delete its contents. Direct child items and containers will move up one level.'
    ]);
    await waitFor(() => {
      assert.deepEqual(navigations, ["/"]);
    });
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke navigates to parent after deleting a nested container", async () => {
  const harness = await bootstrapFrontendHarness({
    pathname: "/containers/2",
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/containers/2": () =>
        createJsonResponse(200, {
          childContainers: [
            {
              id: 3,
              name: "Small Parts",
              parentContainerId: 2
            }
          ],
          childItems: [
            {
              id: 4,
              name: "Packing Tape",
              parentContainerId: 2
            }
          ],
          container: {
            id: 2,
            name: "Shelf Bin",
            parentContainerId: 1,
            photoPath: null,
            qrCode: null
          },
          fullPath: "Garage Tote > Shelf Bin",
          itemCount: 1,
          subcontainerCount: 1
        }),
      "DELETE /api/containers/2": () =>
        createJsonResponse(200, {
          success: true
        })
    }
  });

  try {
    const { document, requestLog, window } = harness;
    const confirmations = [];
    const navigations = [];

    window.confirm = (message) => {
      confirmations.push(message);
      return true;
    };
    window.navigateTo = (path) => {
      navigations.push(path);
    };

    await waitFor(() => {
      assert.equal(document.querySelector("[data-container-page]").hidden, false);
    });

    document.querySelector("[data-container-delete]").click();

    await waitFor(() => {
      assert.equal(
        requestLog.filter((request) => request.key === "DELETE /api/containers/2")
          .length,
        1
      );
    });

    assert.deepEqual(confirmations, [
      'Delete "Shelf Bin"? This will not delete its contents. Direct child items and containers will move up one level.'
    ]);
    await waitFor(() => {
      assert.deepEqual(navigations, ["/containers/1"]);
    });
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke covers an item move happy path", async () => {
  const harness = await bootstrapFrontendHarness({
    pathname: "/items/2/move",
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/items/2": () =>
        createJsonResponse(200, {
          item: {
            id: 2,
            name: "Packing Tape",
            parentContainerId: 1,
            photoPath: null,
            qrCode: null
          },
          topLevel: false,
          fullPath: "Garage Tote > Packing Tape"
        }),
      "GET /api/containers/options": () =>
        createJsonResponse(200, {
          containers: [
            {
              id: 1,
              name: "Garage Tote",
              fullPath: "Garage Tote",
              parentContainerId: null,
              topLevel: true
            },
            {
              id: 3,
              name: "Shelf Bin",
              fullPath: "Garage Tote > Shelf Bin",
              parentContainerId: 1,
              topLevel: false
            }
          ]
        }),
      "POST /api/items/2/move": () =>
        createJsonResponse(200, {
          item: {
            id: 2,
            parentContainerId: 3
          },
          topLevel: false
        })
    }
  });

  try {
    const { document, requestLog, window } = harness;
    const navigations = [];

    window.navigateTo = (path) => {
      navigations.push(path);
    };

    await waitFor(() => {
      assert.equal(document.querySelector("[data-item-move-page]").hidden, false);
      assert.equal(
        document.querySelector("[data-item-move-title]").textContent,
        "Move Packing Tape"
      );
      assert.equal(
        document.querySelector("[data-item-move-current-location]").textContent,
        "Garage Tote > Packing Tape"
      );
      assert.equal(
        document.querySelector("[data-item-move-destination-select]").value,
        "1"
      );
    });

    document.querySelector("[data-item-move-destination-select]").value = "3";
    submitForm(window, document.querySelector("[data-item-move-form]"));

    await waitFor(() => {
      assert.deepEqual(navigations, ["/items/2"]);
    });

    const moveRequests = requestLog.filter(
      (request) => request.key === "POST /api/items/2/move"
    );

    assert.equal(moveRequests.length, 1);
    assert.equal(moveRequests[0].body, JSON.stringify({ parentContainerId: 3 }));
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke covers a container move happy path", async () => {
  const harness = await bootstrapFrontendHarness({
    pathname: "/containers/2/move",
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/containers/2": () =>
        createJsonResponse(200, {
          container: {
            id: 2,
            name: "Shelf Bin",
            parentContainerId: 1,
            photoPath: null,
            qrCode: null
          },
          path: [
            {
              id: 1,
              name: "Garage Tote"
            },
            {
              id: 2,
              name: "Shelf Bin"
            }
          ],
          fullPath: "Garage Tote > Shelf Bin",
          childContainers: [],
          childItems: [],
          itemCount: 0,
          subcontainerCount: 0
        }),
      "GET /api/containers/options": () =>
        createJsonResponse(200, {
          containers: [
            {
              id: 1,
              name: "Garage Tote",
              fullPath: "Garage Tote",
              parentContainerId: null,
              topLevel: true
            },
            {
              id: 2,
              name: "Shelf Bin",
              fullPath: "Garage Tote > Shelf Bin",
              parentContainerId: 1,
              topLevel: false
            },
            {
              id: 4,
              name: "Attic Stack",
              fullPath: "Attic Stack",
              parentContainerId: null,
              topLevel: true
            }
          ]
        }),
      "POST /api/containers/2/move": () =>
        createJsonResponse(200, {
          container: {
            id: 2,
            parentContainerId: 4
          },
          fullPath: "Attic Stack > Shelf Bin"
        })
    }
  });

  try {
    const { document, requestLog, window } = harness;
    const navigations = [];

    window.navigateTo = (path) => {
      navigations.push(path);
    };

    await waitFor(() => {
      assert.equal(document.querySelector("[data-container-move-page]").hidden, false);
      assert.equal(
        document.querySelector("[data-container-move-title]").textContent,
        "Move Shelf Bin"
      );
      assert.equal(
        document.querySelector("[data-container-move-current-location]").textContent,
        "Garage Tote > Shelf Bin"
      );
      assert.equal(
        document.querySelector("[data-container-move-destination-select]").value,
        "1"
      );
    });

    document.querySelector("[data-container-move-destination-select]").value = "4";
    submitForm(window, document.querySelector("[data-container-move-form]"));

    await waitFor(() => {
      assert.deepEqual(navigations, ["/containers/2"]);
    });

    const moveRequests = requestLog.filter(
      (request) => request.key === "POST /api/containers/2/move"
    );

    assert.equal(moveRequests.length, 1);
    assert.equal(moveRequests[0].body, JSON.stringify({ parentContainerId: 4 }));
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke keeps the scanned code visible and carries it into unknown-qr create flows", async () => {
  const harness = await bootstrapFrontendHarness({
    pathname: "/qr/unknown?code=qr-new-label",
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        })
    }
  });

  try {
    const { document, window } = harness;
    const navigations = [];

    window.navigateTo = (path) => {
      navigations.push(path);
    };

    await waitFor(() => {
      assert.equal(document.querySelector("[data-unknown-qr-page]").hidden, false);
      assert.equal(
        document.querySelector("[data-unknown-qr-code]").textContent,
        "qr-new-label"
      );
      assert.match(
        document.querySelector("[data-unknown-qr-link-note]").textContent,
        /qr-new-label/i
      );
      assert.equal(
        document.querySelector("[data-unknown-qr-create-container]").textContent,
        "Create Container With This QR"
      );
      assert.equal(
        document.querySelector("[data-unknown-qr-create-item]").textContent,
        "Create Item With This QR"
      );
    });

    document.querySelector("[data-unknown-qr-create-container]").click();
    document.querySelector("[data-unknown-qr-create-item]").click();

    assert.deepEqual(navigations, [
      "/containers/new?qrCode=qr-new-label",
      "/items/new?qrCode=qr-new-label"
    ]);
  } finally {
    harness.cleanup();
  }
});

test("frontend smoke shows a clear duplicate-link error in the unknown-qr flow", async () => {
  const harness = await bootstrapFrontendHarness({
    pathname: "/qr/unknown?code=qr-duplicate",
    routeHandlers: {
      "GET /api/auth/current-session": () =>
        createJsonResponse(200, {
          user: {
            id: 1,
            username: "tester"
          }
        }),
      "GET /api/search?q=tape": () =>
        createJsonResponse(200, {
          results: [
            {
              name: "Packing Tape",
              objectId: 2,
              objectType: "item",
              pathContext: "Garage Tote > Packing Tape"
            }
          ]
        }),
      "POST /api/qr/link": () =>
        createJsonResponse(409, {
          error: "QR code is already linked to another object"
        })
    }
  });

  try {
    const { document, requestLog, window } = harness;

    await waitFor(() => {
      assert.equal(document.querySelector("[data-unknown-qr-page]").hidden, false);
    });

    document.querySelector("[data-unknown-qr-search-input]").value = "tape";
    submitForm(window, document.querySelector("[data-unknown-qr-search-form]"));

    await waitFor(() => {
      const linkButtons = document.querySelectorAll("[data-unknown-qr-link-button]");

      assert.equal(linkButtons.length, 1);
      assert.match(
        document.querySelector("[data-unknown-qr-link-note]").textContent,
        /qr-duplicate/i
      );
    });

    document.querySelector("[data-unknown-qr-link-button]").click();

    await waitFor(() => {
      const errorNode = document.querySelector("[data-unknown-qr-error]");
      const linkButton = document.querySelector("[data-unknown-qr-link-button]");

      assert.equal(errorNode.hidden, false);
      assert.equal(
        errorNode.textContent,
        "This QR code is already linked to another object. Open the linked object or use a different QR code."
      );
      assert.match(
        document.querySelector("[data-unknown-qr-link-note]").textContent,
        /qr-duplicate/i
      );
      assert.equal(
        document.querySelector("[data-unknown-qr-code]").textContent,
        "qr-duplicate"
      );
      assert.equal(linkButton.disabled, false);
      assert.equal(linkButton.textContent, "Link This QR");
    });

    const linkRequests = requestLog.filter(
      (request) => request.key === "POST /api/qr/link"
    );

    assert.equal(linkRequests.length, 1);
  } finally {
    harness.cleanup();
  }
});

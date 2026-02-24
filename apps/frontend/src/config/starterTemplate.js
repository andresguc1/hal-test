/**
 * Starter Template Configuration
 * Defines the initial nodes and edges for new users.
 * Refined to show the full power of Hal-Test (Tour Mode + Components + Sub-flows).
 */

export const STARTER_TEMPLATE = {
  name: "Hal-Test Tour",
  description:
    "A complete walkthrough showing interactive elements, network history, and components.",
  nodes: [
    {
      id: "starter_launch",
      type: "launch_browser",
      position: { x: -300, y: 450 },
      data: {
        type: "launch_browser",
        label: "Launch Browser",
        starterHint:
          "First, we launch a browser. Let's add a 1s delay to see it in action.",
        configuration: {
          browserType: "chromium",
          headless: false,
          slowMo: "1000",
        },
      },
    },
    {
      id: "starter_open",
      type: "open_url",
      position: { x: 0, y: 450 },
      data: {
        type: "open_url",
        label: "Navigate to SauceDemo",
        starterHint: "We navigate to a testing playground.",
        configuration: {
          url: "https://www.saucedemo.com",
          waitUntil: "networkidle",
        },
      },
    },
    {
      id: "starter_login_group",
      type: "component",
      position: { x: 300, y: 450 },
      data: {
        type: "component",
        label: "Login Steps",
        customLabel: "Login Steps",
        starterHint:
          "Steps grouped to keep the flow clean. Double-click or use the folder icon to 'Dive In'!",
        configuration: {
          description:
            "Encapsulates username, password, and login button clicks.",
        },
        // Nested sub-flow definition handled by useFlowManager
        subFlow: {
          name: "Login Steps (Library)",
          nodes: [
            {
              id: "sub_in",
              type: "input",
              position: { x: 0, y: 200 },
              data: {
                type: "input",
                label: "Entry",
                starterHint: "The entry point for this component.",
              },
            },
            {
              id: "sub_user",
              type: "type_text",
              position: { x: 250, y: 200 },
              data: {
                type: "type_text",
                label: "Enter Username",
                starterHint: "We use standard_user for this demo.",
                configuration: {
                  selector: "#user-name",
                  text: "standard_user",
                },
              },
            },
            {
              id: "sub_pass",
              type: "type_text",
              position: { x: 500, y: 200 },
              data: {
                type: "type_text",
                label: "Enter Password",
                starterHint: "Secret sauce is the key!",
                configuration: { selector: "#password", text: "secret_sauce" },
              },
            },
            {
              id: "sub_click",
              type: "click",
              position: { x: 750, y: 200 },
              data: {
                type: "click",
                label: "Submit Login",
                starterHint: "Clicking the button triggers the inventory load.",
                configuration: { selector: "#login-button" },
              },
            },
            {
              id: "sub_out",
              type: "output",
              position: { x: 1000, y: 200 },
              data: {
                type: "output",
                label: "Exit",
                starterHint:
                  "The exit point, connecting back to the main flow.",
              },
            },
          ],
          edges: [
            {
              id: "e-sub-in",
              source: "sub_in",
              target: "sub_user",
              animated: true,
              type: "custom",
            },
            {
              id: "e-sub-1",
              source: "sub_user",
              target: "sub_pass",
              animated: true,
              type: "custom",
            },
            {
              id: "e-sub-2",
              source: "sub_pass",
              target: "sub_click",
              animated: true,
              type: "custom",
            },
            {
              id: "e-sub-out",
              source: "sub_click",
              target: "sub_out",
              animated: true,
              type: "custom",
            },
          ],
        },
      },
    },
    {
      id: "starter_reload",
      type: "reload_page",
      position: { x: 600, y: 450 },
      data: {
        type: "reload_page",
        label: "Reload Page",
        starterHint:
          "We reload after login to ensure a fresh state. This demonstrates our localized reload action.",
        configuration: {},
      },
    },
    {
      id: "starter_wait",
      type: "wait_network_match",
      position: { x: 900, y: 450 },
      data: {
        type: "wait_network_match",
        label: "Wait List Loaded",
        starterHint:
          "Network history monitoring ensures we don't miss the inventory load request.",
        configuration: {
          urlPattern: "**/inventory.html*",
          method: "GET",
          timeout: 10000,
        },
      },
    },
    {
      id: "starter_screenshot",
      type: "take_screenshot",
      position: { x: 1200, y: 450 },
      data: {
        type: "take_screenshot",
        label: "Evidence",
        starterHint: "We take a screenshot of the successful login.",
        configuration: {
          fullPage: false,
        },
      },
    },
    {
      id: "starter_close",
      type: "close_browser",
      position: { x: 1500, y: 450 },
      data: {
        type: "close_browser",
        label: "Finish Tour",
        starterHint: "Cleanup and close our session.",
        configuration: {},
      },
    },
  ],
  edges: [
    {
      id: "e1-2",
      source: "starter_launch",
      target: "starter_open",
      animated: true,
      type: "custom",
    },
    {
      id: "e2-3",
      source: "starter_open",
      target: "starter_login_group",
      animated: true,
      type: "custom",
    },
    {
      id: "e3-r",
      source: "starter_login_group",
      target: "starter_reload",
      animated: true,
      type: "custom",
    },
    {
      id: "er-4",
      source: "starter_reload",
      target: "starter_wait",
      animated: true,
      type: "custom",
    },
    {
      id: "e4-5",
      source: "starter_wait",
      target: "starter_screenshot",
      animated: true,
      type: "custom",
    },
    {
      id: "e5-6",
      source: "starter_screenshot",
      target: "starter_close",
      animated: true,
      type: "custom",
    },
  ],
};

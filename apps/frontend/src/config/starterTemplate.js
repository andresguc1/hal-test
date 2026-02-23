/**
 * Starter Template Configuration
 * Defines the initial nodes and edges for new users.
 */

export const STARTER_TEMPLATE = {
  name: "Google Search Starter",
  description:
    "A basic flow that opens Google, searches for HaltTest, and validates the results.",
  nodes: [
    {
      id: "starter_launch",
      type: "launch_browser",
      position: { x: 0, y: 450 },
      data: {
        type: "launch_browser",
        label: "Launch Browser",
        starterHint: "First, we always need to launch a browser instance.",
        configuration: {
          browserType: "chromium",
          headless: false,
        },
      },
    },
    {
      id: "starter_open",
      type: "open_url",
      position: { x: 280, y: 450 },
      data: {
        type: "open_url",
        label: "Open Google",
        starterHint: "Then, we navigate to the page we want to test.",
        configuration: {
          url: "https://www.saucedemo.com",
          waitUntil: "networkidle",
        },
      },
    },
    {
      id: "starter_type",
      type: "type_text",
      position: { x: 560, y: 450 },
      data: {
        type: "type_text",
        label: "Search HaltTest",
        starterHint:
          "Interaction nodes allow us to type, click, and much more.",
        configuration: {
          selector:
            "html > body > div:nth-of-type(2) > div:nth-of-type(4) > form > div > div > div:nth-of-type(3) > center > input",
          text: "HaltTest framework",
          delay: 50,
        },
      },
    },
    {
      id: "starter_click",
      type: "click",
      position: { x: 840, y: 450 },
      data: {
        type: "click",
        label: "Click Search",
        starterHint:
          "Click actions allow us to submit forms and navigate through the page.",
        configuration: {
          selector:
            "html > body > div:nth-of-type(2) > div:nth-of-type(4) > form > div > div > div:nth-of-type(3) > center > input",
          force: true,
        },
      },
    },
    {
      id: "starter_screenshot",
      type: "take_screenshot",
      position: { x: 1120, y: 450 },
      data: {
        type: "take_screenshot",
        label: "Capture Result",
        starterHint:
          "Capturing visual results is essential for debugging and reporting.",
        configuration: {
          fullPage: false,
        },
      },
    },
    {
      id: "starter_close",
      type: "close_browser",
      position: { x: 1400, y: 450 },
      data: {
        type: "close_browser",
        label: "Close Browser",
        starterHint:
          "Closing the browser at the end is a best practice to free up system resources.",
        configuration: {},
      },
    },
  ],
  edges: [
    {
      id: "edge_s1_s2",
      source: "starter_launch",
      target: "starter_open",
      type: "custom",
      animated: true,
    },
    {
      id: "edge_s2_s3",
      source: "starter_open",
      target: "starter_type",
      type: "custom",
      animated: true,
    },
    {
      id: "edge_s3_s4",
      source: "starter_type",
      target: "starter_click",
      type: "custom",
      animated: true,
    },
    {
      id: "edge_s4_s5",
      source: "starter_click",
      target: "starter_screenshot",
      type: "custom",
      animated: true,
    },
    {
      id: "edge_s5_s6",
      source: "starter_screenshot",
      target: "starter_close",
      type: "custom",
      animated: true,
    },
  ],
};

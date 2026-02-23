/**
 * Starter Template Configuration
 * Defines the initial nodes and edges for new users.
 * Refined to show the full power of Hal-Test (Tour Mode).
 */

export const STARTER_TEMPLATE = {
  name: "Hal-Test Tour",
  description:
    "A complete walkthrough showing interactive elements, network history, and automated testing.",
  nodes: [
    {
      id: "starter_launch",
      type: "launch_browser",
      position: { x: -300, y: 450 },
      data: {
        type: "launch_browser",
        label: "Launch Browser",
        starterHint: "First, we launch a browser. Let's add a 1s delay to see it in action.",
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
      id: "starter_type_user",
      type: "type_text",
      position: { x: 300, y: 450 },
      data: {
        type: "type_text",
        label: "Enter Username",
        starterHint: "We enter the login credentials.",
        configuration: {
          selector: "#user-name",
          text: "standard_user",
          delay: 50,
        },
      },
    },
    {
      id: "starter_type_pass",
      type: "type_text",
      position: { x: 600, y: 450 },
      data: {
        type: "type_text",
        label: "Enter Password",
        configuration: {
          selector: "#password",
          text: "secret_sauce",
          delay: 50,
        },
      },
    },
    {
      id: "starter_click_login",
      type: "click",
      position: { x: 900, y: 450 },
      data: {
        type: "click",
        label: "Login",
        starterHint: "Perform a click to log in.",
        configuration: {
          selector: "#login-button",
        },
      },
    },
    {
      id: "starter_wait",
      type: "wait_network_match",
      position: { x: 1200, y: 450 },
      data: {
        type: "wait_network_match",
        label: "Wait List Loaded",
        starterHint: "Network history monitoring ensures we don't miss the inventory load request.",
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
      position: { x: 1500, y: 450 },
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
      position: { x: 1800, y: 450 },
      data: {
        type: "close_browser",
        label: "Finish Tour",
        starterHint: "Cleanup and close our session.",
        configuration: {},
      },
    },
  ],
  edges: [
    { id: "e1-2", source: "starter_launch", target: "starter_open", animated: true, type: "custom" },
    { id: "e2-3", source: "starter_open", target: "starter_type_user", animated: true, type: "custom" },
    { id: "e3-4", source: "starter_type_user", target: "starter_type_pass", animated: true, type: "custom" },
    { id: "e4-5", source: "starter_type_pass", target: "starter_click_login", animated: true, type: "custom" },
    { id: "e5-6", source: "starter_click_login", target: "starter_wait", animated: true, type: "custom" },
    { id: "e6-7", source: "starter_wait", target: "starter_screenshot", animated: true, type: "custom" },
    { id: "e7-8", source: "starter_screenshot", target: "starter_close", animated: true, type: "custom" },
  ],
};

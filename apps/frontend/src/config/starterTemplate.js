/**
 * Starter Template Configuration
 * Defines the initial nodes and edges for new users.
 * Refined to show the full power of Hal-Test (Tour Mode + Components + Sub-flows).
 */

export const STARTER_TEMPLATE = {
  name: "Hal-Test Tour",
  description:
    "A complete E2E walkthrough demonstrating logic scripting, variables, nested sub-flows, and conditional routing.",
  nodes: [
    {
      id: "starter_launch",
      type: "launch_browser",
      position: { x: -250, y: 150 },
      data: {
        type: "launch_browser",
        label: "Launch Browser",
        starterHint:
          "First, let's launch Chromium with UI mode enabled to watch our E2E actions live.",
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
      position: { x: 50, y: 150 },
      data: {
        type: "open_url",
        label: "Navigate",
        starterHint:
          "We navigate to Sauce Labs' Swag Labs testing sandbox playground.",
        configuration: {
          url: "https://www.saucedemo.com",
          waitUntil: "networkidle",
        },
      },
    },
    {
      id: "starter_var_user",
      type: "variable",
      position: { x: 350, y: 150 },
      data: {
        type: "variable",
        label: "Set User Role",
        starterHint:
          "Store standard_user in a Flow-scoped variable named user_role.",
        configuration: {
          operation: "set",
          name: "user_role",
          value: "standard_user",
          scope: "flow",
        },
      },
    },
    {
      id: "starter_switch_role",
      type: "switch",
      position: { x: 650, y: 150 },
      data: {
        type: "switch",
        label: "Select Username",
        starterHint:
          "Switch node: branches execution flow dynamically based on the value of 'user_role'.",
        configuration: {
          variableName: "{{user_role}}",
          cases: [
            { id: "standard", label: "Standard User", value: "standard_user" },
          ],
        },
      },
    },
    {
      id: "starter_login_group",
      type: "component",
      position: { x: 950, y: 150 },
      data: {
        type: "component",
        label: "Login Steps",
        customLabel: "Login Steps",
        starterHint:
          "Composite Component: Double-click or click 'Open' to dive into the encapsulated login form steps!",
        configuration: {
          description:
            "Encapsulates username typing, password typing, and login button click.",
        },
        subFlow: {
          name: "Login Steps (Library)",
          nodes: [
            {
              id: "sub_in",
              type: "input",
              position: { x: 50, y: 150 },
              data: {
                type: "input",
                label: "Entry",
                starterHint: "The entry point for this sub-flow.",
              },
            },
            {
              id: "sub_type_user",
              type: "type_text",
              position: { x: 250, y: 150 },
              data: {
                type: "type_text",
                label: "Enter Username",
                starterHint:
                  "Notice how we resolve output from our Set User Role node dynamically using {{user_role}}!",
                configuration: {
                  selector: "#user-name",
                  text: "{{user_role}}",
                },
              },
            },
            {
              id: "sub_type_pass",
              type: "type_text",
              position: { x: 500, y: 150 },
              data: {
                type: "type_text",
                label: "Enter Password",
                starterHint:
                  "Enter the default Swag Labs password value directly.",
                configuration: {
                  selector: "#password",
                  text: "secret_sauce",
                },
              },
            },
            {
              id: "sub_click",
              type: "click",
              position: { x: 750, y: 150 },
              data: {
                type: "click",
                label: "Click Login",
                starterHint:
                  "Clicking the submit button logs us into the dashboard.",
                configuration: {
                  selector: "#login-button",
                },
              },
            },
            {
              id: "sub_out",
              type: "output",
              position: { x: 1000, y: 150 },
              data: {
                type: "output",
                label: "Exit",
                starterHint:
                  "The exit point, returning control to the parent flow.",
              },
            },
          ],
          edges: [
            {
              id: "sub_e1",
              source: "sub_in",
              target: "sub_type_user",
              animated: true,
              type: "custom",
            },
            {
              id: "sub_e2",
              source: "sub_type_user",
              target: "sub_type_pass",
              animated: true,
              type: "custom",
            },
            {
              id: "sub_e3",
              source: "sub_type_pass",
              target: "sub_click",
              animated: true,
              type: "custom",
            },
            {
              id: "sub_e4",
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
      id: "starter_conditional",
      type: "conditional",
      position: { x: 1250, y: 150 },
      data: {
        type: "conditional",
        label: "Verify User Role",
        starterHint:
          "Conditional routing: splits execution branches based on variable values.",
        configuration: {
          branches: [
            {
              id: "true",
              label: "Is Standard User",
              expression: {
                left: "{{user_role}}",
                operator: "==",
                right: "standard_user",
              },
            },
          ],
          fallbackPath: "false",
        },
      },
    },
    {
      id: "starter_screenshot",
      type: "take_screenshot",
      position: { x: 1550, y: 50 },
      data: {
        type: "take_screenshot",
        label: "Take Evidence",
        starterHint:
          "Take a screenshot proof of the Swag Labs catalog dashboard upon success.",
        configuration: {
          fullPage: false,
        },
      },
    },
    {
      id: "starter_fail",
      type: "fail_flow",
      position: { x: 1550, y: 250 },
      data: {
        type: "fail_flow",
        label: "Unexpected Role",
        starterHint:
          "Fail flow node: gracefully aborts the execution with a trace message.",
        configuration: {
          message: "Routed invalid user role branch!",
        },
      },
    },
    {
      id: "starter_close",
      type: "close_browser",
      position: { x: 1850, y: 150 },
      data: {
        type: "close_browser",
        label: "Complete Tour",
        starterHint:
          "Clean up Chromium context and wrap up the Haltest onboarding tour!",
        configuration: {},
      },
    },
  ],
  edges: [
    {
      id: "e_launch_open",
      source: "starter_launch",
      target: "starter_open",
      animated: true,
      type: "custom",
    },
    {
      id: "e_open_var",
      source: "starter_open",
      target: "starter_var_user",
      animated: true,
      type: "custom",
    },
    {
      id: "e_var_switch",
      source: "starter_var_user",
      target: "starter_switch_role",
      animated: true,
      type: "custom",
    },
    {
      id: "e_switch_login",
      source: "starter_switch_role",
      target: "starter_login_group",
      sourceHandle: "standard",
      animated: true,
      type: "custom",
    },
    {
      id: "e_login_cond",
      source: "starter_login_group",
      target: "starter_conditional",
      animated: true,
      type: "custom",
    },
    {
      id: "e_cond_true",
      source: "starter_conditional",
      target: "starter_screenshot",
      sourceHandle: "true",
      animated: true,
      type: "custom",
    },
    {
      id: "e_cond_false",
      source: "starter_conditional",
      target: "starter_fail",
      sourceHandle: "false",
      animated: true,
      type: "custom",
    },
    {
      id: "e_screenshot_close",
      source: "starter_screenshot",
      target: "starter_close",
      animated: true,
      type: "custom",
    },
    {
      id: "e_fail_close",
      source: "starter_fail",
      target: "starter_close",
      animated: true,
      type: "custom",
    },
  ],
};

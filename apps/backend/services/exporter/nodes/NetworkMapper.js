/**
 * Mapper for network interception and control nodes.
 */
export const NetworkMapper = {
    type: [
        'intercept_request',
        'mock_response',
        'block_resource',
        'modify_headers',
        'manage_cookies',
        'configure_route',
        'wait_for_request',
        'wait_for_response',
        'set_network_conditions',
        'clear_all_mocks',
        'listen_events',
    ],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const url = params.url || params.urlPattern || params.pattern || '**/api/**';
        const l = lang.toLowerCase();

        if (l === 'javascript' || l === 'typescript') return NetworkMapper._js(action, params, url);
        if (l === 'python') return NetworkMapper._py(action, params, url);
        if (l === 'java') return NetworkMapper._java(action, params, url);
        if (l === 'csharp') return NetworkMapper._cs(action, params, url);
        return `// network action not implemented for ${lang}`;
    },

    _js: (action, p, url) =>
        ({
            intercept_request: `await page.route(\`${url}\`, async (route) => {\n        await route.continue();\n    });`,
            mock_response: `await page.route(\`${url}\`, async (route) => {\n        await route.fulfill({ status: ${p.status || 200}, contentType: '${p.contentType || 'application/json'}', body: JSON.stringify(${JSON.stringify(p.body || {})}) });\n    });`,
            block_resource: `await page.route(\`${url}\`, (route) => route.abort());`,
            modify_headers: `await page.route(\`${url}\`, async (route) => {\n        const headers = { ...route.request().headers(), '${p.headerName || 'X-Custom'}': '${p.headerValue || ''}' };\n        await route.continue({ headers });\n    });`,
            manage_cookies: NetworkMapper._cookieJs(p),
            configure_route: `await page.route(\`${url}\`, async (route) => await route.continue());`,
            wait_for_request: `await page.waitForRequest(\`${url}\`);`,
            wait_for_response: `await page.waitForResponse(response => response.url().includes(\`${url}\`));`,
            set_network_conditions: `// Network throttling via CDP\nconst client = await page.context().newCDPSession(page);\nawait client.send('Network.emulateNetworkConditions', { offline: false, latency: ${p.latency || 0} });`,
            clear_all_mocks: 'await page.unrouteAll();',
            listen_events: `page.on('${p.eventType || 'request'}', (ev) => console.log('Event:', ev.url ? ev.url() : ev));`,
        })[action],

    _py: (action, p, url) =>
        ({
            intercept_request: `await page.route("${url}", lambda route: route.continue_())`,
            mock_response: `async def mock_handler(route):\n        await route.fulfill(status=${p.status || 200}, content_type="${p.contentType || 'application/json'}", body='${JSON.stringify(p.body || {})}')\n    await page.route("${url}", mock_handler)`,
            block_resource: `await page.route("${url}", lambda route: route.abort())`,
            modify_headers: `async def header_handler(route):\n        headers = {**route.request.headers, "${p.headerName || 'X-Custom'}": "${p.headerValue || ''}"}\n        await route.continue_(headers=headers)\n    await page.route("${url}", header_handler)`,
            manage_cookies: NetworkMapper._cookiePy(p),
            configure_route: `await page.route("${url}", lambda route: route.continue_())`,
            wait_for_request: `await page.wait_for_request("${url}")`,
            wait_for_response: `await page.wait_for_response(lambda r: "${url}" in r.url)`,
            set_network_conditions: `# Network throttling via CDP\nclient = await page.context.new_cdp_session(page)\nawait client.send("Network.emulateNetworkConditions", {"offline": False, "latency": ${p.latency || 0}})`,
            clear_all_mocks: 'await page.unroute_all()',
            listen_events: `page.on("${p.eventType || 'request'}", lambda ev: print(f"Event: {ev}"))`,
        })[action],

    _java: (action, p, url) =>
        ({
            intercept_request: `page.route("${url}", Route::resume);`,
            mock_response: `page.route("${url}", route -> route.fulfill(new Route.FulfillOptions().setStatus(${p.status || 200}).setContentType("${p.contentType || 'application/json'}").setBody("${JSON.stringify(p.body || {}).replace(/"/g, '\\"')}")));`,
            block_resource: `page.route("${url}", Route::abort);`,
            modify_headers: `page.route("${url}", route -> { Map<String, String> h = new HashMap<>(route.request().headers()); h.put("${p.headerName || 'X-Custom'}", "${p.headerValue || ''}"); route.resume(new Route.ResumeOptions().setHeaders(h)); });`,
            manage_cookies: NetworkMapper._cookieJava(p),
            configure_route: `page.route("${url}", Route::resume);`,
            wait_for_request: `page.waitForRequest("${url}");`,
            wait_for_response: `page.waitForResponse(r -> r.url().contains("${url}"));`,
            set_network_conditions:
                '// CDP Network throttling not directly available in Java Playwright',
            clear_all_mocks: 'page.unrouteAll();',
            listen_events: `page.onRequest(req -> System.out.println("Request: " + req.url()));`,
        })[action],

    _cs: (action, p, url) =>
        ({
            intercept_request: `await page.RouteAsync("${url}", route => route.ContinueAsync());`,
            mock_response: `await page.RouteAsync("${url}", route => route.FulfillAsync(new() { Status = ${p.status || 200}, ContentType = "${p.contentType || 'application/json'}", Body = "${JSON.stringify(p.body || {}).replace(/"/g, '\\"')}" }));`,
            block_resource: `await page.RouteAsync("${url}", route => route.AbortAsync());`,
            modify_headers: `await page.RouteAsync("${url}", async route => { var h = new Dictionary<string, string>(route.Request.Headers) { ["${p.headerName || 'X-Custom'}"] = "${p.headerValue || ''}" }; await route.ContinueAsync(new() { Headers = h }); });`,
            manage_cookies: NetworkMapper._cookieCs(p),
            configure_route: `await page.RouteAsync("${url}", route => route.ContinueAsync());`,
            wait_for_request: `await page.WaitForRequestAsync("${url}");`,
            wait_for_response: `await page.WaitForResponseAsync(r => r.Url.Contains("${url}"));`,
            set_network_conditions: '// CDP Network throttling - use NewCDPSessionAsync',
            clear_all_mocks: 'await page.UnrouteAllAsync();',
            listen_events: `page.Request += (_, req) => Console.WriteLine($"Request: {req.Url}");`,
        })[action],

    _cookieJs: (p) => {
        const a = p.cookieAction || p.action || 'get';
        if (a === 'set')
            return `await page.context().addCookies([{ name: '${p.cookieName || 'c'}', value: '${p.cookieValue || 'v'}', domain: '${p.domain || 'localhost'}', path: '/' }]);`;
        if (a === 'clear') return 'await page.context().clearCookies();';
        return 'const cookies = await page.context().cookies();';
    },
    _cookiePy: (p) => {
        const a = p.cookieAction || p.action || 'get';
        if (a === 'set')
            return `await page.context.add_cookies([{"name": "${p.cookieName || 'c'}", "value": "${p.cookieValue || 'v'}", "domain": "${p.domain || 'localhost'}", "path": "/"}])`;
        if (a === 'clear') return 'await page.context.clear_cookies()';
        return 'cookies = await page.context.cookies()';
    },
    _cookieJava: (p) => {
        const a = p.cookieAction || p.action || 'get';
        if (a === 'set')
            return `page.context().addCookies(Arrays.asList(new Cookie("${p.cookieName || 'c'}", "${p.cookieValue || 'v'}").setDomain("${p.domain || 'localhost'}").setPath("/")));`;
        if (a === 'clear') return 'page.context().clearCookies();';
        return 'List<Cookie> cookies = page.context().cookies();';
    },
    _cookieCs: (p) => {
        const a = p.cookieAction || p.action || 'get';
        if (a === 'set')
            return `await page.Context.AddCookiesAsync(new[] { new Cookie { Name = "${p.cookieName || 'c'}", Value = "${p.cookieValue || 'v'}", Domain = "${p.domain || 'localhost'}", Path = "/" } });`;
        if (a === 'clear') return 'await page.Context.ClearCookiesAsync();';
        return 'var cookies = await page.Context.CookiesAsync();';
    },
};

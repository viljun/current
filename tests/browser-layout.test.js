import assert from "node:assert/strict";
import { execFile, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const HARNESS_URL = pathToFileURL(
    fileURLToPath(new URL("./browser-layout-harness.html", import.meta.url)),
).href;
const CHROME = process.env.CHROME_BIN ?? "google-chrome";
const CHROME_AVAILABLE = spawnSync(
    CHROME,
    ["--version"],
    { stdio: "ignore" },
).status === 0;
const VIEWPORTS = [
    { name: "small mobile", width: 320, height: 568, mobile: true },
    { name: "modern mobile", width: 390, height: 844, mobile: true },
    { name: "tablet/desktop", width: 1024, height: 768, mobile: false },
    { name: "desktop", width: 1366, height: 768, mobile: false },
];

async function measureViewport(viewport) {
    const profileDirectory = await mkdtemp(
        join(tmpdir(), "gpsgame-layout-test-"),
    );
    let stdout;
    try {
        ({ stdout } = await executeFile(
            CHROME,
            [
                "--headless",
                "--disable-gpu",
                "--no-sandbox",
                "--hide-scrollbars",
                "--allow-file-access-from-files",
                "--force-device-scale-factor=1",
                "--window-size=1500,1100",
                "--virtual-time-budget=10000",
                "--user-data-dir=" + profileDirectory,
                "--dump-dom",
                HARNESS_URL + "?width=" + viewport.width
                    + "&height=" + viewport.height,
            ],
            { maxBuffer: 2_000_000 },
        ));
    } finally {
        await rm(profileDirectory, { recursive: true, force: true });
    }
    const encoded = stdout.match(
        /<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/,
    )?.[1];
    assert.notEqual(
        encoded,
        undefined,
        viewport.name + " did not produce a layout measurement",
    );

    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
}

function near(actual, expected, tolerance, message) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        message + ": expected " + expected + ", received " + actual,
    );
}

test(
    "rendered mobile and desktop layouts fill, center, and remain readable",
    { skip: !CHROME_AVAILABLE && "Google Chrome is not installed" },
    async context => {
        let firstLayout;
        try {
            firstLayout = await measureViewport(VIEWPORTS[0]);
        } catch (error) {
            if (
                error instanceof Error
                && error.message.includes("Operation not permitted")
            ) {
                context.skip("The execution sandbox blocks headless Chrome");

                return;
            }
            throw error;
        }
        for (const viewport of VIEWPORTS) {
            const layout = viewport === VIEWPORTS[0]
                ? firstLayout
                : await measureViewport(viewport);
            assert.deepEqual(layout.viewport, {
                width: viewport.width,
                height: viewport.height,
            });

            near(layout.container.left, 0, 0.5, viewport.name + " container left");
            near(layout.container.top, 0, 0.5, viewport.name + " container top");
            near(
                layout.container.right,
                viewport.width,
                0.5,
                viewport.name + " container right",
            );
            near(
                layout.container.bottom,
                viewport.height,
                0.5,
                viewport.name + " container bottom",
            );
            assert.ok(layout.map.left <= 0);
            assert.ok(layout.map.top <= 0);
            assert.ok(layout.map.right >= viewport.width);
            assert.ok(layout.map.bottom >= viewport.height);
            assert.equal(layout.paintedEdges.right, true);
            assert.equal(layout.paintedEdges.bottom, true);

            near(
                layout.cat.centerX,
                viewport.width / 2,
                2,
                viewport.name + " cat horizontal center",
            );
            near(
                layout.cat.centerY,
                viewport.height / 2,
                2,
                viewport.name + " cat vertical center",
            );

            near(
                layout.message.rectangle.left,
                0,
                0.5,
                viewport.name + " status left",
            );
            near(
                layout.message.rectangle.right,
                viewport.width,
                0.5,
                viewport.name + " status right",
            );
            near(
                layout.message.text.centerY,
                layout.message.rectangle.centerY,
                1,
                viewport.name + " status text vertical center",
            );
            near(
                layout.message.buttonState.barHeight,
                layout.message.heightWithoutButton,
                0.5,
                viewport.name + " status height with button",
            );
            assert.ok(
                layout.message.buttonState.buttonHeight >= 44,
                viewport.name + " top-bar button is too small to tap",
            );
            assert.ok(
                layout.message.fontSize >= (viewport.mobile ? 16 : 16),
            );
            assert.ok(
                layout.gps.fontSize >= (viewport.mobile ? 15 : 14),
            );

            for (const control of layout.controls) {
                assert.ok(control.rectangle.left >= 0);
                assert.ok(control.rectangle.top >= 0);
                assert.ok(control.rectangle.right <= viewport.width);
                assert.ok(control.rectangle.bottom <= viewport.height);
                assert.ok(
                    control.fontSize >= (viewport.mobile ? 15 : 13),
                    viewport.name + " " + control.id + " font is too small",
                );
            }
            assert.equal(layout.document.scrollWidth, viewport.width);
            assert.equal(layout.document.scrollHeight, viewport.height);
        }
    },
);

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
            assert.deepEqual(layout.message.itemToggle, {
                opens: true,
                ownedText: "Owned: 0",
                expandedWhenOpen: "true",
                focusModeWhenOpen: true,
                focusedType: layout.message.itemToggle.focusedType,
                focusedLabelCount:
                    layout.message.itemToggle.matchingLabelCount,
                matchingLabelCount:
                    layout.message.itemToggle.matchingLabelCount,
                onlyMatchingLabels: true,
                closes: true,
                expandedWhenClosed: "false",
                focusModeWhenClosed: false,
                visibleLabelsAfterClose: layout.labels.count,
            });
            assert.ok(layout.message.itemToggle.focusedType.length > 0);
            assert.ok(
                layout.message.encounterState.barHeight
                    >= layout.message.heightWithoutButton,
                viewport.name + " encounter status became too short",
            );
            assert.equal(
                layout.message.encounterState.barText,
                "Capturea crypt hound. If you succeed, one binding rope is used. "
                    + "You keep the crypt hound and take its 10 coins.",
            );
            assert.ok(
                layout.message.encounterState.action.right <= viewport.width,
                viewport.name + " encounter action is outside the status bar",
            );
            assert.ok(
                layout.message.encounterState.followingTextMargin >= 8,
                viewport.name + " action button still touches its text",
            );
            const descriptionCard =
                layout.message.encounterState.descriptionCard;
            assert.ok(
                descriptionCard.top >= layout.message.rectangle.bottom,
                viewport.name + " encounter card overlaps the status bar",
            );
            assert.ok(descriptionCard.left >= 0);
            assert.ok(descriptionCard.right <= viewport.width);
            assert.ok(descriptionCard.bottom <= viewport.height);
            assert.ok(
                layout.message.encounterState.descriptionScrollHeight
                    <= layout.message.encounterState.descriptionClientHeight + 1,
                viewport.name
                    + " full encounter description is still clipped: "
                    + layout.message.encounterState.descriptionScrollHeight
                    + "/"
                    + layout.message.encounterState.descriptionClientHeight,
            );
            assert.ok(
                layout.message.encounterState.close.width >= 44
                    && layout.message.encounterState.close.height >= 44,
                viewport.name + " encounter close button is too small",
            );
            assert.ok(
                layout.message.encounterState.close.right
                    <= descriptionCard.right,
            );
            assert.ok(
                layout.message.encounterState.close.top
                    >= descriptionCard.top,
            );
            for (const instruction of layout.message.instructions) {
                assert.ok(
                    instruction.scrollWidth <= instruction.clientWidth + 1,
                    viewport.name + " instruction overflows horizontally: "
                        + instruction.text,
                );
                assert.ok(
                    instruction.scrollHeight <= instruction.clientHeight + 1,
                    viewport.name + " instruction is vertically clipped: "
                        + instruction.text,
                );
                assert.ok(
                    instruction.barHeight
                        >= layout.message.heightWithoutButton,
                    viewport.name + " instruction bar is too short: "
                        + instruction.text,
                );
            }
            assert.ok(
                layout.message.longStatus.scrollWidth
                    <= layout.message.longStatus.clientWidth + 1,
                viewport.name + " long status overflows horizontally",
            );
            assert.ok(
                layout.message.longStatus.scrollHeight
                    <= layout.message.longStatus.clientHeight + 1,
                viewport.name + " long status is vertically clipped",
            );
            assert.equal(layout.message.longStatus.overflow, "visible");
            assert.equal(layout.message.longStatus.textOverflow, "clip");
            assert.equal(layout.message.longStatus.whiteSpace, "normal");
            if (viewport.mobile) {
                assert.ok(
                    layout.message.longStatus.barHeight
                        > layout.message.heightWithoutButton,
                    viewport.name + " long status did not grow the status bar",
                );
            }
            assert.ok(
                layout.message.fontSize >= (viewport.mobile ? 16 : 16),
            );
            assert.ok(
                layout.gps.fontSize >= (viewport.mobile ? 15 : 14),
            );
            assert.equal(layout.compass.label, "North points up");
            assert.ok(layout.labels.count > 0);
            assert.deepEqual(layout.labels, {
                count: layout.labels.count,
                checkedBefore: false,
                enabledBefore: false,
                visibleBefore: 0,
                checkedAfter: true,
                enabledAfter: true,
                visibleAfter: layout.labels.count,
            });
            assert.ok(
                layout.compass.rectangle.bottom < layout.gps.rectangle.top,
                viewport.name + " compass does not sit above GPS status",
            );
            assert.ok(layout.compass.rectangle.left >= 0);
            assert.ok(
                layout.compass.rectangle.right <= viewport.width,
                viewport.name + " compass extends outside the viewport",
            );

            for (const [name, dialog] of Object.entries(layout.dialogs)) {
                assert.equal(dialog.overflow, "hidden", name);
                assert.equal(dialog.contentOverflow, "auto", name);
                assert.ok(
                    dialog.contentScrollTop > 0,
                    viewport.name + " " + name + " content does not scroll",
                );
                near(
                    dialog.headerAfterScroll.top,
                    dialog.headerBeforeScroll.top,
                    0.5,
                    viewport.name + " " + name + " header moved while scrolling",
                );
                near(
                    dialog.title.centerX,
                    dialog.rectangle.centerX,
                    1,
                    viewport.name + " " + name + " title is not centered",
                );
                assert.ok(
                    dialog.close.width >= 44 && dialog.close.height >= 44,
                    viewport.name + " " + name + " close button is too small",
                );
                assert.ok(dialog.close.right <= dialog.rectangle.right);
                assert.ok(dialog.close.top >= dialog.rectangle.top);
                if (viewport.mobile) {
                    near(
                        dialog.rectangle.width,
                        viewport.width,
                        1,
                        viewport.name + " " + name + " dialog width",
                    );
                    near(
                        dialog.rectangle.height,
                        viewport.height,
                        1,
                        viewport.name + " " + name + " dialog height",
                    );
                    near(
                        dialog.rectangle.left,
                        0,
                        1,
                        viewport.name + " " + name + " dialog left edge",
                    );
                    near(
                        dialog.rectangle.top,
                        0,
                        1,
                        viewport.name + " " + name + " dialog top edge",
                    );
                    assert.equal(dialog.borderRadius, "0px");
                } else {
                    assert.ok(
                        dialog.rectangle.width
                            >= Math.min(1024, viewport.width - 32) - 1,
                        viewport.name + " " + name
                            + " dialog did not use the wider desktop space: "
                            + dialog.rectangle.width,
                    );
                    assert.ok(dialog.rectangle.width <= 1024 + 1);
                    assert.notEqual(dialog.borderRadius, "0px");
                }
            }
            assert.equal(layout.actualInventory.itemsSelected, "false");
            assert.equal(layout.actualInventory.recipesSelected, "true");
            assert.ok(layout.actualInventory.recipeCount >= 2);
            assert.ok(layout.actualInventory.filterHeight >= 39);
            assert.equal(layout.actualInventory.clubExpanded, "true");
            assert.equal(layout.actualInventory.clubDetailsHidden, false);
            assert.deepEqual(
                layout.actualInventory.clubIngredientCounts,
                ["0/1", "0/1"],
            );
            assert.ok(
                layout.actualInventory.clubRecipe.left >= 0
                    && layout.actualInventory.clubRecipe.right
                        <= viewport.width,
                viewport.name + " recipe card escapes the dialog",
            );
            assert.ok(
                layout.actualInventory.itemsTab.height >= 41
                    && layout.actualInventory.recipesTab.height >= 41,
                viewport.name + " inventory tabs are too small",
            );
            assert.ok(
                layout.actualInventory.tabs.top
                    >= layout.actualInventory.header.bottom,
                viewport.name + " inventory tabs overlap the header",
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

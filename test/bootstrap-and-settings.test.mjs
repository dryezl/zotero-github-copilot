/* global process */
import { strict as assert } from "node:assert";
import fs from "node:fs";
import path from "node:path";

describe("zotero copilot bootstrap and settings", function () {
  let mainSource = "";
  let settingsSource = "";
  let esbuildSource = "";
  let manifestSource = "";

  before(function () {
    const repoRoot = path.resolve(process.cwd());
    mainSource = fs.readFileSync(path.join(repoRoot, "src/main.ts"), "utf8");
    settingsSource = fs.readFileSync(
      path.join(repoRoot, "src/settings/SettingTab.tsx"),
      "utf8",
    );
    esbuildSource = fs.readFileSync(
      path.join(repoRoot, "esbuild.config.mjs"),
      "utf8",
    );
    manifestSource = fs.readFileSync(
      path.join(repoRoot, "addon/manifest.json"),
      "utf8",
    );
  });

  it("exports Zotero bootstrap lifecycle hooks", function () {
    assert.match(mainSource, /export async function startup/);
    assert.match(mainSource, /export function shutdown/);
    assert.match(mainSource, /export function install/);
    assert.match(mainSource, /export function uninstall/);
    assert.match(mainSource, /export function onPrefsEvent/);
  });

  it("registers and opens plugin preferences pane", function () {
    assert.match(mainSource, /preferencePanes\?\.register/);
    assert.match(mainSource, /openPreferences\(PREFERENCE_PANE_ID\)/);
    assert.match(mainSource, /interface StartupParams/);
    assert.match(mainSource, /export async function startup/);
    assert.match(mainSource, /const \{ id, version, rootURI \} = params/);
    assert.match(mainSource, /addonData\?\.config\?\.addonID/);
    assert.match(mainSource, /skip preference pane registration/);
  });

  it("registers runtime hooks on scaffold addon instance name", function () {
    assert.match(mainSource, /zotero\.ZoteroGitHubCopilot/);
    assert.match(mainSource, /zotero\.__addonInstance__/);
    assert.match(
      mainSource,
      /addonInstance\.hooks = addonInstance\.hooks \|\|/,
    );
  });

  it("configures esbuild bootstrap entry/output", function () {
    assert.match(esbuildSource, /entryPoints:\s*\["src\/main.ts"\]/);
    assert.match(esbuildSource, /outfile:\s*"build\/bootstrap.js"/);
    assert.match(esbuildSource, /target:\s*\["firefox115"\]/);
  });

  it("declares Zotero 9 compatibility in addon manifest", function () {
    assert.match(manifestSource, /"strict_max_version": "9\.\*"/);
  });

  it("defines typed settings and device-specific persistence behavior", function () {
    assert.match(settingsSource, /export interface ZoteroCopilotSettings/);
    assert.match(settingsSource, /suggestionDelay:\s*500/);
    assert.match(settingsSource, /nodePath:\s*""/);
    assert.match(settingsSource, /device_data\.json/);
    assert.match(settingsSource, /registerObserver\(/);
    assert.match(settingsSource, /notifyObservers\(/);
  });
});

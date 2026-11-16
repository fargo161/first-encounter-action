'use strict';

const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { setTimeout: delay } = require('node:timers/promises');

class Transport {
  constructor(output, input) {
    this.output = output;
    this.sequence = 0;
    this.pending = new Map();
    this.sessions = new Map();
    let incoming = '';
    input.setEncoding('utf8');
    input.on('data', (chunk) => {
      incoming += chunk;
      let end;
      while ((end = incoming.indexOf('\0')) !== -1) {
        const frame = incoming.slice(0, end);
        incoming = incoming.slice(end + 1);
        if (frame) this.receive(JSON.parse(frame));
      }
    });
    const closed = (error) => {
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(error instanceof Error ? error : new Error('Chrome debugging pipe closed'));
      }
      this.pending.clear();
    };
    input.on('close', closed);
    input.on('error', closed);
    output.on('error', closed);
  }

  receive(response) {
    if (response.id) {
      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);
      clearTimeout(pending.timer);
      if (response.error) pending.reject(new Error(response.error.message));
      else pending.resolve(response.result);
      return;
    }
    const session = this.sessions.get(response.sessionId);
    for (const handler of session?.eventHandlers.get(response.method) || []) handler(response.params);
  }

  send(method, params, sessionId) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 10000);
      this.pending.set(id, { resolve, reject, timer });
      this.output.write(JSON.stringify({ id, method, params, sessionId }) + '\0');
    });
  }
}

class Session {
  constructor(transport, sessionId) {
    this.transport = transport;
    this.sessionId = sessionId;
    this.eventHandlers = new Map();
    transport.sessions.set(sessionId, this);
  }

  send(method, params = {}) {
    return this.transport.send(method, params, this.sessionId);
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, []);
    this.eventHandlers.get(event).push(handler);
  }

  async eval(expression) {
    const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
    return result.value;
  }

  async until(expression, { message = expression, timeout = 3500 } = {}) {
    const stop = performance.now() + timeout;
    while (performance.now() < stop) {
      const result = await this.eval(expression);
      if (result) return result;
      await delay(12);
    }
    throw new Error(`Timed out: ${message}`);
  }

  async point(selector, offset = [0, 0]) {
    const r = await this.eval(`(() => {
      const e = document.querySelector(${JSON.stringify(selector)});
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height];
    })()`);
    assert(r && r[2] > 0 && r[3] > 0, `Visible element needed: ${selector}`);
    return { x: Math.round(r[0] + offset[0]), y: Math.round(r[1] + offset[1]) };
  }

  async mouse(type, point, button = 'left') {
    const buttons = type === 'mousePressed' ? { left: 1, right: 2, middle: 4 }[button] : 0;
    return this.send('Input.dispatchMouseEvent', { type, ...point, button, buttons, clickCount: 1 });
  }

  async click(selector, button = 'left', duration = 0) {
    const point = await this.point(selector);
    await this.mouse('mousePressed', point, button);
    if (duration) await delay(duration);
    await this.mouse('mouseReleased', point, button);
  }

  async wheel(selector, deltaY) {
    const point = await this.point(selector);
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel', ...point, deltaX: 0, deltaY,
    });
  }

  async key(code, type = 'press', modifiers = 0) {
    const names = { Escape: ['Escape', 27], Tab: ['Tab', 9], Space: [' ', 32], Enter: ['Enter', 13] };
    const key = names[code]?.[0] || code.replace(/^(?:Key|Digit)/, '').toLowerCase();
    const num = names[code]?.[1] || key.toUpperCase().charCodeAt(0);
    const options = { code, key, windowsVirtualKeyCode: num, nativeVirtualKeyCode: num, modifiers };
    if (type !== 'up') {
      await this.send('Input.dispatchKeyEvent', { type: 'keyDown', ...options });
    }
    if (type !== 'down') {
      await this.send('Input.dispatchKeyEvent', { type: 'keyUp', ...options });
    }
  }

  async screenshot(file) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    await fs.writeFile(file, Buffer.from(data, 'base64'));
  }
}

async function openBrowser() {
  const browserPath = process.env.FIRST_ENCOUNTER_CHROME ||
    (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/chromium');
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'fe-hands-browser-'));
  const args = [
    '--headless=new', '--remote-debugging-pipe', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-component-update', '--no-proxy-server',
    '--disable-gpu', '--disable-breakpad', '--disable-crash-reporter', '--no-sandbox',
    '--window-size=1360,900', `--user-data-dir=${profile}`, 'about:blank',
  ];
  const child = spawn(browserPath, args, {
    windowsHide: true, stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'],
  });
  const close = new Promise((resolve) => child.once('close', resolve));
  let errors = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (s) => { errors += s; });
  const spawnFailed = new Promise((_, reject) => child.once('error', reject));
  const transport = new Transport(child.stdio[3], child.stdio[4]);
  const browser = new Session(transport);

  async function stop() {
    if (child.exitCode === null) {
      await Promise.race([browser.send('Browser.close').catch(() => {}), delay(250)]);
      child.stdio[3].end();
    }
    await Promise.race([close, delay(500)]);
    if (child.exitCode === null) child.kill();
    await Promise.race([close, delay(1000)]);
    const resolved = path.resolve(profile);
    const temp = path.resolve(os.tmpdir());
    if (path.dirname(resolved) === temp && path.basename(resolved).startsWith('fe-hands-browser-')) {
      await fs.rm(resolved, { recursive: true, force: true, maxRetries: 2 }).catch(() => {});
    }
  }
  try {
    const { targetInfos } = await Promise.race([browser.send('Target.getTargets'), spawnFailed]);
    const tab = targetInfos.find((item) => item.type === 'page');
    assert(tab, 'CDP had no browser page');
    const { sessionId } = await browser.send('Target.attachToTarget', {
      targetId: tab.targetId, flatten: true,
    });
    const page = new Session(transport, sessionId);
    for (const cmd of ['Page.enable', 'Network.enable', 'Runtime.enable']) await page.send(cmd);
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1360, height: 860, deviceScaleFactor: 1, mobile: false,
    });
    return { browser, page, stop, browserPath };
  } catch (error) {
    await stop();
    throw new Error(`${error.message}\n${errors.trim()}`, { cause: error });
  }
}

module.exports = { openBrowser };

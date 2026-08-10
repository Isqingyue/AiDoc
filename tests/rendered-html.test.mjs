import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the AI manual workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>知问 · AI 智能用户手册<\/title>/);
  assert.match(html, /智能问答/);
  assert.match(html, /引用与原文/);
  assert.match(html, /ERP采购管理用户手册/);
  assert.match(html, /数据安全保护/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("renders verifiable answer content", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /撤回采购订单/);
  assert.match(html, /第 <!-- -->36<!-- --> 页/);
  assert.match(html, /回答仅使用您有权访问的已发布手册/);
  assert.match(html, /此回答对您有帮助吗/);
});

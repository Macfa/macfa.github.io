const $ = (selector) => document.querySelector(selector);
const state = {
  catalog: { posts: [], tags: [] },
  tags: [],
  links: [],
  relatedTech: [],
  original: null,
  completion: null,
  completionIndex: 0,
};

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "요청에 실패했습니다.");
  return data;
}

function toast(message, error = false) {
  const element = $("#toast");
  element.textContent = message;
  element.style.background = error ? "#8b3024" : "#18201d";
  element.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (element.hidden = true), 4200);
}

async function refreshCatalog() {
  state.catalog = await api("/api/catalog");
  renderPostList();
}

function renderPostList() {
  const query = $("#post-search").value.trim().toLowerCase();
  const posts = state.catalog.posts.filter((post) =>
    `${post.title} ${post.slug} ${post.tags.join(" ")}`.toLowerCase().includes(query),
  );
  $("#post-list").innerHTML = posts
    .map(
      (post) => `<button class="post-item${state.original === post.file ? " active" : ""}" type="button" data-post='${JSON.stringify({ kind: post.kind, category: post.category, slug: post.slug })}'>
        <strong>${escapeHtml(post.title)}</strong>
        <span>${post.kind === "tech" ? `TECH · ${post.category}` : "PROJECT"}</span>
      </button>`,
    )
    .join("");
  document.querySelectorAll("[data-post]").forEach((button) => {
    button.addEventListener("click", () => loadPost(JSON.parse(button.dataset.post)));
  });
}

function setLocked(locked) {
  $("#kind").disabled = locked;
  $("#category").readOnly = locked;
  $("#slug").readOnly = locked;
}

function resetPost(kind = "tech") {
  state.original = null;
  state.tags = [];
  state.links = [];
  state.relatedTech = [];
  $("#post-form").reset();
  $("#kind").value = kind;
  $("#date").value = today();
  $("#mode-label").textContent = `NEW ${kind.toUpperCase()}`;
  $("#editor-title").textContent = "새 글 작성";
  $("#save-status").textContent = "저장되지 않음";
  setLocked(false);
  updateKindFields();
  renderTags();
  renderLinks();
  renderPreview();
  renderPostList();
  $("#title").focus();
}

async function loadPost(location) {
  const params = new URLSearchParams(location);
  const post = await api(`/api/post?${params}`);
  state.original = post.original;
  state.tags = post.tags;
  state.links = post.links;
  state.relatedTech = post.relatedTech;
  for (const id of ["kind", "category", "slug", "title", "date", "summary", "body"]) {
    $("#" + id).value = post[id] ?? "";
  }
  $("#sample").checked = post.sample;
  $("#mode-label").textContent = `EDIT ${post.kind.toUpperCase()}`;
  $("#editor-title").textContent = post.title;
  $("#save-status").textContent = post.original;
  setLocked(true);
  updateKindFields();
  renderTags();
  renderLinks();
  renderPreview();
  renderPostList();
}

function updateKindFields() {
  const project = $("#kind").value === "project";
  $("#category-field").hidden = project;
  $("#project-links-section").hidden = !project;
}

function renderTags() {
  $("#tag-chips").innerHTML = state.tags
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}<button type="button" data-remove-tag="${escapeHtml(tag)}" aria-label="${escapeHtml(tag)} 제거">×</button></span>`)
    .join("");
  document.querySelectorAll("[data-remove-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tags = state.tags.filter((tag) => tag !== button.dataset.removeTag);
      renderTags();
    });
  });
}

function addTag(tag) {
  const normalized = tag.trim().toLowerCase();
  if (normalized && !state.tags.includes(normalized)) state.tags.push(normalized);
  $("#tag-input").value = "";
  $("#tag-suggestions").hidden = true;
  renderTags();
}

function showTagSuggestions() {
  const query = $("#tag-input").value.trim().toLowerCase();
  const matches = state.catalog.tags
    .filter((tag) => !state.tags.includes(tag.name) && tag.name.includes(query))
    .slice(0, 5);
  const box = $("#tag-suggestions");
  box.innerHTML = matches
    .map((tag, index) => `<button class="suggestion${index === 0 ? " active" : ""}" type="button" data-tag="${escapeHtml(tag.name)}"><strong>#${escapeHtml(tag.name)}</strong><small>${tag.count}개 글</small></button>`)
    .join("");
  box.hidden = matches.length === 0;
  box.querySelectorAll("[data-tag]").forEach((button) => button.addEventListener("click", () => addTag(button.dataset.tag)));
  return matches;
}

function renderLinks() {
  $("#project-links").innerHTML = state.links.length
    ? state.links.map((link, index) => `<div class="link-row" data-link-row="${index}">
        <select data-link-field="kind">
          ${["demo", "repository", "documentation", "download"].map((kind) => `<option value="${kind}"${link.kind === kind ? " selected" : ""}>${kind}</option>`).join("")}
        </select>
        <input data-link-field="label" value="${escapeAttribute(link.label || "")}" placeholder="표시 이름" />
        <input data-link-field="url" value="${escapeAttribute(link.url || "")}" placeholder="https://..." />
        <button type="button" data-remove-link="${index}">삭제</button>
      </div>`).join("")
    : `<p class="hint">실제 프로젝트는 Live demo 또는 GitHub 저장소를 하나 이상 등록하세요.</p>`;
  document.querySelectorAll("[data-link-row]").forEach((row) => {
    const index = Number(row.dataset.linkRow);
    row.querySelectorAll("[data-link-field]").forEach((input) => {
      input.addEventListener("input", () => (state.links[index][input.dataset.linkField] = input.value));
    });
  });
  document.querySelectorAll("[data-remove-link]").forEach((button) => button.addEventListener("click", () => {
    state.links.splice(Number(button.dataset.removeLink), 1);
    renderLinks();
  }));
}

function bodyCompletion() {
  const editor = $("#body");
  const before = editor.value.slice(0, editor.selectionStart);
  const lineStart = before.lastIndexOf("\n") + 1;
  const line = before.slice(lineStart);
  const match = line.match(/(?:^|\s)#([a-z0-9-]*)(?:\s+([^\n]*))?$/i);
  if (!match) return null;
  const hashOffset = line.lastIndexOf("#" + match[1]);
  const start = lineStart + hashOffset;
  const tag = match[1].toLowerCase();
  if (match[2] === undefined) {
    const suggestions = state.catalog.tags.filter((item) => item.name.startsWith(tag)).slice(0, 5);
    return { mode: "tag", start, end: editor.selectionStart, tag, suggestions };
  }
  if (!state.catalog.tags.some((item) => item.name === tag)) return null;
  const query = match[2].trim().toLowerCase();
  const suggestions = state.catalog.posts
    .filter((post) => post.kind === "tech" && post.tags.includes(tag) && post.title.toLowerCase().includes(query))
    .slice(0, 5);
  return { mode: "post", start, end: editor.selectionStart, tag, query, suggestions };
}

function refreshBodySuggestions() {
  state.completion = bodyCompletion();
  state.completionIndex = 0;
  renderBodySuggestions();
}

function renderBodySuggestions() {
  const box = $("#body-suggestions");
  const completion = state.completion;
  if (!completion || completion.suggestions.length === 0) {
    box.hidden = true;
    return;
  }
  box.innerHTML = completion.suggestions.map((item, index) => {
    if (completion.mode === "tag") {
      return `<button class="suggestion${index === state.completionIndex ? " active" : ""}" type="button" data-completion="${index}"><span><strong>#${escapeHtml(item.name)}</strong><small>태그 선택 후 Tech 글을 검색합니다.</small></span><small>${item.count}개</small></button>`;
    }
    return `<button class="suggestion${index === state.completionIndex ? " active" : ""}" type="button" data-completion="${index}"><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.summary)}</small></span><small>Tab</small></button>`;
  }).join("");
  box.hidden = false;
  box.querySelectorAll("[data-completion]").forEach((button) => button.addEventListener("click", () => selectCompletion(Number(button.dataset.completion))));
}

function selectCompletion(index = state.completionIndex) {
  const completion = state.completion;
  if (!completion) return;
  const item = completion.suggestions[index];
  if (!item) return;
  const editor = $("#body");
  const replacement = completion.mode === "tag"
    ? `#${item.name} `
    : `[[tech:${item.category}/${item.slug}|${item.title}]]`;
  editor.setRangeText(replacement, completion.start, completion.end, "end");
  editor.focus();
  refreshBodySuggestions();
  renderPreview();
}

function collectRelatedTech(body) {
  const seen = new Set();
  const existing = new Map(state.relatedTech.map((item) => [item.ref, item]));
  const result = [];
  for (const match of body.matchAll(/\[\[tech:([a-z0-9-]+\/[a-z0-9-]+)\|[^\]]+\]\]/g)) {
    const ref = match[1];
    if (seen.has(ref)) continue;
    seen.add(ref);
    result.push(existing.get(ref) ?? { ref, context: "" });
  }
  return result;
}

async function save(event) {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  $("#save-status").textContent = "검사 및 저장 중…";
  const body = $("#body").value;
  const kind = $("#kind").value;
  const payload = {
    original: state.original,
    kind,
    category: $("#category").value,
    slug: $("#slug").value,
    title: $("#title").value,
    date: $("#date").value,
    summary: $("#summary").value,
    tags: state.tags,
    sample: $("#sample").checked,
    links: state.links,
    relatedTech: kind === "project" ? collectRelatedTech(body) : [],
    body,
  };
  try {
    const result = await api("/api/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.original = result.file;
    state.relatedTech = payload.relatedTech;
    $("#save-status").textContent = `저장됨 · ${result.file}`;
    setLocked(true);
    await refreshCatalog();
    toast("Markdown 저장과 SQLite 동기화를 완료했습니다.");
  } catch (error) {
    $("#save-status").textContent = "저장 실패";
    toast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function uploadMedia(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const result = await api("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: $("#slug").value, name: file.name, data: reader.result }),
      });
      const editor = $("#body");
      const markdown = file.type.startsWith("video/")
        ? `<video controls src="${result.url}"></video>`
        : `![${file.name.replace(/\.[^.]+$/, "")}](${result.url})`;
      editor.setRangeText(markdown, editor.selectionStart, editor.selectionEnd, "end");
      renderPreview();
      toast(`미디어를 추가했습니다 (${Math.round(result.bytes / 1024)}KB).`);
    } catch (error) {
      toast(error.message, true);
    }
  };
  reader.readAsDataURL(file);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function escapeAttribute(value) { return escapeHtml(value); }

function inlineMarkdown(value) {
  return value
    .replace(/\[\[tech:([^|]+)\|([^\]]+)\]\]/g, '<a href="/tech/$1">$2</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function markdownPreview(markdown) {
  const escaped = escapeHtml(markdown);
  const lines = escaped.split("\n");
  const output = [];
  let inCode = false;
  let list = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      if (list) { output.push("</ul>"); list = false; }
      output.push(inCode ? "</code></pre>" : "<pre><code>");
      inCode = !inCode;
      continue;
    }
    if (inCode) { output.push(line + "\n"); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      if (list) { output.push("</ul>"); list = false; }
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!list) { output.push("<ul>"); list = true; }
      output.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }
    if (list) { output.push("</ul>"); list = false; }
    if (line.startsWith("&gt; ")) output.push(`<blockquote>${inlineMarkdown(line.slice(5))}</blockquote>`);
    else if (line.trim()) output.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  if (list) output.push("</ul>");
  if (inCode) output.push("</code></pre>");
  return output.join("\n");
}

function renderPreview() {
  $("#preview").innerHTML = markdownPreview($("#body").value || "미리보기가 여기에 표시됩니다.");
}

document.querySelectorAll("[data-new]").forEach((button) => button.addEventListener("click", () => resetPost(button.dataset.new)));
$("#post-search").addEventListener("input", renderPostList);
$("#kind").addEventListener("change", updateKindFields);
$("#post-form").addEventListener("submit", save);
$("#add-link").addEventListener("click", () => { state.links.push({ kind: "demo", label: "Live demo", url: "" }); renderLinks(); });
$("#tag-input").addEventListener("input", showTagSuggestions);
$("#tag-input").addEventListener("keydown", (event) => {
  if ((event.key === "Tab" || event.key === "Enter") && $("#tag-input").value.trim()) {
    event.preventDefault();
    const matches = showTagSuggestions();
    addTag(matches[0]?.name ?? $("#tag-input").value);
  }
});
$("#body").addEventListener("input", () => { refreshBodySuggestions(); renderPreview(); $("#save-status").textContent = "변경사항 있음"; });
$("#body").addEventListener("click", refreshBodySuggestions);
$("#body").addEventListener("keydown", (event) => {
  if (!state.completion || state.completion.suggestions.length === 0) {
    if (event.key === "Tab") {
      event.preventDefault();
      const editor = $("#body");
      editor.setRangeText("  ", editor.selectionStart, editor.selectionEnd, "end");
    }
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const delta = event.key === "ArrowDown" ? 1 : -1;
    state.completionIndex = (state.completionIndex + delta + state.completion.suggestions.length) % state.completion.suggestions.length;
    renderBodySuggestions();
  } else if (event.key === "Tab" || event.key === "Enter") {
    event.preventDefault();
    selectCompletion();
  } else if (event.key === "Escape") {
    state.completion = null;
    renderBodySuggestions();
  }
});
$("#media-input").addEventListener("change", (event) => { uploadMedia(event.target.files[0]); event.target.value = ""; });

refreshCatalog().then(() => resetPost("tech")).catch((error) => toast(error.message, true));

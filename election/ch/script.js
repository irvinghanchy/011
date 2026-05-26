const state = {
  candidates: [
    { number: "1", leftName: "賴清德", rightName: "蕭美琴", singleName: "賴清德", votes: "" },
    { number: "2", leftName: "林書豪", rightName: "王小明", singleName: "林書豪", votes: "" },
    { number: "3", leftName: "陳○○", rightName: "李○○", singleName: "陳○○", votes: "" },
    { number: "4", leftName: "黃○○", rightName: "張○○", singleName: "黃○○", votes: "" },
  ],
};

const el = (id) => document.getElementById(id);

const refs = {
  electionPreset: el("electionPreset"),
  districtPreset: el("districtPreset"),
  termText: el("termText"),
  manualTitle: el("manualTitle"),
  districtManualWrap: el("districtManualWrap"),
  districtManual: el("districtManual"),
  paperSize: el("paperSize"),
  colorMode: el("colorMode"),
  fontMode: el("fontMode"),
  candidateMode: el("candidateMode"),
  contestMode: el("contestMode"),
  candidateCount: el("candidateCount"),
  boxesPerCandidate: el("boxesPerCandidate"),
  candidates: el("candidates"),
  candidateTemplate: el("candidateTemplate"),
  supplementTemplate: el("supplementTemplate"),
  titlePreview: el("titlePreview"),
  preview: el("preview"),
  showSupplement: el("showSupplement"),
  showGuide: el("showGuide"),
  btnPrint: el("btnPrint"),
  btnReset: el("btnReset"),
  btnAddCandidate: el("btnAddCandidate"),
};

function buildTitle() {
  const manual = refs.manualTitle.value.trim();
  if (manual) return manual;

  const term = refs.termText.value.trim() || "第◯◯屆";
  const election = refs.electionPreset.value.trim();
  const district = refs.districtPreset.value;
  const districtText = district === "手動輸入"
    ? (refs.districtManual.value.trim() || "選舉區")
    : (district || "選舉區");

  const hasElection = election ? election : "選舉";
  return `國立高雄師範大學附屬高級中學學生會${hasElection}${districtText}選舉區計票紙`;
}

function syncDistrictVisibility() {
  refs.districtManualWrap.classList.toggle("hidden", refs.districtPreset.value !== "手動輸入");
}

function syncFontAndColor() {
  document.body.classList.toggle("font-kai", refs.fontMode.value === "kai");
  document.body.classList.toggle("font-hei", refs.fontMode.value === "hei");
  document.body.classList.toggle("color-mode", refs.colorMode.value === "color");
  document.body.classList.toggle("bw-mode", refs.colorMode.value === "bw");
}

function syncGuide() {
  document.body.classList.toggle("guide", refs.showGuide.checked);
}

function candidateTemplateNode() {
  return refs.candidateTemplate.content.firstElementChild.cloneNode(true);
}

function createEditorRow(candidate, index) {
  const row = document.createElement("div");
  row.className = "candidate-editor";
  row.dataset.index = index;

  row.innerHTML = `
    <div class="candidate-editor-header">
      <strong>候選人 ${index + 1}</strong>
      <button type="button" class="remove-btn">刪除</button>
    </div>
    <div class="candidate-editor-grid">
      <label class="field">
        <span>號次</span>
        <input class="number-input" type="text" value="${escapeHtml(candidate.number ?? String(index + 1))}" />
      </label>
      <div>
        <label class="field joint-only">
          <span>聯名姓名</span>
          <div class="two-inputs">
            <input class="left-name-input" type="text" placeholder="會長姓名" value="${escapeHtml(candidate.leftName ?? "")}" />
            <input class="right-name-input" type="text" placeholder="副會長姓名" value="${escapeHtml(candidate.rightName ?? "")}" />
          </div>
        </label>
        <label class="field independent-only hidden">
          <span>姓名</span>
          <input class="single-name-input" type="text" placeholder="姓名" value="${escapeHtml(candidate.singleName ?? "")}" />
        </label>
        <label class="field">
          <span>票數 / 備註</span>
          <input class="votes-input" type="text" value="${escapeHtml(candidate.votes ?? "")}" placeholder="留空" />
        </label>
      </div>
    </div>
  `;

  row.querySelector(".remove-btn").addEventListener("click", () => {
    state.candidates.splice(index, 1);
    renderEditors();
    renderPreview();
  });

  const update = () => {
    const idx = Number(row.dataset.index);
    const c = state.candidates[idx];
    c.number = row.querySelector(".number-input").value;
    c.leftName = row.querySelector(".left-name-input").value;
    c.rightName = row.querySelector(".right-name-input").value;
    c.singleName = row.querySelector(".single-name-input").value;
    c.votes = row.querySelector(".votes-input").value;
    renderPreview();
  };

  row.querySelectorAll("input").forEach((input) => input.addEventListener("input", update));
  return row;
}

function renderEditors() {
  refs.candidates.innerHTML = "";
  state.candidates.forEach((candidate, index) => {
    refs.candidates.appendChild(createEditorRow(candidate, index));
  });
  refs.candidateCount.value = state.candidates.length;
  updateEditorVisibility();
}

function updateEditorVisibility() {
  const mode = refs.candidateMode.value;
  document.querySelectorAll(".joint-only").forEach((node) => node.classList.toggle("hidden", mode !== "joint"));
  document.querySelectorAll(".independent-only").forEach((node) => node.classList.toggle("hidden", mode !== "independent"));
}

function tallyCells(count) {
  const frag = document.createDocumentFragment();
  const n = Math.max(4, Number(count) || 16);
  for (let i = 1; i <= n; i++) {
    const cell = document.createElement("div");
    cell.className = "tally-cell";
    const label = i * 5;
    cell.innerHTML = `<span>${label}</span>`;
    frag.appendChild(cell);
  }
  return frag;
}

function buildCandidateCard(candidate, index) {
  const node = candidateTemplateNode();
  node.querySelector(".index-value").textContent = candidate.number || String(index + 1);
  node.querySelector(".name-left").value = candidate.leftName || "";
  node.querySelector(".name-right").value = candidate.rightName || "";
  node.querySelector(".name-single").value = candidate.singleName || "";
  node.querySelector(".votes").value = candidate.votes || "";

  const mode = refs.candidateMode.value;
  node.querySelectorAll(".joint-only").forEach((n) => n.classList.toggle("hidden", mode !== "joint"));
  node.querySelectorAll(".independent-only").forEach((n) => n.classList.toggle("hidden", mode !== "independent"));

  const tallyGrid = node.querySelector(".tally-grid");
  tallyGrid.innerHTML = "";
  tallyGrid.appendChild(tallyCells(refs.boxesPerCandidate.value));
  return node;
}

function buildSupplement() {
  const tpl = refs.supplementTemplate.content.firstElementChild.cloneNode(true);
  const grid = tpl.querySelector(".tally-grid");
  grid.innerHTML = "";
  grid.appendChild(tallyCells(refs.boxesPerCandidate.value));
  return tpl;
}

function electionMetaLine() {
  const election = refs.electionPreset.value.trim() || "選舉";
  const district = refs.districtPreset.value === "手動輸入"
    ? (refs.districtManual.value.trim() || "選舉區")
    : (refs.districtPreset.value || "選舉區");
  return { election, district };
}

function renderSheetContent(container) {
  container.innerHTML = "";

  const title = buildTitle();
  refs.titlePreview.textContent = title;

  const top = document.createElement("div");
  top.className = "sheet-content";

  const titleEl = document.createElement("div");
  titleEl.className = "sheet-title";
  titleEl.textContent = title;
  top.appendChild(titleEl);

  const meta = document.createElement("div");
  meta.className = "meta-strip";
  const { election, district } = electionMetaLine();
  meta.innerHTML = `
    <div class="meta-block"><span class="meta-label">選舉別：</span><span class="meta-value">${escapeHtml(election)}</span></div>
    <div class="meta-block"><span class="meta-label">選舉區：</span><span class="meta-value">${escapeHtml(district)}</span></div>
    <div class="meta-block"><span class="meta-label">計票格式：</span><span class="meta-value">${refs.contestMode.value === "sufficient" ? "足額競選" : "不足額競選"}</span></div>
  `;
  top.appendChild(meta);

  const candidateWrap = document.createElement("div");
  candidateWrap.className = "candidates-view";

  const count = Math.max(1, state.candidates.length);
  state.candidates.slice(0, count).forEach((candidate, index) => {
    candidateWrap.appendChild(buildCandidateCard(candidate, index));
  });
  top.appendChild(candidateWrap);

  if (refs.showSupplement.checked) {
    top.appendChild(buildSupplement());
  }

  const signature = document.createElement("div");
  signature.className = "small-note";
  signature.textContent = "工作人員簽名：____________________________";
  top.appendChild(signature);

  container.appendChild(top);
}

function renderPreview() {
  syncDistrictVisibility();
  syncFontAndColor();
  syncGuide();
  updateEditorVisibility();

  const size = refs.paperSize.value;
  refs.preview.innerHTML = "";

  if (size === "A3_SPLIT") {
    const outer = document.createElement("div");
    outer.className = "sheet sheet-split print-split";
    outer.style.background = "#fff";

    const leftPage = document.createElement("div");
    leftPage.className = "a3-page";
    const leftInner = document.createElement("div");
    leftInner.className = "inner-sheet";
    leftPage.appendChild(leftInner);

    const rightPage = document.createElement("div");
    rightPage.className = "a3-page";
    const rightInner = document.createElement("div");
    rightInner.className = "inner-sheet shift-right";
    rightPage.appendChild(rightInner);

    renderSheetContent(leftInner);
    renderSheetContent(rightInner);

    outer.appendChild(leftPage);
    outer.appendChild(rightPage);
    refs.preview.appendChild(outer);
  } else {
    const sheet = document.createElement("div");
    sheet.className = `sheet ${size === "A1" ? "a1 print-a1" : "a2 print-a2"}`;
    renderSheetContent(sheet);
    refs.preview.appendChild(sheet);
  }
}

function addCandidate() {
  state.candidates.push({
    number: String(state.candidates.length + 1),
    leftName: "",
    rightName: "",
    singleName: "",
    votes: "",
  });
  renderEditors();
  renderPreview();
}

function clampCandidateCount() {
  const n = Math.max(1, Math.min(20, Number(refs.candidateCount.value) || 1));
  refs.candidateCount.value = n;
  while (state.candidates.length < n) addCandidateSilently();
  while (state.candidates.length > n) state.candidates.pop();
  renderEditors();
  renderPreview();
}

function addCandidateSilently() {
  state.candidates.push({
    number: String(state.candidates.length + 1),
    leftName: "",
    rightName: "",
    singleName: "",
    votes: "",
  });
}

function resetSample() {
  state.candidates = [
    { number: "1", leftName: "賴清德", rightName: "蕭美琴", singleName: "賴清德", votes: "" },
    { number: "2", leftName: "林書豪", rightName: "王小明", singleName: "林書豪", votes: "" },
    { number: "3", leftName: "陳○○", rightName: "李○○", singleName: "陳○○", votes: "" },
    { number: "4", leftName: "黃○○", rightName: "張○○", singleName: "黃○○", votes: "" },
  ];
  refs.electionPreset.value = "第十二屆學生議員選舉";
  refs.districtPreset.value = "國中部";
  refs.termText.value = "第十二屆";
  refs.manualTitle.value = "";
  refs.districtManual.value = "";
  refs.paperSize.value = "A2";
  refs.colorMode.value = "color";
  refs.fontMode.value = "kai";
  refs.candidateMode.value = "joint";
  refs.contestMode.value = "sufficient";
  refs.candidateCount.value = 4;
  refs.boxesPerCandidate.value = 16;
  refs.showSupplement.checked = true;
  refs.showGuide.checked = true;
  renderEditors();
  renderPreview();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attach() {
  Object.values(refs).forEach((node) => {
    if (!node || typeof node.addEventListener !== "function") return;
    if (node.matches && node.matches("input, select")) {
      node.addEventListener("input", renderPreview);
      node.addEventListener("change", renderPreview);
    }
  });

  refs.electionPreset.addEventListener("change", renderPreview);
  refs.districtPreset.addEventListener("change", renderPreview);
  refs.districtManual.addEventListener("input", renderPreview);
  refs.manualTitle.addEventListener("input", renderPreview);
  refs.candidateMode.addEventListener("change", renderPreview);
  refs.contestMode.addEventListener("change", renderPreview);
  refs.boxesPerCandidate.addEventListener("input", renderPreview);
  refs.paperSize.addEventListener("change", renderPreview);

  refs.candidateCount.addEventListener("change", clampCandidateCount);
  refs.btnAddCandidate.addEventListener("click", addCandidate);
  refs.btnReset.addEventListener("click", resetSample);
  refs.btnPrint.addEventListener("click", () => window.print());

  renderEditors();
  renderPreview();
}

attach();

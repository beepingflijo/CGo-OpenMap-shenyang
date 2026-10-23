/**
 * ==============================================================================
 * CGo OpenMap - 共享层数据（编辑器侧） (editor/js/tools/dataset-studio.js)
 * ==============================================================================
 *
 * 交互形态（不再是全屏数据表）
 * ------------------------------------------------------------------------------
 *   · 控制面板：Ribbon「数据与工具」→「共享层数据」，按功能给出两个独立开关：
 *       - 编辑控件开 / 关：只控制大纲分支与属性栏编辑区是否出现，运行时数据照常生效
 *       - 清空数据：把该数据集条目清空，导出时写回空数组（需二次确认）
 *   · 大纲：条目以「快速前往」branch 的形式挂在 drawer-body 的树里
 *   · 属性栏：点条目后在 inspector 里编辑基础字段与出入口列表
 *
 * 数据格式
 * ------------------------------------------------------------------------------
 *   { name, sid, kind, tag?, icon?, tone?, exits: [
 *       { code, mode: "transfer"|"entry"|"exit", walkMeters?, walkMinutes? }
 *   ] }
 *
 *   mode 站在**地点**视角，三者互斥：
 *     transfer 接驳 = 双向通行
 *     entry    入口 = 出入口 → 地点（热点作**终点**时用）
 *     exit     出口 = 地点 → 出入口（热点作**起点**时用）
 *
 *   取口顺序（运行时 route-panel 的 hotExitOf）：步行用时升序 → 无用时按距离
 *   （80 m/min 折算）→ 都没填则按数组顺序（约定数组即由近及远）。
 *
 * 写入
 * ------------------------------------------------------------------------------
 *   一律走 editor/js/core/city-project-io.js 的 patchEntries，只重写真正改动的条目。
 *   旧字段 exit / enterExit / leaveExit 在读入时归一化为 exits[]，写回时只写新格式。
 * ==============================================================================
 */
window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.DatasetStudio = (function () {
    'use strict';

    const FILE = 'data_hotspots.js';
    const GLOBALS = ['CGO_HOTSPOTS'];
    const ENABLED_KEY = 'openmap-editor-dataset-editor-enabled';

    const MODE_LABELS = {
        transfer: '接驳（双向通行）',
        entry: '入口（出入口 → 地点）',
        exit: '出口（地点 → 出入口）'
    };

    let project = null;          // CityProjectIO.loadCity 结果
    let stations = {};
    let lines = [];
    let rows = [];               // [{ origin: number|null, value }]
    let originals = [];          // 原始快照
    let sourceText = '';
    let containerName = '';
    let exitIndex = null;        // { sid: [出口编号] }
    let refIndex = null;         // { stations: [{id, cn}] }
    let selectedIndex = -1;

    // --------------------------------------------------------------------------
    // 工具
    // --------------------------------------------------------------------------

    function el(id) { return document.getElementById(id); }

    function getIO() {
        return window.OpenMapEditor.CityProjectIO || window.CityProjectIO;
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function stableJson(value) {
        return JSON.stringify(value, (k, v) => (k.startsWith('_') ? undefined : v));
    }

    function toast(msg, type) {
        if (window.CGO && typeof window.CGO.showToast === 'function') {
            window.CGO.showToast(msg, type || 'info', 3200);
        } else {
            console.log('[DatasetStudio]', msg);
        }
    }

    /** 数据变更后广播，editor-app 收到后刷新大纲 */
    function notifyChanged() {
        document.dispatchEvent(new CustomEvent('cgo:dataset-changed', { bubbles: true }));
    }

    // --------------------------------------------------------------------------
    // 启用状态
    // --------------------------------------------------------------------------

    function isEditorEnabled() {
        if (window.OpenMapEditor.Experiments) {
            return window.OpenMapEditor.Experiments.isEnabled('hotspots');
        }
        try { return localStorage.getItem(ENABLED_KEY) !== '0'; } catch (e) { return true; }
    }

    function setEditorEnabled(on) {
        if (window.OpenMapEditor.Experiments) {
            window.OpenMapEditor.Experiments.setEnabled('hotspots', on);
        } else {
            try { localStorage.setItem(ENABLED_KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
        }
        if (!on) {
            selectedIndex = -1;
            window.OpenMapEditor.InspectorView.renderEmpty();
        }
        notifyChanged();
    }

    // --------------------------------------------------------------------------
    // 城市载入
    // --------------------------------------------------------------------------

    function currentCity() {
        const ps = window.OpenMapEditor.PipelineSurgical;
        return ps && typeof ps.getCurrentLoadedCity === 'function' ? ps.getCurrentLoadedCity() : null;
    }

    async function fetchSource(file) {
        const url = `${project.base}/${file}?_ds=${Date.now()}`;
        try {
            const res = await fetch(url, { cache: 'no-store' });
            return res.ok ? await res.text() : null;
        } catch (e) { return null; }
    }

    function evalDataFile(source, name) {
        return new Function(`${source}\n;return (typeof ${name} !== "undefined") ? ${name} : null;`)();
    }

    function resolveContainerName(source, globals) {
        const io = getIO();
        for (const g of globals) {
            const m = new RegExp(`window\\s*\\.\\s*${g}\\s*=\\s*([A-Za-z_$][\\w$]*)\\s*;`).exec(source);
            if (m && io.findDeclaration(source, m[1]) >= 0) return m[1];
        }
        for (const g of globals) if (io.findDeclaration(source, g) >= 0) return g;
        const m = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*[\[{]/.exec(source);
        return m ? m[1] : null;
    }

    /** 旧字段 → exits[]（迁移前的城市数据仍可编辑） */
    function normalizeHotspot(h) {
        const out = Object.assign({}, h || {});
        if (!Array.isArray(out.exits)) {
            const exits = [];
            if (h && h.exit != null) exits.push({ code: String(h.exit), mode: 'transfer' });
            if (h && h.enterExit != null) exits.push({ code: String(h.enterExit), mode: 'exit' });
            if (h && h.leaveExit != null) exits.push({ code: String(h.leaveExit), mode: 'entry' });
            if (exits.length) out.exits = exits;
        }
        delete out.exit;
        delete out.enterExit;
        delete out.leaveExit;
        return out;
    }

    function buildRefIndex() {
        const io = getIO();
        const normal = new Set();
        (lines || []).forEach(line => {
            if (line.isPointOnly) return;
            io.lineAllStationIds(line).forEach(id => normal.add(id));
        });
        const list = [];
        Object.keys(stations).forEach(id => {
            const s = stations[id];
            if (s.type === 'no') return;
            if (!normal.has(id)) return;
            list.push({ id, cn: s.cn || id });
        });
        list.sort((a, b) => a.cn.localeCompare(b.cn, 'zh-Hans-CN'));
        return { stations: list };
    }

    async function ensureExitIndex() {
        if (exitIndex) return;
        exitIndex = {};
        const src = await fetchSource('data_exits.js');
        if (!src) return;
        const container = resolveContainerName(src, ['STATION_EXITS', 'CGO_EXITS']);
        if (!container) return;
        let map = null;
        try { map = evalDataFile(src, container); } catch (e) { return; }
        if (!map || typeof map !== 'object') return;
        Object.keys(map).forEach(sid => {
            const list = map[sid];
            if (!Array.isArray(list)) return;
            const codes = list.map(x => (x && x.name != null) ? String(x.name) : null).filter(Boolean);
            if (codes.length) exitIndex[sid] = codes;
        });
    }

    /** 载入指定城市的数据（编辑器切换城市时调用） */
    async function loadForCity() {
        const city = currentCity();
        if (!city) return null;
        if (project && project.id === city.id) return project;

        project = await getIO().loadCity(city.id);
        stations = project.data.stationsData || {};
        lines = project.data.linesData || [];

        sourceText = (await fetchSource(FILE)) || '';
        containerName = sourceText ? resolveContainerName(sourceText, GLOBALS) : '';
        const raw = (sourceText && containerName) ? (evalDataFile(sourceText, containerName) || []) : [];

        rows = raw.map((value, index) => ({ origin: index, value: normalizeHotspot(value) }));
        originals = JSON.parse(JSON.stringify(rows.map(r => r.value)));
        selectedIndex = -1;
        exitIndex = null;
        refIndex = buildRefIndex();

        await ensureExitIndex();
        notifyChanged();
        return project;
    }

    function getHotspots() {
        return rows.map(r => r.value);
    }

    /** 某站经停线路的标志色（供大纲显示线路色圆标） */
    function getStationLineColors(sid) {
        if (!sid) return [];
        const io = getIO();
        const out = [];
        (lines || []).forEach(line => {
            if (!line.color) return;
            if (io.lineAllStationIds(line).indexOf(sid) !== -1) {
                out.push({ name: line.name || line.id, color: line.color });
            }
        });
        return out;
    }

    // --------------------------------------------------------------------------
    // 属性栏：热点编辑
    // --------------------------------------------------------------------------

    function stationSelectHtml(current) {
        const list = refIndex ? refIndex.stations : [];
        const options = ['<option value="">（未指定）</option>'].concat(
            list.map(s => `<option value="${escapeHtml(s.id)}"${s.id === current ? ' selected' : ''}>` +
                `${escapeHtml(s.cn)} · ${escapeHtml(s.id)}</option>`)
        );
        if (current && !list.some(s => s.id === current)) {
            options.push(`<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}（无效引用）</option>`);
        }
        return `<select class="form-select" data-hot-field="sid">${options.join('')}</select>`;
    }

    function renderInspector() {
        if (!isEditorEnabled()) {
            window.OpenMapEditor.InspectorView.renderEmpty();
            return;
        }
        const row = rows[selectedIndex];
        if (!row) {
            window.OpenMapEditor.InspectorView.renderEmpty();
            return;
        }
        const h = row.value;

        let html = '<div class="inspector-section">' +
            '<div class="inspector-section-title" style="display:flex;align-items:center;gap:6px;">' +
            '<cgo-icon name="tourist" size="14"></cgo-icon><span>快速前往条目</span></div>';

        html += '<div class="form-row"><span class="form-label">名称:</span>' +
            `<input class="form-input" type="text" data-hot-field="name" value="${escapeHtml(h.name || '')}"></div>`;

        html += '<div class="form-row"><span class="form-label">车站:</span>' +
            stationSelectHtml(h.sid) + '</div>';

        html += '<div class="form-row"><span class="form-label">类型:</span>' +
            '<select class="form-select" data-hot-field="kind">' +
            `<option value="hub"${h.kind === 'hub' ? ' selected' : ''}>交通枢纽</option>` +
            `<option value="poi"${h.kind === 'poi' ? ' selected' : ''}>名胜景点</option>` +
            '</select></div>';

        html += '<div class="form-row"><span class="form-label">标签:</span>' +
            `<input class="form-input" type="text" data-hot-field="tag" value="${escapeHtml(h.tag || '')}" placeholder="如：全国文保 · 4A"></div>`;

        html += '<div class="form-row"><span class="form-label">图标:</span>' +
            `<input class="form-input" type="text" data-hot-field="icon" value="${escapeHtml(h.icon || '')}" placeholder="如：railway / plane / tourist"></div>`;

        html += '<div class="form-row"><span class="form-label">线路色:</span>' +
            '<select class="form-select" data-hot-field="tone">' +
            `<option value=""${!h.tone ? ' selected' : ''}>正常（跟线路色）</option>` +
            `<option value="somber"${h.tone === 'somber' ? ' selected' : ''}>淡化（中性灰）</option>` +
            '</select></div>';

        html += '<div class="ds-exit-block">' +
            '<div class="ds-exit-head"><span>接驳出入口</span>' +
            '<button type="button" class="ribbon-btn-sm" id="dsAddExit" style="width:auto;padding:3px 10px;">+ 添加</button></div>';

        const exits = Array.isArray(h.exits) ? h.exits : [];
        if (!exits.length) {
            html += '<div class="ds-exit-empty">尚未绑定出入口。可绑定不同车站的口（如地铁站与有轨站）。</div>';
        } else {
            exits.forEach((ex, i) => {
                const sid = ex.sid || h.sid || '';
                const st = sid ? stations[sid] : null;
                const stationText = sid ? `${(st && st.cn) || sid} · ${sid}` : '';
                const modeOptions = Object.keys(MODE_LABELS).map(m =>
                    `<option value="${m}"${ex.mode === m ? ' selected' : ''}>${MODE_LABELS[m]}</option>`
                ).join('');

                html += '<div class="ds-gate" data-gate-row="' + i + '">' +
                    '<div class="ds-gate-line">' +
                    '<div class="ds-gate-stationwrap">' +
                    `<input type="text" class="form-input ds-gate-station" data-gate-search="${i}"` +
                    ` value="${escapeHtml(stationText)}" placeholder="搜索车站（名称或编号）" autocomplete="off">` +
                    '<div class="ds-gate-suggest" hidden></div>' +
                    '</div>' +
                    `<button type="button" class="ds-gate-exitbtn${ex.code ? ' has-exit' : ''}" data-gate-exit="${i}">` +
                    (ex.code ? escapeHtml(ex.code) + ' 口' : '选择口') + '</button>' +
                    '<div class="ds-gate-menu" hidden></div>' +
                    `<button type="button" class="ds-icon-btn ds-icon-btn--danger" data-gate-remove="${i}" title="移除此口">` +
                    '<cgo-icon name="close" size="12"></cgo-icon></button>' +
                    '</div>' +
                    '<div class="ds-gate-meta">' +
                    `<select class="form-select" data-gate-field="mode">${modeOptions}</select>` +
                    `<input class="form-input" type="number" min="0" step="10" data-gate-field="walkMeters"` +
                    ` value="${ex.walkMeters != null ? ex.walkMeters : ''}" placeholder="步行米数">` +
                    `<input class="form-input" type="number" min="0" step="1" data-gate-field="walkMinutes"` +
                    ` value="${ex.walkMinutes != null ? ex.walkMinutes : ''}" placeholder="步行分钟">` +
                    '</div></div>';
            });
        }
        html += '<div class="ds-exit-hint">可绑定多个车站的口；规划时全部候选会参与总用时排序，选真正最快的「车站+口」。</div>';
        html += '</div>';

        html += '<button type="button" class="ribbon-btn-sm danger" id="dsRemoveHotspot" ' +
            'style="margin-top:12px;width:100%;">删除此条</button>';
        html += '</div>';

        window.OpenMapEditor.InspectorView.renderCustom(html, bindInspector);
    }

    function bindInspector(body) {
        const row = rows[selectedIndex];
        if (!row) return;

        // 基础字段：input 只改数据，不重渲染（避免打断输入法）
        body.querySelectorAll('[data-hot-field]').forEach(node => {
            node.addEventListener('input', () => {
                if (node.tagName === 'SELECT') return;
                row.value[node.dataset.hotField] = node.value;
                markDirtyOnly();
            });
            node.addEventListener('change', () => {
                if (node.tagName !== 'SELECT') return;
                row.value[node.dataset.hotField] = node.value;
                // 改车站后出口候选要跟着换，整块重渲染
                renderInspector();
                notifyChanged();
            });
        });

        // ── 出入口：车站搜索（cgo-rt-field 同款）+ 出口菜单 + 模式 + 步行 ──
        const exitsOf = () => (row.value.exits || (row.value.exits = []));

        body.querySelectorAll('[data-gate-search]').forEach(input => {
            const i = Number(input.dataset.gateSearch);
            const wrap = input.closest('.ds-gate');
            const suggest = wrap.querySelector('.ds-gate-suggest');

            input.addEventListener('input', () => {
                const q = input.value.trim().toLowerCase();
                const list = refIndex.stations.filter(s =>
                    !q || s.cn.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
                ).slice(0, 20);

                suggest.innerHTML = list.length
                    ? list.map(s =>
                        `<button type="button" class="ds-gate-suggest-item"` +
                        ` data-pick-station="${escapeHtml(s.id)}" data-gate-row="${i}">` +
                        `${escapeHtml(s.cn)}<small>${escapeHtml(s.id)}</small></button>`).join('')
                    : '<div class="ds-gate-empty">无匹配车站</div>';
                suggest.hidden = false;
            });

            input.addEventListener('blur', () => {
                // 延迟收起，让建议项上的 mousedown 先生效
                setTimeout(() => { suggest.hidden = true; }, 160);
            });
        });

        // 建议项是输入时动态生成的，必须走事件委托 —— 逐项绑定会漏掉后插入的节点
        body.onmousedown = function (e) {
            const btn = e.target.closest('[data-pick-station]');
            if (!btn) return;
            e.preventDefault();          // 阻止 input 失焦，避免建议先被收起
            const i = Number(btn.dataset.gateRow);
            const ex = exitsOf()[i];
            if (!ex) return;
            ex.sid = btn.dataset.pickStation;
            delete ex.code;              // 换站后原口不再有效
            renderInspector();
            markDirtyOnly();
        };

        body.querySelectorAll('[data-gate-exit]').forEach(btn => {
            const i = Number(btn.dataset.gateExit);
            const wrap = btn.closest('.ds-gate');
            const menu = wrap.querySelector('.ds-gate-menu');

            btn.addEventListener('click', () => {
                const ex = exitsOf()[i];
                if (!ex) return;
                const sid = ex.sid || row.value.sid;
                const codes = (sid && exitIndex && exitIndex[sid]) ? exitIndex[sid] : [];
                if (!codes.length) { toast('该站没有出入口数据，无法选口。'); return; }

                menu.innerHTML = codes.map(c =>
                    `<button type="button" class="ds-gate-exit-item${String(ex.code) === c ? ' is-on' : ''}"` +
                    ` data-pick-exit="${escapeHtml(c)}" data-gate-row="${i}">${escapeHtml(c)} 口</button>`
                ).join('');
                menu.hidden = !menu.hidden;
            });
        });

        body.onclick = function (e) {
            const btn = e.target.closest('[data-pick-exit]');
            if (!btn) return;
            const i = Number(btn.dataset.gateRow);
            const ex = exitsOf()[i];
            if (!ex) return;
            ex.code = btn.dataset.pickExit;
            if (!ex.sid) ex.sid = row.value.sid || '';
            renderInspector();
            markDirtyOnly();
        };

        body.querySelectorAll('[data-gate-field]').forEach(node => {
            const i = Number(node.closest('[data-gate-row]').dataset.gateRow);
            const key = node.dataset.gateField;
            const commit = () => {
                const ex = exitsOf()[i];
                if (!ex) return;
                if (key === 'walkMeters' || key === 'walkMinutes') {
                    if (node.value === '') delete ex[key];
                    else ex[key] = Number(node.value);
                } else {
                    ex[key] = node.value;
                }
                markDirtyOnly();
            };
            node.addEventListener(node.tagName === 'SELECT' ? 'change' : 'input', commit);
        });

        const addBtn = body.querySelector('#dsAddExit');
        if (addBtn) addBtn.addEventListener('click', () => {
            exitsOf().push({ sid: row.value.sid || '', code: '', mode: 'transfer' });
            renderInspector();
            markDirtyOnly();
        });

        body.querySelectorAll('[data-gate-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                exitsOf().splice(Number(btn.dataset.gateRemove), 1);
                renderInspector();
                markDirtyOnly();
            });
        });

        const del = body.querySelector('#dsRemoveHotspot');
        if (del) del.addEventListener('click', () => removeHotspot(selectedIndex));
    }

    function markDirtyOnly() {
        renderControlPanel();
    }

    // --------------------------------------------------------------------------
    // 增删
    // --------------------------------------------------------------------------

    function addHotspot() {
        rows.push({ origin: null, value: { name: '新条目', sid: '', kind: 'poi', exits: [] } });
        selectedIndex = rows.length - 1;
        renderInspector();
        notifyChanged();
    }

    function removeHotspot(index) {
        const row = rows[index];
        if (!row) return;
        const name = (row.value && row.value.name) || `第 ${index + 1} 条`;
        if (!window.confirm(`确定删除「${name}」？导出时会把它从 ${FILE} 中移除。`)) return;
        rows.splice(index, 1);
        selectedIndex = -1;
        window.OpenMapEditor.InspectorView.renderEmpty();
        notifyChanged();
    }

    function clearAll() {
        if (!rows.length) { toast('当前没有可清空的条目。'); return; }
        if (!window.confirm(`确定清空「快速前往」的全部 ${rows.length} 条数据？\n导出时会写回空数组，此操作需导出后才落到文件。`)) return;
        rows = [];
        selectedIndex = -1;
        window.OpenMapEditor.InspectorView.renderEmpty();
        notifyChanged();
    }

    // --------------------------------------------------------------------------
    // 脏判定与导出
    // --------------------------------------------------------------------------

    function collectOps() {
        const update = {};
        const remove = [];
        const append = [];
        const alive = new Set();

        rows.forEach(row => {
            if (row.origin == null) { append.push({ value: compact(row.value) }); return; }
            alive.add(row.origin);
            if (stableJson(originals[row.origin]) !== stableJson(row.value)) {
                update[String(row.origin)] = compact(row.value);
            }
        });
        originals.forEach((_, i) => { if (!alive.has(i)) remove.push(String(i)); });

        if (!Object.keys(update).length && !remove.length && !append.length) return null;
        return { update, remove, append };
    }

    /** 写回时只保留实际字段，去掉空值 */
    function compact(value) {
        const out = {};
        ['name', 'sid', 'kind', 'tag', 'icon', 'tone'].forEach(k => {
            if (value[k] !== undefined && value[k] !== '') out[k] = value[k];
        });
        const exits = (value.exits || []).filter(ex => ex && ex.code).map(ex => {
            const item = { code: String(ex.code), mode: ex.mode || 'transfer' };
            // 跨站绑定：与顶层主站不同才写出 sid，让既有数据尽量短
            if (ex.sid && ex.sid !== value.sid) item.sid = String(ex.sid);
            if (ex.walkMeters != null) item.walkMeters = Number(ex.walkMeters);
            if (ex.walkMinutes != null) item.walkMinutes = Number(ex.walkMinutes);
            return item;
        });
        if (exits.length) out.exits = exits;
        return out;
    }

    function getDirtySummary() {
        const ops = collectOps();
        if (!ops) return { total: 0 };
        return { total: Object.keys(ops.update).length + ops.remove.length + ops.append.length };
    }

    function buildExportFiles() {
        const ops = collectOps();
        if (!ops || !sourceText || !containerName) return [];
        const patched = getIO().patchEntries(sourceText, containerName, ops);
        return [{ name: FILE, text: patched }];
    }

    function exportChanges() {
        let files = [];
        try { files = buildExportFiles(); } catch (e) { toast('回写失败：' + e.message, 'error'); return; }
        if (!files.length) { toast('快速前往没有未导出的改动。'); return; }
        files.forEach((f, i) => {
            setTimeout(() => window.OpenMapEditor.BundleExporter.download(f.name, f.text, 'text/javascript'), i * 250);
        });
        toast('已生成 ' + FILE + '，覆盖回 city/' + (project ? project.id : '') + '/ 即可。', 'success');
    }

    // --------------------------------------------------------------------------
    // 控制面板
    // --------------------------------------------------------------------------

    function openControlPanel() {
        const modal = el('modalDatasetStudio');
        if (modal) modal.classList.add('open');
        renderControlPanel();
        if (!project || project.id !== (currentCity() || {}).id) {
            loadForCity().catch(e => toast('载入失败：' + e.message, 'error'));
        }
    }

    function renderControlPanel() {
        const box = el('ds-control-panel');
        if (!box) return;
        // 面板没打开时不做无谓重建（编辑属性栏时每次输入都会触发本函数）
        const modal = el('modalDatasetStudio');
        if (modal && !modal.classList.contains('open') && !modal.open) return;

        if (window.OpenMapEditor.Experiments) {
            window.OpenMapEditor.Experiments.refresh();
        } else {
            box.innerHTML = '<div class="ds-empty">实验性功能注册中心未加载。</div>';
        }
    }

    // --------------------------------------------------------------------------
    // 对外
    // --------------------------------------------------------------------------

    return {
        isEditorEnabled: isEditorEnabled,
        setEditorEnabled: setEditorEnabled,
        getHotspots: getHotspots,
        getStationLineColors: getStationLineColors,
        loadForCity: loadForCity,
        selectHotspot: function (index) {
            selectedIndex = Number(index);
            renderInspector();
        },
        renderInspector: renderInspector,
        addHotspot: addHotspot,
        openControlPanel: openControlPanel,
        getDirtySummary: getDirtySummary,
        buildExportFiles: buildExportFiles
    };
})();

// Ribbon 入口 + 注册为实验项
document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('btnOpenDatasetStudio');
    if (btn) {
        btn.addEventListener('click', function () {
            window.OpenMapEditor.DatasetStudio.openControlPanel();
        });
    }

    if (window.OpenMapEditor.Experiments) {
        window.OpenMapEditor.Experiments.register({
            id: 'hotspots',
            name: '快速前往',
            author: 'jrzhang',
            description: '行程规划面板的推荐目的地。编辑入口在大纲「快速前往」分支与右侧属性栏。',
            getStat: function () {
                var count = rows.length;
                var dirty = getDirtySummary().total;
                return count + ' 条' + (dirty ? ' · ' + dirty + ' 处未导出改动' : '');
            },
            actions: [
                { id: 'export', label: '导出改动', icon: 'download', variant: 'primary', when: 'on', run: function () { exportChanges(); } },
                { id: 'clear', label: '清空数据', icon: 'close', variant: 'danger', when: 'off', run: function () { clearAll(); } }
            ],
            onToggle: function (on) {
                if (!on) {
                    selectedIndex = -1;
                    if (window.OpenMapEditor.InspectorView) window.OpenMapEditor.InspectorView.renderEmpty();
                }
                notifyChanged();
            }
        });
    }
});

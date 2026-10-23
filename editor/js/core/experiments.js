/**
 * ==============================================================================
 * CGo OpenMap - 实验性功能注册中心 (editor/js/core/experiments.js)
 * ==============================================================================
 * 各城市 / 作者在自己的 city/{id}/experiments.js 里调用 register()，即可把功能
 * 接入编辑器的「实验性功能」面板，无需改动 editor/ 主代码。
 *
 * 注册项（def）：
 *   id            唯一标识（必填）
 *   name          显示名称
 *   author        归属作者 / 城市
 *   description   一句话说明
 *   getStat()     可选：返回统计文案（如「12 条 · 3 处未导出改动」）
 *   actions[]     可选：{ id, label, icon, variant, run() }
 *   onToggle(on)  可选：开关变化回调
 *
 * 开关语义：只控制「编辑控件」是否出现；运行时数据是否生效由各功能自行决定。
 * 状态持久化在 localStorage，按实验项 id 隔离。
 * ==============================================================================
 */
(function () {
    'use strict';

    var registry = [];
    var listeners = [];
    var STORAGE_PREFIX = 'om-exp-editor:';

    function register(def) {
        if (!def || !def.id) return;
        var existing = null;
        for (var i = 0; i < registry.length; i++) {
            if (registry[i].id === def.id) { existing = registry[i]; break; }
        }
        if (existing) Object.assign(existing, def);
        else registry.push(def);
        notify();
    }

    function list() { return registry.slice(); }

    function get(id) {
        for (var i = 0; i < registry.length; i++) {
            if (registry[i].id === id) return registry[i];
        }
        return null;
    }

    function isEnabled(id) {
        try {
            var v = localStorage.getItem(STORAGE_PREFIX + id);
            return v === null ? true : v === '1';
        } catch (e) { return true; }
    }

    function setEnabled(id, on) {
        try { localStorage.setItem(STORAGE_PREFIX + id, on ? '1' : '0'); } catch (e) { /* 隐私模式忽略 */ }
        var def = get(id);
        if (def && typeof def.onToggle === 'function') {
            try { def.onToggle(!!on); } catch (e) { /* 单个功能异常不拖垮面板 */ }
        }
        notify();
    }

    function onChange(fn) {
        if (typeof fn === 'function') listeners.push(fn);
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function renderPanel(container) {
        if (!container) return;
        if (!registry.length) {
            container.innerHTML = '<div class="ds-empty">暂无已注册的实验性功能。</div>';
            return;
        }

        container.innerHTML = registry.map(function (def) {
            var enabled = isEnabled(def.id);
            var stat = '';
            if (typeof def.getStat === 'function') {
                try { stat = def.getStat() || ''; } catch (e) { stat = ''; }
            }
            // 按钮按开关状态显隐：编辑控件开着时给「导出」，关掉后给「清空」
            var actions = (def.actions || []).filter(function (a) {
                if (a.when === 'on') return enabled;
                if (a.when === 'off') return !enabled;
                return true;
            }).map(function (a) {
                return '<cgo-button data-exp-action="' + esc(a.id) + '" data-exp-id="' + esc(def.id) + '"' +
                    ' variant="' + esc(a.variant || 'info') + '"' + (a.icon ? ' icon="' + esc(a.icon) + '"' : '') + '>' +
                    esc(a.label || a.id) + '</cgo-button>';
            }).join('');

            return '<div class="ds-panel-row" data-exp-id="' + esc(def.id) + '">' +
                '<div class="ds-panel-info">' +
                '<div class="ds-panel-name">' + esc(def.name || def.id) + '</div>' +
                (def.author ? '<div class="ds-exp-author">作者 · ' + esc(def.author) + '</div>' : '') +
                '<div class="ds-panel-desc">' + esc(def.description || '') + '</div>' +
                '<div class="ds-panel-stat">' + esc(stat) + '</div>' +
                '</div>' +
                '<div class="ds-panel-actions">' +
                '<div class="ds-switch-row">' +
                '<span class="ds-switch-label">编辑控件</span>' +
                '<button type="button" class="cgo-switch' + (enabled ? ' is-on' : '') + '"' +
                ' data-exp-toggle="' + esc(def.id) + '" role="switch" aria-checked="' + (enabled ? 'true' : 'false') + '">' +
                '<span class="cgo-switch-thumb"></span></button>' +
                '</div>' +
                actions +
                '</div></div>';
        }).join('');

        container.onclick = function (e) {
            var toggle = e.target.closest('[data-exp-toggle]');
            if (toggle) {
                var id = toggle.dataset.expToggle;
                setEnabled(id, !isEnabled(id));
                return;
            }
            var btn = e.target.closest('[data-exp-action]');
            if (!btn) return;
            var def = get(btn.dataset.expId);
            var action = def && (def.actions || []).find(function (a) { return a.id === btn.dataset.expAction; });
            if (action && typeof action.run === 'function') action.run();
        };
    }

    function refresh() {
        var box = document.getElementById('ds-control-panel');
        if (box) renderPanel(box);
    }

    function notify() {
        listeners.slice().forEach(function (fn) {
            try { fn(registry); } catch (e) { /* ignore */ }
        });
        refresh();
        // 让大纲等视图跟随实验项开关重绘（与 DatasetStudio 的 cgo:dataset-changed 同义）
        document.dispatchEvent(new CustomEvent('cgo:dataset-changed', { bubbles: true }));
    }

    window.OpenMapEditor = window.OpenMapEditor || {};
    window.OpenMapEditor.Experiments = {
        register: register,
        list: list,
        get: get,
        isEnabled: isEnabled,
        setEnabled: setEnabled,
        onChange: onChange,
        renderPanel: renderPanel,
        refresh: refresh
    };
})();

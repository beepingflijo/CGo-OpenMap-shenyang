/**
 * ==============================================================================
 * CGo OpenMap - 首末班车编辑区 (editor/js/tools/timetable-studio.js)
 * ==============================================================================
 * 挂载位置：车站 inspector 末尾（#inspectorBody 追加，不替换原有内容）。
 *
 * 交互：
 *   · 选中车站 → 列出该站所属线路的两个方向（往 line-first / line-last）；
 *   · 每条线路按 {CITY}_TIMETABLE_CONFIG[lineId] 决定可用维度（季节 / 日期类型）；
 *   · 表格行 = 季节 × 日期类型，列 = 首班 / 末班；空格子即「未录入」；
 *   · terminalOnly 线路只允许编辑两端站，中间站显示提示。
 *
 * 写回：统一导出为标准格式（由 TimetableSchema.serialize 生成），不再兼容旧结构。
 * ==============================================================================
 */
(function () {
    'use strict';

    var cache = {
        cityId: null,
        varName: '',
        configVarName: '',
        data: {},
        config: {},
        dirty: false,
        loading: null
    };

    var DEFAULT_CONFIG = {
        seasons: [],
        dayTypes: [],
        seasonLabels: { summer: '夏令时', winter: '冬令时' },
        dayTypeLabels: { workday: '工作日', restday: '节假日' },
        terminalOnly: false
    };

    function projectCityId(project) {
        return (project && (project.id || project.cityId)) ||
            (window.OpenMapEditor && window.OpenMapEditor.currentCityId) || '';
    }

    function configOf(lineId) {
        return Object.assign({}, DEFAULT_CONFIG, cache.config[lineId] || {});
    }

    /** 读取 data_timetable.js；长春旧格式以 linesData 作为求值入参 */
    function loadTimetable(project) {
        var cityId = projectCityId(project);
        if (!cityId) return Promise.resolve();
        if (cache.cityId === cityId && cache.loading) return cache.loading;

        cache = {
            cityId: cityId, varName: '', configVarName: '', data: {}, config: {},
            dirty: false, loading: null
        };

        cache.loading = fetch('../city/' + cityId + '/data_timetable.js')
            .then(function (res) { return res.ok ? res.text() : ''; })
            .then(function (source) {
                var dataMatch = source.match(/(?:const|let|var)\s+([A-Z0-9_]*TIMETABLE_DATA)\s*=/);
                var configMatch = source.match(/(?:const|let|var)\s+([A-Z0-9_]*TIMETABLE_CONFIG)\s*=/);
                cache.varName = dataMatch ? dataMatch[1] : '';
                cache.configVarName = configMatch ? configMatch[1] : '';

                var rawData = {};
                var rawConfig = {};
                if (source) {
                    var linesData = ((project && project.lines) || []).map(function (l) {
                        return { id: l.id, stationIds: l.stationIds || [] };
                    });
                    try {
                        // 旧文件末尾可能还有依赖 stationsData / document 的登记逻辑；
                        // 必须一并注入，否则整段求值抛错会把数据与配置一起丢掉。
                        var fn = new Function('linesData', 'stationsData', 'document', source + '\nreturn {' +
                            'data: typeof ' + (cache.varName || '__none__') + " !== 'undefined' ? " + (cache.varName || '__none__') + ' : {},' +
                            'config: typeof ' + (cache.configVarName || '__none__') + " !== 'undefined' ? " + (cache.configVarName || '__none__') + ' : {}' +
                            '};');
                        var bundle = fn(
                            linesData,
                            (project && project.nodes) || {},
                            { addEventListener: function () { } }
                        ) || {};
                        rawData = bundle.data || {};
                        rawConfig = bundle.config || {};
                    } catch (e) { /* 旧文件求值失败时按空表处理 */ }
                }

                cache.data = window.OpenMapEditor.TimetableSchema.normalize(cityId, rawData, rawConfig, project);
                cache.config = rawConfig || {};
            })
            .catch(function () { /* 无时刻表文件：空表 */ });

        return cache.loading;
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /** input[type=time] 只认 HH:MM；旧数据里的 6:00 需补零 */
    function normalizeClock(value) {
        var match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return '';
        return ('0' + match[1]).slice(-2) + ':' + match[2];
    }

    function stationName(project, sid) {
        var node = project && project.nodes ? project.nodes[sid] : null;
        return (node && node.cn) || sid;
    }

    function lineOf(project, lineId) {
        return ((project && project.lines) || []).find(function (l) { return l && l.id === lineId; }) || null;
    }

    function destName(project, line, destId) {
        if (!line) return destId;
        var ids = window.OpenMapEditor.TimetableSchema.operableStationIds(project, line);
        if (!ids.length) return destId;
        if (destId === 'line-first') return stationName(project, ids[0]);
        if (destId === 'line-last') return stationName(project, ids[ids.length - 1]);
        return stationName(project, destId);
    }

    function rowsOf(sid) {
        return cache.data[sid] || (cache.data[sid] = []);
    }

    function findRow(sid, lineId, destId, season, dayType) {
        return rowsOf(sid).find(function (r) {
            if (r.lineId !== lineId || r.destinationStationId !== destId) return false;
            // null 表示该维度未启用：不限定，取第一行即可
            if (season && (r.season || null) !== season) return false;
            if (dayType && (r.dayType || null) !== dayType) return false;
            return true;
        }) || null;
    }

    function setCell(sid, lineId, destId, season, dayType, field, value) {
        var row = findRow(sid, lineId, destId, season, dayType);
        if (!row) {
            if (!value) return;
            row = { lineId: lineId, destinationStationId: destId, season: season || null, dayType: dayType || null };
            rowsOf(sid).push(row);
        }
        if (value) row[field] = value;
        else delete row[field];
        cache.dirty = true;
    }

    /** 该维度在数据上是否确有差异；无差异就不展开，避免空行造成必填错觉 */
    function dimensionHasDiff(sid, lineId, destId, key, values) {
        if (!values || values.length <= 1) return false;
        var seen = {};
        values.forEach(function (value) {
            var rows = rowsOf(sid).filter(function (r) {
                return r.lineId === lineId && r.destinationStationId === destId && (r[key] || null) === value;
            });
            var sig = rows.map(function (r) { return (r.first || '') + '|' + (r.last || ''); }).join(';');
            seen[sig] = true;
        });
        return Object.keys(seen).length > 1;
    }

    function rowLabel(item) {
        var parts = [];
        if (item.season) parts.push((item.cfg.seasonLabels && item.cfg.seasonLabels[item.season]) || item.season);
        if (item.dayType) parts.push((item.cfg.dayTypeLabels && item.cfg.dayTypeLabels[item.dayType]) || item.dayType);
        return parts.length ? parts.join(' · ') : '通用';
    }

    /** 汇总当前车站所有「线路 × 方向 × 维度」组合（含提示行） */
    function collectRows(project, node) {
        var lines = ((project && project.lines) || []).filter(function (line) {
            return line && Array.isArray(line.stationIds) && line.stationIds.indexOf(node.id) !== -1;
        });
        var out = [];

        lines.forEach(function (line) {
            var operable = window.OpenMapEditor.TimetableSchema.operableStationIds(project, line);
            if (!operable.length) return;

            var dests = [];
            if (operable[0] !== node.id) dests.push('line-first');
            if (operable[operable.length - 1] !== node.id) dests.push('line-last');

            // 小交路：数据里已存在的中间站终点也一并列出
            rowsOf(node.id).forEach(function (r) {
                if (r.lineId === line.id && r.destinationStationId &&
                    r.destinationStationId !== 'line-first' && r.destinationStationId !== 'line-last' &&
                    dests.indexOf(r.destinationStationId) === -1) {
                    dests.push(r.destinationStationId);
                }
            });

            dests.forEach(function (destId) {
                var cfg = configOf(line.id);
                var seasons = Array.isArray(cfg.seasons) ? cfg.seasons : [];
                var dayTypes = Array.isArray(cfg.dayTypes) ? cfg.dayTypes : [];

                if (cfg.terminalOnly) {
                    var isTerminal = operable[0] === node.id || operable[operable.length - 1] === node.id;
                    if (!isTerminal) {
                        out.push({ line: line, destId: destId, note: '该线路仅录入两端车站的发车时间。' });
                        return;
                    }
                }

                if (!seasons.length && !dayTypes.length) {
                    out.push({ line: line, destId: destId, note: '该线路尚未配置时刻表维度。' });
                    return;
                }

                // 只有该维度在数据上确有差异才展开；否则只保留一个代表值
                var useSeasons = dimensionHasDiff(node.id, line.id, destId, 'season', seasons);
                var useDayTypes = dimensionHasDiff(node.id, line.id, destId, 'dayType', dayTypes);
                var seasonList = useSeasons ? seasons : [seasons[0] || null];
                var dayTypeList = useDayTypes ? dayTypes : [dayTypes[0] || null];

                seasonList.forEach(function (season) {
                    dayTypeList.forEach(function (dayType) {
                        out.push({
                            line: line, destId: destId, season: season, dayType: dayType, cfg: cfg,
                            row: findRow(node.id, line.id, destId, season, dayType)
                        });
                    });
                });
            });
        });
        return out;
    }

    function renderSection(bodyEl, node, project) {
        var old = document.getElementById('inspectorTimetable');
        if (old) old.remove();

        var host = document.getElementById('inspectorTimetableSlot') || bodyEl;
        var items = collectRows(project, node);

        var section = document.createElement('div');
        section.id = 'inspectorTimetable';
        section.className = 'tt-section';

        if (!items.length) {
            section.innerHTML = '<div class="tt-head"><span>首末班车</span></div>' +
                '<div class="tt-note">该车站未归属任何可运营线路。</div>';
            host.appendChild(section);
            return;
        }

        // 按「线路 + 方向」分组，组内两列紧凑排布
        var groups = [];
        var index = {};
        items.forEach(function (item) {
            var key = item.line.id + '|' + item.destId;
            if (!index[key]) {
                index[key] = { line: item.line, destId: item.destId, items: [] };
                groups.push(index[key]);
            }
            index[key].items.push(item);
        });

        var html = '<div class="tt-head"><span>首末班车</span>' +
            '<span class="tt-hint">点击编辑</span></div>';

        groups.forEach(function (group) {
            var isLocal = group.destId !== 'line-first' && group.destId !== 'line-last';
            html += '<div class="tt-group">' +
                '<div class="tt-group-title">' +
                '<span>' + escapeHtml(group.line.name + ' 开往 ' +
                    destName(project, group.line, group.destId)) + '</span>' +
                '<span class="tt-group-actions">' +
                (isLocal
                    ? '<button type="button" class="tt-add-local" data-tt-remove="' + escapeHtml(group.line.id) + '"' +
                      ' data-tt-dest="' + escapeHtml(group.destId) + '" title="删除小交路">−</button>'
                    : '') +
                '<button type="button" class="tt-add-local" data-tt-add="' + escapeHtml(group.line.id) + '"' +
                ' title="添加小交路终点">+</button>' +
                '</span>' +
                '</div><div class="tt-grid">';

            group.items.forEach(function (item) {
                if (item.note) {
                    html += '<div class="tt-cell tt-cell--note">' + escapeHtml(item.note) + '</div>';
                    return;
                }
                var first = normalizeClock(item.row && item.row.first);
                var last = normalizeClock(item.row && item.row.last);
                var cellIndex = items.indexOf(item);
                html += '<div class="tt-cell">' +
                    '<span class="tt-cell-label">' + escapeHtml(rowLabel(item)) + '</span>' +
                    '<div class="tt-cell-body">' +
                    '<span class="tt-cell-value">' + escapeHtml((first || '--:--') + '-' + (last || '--:--')) + '</span>' +
                    '<button type="button" class="tt-cell-edit" data-tt-edit="' + cellIndex + '" title="编辑">' +
                    '<cgo-icon name="edit" size="11"></cgo-icon></button>' +
                    '</div></div>';
            });

            html += '</div></div>';
        });

        section.innerHTML = html;
        host.appendChild(section);

        // 事件委托：按钮内容含 <cgo-icon>，逐项绑定容易受渲染时序影响
        section.onclick = function (e) {
            var editBtn = e.target.closest('[data-tt-edit]');
            if (editBtn) {
                var item = items[Number(editBtn.dataset.ttEdit)];
                if (item) openEditor(node, project, item);
                return;
            }

            var addBtn = e.target.closest('[data-tt-add]');
            if (addBtn) {
                var addLine = lineOf(project, addBtn.dataset.ttAdd);
                if (addLine) openAddLocal(node, project, addLine);
                return;
            }

            var removeBtn = e.target.closest('[data-tt-remove]');
            if (removeBtn) {
                if (!window.confirm('删除该小交路方向的所有时刻数据？')) return;
                var lineId = removeBtn.dataset.ttRemove;
                var destId = removeBtn.dataset.ttDest;
                cache.data[node.id] = rowsOf(node.id).filter(function (r) {
                    return !(r.lineId === lineId && r.destinationStationId === destId);
                });
                cache.dirty = true;
                renderSection(document.getElementById('inspectorBody'), node, project);
            }
        };
    }

    /** 小交路终点选择（cgo-modal） */
    function openAddLocal(node, project, line) {
        var modal = document.getElementById('ttLocalModal');
        var bodyEl = document.getElementById('ttLocalBody');
        if (!modal || !bodyEl) return;

        var operable = window.OpenMapEditor.TimetableSchema.operableStationIds(project, line);
        var candidates = operable.filter(function (id) {
            return id !== operable[0] && id !== operable[operable.length - 1] && id !== node.id;
        });

        bodyEl.innerHTML =
            '<div class="tt-edit-title">' + escapeHtml(line.name || line.id) + '</div>' +
            (candidates.length
                ? '<div class="tt-local-list">' + candidates.map(function (id) {
                    return '<button type="button" class="tt-local-item" data-pick-local="' + escapeHtml(id) + '">' +
                        escapeHtml(stationName(project, id)) + '</button>';
                }).join('') + '</div>'
                : '<div class="tt-note">该线路没有可选为小交路终点的中间站。</div>') +
            '<div class="dialog-buttons"><cgo-button variant="info" data-close="ttLocalModal">取消</cgo-button></div>';

        modal.classList.add('open');

        bodyEl.querySelectorAll('[data-pick-local]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var cfg = configOf(line.id);
                rowsOf(node.id).push({
                    lineId: line.id,
                    destinationStationId: btn.dataset.pickLocal,
                    season: (cfg.seasons && cfg.seasons[0]) || null,
                    dayType: (cfg.dayTypes && cfg.dayTypes[0]) || null
                });
                cache.dirty = true;
                modal.classList.remove('open');
                renderSection(document.getElementById('inspectorBody'), node, project);
            });
        });
    }

    function openEditor(node, project, item) {
        var modal = document.getElementById('ttEditorModal');
        var bodyEl = document.getElementById('ttEditBody');
        if (!modal || !bodyEl) return;

        var title = item.line.name + ' · 开往 ' + destName(project, item.line, item.destId) + ' · ' + rowLabel(item);
        bodyEl.innerHTML =
            '<div class="tt-edit-title">' + escapeHtml(title) + '</div>' +
            '<div class="tt-modal-field"><label>首班</label>' +
            '<input type="time" id="ttEditFirst" value="' + escapeHtml(normalizeClock(item.row && item.row.first)) + '"></div>' +
            '<div class="tt-modal-field"><label>末班</label>' +
            '<input type="time" id="ttEditLast" value="' + escapeHtml(normalizeClock(item.row && item.row.last)) + '"></div>' +
            '<div class="dialog-buttons">' +
            '<cgo-button variant="info" data-close="ttEditorModal">取消</cgo-button>' +
            '<cgo-button variant="primary" id="ttSaveBtn">保存</cgo-button>' +
            '</div>';

        modal.classList.add('open');

        var saveBtn = bodyEl.querySelector('#ttSaveBtn');
        if (saveBtn) saveBtn.addEventListener('click', function () {
            var first = bodyEl.querySelector('#ttEditFirst').value;
            var last = bodyEl.querySelector('#ttEditLast').value;
            setCell(node.id, item.line.id, item.destId, item.season || null, item.dayType || null, 'first', first);
            setCell(node.id, item.line.id, item.destId, item.season || null, item.dayType || null, 'last', last);
            modal.classList.remove('open');
            renderSection(document.getElementById('inspectorBody'), node, project);
            var section = document.getElementById('inspectorTimetable');
            if (section) section.classList.add('is-dirty');
        });
    }

    function mount(node, project) {
        if (window.OpenMapEditor.Experiments && !window.OpenMapEditor.Experiments.isEnabled('timetable')) return;
        var bodyEl = document.getElementById('inspectorBody');
        if (!bodyEl || !node || !project) return;
        var sid = node.id;
        bodyEl.dataset.ttNode = sid;
        loadTimetable(project).then(function () {
            // 异步返回时用户可能已切站
            if (bodyEl.dataset.ttNode !== sid) return;
            renderSection(bodyEl, node, project);
        });
    }

    function exportSource() {
        if (!cache.varName) {
            if (window.OpenMapEditor.showToast) window.OpenMapEditor.showToast('当前城市没有可导出的时刻表变量', 'warning');
            return;
        }
        var meta = { varName: cache.varName, configVarName: cache.configVarName };
        var source = window.OpenMapEditor.TimetableSchema.serialize(meta, cache.data, cache.config);
        var blob = new Blob([source], { type: 'text/javascript;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'data_timetable.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        cache.dirty = false;
    }

    function clearAll() {
        if (!window.confirm('确定清空当前城市的所有首末班车数据？导出后才会写回文件。')) return;
        cache.data = {};
        cache.dirty = true;
        var section = document.getElementById('inspectorTimetable');
        if (section) {
            section.querySelectorAll('.tt-row-value').forEach(function (el) {
                el.textContent = '--:-- - --:--';
            });
        }
    }

    window.OpenMapEditor = window.OpenMapEditor || {};
    window.OpenMapEditor.TimetableStudio = {
        mount: mount,
        exportSource: exportSource,
        isDirty: function () { return !!cache.dirty; }
    };

    // 注册为实验项
    document.addEventListener('DOMContentLoaded', function () {
        if (!window.OpenMapEditor.Experiments) return;
        window.OpenMapEditor.Experiments.register({
            id: 'timetable',
            name: '首末班车',
            author: 'jrzhang',
            description: '按车站编辑各方向的首末班时刻，支持季节与日期类型维度。',
            getStat: function () {
                var dirty = cache.dirty ? 1 : 0;
                return (cache.cityId ? '已载入 ' + cache.cityId : '未载入城市') + (dirty ? ' · 有未导出的改动' : '');
            },
            actions: [
                { id: 'export', label: '导出改动', icon: 'download', variant: 'primary', when: 'on', run: exportSource },
                { id: 'clear', label: '清空数据', icon: 'close', variant: 'danger', when: 'off', run: clearAll }
            ],
            onToggle: function (on) {
                if (!on) {
                    var section = document.getElementById('inspectorTimetable');
                    if (section) section.remove();
                }
            }
        });
    });
})();

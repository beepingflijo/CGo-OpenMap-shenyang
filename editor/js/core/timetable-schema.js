/**
 * ==============================================================================
 * CGo OpenMap - 首末班车标准格式与旧数据适配 (editor/js/core/timetable-schema.js)
 * ==============================================================================
 *
 * 标准行（按车站索引，每站一个数组）：
 *   {
 *       lineId: "CC1",
 *       destinationStationId: "line-first" | "line-last" | "站ID",
 *       season: "summer" | "winter" | null,
 *       dayType: "workday" | "restday" | null,
 *       first: "05:30",
 *       last: "22:00",
 *       isEstimated: false
 *   }
 *
 *   · destinationStationId 已唯一确定方向与终点，故不再冗余存 direction / destinationName；
 *     展示时由 CGoTimetable.resolveDestination 或站序解析。
 *   · season / dayType 为 null 表示该维度不参与，渲染时直接展示。
 *
 * 线路配置（与数据同文件导出，按线路而非按城市）：
 *   const {CITY}_TIMETABLE_CONFIG = {
 *       "CC1": {
 *           seasons: ["summer", "winter"],
 *           dayTypes: ["workday", "restday"],
 *           seasonLabels: { summer: "夏令时", winter: "冬令时" },
 *           dayTypeLabels: { workday: "工作日", restday: "节假日" },
 *           terminalOnly: false,          // true = 该线只录两端站发车时间
 *           seasonResolver: (date) => "summer"   // 可选，运行时判定，编辑器不消费
 *       }
 *   };
 * ==============================================================================
 */
(function () {
    'use strict';

    function stationName(project, sid) {
        const node = project && project.nodes ? project.nodes[sid] : null;
        return (node && node.cn) || sid || '';
    }

    /**
     * 只从**已进入运营**的车站里取端点：未开通站（type "no"）不参与
     * line-first / line-last 判定，否则终点名会落到尚未开通的规划站上。
     */
    function operableStationIds(project, line) {
        if (!line || !Array.isArray(line.stationIds)) return [];
        return line.stationIds.filter(function (id) {
            const node = project && project.nodes ? project.nodes[id] : null;
            return !node || node.type !== 'no';
        });
    }

    /**
     * 把终点站名解析成标准代号：线端站 → line-first / line-last，其余 → 站 ID。
     * 找不到时原样返回，避免丢失信息。
     */
    function resolveDestinationId(project, line, name) {
        if (!name) return name;
        const ids = operableStationIds(project, line);
        if (!ids.length) return name;
        if (stationName(project, ids[0]) === name) return 'line-first';
        if (stationName(project, ids[ids.length - 1]) === name) return 'line-last';
        const hit = ids.find(function (id) { return stationName(project, id) === name; });
        return hit || name;
    }

    /** 长春旧格式：[lineId][stationId] = [{ destination, first:{workday,restday}, summer, winter }] */
    function fromChangchun(data, config, project) {
        const out = {};
        const lines = (project && project.lines) || [];

        Object.keys(data || {}).forEach(function (lineId) {
            const line = lines.find(function (l) { return l && l.id === lineId; }) || null;
            const byStation = data[lineId] || {};

            Object.keys(byStation).forEach(function (sid) {
                (byStation[sid] || []).forEach(function (row) {
                    if (!row) return;
                    const destId = resolveDestinationId(project, line, row.destination);
                    const firstWorkday = (row.first && row.first.workday) || (row.first && row.first.restday) || '';
                    const firstRestday = (row.first && row.first.restday) || firstWorkday;

                    const cfg = config[lineId] || {};
                    const wantRestday = (cfg.dayTypes || []).indexOf('restday') !== -1;
                    const combos = [
                        { season: 'summer', dayType: 'workday', first: firstWorkday, last: row.summer || '' },
                        { season: 'winter', dayType: 'workday', first: firstWorkday, last: row.winter || '' }
                    ];
                    // 线路启用了节假日维度时，即使首班与工作日相同也生成 restday 行，
                    // 否则编辑器会把「无差异」误显示成「未录入」。
                    if (wantRestday || firstRestday !== firstWorkday) {
                        combos.push({ season: 'summer', dayType: 'restday', first: firstRestday, last: row.summer || '' });
                        combos.push({ season: 'winter', dayType: 'restday', first: firstRestday, last: row.winter || '' });
                    }

                    combos.forEach(function (c) {
                        if (!c.first && !c.last) return;
                        (out[sid] || (out[sid] = [])).push({
                            lineId: lineId,
                            destinationStationId: destId,
                            season: c.season,
                            dayType: c.dayType,
                            first: c.first,
                            last: c.last
                        });
                    });
                });
            });
        });
        return out;
    }

    /** 已是标准格式（按车站索引的数组）则原样返回 */
    function fromStandard(data) {
        return data && typeof data === 'object' ? data : {};
    }

    function normalize(cityId, data, config, project) {
        if (cityId === 'changchun') return fromChangchun(data, config, project);
        return fromStandard(data);
    }

    function quote(value) {
        return "'" + String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    }

    /** 标准数据 → data_timetable.js 源码（含线路配置） */
    function serialize(meta, data, config) {
        const varName = meta.varName;
        const configVarName = meta.configVarName || (varName.replace(/_TIMETABLE_DATA$/, '') + '_TIMETABLE_CONFIG');
        const lines = [];

        lines.push('/**');
        lines.push(' * CGo OpenMap - 首末班车标准数据（由 OpenMap Editor 导出）');
        lines.push(' * 行格式：{ lineId, destinationStationId, season, dayType, first, last, isEstimated? }');
        lines.push(' */');
        lines.push('');
        lines.push('const ' + configVarName + ' = {');
        const lineConfigs = Object.keys(config || {});
        lineConfigs.forEach(function (lineId, index) {
            const cfg = config[lineId] || {};
            const parts = [];
            if (Array.isArray(cfg.seasons)) parts.push('seasons: [' + cfg.seasons.map(quote).join(', ') + ']');
            if (Array.isArray(cfg.dayTypes)) parts.push('dayTypes: [' + cfg.dayTypes.map(quote).join(', ') + ']');
            if (cfg.seasonLabels) parts.push('seasonLabels: ' + JSON.stringify(cfg.seasonLabels));
            if (cfg.dayTypeLabels) parts.push('dayTypeLabels: ' + JSON.stringify(cfg.dayTypeLabels));
            if (cfg.terminalOnly) parts.push('terminalOnly: true');
            lines.push('    ' + quote(lineId) + ': { ' + parts.join(', ') + ' }' +
                (index === lineConfigs.length - 1 ? '' : ','));
        });
        lines.push('};');
        lines.push('');
        lines.push('const ' + varName + ' = {');

        const stationIds = Object.keys(data || {});
        stationIds.forEach(function (sid, sIndex) {
            const rows = (data[sid] || []).filter(Boolean);
            if (!rows.length) return;
            lines.push('    ' + quote(sid) + ': [');
            rows.forEach(function (row, rIndex) {
                const parts = [
                    'lineId: ' + quote(row.lineId),
                    'destinationStationId: ' + quote(row.destinationStationId)
                ];
                if (row.season) parts.push('season: ' + quote(row.season));
                if (row.dayType) parts.push('dayType: ' + quote(row.dayType));
                if (row.first) parts.push('first: ' + quote(row.first));
                if (row.last) parts.push('last: ' + quote(row.last));
                if (row.isEstimated) parts.push('isEstimated: true');
                lines.push('        { ' + parts.join(', ') + ' }' +
                    (rIndex === rows.length - 1 ? '' : ','));
            });
            lines.push('    ]' + (sIndex === stationIds.length - 1 ? '' : ','));
        });
        lines.push('};');
        lines.push('');
        return lines.join('\n');
    }

    window.OpenMapEditor = window.OpenMapEditor || {};
    window.OpenMapEditor.TimetableSchema = {
        normalize: normalize,
        serialize: serialize,
        operableStationIds: operableStationIds,
        resolveDestinationId: resolveDestinationId
    };
})();

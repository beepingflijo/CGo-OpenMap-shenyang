/**
 * CGo OpenMap - 共享层多语言运行时 (city/shenyang/shared/base/i18n.js)
 *
 * 目标：不改 core、不改 stationsData 的 cn/en 业务主键，只改「显示层」。
 *
 * 三层结构
 * 1. Locale：解析 ?lang=，首版支持 zh-Hans / zh-Hant / en；
 * 2. UI 文案：window.CGO_I18N_MESSAGES 提供语义 key，反查表把中文源文案
 *    映射为目标语言，用于覆盖 core 与尚未改造的共享模块；
 * 3. 内容名称：城市在 city/{city}/data_i18n.js 里按稳定车站 ID 提供
 *    zh-Hant / en 等名称，本运行时负责拼装地图标签、面板标题与搜索别名。
 *
 * 关键约束
 * - 绝不改写 station.cn / station.en：出口反查、坐标索引、邻站匹配、沿革
 *   都依赖中文名作为业务主键；
 * - 地图标签只改写 .stacn / .staen / .cgo-sta-third 的文本；
 * - 搜索结果只改写文本容器，保留 core 绑定的 data-sid 与点击逻辑；
 * - 出口地标不翻译；快速前往由 route-panel 通过 poiName/poiTag 主动取译名。
 */
(function () {
    "use strict";

    const DEFAULT_LOCALE = "zh-Hans";
    const FALLBACK = {
        "zh-Hant": ["zh-Hans"],
        en: ["zh-Hans"]
    };
    const ALIASES = {
        zh: "zh-Hans",
        "zh-cn": "zh-Hans",
        "zh-sg": "zh-Hans",
        "zh-my": "zh-Hans",
        "zh-tw": "zh-Hant",
        "zh-hk": "zh-Hant",
        "zh-mo": "zh-Hant",
        en: "en",
        "en-us": "en",
        "en-gb": "en",
        "en-au": "en",
        "en-ca": "en"
    };

    const params = new URLSearchParams(window.location.search);
    const locale = normalizeLocale(params.get("lang")) || DEFAULT_LOCALE;
    const isTranslated = locale !== DEFAULT_LOCALE;

    const cityId = (window.CityDataManager && typeof window.CityDataManager.getCurrentCityId === "function")
        ? window.CityDataManager.getCurrentCityId()
        : (params.get("city") || "beijing");
    const cityConfig = (window.CGO_CITY_I18N && window.CGO_CITY_I18N[cityId]) || {};
    const defaultNameStyle = cityConfig.nameStyle === "translit" ? "translit" : "semantic";
    const styleParam = params.get("nameStyle");
    const nameStyle = (styleParam === "translit" || styleParam === "semantic")
        ? styleParam
        : defaultNameStyle;

    /* ── 文案表与反查表 ─────────────────────────────────────────────────── */

    const messages = window.CGO_I18N_MESSAGES || {};
    const bundles = {};
    const reverse = {};

    function buildBundles() {
        Object.keys(messages).forEach((key) => {
            const item = messages[key] || {};
            Object.keys(item).forEach((lang) => {
                if (!bundles[lang]) bundles[lang] = {};
                bundles[lang][key] = item[lang];
            });
        });
        Object.keys(bundles).forEach((lang) => {
            const rev = {};
            const source = bundles["zh-Hans"] || {};
            Object.keys(bundles[lang]).forEach((key) => {
                const zh = source[key];
                const value = bundles[lang][key];
                if (zh && value) rev[zh] = value;
            });
            reverse[lang] = rev;
        });
    }
    buildBundles();

    function fallbackChain(lang) {
        return [lang].concat(FALLBACK[lang] || []).concat([DEFAULT_LOCALE]);
    }

    function t(key, vars) {
        const chain = fallbackChain(locale);
        let value = key;
        for (let i = 0; i < chain.length; i += 1) {
            const bundle = bundles[chain[i]];
            if (bundle && bundle[key] != null) { value = bundle[key]; break; }
        }
        if (vars && typeof value === "string") {
            Object.keys(vars).forEach((name) => {
                value = value.replace(new RegExp("\\{" + name + "\\}", "g"), () => String(vars[name]));
            });
        }
        return value;
    }

    function tr(text) {
        if (!text) return text;
        const chain = fallbackChain(locale);
        for (let i = 0; i < chain.length; i += 1) {
            const rev = reverse[chain[i]];
            if (rev && rev[text] != null) return rev[text];
        }
        return text;
    }

    /* ── 数据访问 ───────────────────────────────────────────────────────── */

    function stationTable() {
        const processed = window.processedStations;
        if (processed && Object.keys(processed).length) return processed;
        if (typeof stationsData !== "undefined" && stationsData) return stationsData;
        return {};
    }

    function getStation(sid) {
        if (!sid) return null;
        return stationTable()[sid] || null;
    }

    function findSidByCn(cn) {
        if (!cn) return "";
        const table = stationTable();
        return Object.keys(table).find((sid) => table[sid] && table[sid].cn === cn) || "";
    }

    function clean(text) {
        return String(text == null ? "" : text)
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    /** 保留 <br> 换行标记，只规整其两侧的空白 */
    function normalizeName(text) {
        return String(text == null ? "" : text)
            .replace(/\s*<br\s*\/?>\s*/gi, "<br>")
            .replace(/[ \t]+/g, " ")
            .trim();
    }

    /** 纯文本名：把 <br> 折成空格，供 aria-label / 搜索 / 行程面板使用 */
    function plainName(text) {
        return normalizeName(text).replace(/<br\s*\/?>/gi, " ");
    }

    /** 把除 <br> 以外的内容全部转义，允许数据里用 <br> 控制站名换行 */
    function escapeNameHtml(text) {
        return normalizeName(text).split(/<br\s*\/?>/gi).map(escapeHtml).join("<br>");
    }

    /**
     * 一行站名。
     * role 决定它落在标签的哪一行，而不是靠数组下标：
     * - main：站点主名（中文界面的中文、外文界面的主外文名）
     * - sub：副名（中文界面的英文、外文界面的意译）
     * - native：外文界面下的中文原文，固定放第三行
     */
    function makeLine(text, lang, role) {
        const value = normalizeName(text);
        return { text: value, plain: plainName(value), lang, role };
    }

    function localizedStationName(sid, station, lang, style) {
        if (!station) return "";
        const entry = (cityConfig.stations && cityConfig.stations[sid]) || null;
        const raw = entry ? entry[lang] : null;

        if (lang === "zh-Hans") return normalizeName(station.cn);
        if (lang === "zh-Hant") {
            if (typeof raw === "string") return normalizeName(raw);
            if (raw && typeof raw === "object") return normalizeName(raw.primary || raw.semantic || raw.translit || "");
            return normalizeName(station.cn);
        }

        if (raw && typeof raw === "object") {
            const preferred = (style === "translit")
                ? (raw.translit || raw.semantic)
                : (raw.semantic || raw.translit);
            if (preferred) return normalizeName(preferred);
        }
        if (typeof raw === "string" && raw) return normalizeName(raw);

        // 回退到数据文件里的 en 字段：沈/长为音译，大/哈/呼为意译
        if (lang === "en") return normalizeName(station.en);
        return "";
    }

    /**
     * 地图标签行。
     * - zh-Hans：中文主行 + 英文副行（保持引擎原样）
     * - zh-Hant：繁体主行 + 英文副行
     * - en/ko/ru：外语主行 + （音译优先时）意译副行 + 中文原文行
     * - ja：日文主行 + 中文副行（沿用两行模型）
     * text 保留 <br> 供地图标签换行；plain 已折成空格，供 aria / 搜索使用。
     */
    function labelLines(sid, station) {
        if (!station) return [];
        if (!sid) sid = findSidByCn(station.cn);
        if (locale === "zh-Hans") {
            return [
                makeLine(station.cn, "zh-Hans", "main"),
                makeLine(station.en, "en", "sub")
            ].filter((line) => line.plain);
        }
        if (locale === "zh-Hant") {
            return [
                makeLine(localizedStationName(sid, station, "zh-Hant"), "zh-Hant", "main"),
                makeLine(station.en, "en", "sub")
            ].filter((line) => line.plain);
        }
        if (locale === "ja") {
            const ja = localizedStationName(sid, station, "ja", "semantic");
            return [
                makeLine(ja || station.cn, "ja", "main"),
                makeLine(station.cn, "zh-Hans", "sub")
            ].filter((line) => line.plain);
        }

        const primary = localizedStationName(sid, station, locale, nameStyle);
        const other = localizedStationName(sid, station, locale, nameStyle === "translit" ? "semantic" : "translit");
        const lines = [];
        if (primary) lines.push(makeLine(primary, locale, "main"));
        if (nameStyle === "translit" && other && other !== primary) {
            // 音译为主的城市：意译名加括号，避免两行外文看起来像同一个名字
            lines.push(makeLine(`(${other})`, locale, "sub"));
        }
        // 中文原文固定占第三行：没有意译时不能顺次挤进 staen，
        // 否则 staen 的字号/字体与描边规则（按副名设计）会套在中文上
        if (station.cn) lines.push(makeLine(station.cn, "zh-Hans", "native"));
        return lines;
    }

    function stationName(sid, station) {
        const lines = labelLines(sid, station || getStation(sid));
        return lines.length ? lines[0].plain : "";
    }

    /**
     * 结果标题 / 行程步骤用的完整显示名。
     * 音译为主的城市把意译名一并带上（如「ZHONGJIE (Middle Street)」），
     * 只显示一行音译在外语环境下很难分辨是哪一站。
     */
    function stationDisplayName(sid, station) {
        const target = station || getStation(sid);
        const lines = labelLines(sid, target);
        if (!lines.length) return "";
        const primary = lines[0].plain;
        if (nameStyle === "translit" && locale !== "zh-Hans" && locale !== "zh-Hant") {
            const semantic = lines.slice(1).find((line) => line.lang === locale);
            if (semantic && semantic.plain.startsWith("(")) return `${primary} ${semantic.plain}`;
        }
        return primary;
    }

    function stationTitle(station, kind) {
        if (!station || !isTranslated) return "";
        const sid = station.id;
        const primary = stationName(sid, station);
        if (!primary) return "";
        if (locale === "zh-Hant") {
            const base = primary.endsWith("站") ? primary : primary + "站";
            if (kind === "tram") return base + "（輕軌站）";
            if (kind === "rail") return base + "（火車站）";
            return base;
        }
        if (locale === "en") {
            if (kind === "rail") return primary;
            if (kind === "tram") return primary + " (Tram)";
            if (/ (Station|Airport|Terminal)$/i.test(primary)) return primary;
            return primary + " Station";
        }
        return primary;
    }

    /**
     * 线路名：只查城市数据，不做任何模式生成。
     * 城市没有登记译名时原样返回，避免出现「Line 3 Branch」这种看似翻译、
     * 实际由正则猜出来的名称。
     */
    function lineName(name) {
        if (!name || !isTranslated) return name;
        const entry = cityConfig.lines && cityConfig.lines[name];
        if (!entry) return name;
        return entry[locale] || entry.en || name;
    }

    function poiName(hot) {
        if (!hot || !isTranslated) return hot ? hot.name : "";
        const item = hot.i18n && hot.i18n[locale];
        return (item && item.name) || hot.name || "";
    }

    function poiTag(hot) {
        if (!hot || !isTranslated) return hot ? hot.tag : "";
        const item = hot.i18n && hot.i18n[locale];
        return (item && item.tag) || hot.tag || "";
    }

    /* 设施名称翻译：只翻「设施名」，不翻后面的位置详情（如「站厅层 A、B 出入口」） */
    const FACILITY_NAMES = {
        "自动扶梯": { en: "Escalator", "zh-Hant": "自動扶梯" },
        "自动扶梯（上行）": { en: "Escalator (up)", "zh-Hant": "自動扶梯（上行）" },
        "自动扶梯（下行）": { en: "Escalator (down)", "zh-Hant": "自動扶梯（下行）" },
        "电梯": { en: "Elevator", "zh-Hant": "電梯" },
        "电梯（上行）": { en: "Elevator (up)", "zh-Hant": "電梯（上行）" },
        "电梯（下行）": { en: "Elevator (down)", "zh-Hant": "電梯（下行）" },
        "无障碍电梯": { en: "Accessible elevator", "zh-Hant": "無障礙電梯" },
        "楼梯": { en: "Stairs", "zh-Hant": "樓梯" },
        "步行梯": { en: "Stairs", "zh-Hant": "步行梯" },
        "升降平台": { en: "Lift platform", "zh-Hant": "升降平台" },
        "卫生间": { en: "Restroom", "zh-Hant": "衛生間" },
        "无障碍卫生间": { en: "Accessible restroom", "zh-Hant": "無障礙衛生間" },
        "母婴室": { en: "Nursing room", "zh-Hant": "母嬰室" },
        "AED": { en: "AED", "zh-Hant": "AED" },
        "自动售票机": { en: "Ticket machine", "zh-Hant": "自動售票機" },
        "充值机": { en: "Top-up machine", "zh-Hant": "充值機" },
        "客服中心": { en: "Customer service", "zh-Hant": "客服中心" },
        "乘客服务中心": { en: "Passenger service center", "zh-Hant": "乘客服務中心" },
        "车站层级图": { en: "Station level map", "zh-Hant": "車站層級圖" },
        "安检": { en: "Security check", "zh-Hant": "安檢" },
        "警务室": { en: "Police office", "zh-Hant": "警務室" },
        "站台": { en: "Platform", "zh-Hant": "月台" },
        "站厅": { en: "Concourse", "zh-Hant": "站廳" },
        "换乘通道": { en: "Transfer passage", "zh-Hant": "轉乘通道" },
        "地下通道": { en: "Underpass", "zh-Hant": "地下通道" },
        "天桥": { en: "Footbridge", "zh-Hant": "天橋" },
        "停车场": { en: "Parking", "zh-Hant": "停車場" },
        "出租车": { en: "Taxi", "zh-Hant": "計程車" },
        "公交": { en: "Bus", "zh-Hant": "公車" },
        "共享单车": { en: "Bike sharing", "zh-Hant": "共享單車" },
        "P+R": { en: "Park & Ride", "zh-Hant": "P+R" }
    };

    function facilityName(name) {
        if (!name || !isTranslated) return name || "";
        const key = String(name).trim();
        const hit = FACILITY_NAMES[key];
        if (hit) return hit[locale] || hit.en || key;
        const match = /^自动扶梯（(.+)）$/.exec(key);
        if (match) {
            const direction = match[1] === "上行" ? "up" : match[1] === "下行" ? "down" : match[1];
            return locale === "en" ? `Escalator (${direction})` : `自動扶梯（${match[1]}）`;
        }
        return name;
    }

    /* ── 站名 / 线路名文本替换表（只查表，不生成译名） ────────────────── */

    let stationTextMap = null;
    let lineTextMap = null;
    let hotspotTextMap = null;

    function buildStationTextMap() {
        const table = stationTable();
        const ids = Object.keys(table);
        if (!ids.length) return null;
        const map = {};
        ids.forEach((sid) => {
            const station = table[sid];
            if (!station || !station.cn) return;
            const primary = stationName(sid, station);
            if (primary && primary !== station.cn) map[station.cn] = primary;
        });
        stationTextMap = map;
        return map;
    }

    function buildLineTextMap() {
        const map = {};
        const lines = (cityConfig && cityConfig.lines) || {};
        Object.keys(lines).forEach((name) => {
            const entry = lines[name] || {};
            const value = entry[locale] || entry.en;
            if (value) map[name] = value;
        });
        lineTextMap = map;
        return map;
    }

    function buildHotspotTextMap() {
        const map = {};
        const list = Array.isArray(window.CGO_HOTSPOTS) ? window.CGO_HOTSPOTS : [];
        list.forEach((hot) => {
            if (!hot || !hot.name) return;
            const name = poiName(hot);
            if (name && name !== hot.name) map[hot.name] = name;
            const tag = poiTag(hot);
            if (tag && hot.tag && tag !== hot.tag) map[hot.tag] = tag;
        });
        hotspotTextMap = map;
        return map;
    }

    function translateText(text) {
        if (!text) return text;
        const direct = tr(text);
        if (direct !== text) return direct;
        const cityZh = cityConfig.city && cityConfig.city["zh-Hans"];
        if (cityZh && text === cityZh) {
            return cityConfig.city[locale] || cityConfig.city.en || text;
        }
        const stations = stationTextMap || buildStationTextMap();
        if (stations && stations[text] != null) return stations[text];
        const lines = lineTextMap || buildLineTextMap();
        if (lines && lines[text] != null) return lines[text];
        const hotspots = hotspotTextMap || buildHotspotTextMap();
        if (hotspots && hotspots[text] != null) return hotspots[text];
        return applyUiPattern(text);
    }

    /**
     * 界面句式格式化（只处理 UI 句子，绝不处理站名 / 地名 / 线路名）。
     * 地名一律走上面的查表；这里只覆盖「乘坐 N 站」「约 N 分钟」这类
     * 由共享层模块拼出来的显示句。
     */
    function applyUiPattern(text) {
        if (!isTranslated || !text) return text;
        if (locale === "en") {
            let m = /^开往\s*(.+)$/.exec(text);
            if (m) return "Toward " + translateText(m[1]);
            m = /^(\d+)\s*米$/.exec(text);
            if (m) return m[1] + " m";
            m = /^(\d+(?:\.\d+)?)\s*公里$/.exec(text);
            if (m) return m[1] + " km";
            m = /^(\d+)\s*处$/.exec(text);
            if (m) return m[1];
            m = /^(\d+)\s*条(\s*\(推荐\))?$/.exec(text);
            if (m) return m[1] + (m[1] === "1" ? " station" : " stations") + (m[2] ? " (recommended)" : "");
            m = /^出口\s*([A-Za-z0-9]+)$/.exec(text);
            if (m) return "Exit " + m[1];
            m = /^(\d+)\s*号口$/.exec(text);
            if (m) return "Exit " + m[1];
            m = /^([A-Za-z0-9]+)\s*口$/.exec(text);
            if (m) return "Exit " + m[1];
            m = /^可进站：(.+)$/.exec(text);
            if (m) return "Enter via: " + m[1];
            m = /^可出站：(.+)$/.exec(text);
            if (m) return "Exit via: " + m[1];
            m = /^本站暂无满足「(.+)」的进站口$/.exec(text);
            if (m) return "No entrance at this station meets \"" + translateText(m[1]) + "\"";
            m = /^本站暂无满足「(.+)」的出站口$/.exec(text);
            if (m) return "No exit at this station meets \"" + translateText(m[1]) + "\"";
            m = /^已选\s*([A-Za-z0-9]+)\s*口不满足「(.+)」，本站暂无替代口$/.exec(text);
            if (m) return "Exit " + m[1] + " does not meet \"" + translateText(m[2]) + "\" · No alternative at this station";
            m = /^已选\s*([A-Za-z0-9]+)\s*口不满足「(.+)」，推荐：(.+)$/.exec(text);
            if (m) return "Exit " + m[1] + " does not meet \"" + translateText(m[2]) + "\" · Recommended: " + m[3];
            m = /^推荐改用\s*([A-Za-z0-9]+)\s*口\s*·\s*设施：(.+)$/.exec(text);
            if (m) return "Recommended: Exit " + m[1] + " · Facilities: " + translateText(m[2]);
            m = /^该口(.+?)·\s*本站无替代口$/.exec(text);
            if (m) return "This exit " + translateText(m[1].trim()) + " · No alternative at this station";
            m = /^前往\s*(.+?)\s*换乘车站$/.exec(text);
            if (m) return "Go to " + translateText(m[1]) + " transfer station";
            m = /^前往\s*(.+)$/.exec(text);
            if (m) return "Go to " + translateText(m[1]);
            m = /^(.+?)（(\d+)米）$/.exec(text);
            if (m) return translateText(m[1]) + " (" + m[2] + " m)";
            m = /^(.+?)（([\d.]+)公里）$/.exec(text);
            if (m) return translateText(m[1]) + " (" + m[2] + " km)";
            m = /^（(\d+)米）$/.exec(text);
            if (m) return " (" + m[1] + " m)";
            m = /^乘坐\s*(\d+)\s*站$/.exec(text);
            if (m) return "Ride " + m[1] + " stops";
            m = /^约\s*(\d+)\s*分钟$/.exec(text);
            if (m) return "About " + m[1] + " min";
            m = /^票价\s*([\d.]+)\s*元$/.exec(text);
            if (m) return "Fare ¥" + m[1];
            m = /^(\d+)\s*次换乘$/.exec(text);
            if (m) return m[1] + " transfers";
            m = /^步行\s*(\d+)\s*分钟$/.exec(text);
            if (m) return "Walk " + m[1] + " min";
            m = /^(\d+)\s*站$/.exec(text);
            if (m) return m[1] + " stops";
            m = /^约\s*([\d.]+)\s*公里$/.exec(text);
            if (m) return "About " + m[1] + " km";
            m = /^约\s*(\d+)\s*米$/.exec(text);
            if (m) return "About " + m[1] + " m";
        }
        if (locale === "zh-Hant") {
            let m = /^开往\s*(.+)$/.exec(text);
            if (m) return "開往 " + translateText(m[1]);
            m = /^(\d+)\s*米$/.exec(text);
            if (m) return m[1] + " 公尺";
            m = /^(\d+(?:\.\d+)?)\s*公里$/.exec(text);
            if (m) return m[1] + " 公里";
            m = /^(\d+)\s*处$/.exec(text);
            if (m) return m[1] + " 處";
            m = /^(\d+)\s*条(\s*\(推荐\))?$/.exec(text);
            if (m) return m[1] + " 條" + (m[2] ? "（推薦）" : "");
            m = /^乘坐\s*(\d+)\s*站$/.exec(text);
            if (m) return "乘坐 " + m[1] + " 站";
            m = /^约\s*(\d+)\s*分钟$/.exec(text);
            if (m) return "約 " + m[1] + " 分鐘";
            m = /^票价\s*([\d.]+)\s*元$/.exec(text);
            if (m) return "票價 " + m[1] + " 元";
            m = /^(\d+)\s*次换乘$/.exec(text);
            if (m) return m[1] + " 次轉乘";
            m = /^步行\s*(\d+)\s*分钟$/.exec(text);
            if (m) return "步行 " + m[1] + " 分鐘";
            m = /^(\d+)\s*站$/.exec(text);
            if (m) return m[1] + " 站";
            m = /^约\s*([\d.]+)\s*公里$/.exec(text);
            if (m) return "約 " + m[1] + " 公里";
            m = /^约\s*(\d+)\s*米$/.exec(text);
            if (m) return "約 " + m[1] + " 公尺";
        }
        return text;
    }

    /* ── DOM 覆盖层 ─────────────────────────────────────────────────────── */

    const SKIP_SELECTOR = [
        "#labels-layer",
        "script",
        "style",
        "noscript",
        "textarea",
        "input",
        // 线路徽标本身不翻译：徽标里的文字是线路标识，不是界面文案
        ".text-badge",
        ".line-badge",
        ".svg-icon-placeholder",
        "[data-cgo-no-i18n]"
    ].join(",");

    /* 属性翻译不受 input / textarea 跳过规则影响：placeholder / aria-label 是界面文案，
       而它们的文本节点本来就不会被改写 */
    const ATTR_SKIP_SELECTOR = [
        "#labels-layer",
        "script",
        "style",
        ".text-badge",
        ".line-badge",
        ".svg-icon-placeholder",
        "[data-cgo-no-i18n]"
    ].join(",");

    function shouldSkip(node) {
        let el = node.nodeType === 1 ? node : node.parentElement;
        while (el) {
            if (el.matches && el.matches(SKIP_SELECTOR)) return true;
            el = el.parentElement;
        }
        return false;
    }

    function replaceTrimmed(raw, replacement) {
        if (replacement == null || replacement === raw) return raw;
        const trimmed = raw.trim();
        if (!trimmed) return raw;
        const start = raw.indexOf(trimmed);
        if (start < 0) return raw;
        return raw.slice(0, start) + replacement + raw.slice(start + trimmed.length);
    }

    function translateAttribute(el, name) {
        const value = el.getAttribute(name);
        if (!value) return;
        const trimmed = value.trim();
        if (!trimmed) return;
        const replacement = translateText(trimmed);
        if (replacement && replacement !== trimmed) {
            el.setAttribute(name, replaceTrimmed(value, replacement));
        }
    }

    /** 单个文本节点的就地翻译（高频组件同步走这里，不必等下一帧的全量扫描） */
    function translateNodeText(node) {
        if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
        if (shouldSkip(node)) return;
        const raw = node.nodeValue;
        const trimmed = raw.trim();
        const replacement = translateText(trimmed);
        if (replacement && replacement !== trimmed) {
            node.nodeValue = replaceTrimmed(raw, replacement);
        }
    }

    function translateDom(root) {
        if (!isTranslated || !root) return;
        const docRoot = root.nodeType === 9 ? root.documentElement : root;
        if (!docRoot) return;

        const walker = document.createTreeWalker(docRoot, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(translateNodeText);

        const attrSelector = "[title], [aria-label], [placeholder], [alt]";
        const attrEls = docRoot.querySelectorAll ? docRoot.querySelectorAll(attrSelector) : [];
        attrEls.forEach((el) => {
            if (el.closest && el.closest(ATTR_SKIP_SELECTOR)) return;
            ["title", "aria-label", "placeholder", "alt"].forEach((name) => translateAttribute(el, name));
        });
    }

    /* ── 地图标签 ───────────────────────────────────────────────────────── */

    /** 顶栏品牌、页面标题与读屏标题：城市名走城市数据，后缀走 UI 文案 */
    function applyShellText() {
        if (!isTranslated) return;
        const cityLabel = (cityConfig.city && (cityConfig.city[locale] || cityConfig.city.en)) || "";
        if (!cityLabel) return;
        const full = document.querySelector(".title-full");
        if (full) full.textContent = `${cityLabel} ${t("header.openMap")}`;
        const short = document.querySelector(".title-short");
        if (short) short.textContent = t("header.openMap");
        const heading = document.getElementById("page-heading");
        if (heading) heading.textContent = `CGo OpenMap ${cityLabel} ${t("header.pageHeading")}`;
        const panel = document.getElementById("info-panel");
        const panelOpen = panel && panel.style.display !== "none" && panel.dataset.cgoSid;
        if (!panelOpen) document.title = `CGo OpenMap - ${cityLabel} ${t("header.pageHeading")}`;
    }

    /**
     * cgo-toolbar-select 的当前值文本在 Shadow DOM 内，普通 TreeWalker 看不到。
     * 只遍历页面里少量下拉组件，成本可忽略；选择变更 / 打开设置时补一次。
     */
    function translateShadowSelects(root) {
        if (!isTranslated) return;
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll("cgo-toolbar-select").forEach((el) => {
            if (el.shadowRoot) translateDom(el.shadowRoot);
        });
    }

    function lineElement(label, index) {
        let el = label.querySelector(`[data-cgo-line="${index}"]`);
        if (el) return el;
        if (index === 0) el = label.querySelector(".stacn");
        if (index === 1) el = label.querySelector(".staen");
        if (index === 2) el = label.querySelector(".cgo-sta-third");
        if (!el) {
            el = document.createElement("span");
            el.className = index === 0 ? "stacn" : index === 1 ? "staen" : "cgo-sta-third";
            label.appendChild(el);
        }
        el.dataset.cgoLine = String(index);
        return el;
    }

    function baseScaleOf(el) {
        if (el.dataset.cgoBaseScale != null) {
            const cached = parseFloat(el.dataset.cgoBaseScale);
            return Number.isFinite(cached) ? cached : 1;
        }
        const match = /scaleX\(\s*([-\d.]+)\s*\)/.exec(el.style.transform || "");
        const value = match ? parseFloat(match[1]) : 1;
        const safe = Number.isFinite(value) ? value : 1;
        el.dataset.cgoBaseScale = String(safe);
        return safe;
    }

    function setLineContent(el, text) {
        if (/<br\s*\/?>/i.test(text)) {
            const html = escapeNameHtml(text);
            if (el.innerHTML !== html) el.innerHTML = html;
            return;
        }
        if (el.textContent !== text) el.textContent = text;
    }

    /**
     * 呼出标签（.label-callout）的底边框与引线都按元素矩形绘制，
     * 而 scaleX 只压缩字形、不改变布局宽度。它的行宽补偿见下面的 fitCalloutLine。
     */
    const isCalloutLabel = (el) => Boolean(el.closest && el.closest(".label-group.label-callout"));

    /**
     * 呼出标签的行宽补偿。
     *
     * 外文界面的呼出标签在 i18n.css 里改成了 flex 纵排，每行的 margin box 会作为一个整体
     * 参与交叉轴对齐。这里按缩放原点把左右负 margin 设成不对称值，让 margin box 恰好等于
     * 压缩后的视觉宽度：长行贴住底边框、短行在剩余空间里居中，边框与引线都是按元素矩形画的，
     * 因此一并收窄。
     *
     * 行宽用 max-content + offsetWidth 量：getBoundingClientRect 会被 #map-content 的视口
     * scale 放大，地图缩放后算出来的值会成倍偏差。
     */
    function fitCalloutLine(el, scale) {
        const label = el.closest && el.closest(".label-group.label-callout");
        const clear = () => {
            if (!el.dataset.cgoFit) return;
            el.style.width = "";
            el.style.marginLeft = "";
            el.style.marginRight = "";
            delete el.dataset.cgoFit;
        };
        if (!label || scale >= 0.999) {
            clear();
            return;
        }
        const key = `${el.textContent}|${scale.toFixed(3)}`;
        if (el.dataset.cgoFit === key && el.style.width) return;

        const previous = el.style.transform;
        el.style.transform = "none";                 // 量未压缩的排版宽度
        el.style.width = "max-content";
        el.style.marginLeft = "0";
        el.style.marginRight = "0";
        const layoutWidth = el.offsetWidth;
        el.style.transform = previous;
        if (!layoutWidth) return;

        // 负 margin 补齐被 scaleX 吃掉的宽度；怎么分取决于缩放原点
        const shrink = layoutWidth * (1 - scale);
        const origin = el.style.transformOrigin || "50% center";
        if (/^100%/.test(origin)) {
            el.style.marginLeft = `${-shrink}px`;
            el.style.marginRight = "0";
        } else if (/^0%/.test(origin)) {
            el.style.marginLeft = "0";
            el.style.marginRight = `${-shrink}px`;
        } else {
            el.style.marginLeft = `${(-shrink / 2).toFixed(2)}px`;
            el.style.marginRight = `${(-shrink / 2).toFixed(2)}px`;
        }
        el.dataset.cgoFit = key;
    }

    function applyLabel(label) {
        if (!label || !label.dataset || !label.dataset.sid) return;
        if (document.getElementById("map-content") &&
            document.getElementById("map-content").classList.contains("cgo-oh-stage")) {
            return; // 沿革演示中由演示层自行控制站名，避免把历史名翻成当前名
        }
        const sid = label.dataset.sid;
        const station = getStation(sid);
        if (!station) return;

        const lines = labelLines(sid, station);
        if (!lines.length) return;

        // 按语义落位，不按下标：外文界面没有意译时 staen 必须留空，
        // 中文原文落在第三行，才不会顶着副名的字号与描边规则挤进第二行
        let main = lines.find((line) => line.role === "main") || null;
        let native = lines.find((line) => line.role === "native") || null;
        const sub = lines.find((line) => line.role === "sub") || null;
        if (!main && native) {
            // 连外文主名都没有（城市未登记译名）：中文回到主行，避免同一行重复显示
            main = native;
            native = null;
        }
        if (!main) main = lines[0] || null;
        const slots = [
            { el: lineElement(label, 0), line: main },
            { el: lineElement(label, 1), line: sub },
            { el: lineElement(label, 2), line: native }
        ];
        const callout = isCalloutLabel(label);
        slots.forEach(({ el, line }) => {
            if (!line || !line.plain) {
                el.textContent = "";
                el.style.display = "none";
                if (el.dataset.cgoFit) {
                    el.style.width = "";
                    el.style.marginLeft = "";
                    el.style.marginRight = "";
                    delete el.dataset.cgoFit;
                }
                return;
            }
            el.style.display = "";
            setLineContent(el, line.text);
            el.setAttribute("lang", line.lang);

            if (locale === "zh-Hant" || locale === "ja") {
                return;
            }

            const foreign = line.lang !== "zh-Hans";
            el.dataset.cgoForeign = foreign ? "1" : "0";
            const base = baseScaleOf(el);
            // Arimo 没有 condensed 字面：外文行统一横向压到 80%；
            // 呼出标签再用负 margin 把布局外框收到视觉宽（见 fitCalloutLine）
            const scale = foreign ? base * 0.8 : base;
            el.style.transformOrigin = el.style.transformOrigin || "50% center";
            el.style.transform = (Math.abs(scale - 1) < 0.001) ? "" : `scaleX(${scale})`;
            if (callout) fitCalloutLine(el, scale);
        });

        const spoken = lines.map((line) => line.plain).join(" ");
        label.setAttribute("aria-label", station.type === "no" ? `${spoken} (${t("station.notOpen")})` : spoken);
        const node = document.getElementById(`node_${sid}`);
        if (node) {
            node.setAttribute("aria-label", station.type === "no" ? `${spoken} (${t("station.notOpen")})` : spoken);
        }
    }

    function applyLabels(root) {
        if (!isTranslated) return;
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll("#labels-layer .label-group[data-sid]").forEach(applyLabel);
    }

    /* ── 车站面板标题 ───────────────────────────────────────────────────── */

    function applyStationPanel(panel, sid) {
        if (!isTranslated || !panel || !sid) return;
        const station = getStation(sid);
        if (!station) return;
        const lines = labelLines(sid, station);
        if (!lines.length) return;

        const cnEl = panel.querySelector(".panel-cn-name");
        const enEl = panel.querySelector(".panel-en-name");
        const isCalligraphy = cnEl && cnEl.classList.contains("sy-calligraphy-title");

        if (cnEl && !isCalligraphy) {
            // 这里写进去的已经是目标语言的显示名，别再让覆盖层按站名表翻一次
            cnEl.setAttribute("data-cgo-no-i18n", "1");
            cnEl.innerHTML = escapeNameHtml(lines[0].text);
            cnEl.setAttribute("lang", lines[0].lang);
        } else if (cnEl && isCalligraphy) {
            // 题字图保留原字形，但把读屏文本与 aria 换成当前语言的主行名
            cnEl.setAttribute("aria-label", lines[0].plain);
        }

        if (enEl) {
            // 副行常只有一个中文站名（意译被注释掉时），若不屏蔽覆盖层，
            // 「大南门」会被站名表翻成主行「DANANMEN」，与主行重复且丢掉原文
            enEl.setAttribute("data-cgo-no-i18n", "1");
            const rest = lines.slice(1).filter((line) => line.plain);
            // 非中文界面：副行至少要留下中文原文，方便对照报站与现场导视。
            // 有些站没有登记意译名（data_i18n 里被注释掉），此时 rest 只剩中文；
            // 若连中文都没有（外文主行回退成了中文），这里补一次，避免副行整块消失。
            if (locale !== "zh-Hans" && locale !== "zh-Hant" && station.cn
                && !rest.some((line) => line.lang === "zh-Hans" || line.lang === "zh-Hant")) {
                rest.push(makeLine(station.cn, "zh-Hans"));
            }
            enEl.innerHTML = escapeNameHtml(rest.map((line) => line.text).join(" · "));
            enEl.setAttribute("lang", rest[0] ? rest[0].lang : lines[0].lang);
            enEl.hidden = rest.length === 0;
        }

        panel.setAttribute("aria-label", `${lines[0].plain} · ${t("panel.stationInfo")}`);
        if (document.title) document.title = `${lines[0].plain} · ${t("panel.detail")}`;
    }

    /* ── 搜索结果 ───────────────────────────────────────────────────────── */

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function applySearchResults(root) {
        if (!isTranslated) return;
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll("#search-results-list .search-item[data-sid]").forEach((item) => {
            const sid = item.dataset.sid;
            const station = getStation(sid);
            const textEl = item.querySelector(".search-item-text");
            if (!station || !textEl) return;
            // 副行可能只有一个中文站名，屏蔽覆盖层以免它再被翻成主行
            textEl.setAttribute("data-cgo-no-i18n", "1");
            const lines = labelLines(sid, station);
            if (!lines.length) return;
            const primary = lines[0];
            const rest = lines.slice(1).filter((line) => line.plain).map((line) => line.plain);
            let html = `<span lang="${primary.lang}">${escapeHtml(primary.plain)}</span>`;
            if (rest.length) {
                html += ` <span class="cgo-search-secondary">${escapeHtml(rest.join(" · "))}</span>`;
            }
            if (station.type === "no") {
                html += ` <span class="cgo-search-pending">(${escapeHtml(t("station.notOpenShort"))})</span>`;
            }
            if (textEl.innerHTML !== html) textEl.innerHTML = html;
        });
    }

    /* ── 搜索别名：多语言名都能搜到 ────────────────────────────────────── */

    let aliasTimer = 0;

    function allNamesOf(sid, station) {
        const names = [];
        const push = (value) => {
            const text = clean(value);
            if (text && names.indexOf(text) < 0) names.push(text);
        };
        push(station.cn);
        push(station.en);
        const entry = (cityConfig.stations && cityConfig.stations[sid]) || null;
        if (entry) {
            Object.keys(entry).forEach((lang) => {
                const value = entry[lang];
                if (typeof value === "string") push(value);
                else if (value && typeof value === "object") {
                    push(value.primary);
                    push(value.semantic);
                    push(value.translit);
                }
            });
        }
        return names;
    }

    function installSearchAliases() {
        if (!isTranslated) return;
        const table = window.processedStations;
        if (!table || !Object.keys(table).length) {
            if (aliasTimer < 40) {
                aliasTimer += 1;
                window.setTimeout(installSearchAliases, 100);
            }
            return;
        }
        Object.keys(table).forEach((sid) => {
            const station = table[sid];
            if (!station) return;
            const current = Array.isArray(station.aliases) ? station.aliases : [];
            allNamesOf(sid, station).forEach((name) => {
                if (current.indexOf(name) < 0) current.push(name);
            });
            station.aliases = current;
        });
        // core 的 loadStationAliases() 可能稍后才用 CSV 覆盖 aliases，补一次
        window.setTimeout(() => {
            const late = window.processedStations;
            if (!late) return;
            Object.keys(late).forEach((sid) => {
                const station = late[sid];
                if (!station) return;
                const current = Array.isArray(station.aliases) ? station.aliases : [];
                allNamesOf(sid, station).forEach((name) => {
                    if (current.indexOf(name) < 0) current.push(name);
                });
                station.aliases = current;
            });
        }, 1200);
    }

    /* ── 车站信息板锚点：把当前 sid 写到面板上，供标题改写使用 ─────────── */

    function registerStationBoardAnchor() {
        const board = window.StationBoard;
        if (!board || typeof board.registerModule !== "function") return;
        board.registerModule({
            id: "cgo-i18n-anchor",
            name: "多语言锚点",
            slot: "header",
            order: 999,
            render() { return ""; },
            onMounted(_container, context) {
                const panel = document.getElementById("info-panel");
                const sid = context && context.station && context.station.id;
                if (panel && sid) {
                    panel.dataset.cgoSid = sid;
                    applyStationPanel(panel, sid);
                }
            }
        });
    }

    /* ── 观察与调度 ─────────────────────────────────────────────────────── */

    let frameId = 0;
    let running = false;

    function applyAll() {
        if (running) return;
        running = true;
        try {
            translateDom(document.body);
            applyLabels(document);
            applySearchResults(document);
            const panel = document.getElementById("info-panel");
            if (panel && panel.dataset && panel.dataset.cgoSid) {
                applyStationPanel(panel, panel.dataset.cgoSid);
            }
        } finally {
            running = false;
        }
    }

    function schedule() {
        if (frameId) return;
        frameId = window.requestAnimationFrame(() => {
            frameId = 0;
            applyAll();
        });
    }

    /**
     * core 的 updateShareMeta() 会直接把业务主键写进 document.title
     * （选站时 `${station.cn}站详细信息`，取消选中时恢复页面原始中文标题）。
     * 这两个入口都在 core 内部，不改 core 就只能盯住 <title> 做一次显示层纠正。
     */
    function watchDocumentTitle() {
        if (!isTranslated) return;
        const titleEl = document.querySelector("title");
        if (!titleEl) return;
        new MutationObserver(() => {
            const raw = titleEl.textContent || "";
            const matched = /^(.+)站详细信息$/.exec(raw);
            if (matched) {
                const sid = findSidByCn(matched[1]);
                const station = sid ? getStation(sid) : null;
                const name = station ? stationDisplayName(sid, station) : matched[1];
                titleEl.textContent = `${name} · ${t("panel.detail")}`;
                return;
            }
            const zhCity = cityConfig.city && cityConfig.city["zh-Hans"];
            const cityLabel = cityConfig.city && (cityConfig.city[locale] || cityConfig.city.en);
            if (zhCity && cityLabel && raw.indexOf(zhCity) >= 0) {
                titleEl.textContent = `CGo OpenMap - ${cityLabel} ${t("header.pageHeading")}`;
            }
        }).observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    function installObserver() {
        const observer = new MutationObserver((mutations) => {
            if (!mutations.length) return;
            let needsFull = false;
            mutations.forEach((mutation) => {
                if (mutation.type === "characterData") {
                    // 文本就地翻译：悬停读数、倒计时这类高频组件每帧都在改文字，
                    // 若等到下一帧再全量扫描，看到的永远是上一帧的内容。
                    // 翻译结果再触发一轮本回调时已不含中文，不会被再次改写。
                    translateNodeText(mutation.target);
                    return;
                }
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) translateDom(node);
                    else if (node.nodeType === 3) translateNodeText(node);
                });
                if (mutation.addedNodes.length || mutation.removedNodes.length) needsFull = true;
            });
            // 全量那趟还要负责标签、搜索结果与面板标题，结构变了仍补一次
            if (needsFull) schedule();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        schedule();
    }

    /* ── 样式注入与启动 ─────────────────────────────────────────────────── */

    function injectStyle() {
        const script = document.currentScript || Array.prototype.find.call(document.scripts, (item) => {
            return item.src && item.src.indexOf("/i18n.js") >= 0;
        });
        if (!script || !script.src) return;
        // 把脚本的 ?v= 版本串一并带到 CSS，否则 Service Worker 会一直命中旧样式表
        const href = script.src.replace(/i18n\.js(\?|$)/, "i18n.css$1");
        if (document.querySelector(`link[data-cgo-i18n-style="1"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.cgoI18nStyle = "1";
        document.head.appendChild(link);
    }

    /**
     * 语言标签按 BCP 47 解析，但大小写与分隔符都放宽：
     * ?lang=zh-Hant / zh-hant / ZH_HANT / zh-Hant-TW 都按繁体处理。
     */
    function normalizeLocale(tag) {
        if (!tag) return "";
        const lower = String(tag).trim().toLowerCase().replace(/_/g, "-");
        if (lower.startsWith("zh-hant") || lower === "zh-tw" || lower === "zh-hk" || lower === "zh-mo") {
            return "zh-Hant";
        }
        if (lower.startsWith("zh-hans") || lower === "zh" || lower === "zh-cn"
            || lower === "zh-sg" || lower === "zh-my") {
            return "zh-Hans";
        }
        if (lower.startsWith("en")) return "en";
        if (ALIASES[lower]) return ALIASES[lower];
        return "";
    }

    const api = {
        locale,
        nameStyle,
        isTranslated,
        isChinese: locale === "zh-Hans" || locale === "zh-Hant",
        t,
        tr,
        translateDom,
        stationName,
        stationDisplayName,
        plainName,
        stationTitle,
        labelLines,
        lineName,
        poiName,
        poiTag,
        facilityName,
        applyStationPanel,
        applyAll,
        schedule
    };
    window.CGoI18n = api;

    document.documentElement.setAttribute("data-cgo-lang", locale);
    document.documentElement.lang = locale;

    injectStyle();
    registerStationBoardAnchor();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            if (!isTranslated) return;
            installObserver();
            watchDocumentTitle();
            installSearchAliases();
            applyShellText();
            window.setTimeout(applyShellText, 600);
        }, { once: true });
    } else if (isTranslated) {
        installObserver();
        watchDocumentTitle();
        installSearchAliases();
        applyShellText();
        window.setTimeout(applyShellText, 600);
    }

    if (isTranslated) {
        window.setTimeout(() => translateShadowSelects(document), 800);
        document.addEventListener("cgo-change", () => {
            window.setTimeout(() => translateShadowSelects(document), 0);
        }, true);
        document.addEventListener("click", (event) => {
            if (event.target && event.target.closest && event.target.closest("#settings-btn")) {
                window.setTimeout(() => translateShadowSelects(document), 120);
            }
        }, true);
    }
})();

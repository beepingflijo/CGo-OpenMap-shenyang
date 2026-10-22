/**
 * CGo OpenMap - 沈阳多语言名称数据 (city/shenyang/data_i18n.js)
 *
 * 口径
 * - 车站以稳定 ID 为键，不修改 data_stations.js 的 cn / en 业务主键；
 * - zh-Hant 由 OpenCC 一次性简→繁转换生成，运行时不带转换器；
 * - en.translit 沿用 data_stations.js 的既有拼音；
 * - en.semantic 为首版意译：后缀（街 / 路 / 公园 / 广场 / 大学 / 中心…）翻成英文，
 *   专名优先用人工表，其次用构词表，未知专名回退拼音；全部待按报站视频复核；
 * - 线路名逐条显式登记，运行时不做「N号线 → Line N」之类的模式生成。
 */
window.CGO_CITY_I18N = window.CGO_CITY_I18N || {};
window.CGO_CITY_I18N["shenyang"] = {
  "nameStyle": "translit",
  "city": {
    "zh-Hans": "沈阳",
    "en": "Shenyang",
    "zh-Hant": "瀋陽"
  },
  "stations": {
    "1001": {
      "zh-Hant": "丁香湖",
      "en": {
        "translit": "DINGXIANGHU",
        "semantic": "Dingxiang Lake"
      }
    },
    "1002": {
      "zh-Hant": "元江街",
      "en": {
        "translit": "YUANJIANGJIE",
        "semantic": "Yuanjiang Street"
      }
    },
    "1003": {
      "zh-Hant": "向工街",
      "en": {
        "translit": "XIANGGONGJIE",
        "semantic": "Xianggong Street"
      }
    },
    "1004": {
      "zh-Hant": "塔灣街",
      "en": {
        "translit": "TAWANJIE",
        "semantic": "Tawan Street"
      }
    },
    "1006": {
      "zh-Hant": "百鳥公園",
      "en": {
        "translit": "BAINIAOGONGYUAN",
        "semantic": "Bainiao Park"
      }
    },
    "1007": {
      "zh-Hant": "長江街",
      "en": {
        "translit": "CHANGJIANGJIE",
        "semantic": "Changjiang Street"
      }
    },
    "1009": {
      "zh-Hant": "陵東街",
      "en": {
        "translit": "LINGDONGJIE",
        "semantic": "Lingdong Street"
      }
    },
    "1010": {
      "zh-Hant": "北塔",
      "en": {
        "translit": "BEITA",
        "semantic": "North Pagoda"
      }
    },
    "1011": {
      "zh-Hant": "合作街",
      "en": {
        "translit": "HEZUOJIE",
        "semantic": "Hezuo Street"
      }
    },
    "1012": {
      "zh-Hant": "東北大馬路",
      "en": {
        "translit": "DONGBEIDAMALU",
        "semantic": "Dongbei Avenue"
      }
    },
    "1014": {
      "zh-Hant": "長安路",
      "en": {
        "translit": "CHANG'ANLU",
        "semantic": "Chang'an Road"
      }
    },
    "1015": {
      "zh-Hant": "萬蓮",
      "en": {
        "translit": "WANLIAN",
        //"semantic": "Wanlian"
      }
    },
    "1016": {
      "zh-Hant": "泉園",
      "en": {
        "translit": "QUANYUAN",
        //"semantic": "Quanyuan"
      }
    },
    "1017": {
      "zh-Hant": "江東街",
      "en": {
        "translit": "JIANGDONGJIE",
        "semantic": "Jiangdong Street"
      }
    },
    "1018": {
      "zh-Hant": "長青橋",
      "en": {
        "translit": "CHANGQINGQIAO",
        "semantic": "Changqing Bridge"
      }
    },
    "1020": {
      "zh-Hant": "理工大學",
      "en": {
        "translit": "LIGONGDAXUE",
        "semantic": "Ligong University"
      }
    },
    "1021": {
      "zh-Hant": "張沙布",
      "en": {
        "translit": "ZHANGSHABU",
        //"semantic": "Zhangshabu"
      }
    },
    "1022": {
      "zh-Hant": "營城子",
      "en": {
        "translit": "YINGCHENGZI",
        //"semantic": "Yingchengzi"
      }
    },
    "1023": {
      "zh-Hant": "桑林子",
      "en": {
        "translit": "SANGLINZI",
        //"semantic": "Sanglinzi"
      }
    },
    "1024": {
      "zh-Hant": "營城子南",
      "en": {
        "translit": "YINGCHENGZINAN",
        "semantic": "Yingchengzi South"
      }
    },
    "1025": {
      "zh-Hant": "沈本二街",
      "en": {
        "translit": "SHENBENERJIE",
        "semantic": "Shenben Second Street"
      }
    },
    "1026": {
      "zh-Hant": "莫子山公園",
      "en": {
        "translit": "MOZISHANGONGYUAN",
        "semantic": "Mozishan Park"
      }
    },
    "1027": {
      "zh-Hant": "桃仙街",
      "en": {
        "translit": "TAOXIANJIE",
        "semantic": "Taoxian Street"
      }
    },
    "1028": {
      "zh-Hant": "創新一路",
      "en": {
        "translit": "CHUANGXINYILU",
        "semantic": "Chuangxin First Road"
      }
    },
    "1029": {
      "zh-Hant": "智慧大街",
      "en": {
        "translit": "ZHIHUIDAJIE",
        "semantic": "Zhihui Avenue"
      }
    },
    "1030": {
      "zh-Hant": "白塔二街",
      "en": {
        "translit": "BAITAERJIE",
        "semantic": "Baita Second Street"
      }
    },
    "1031": {
      "zh-Hant": "白塔街",
      "en": {
        "translit": "BAITAJIE",
        "semantic": "Baita Street"
      }
    },
    "1032": {
      "zh-Hant": "瀋陽南站",
      "en": {
        "translit": "SHENYANGNANZHAN",
        "semantic": "Shenyangnan Rwy. Sta."
      }
    },
    "1033": {
      "zh-Hant": "體育學院",
      "en": {
        "translit": "TIYUXUEYUAN",
        "semantic": "Sport University"
      }
    },
    "1034": {
      "zh-Hant": "國展中心",
      "en": {
        "translit": "GUOZHANZHONGXIN",
        "semantic": "International Exhibition Center"
      }
    },
    "1036": {
      "zh-Hant": "丁香街",
      "en": {
        "translit": "DINGXIANGJIE",
        "semantic": "Dingxiang Street"
      }
    },
    "0101": {
      "zh-Hant": "十三號街",
      "en": {
        "translit": "SHISANHAOJIE",
        "semantic": "13th Street"
      }
    },
    "0102": {
      "zh-Hant": "中央大街",
      "en": {
        "translit": "ZHONGYANGDAJIE",
        "semantic": "Central Avenue"
      }
    },
    "0103": {
      "zh-Hant": "七號街",
      "en": {
        "translit": "QIHAOJIE",
        "semantic": "7th Street"
      }
    },
    "0104": {
      "zh-Hant": "四號街",
      "en": {
        "translit": "SIHAOJIE",
        "semantic": "4th Street"
      }
    },
    "0105": {
      "zh-Hant": "張士",
      "en": {
        "translit": "ZHANGSHI",
        //"semantic": "Zhangshi"
      }
    },
    "0106": {
      "zh-Hant": "開發大道",
      "en": {
        "translit": "KAIFADADAO",
        "semantic": "Kaifa Avenue"
      }
    },
    "0107": {
      "zh-Hant": "于洪廣場",
      "en": {
        "translit": "YUHONGGUANGCHANG",
        "semantic": "Yuhong Square"
      }
    },
    "0108": {
      "zh-Hant": "迎賓路",
      "en": {
        "translit": "YINGBINLU",
        "semantic": "Yingbin Road"
      }
    },
    "0109": {
      "zh-Hant": "重工街",
      "en": {
        "translit": "ZHONGGONGJIE",
        "semantic": "Zhonggong Street"
      }
    },
    "0110": {
      "zh-Hant": "啟工街",
      "en": {
        "translit": "QIGONGJIE",
        "semantic": "Qigong Street"
      }
    },
    "0111": {
      "zh-Hant": "保工街",
      "en": {
        "translit": "BAOGONGJIE",
        "semantic": "Baogong Street"
      }
    },
    "0112": {
      "zh-Hant": "鐵西廣場",
      "en": {
        "translit": "TIEXIGUANGCHANG",
        "semantic": "Tiexi Square"
      }
    },
    "0113": {
      "zh-Hant": "雲峰北街",
      "en": {
        "translit": "YUNFENGBEIJIE",
        "semantic": "Yunfeng North Street"
      }
    },
    "0114": {
      "zh-Hant": "瀋陽站",
      "en": {
        "translit": "SHENYANGZHAN",
        "semantic": "Shenyang Rwy. Sta."
      }
    },
    "0115": {
      "zh-Hant": "太原街",
      "en": {
        "translit": "TAIYUANJIE",
        "semantic": "Taiyuan Street"
      }
    },
    "0116": {
      "zh-Hant": "南市場",
      "en": {
        "translit": "NANSHICHANG",
        "semantic": "South Market"
      }
    },
    "0117": {
      "zh-Hant": "青年大街",
      "en": {
        "translit": "QINGNIANDAJIE",
        "semantic": "Qingnian Avenue"
      }
    },
    "0118": {
      "zh-Hant": "懷遠門",
      "en": {
        "translit": "HUAIYUANMEN",
        //"semantic": "Huaiyuan Gate"
      }
    },
    "0119": {
      "zh-Hant": "中街",
      "en": {
        "translit": "ZHONGJIE",
        "semantic": "Middle Street"
      }
    },
    "0120": {
      "zh-Hant": "東中街",
      "en": {
        "translit": "DONGZHONGJIE",
        "semantic": "East Middle Street"
      }
    },
    "0121": {
      "zh-Hant": "滂江街",
      "en": {
        "translit": "PANGJIANGJIE",
        "semantic": "Pangjiang Street"
      }
    },
    "0122": {
      "zh-Hant": "黎明廣場",
      "en": {
        "translit": "LIMINGGUANGCHANG",
        "semantic": "Liming Square"
      }
    },
    "0123": {
      "zh-Hant": "新惠街",
      "en": {
        "translit": "XINHUIJIE",
        "semantic": "Xinhui Street"
      }
    },
    "0124": {
      "zh-Hant": "新寧街",
      "en": {
        "translit": "XINNINGJIE",
        "semantic": "Xinning Street"
      }
    },
    "0125": {
      "zh-Hant": "東大營街",
      "en": {
        "translit": "DONGDAYINGJIE",
        "semantic": "Dongdaying Street"
      }
    },
    "0126": {
      "zh-Hant": "農業大學",
      "en": {
        "translit": "NONGYEDAXUE",
        "semantic": "Agricultural University"
      }
    },
    "0127": {
      "zh-Hant": "前陵",
      "en": {
        "translit": "QIANLING",
        //"semantic": "Qianling"
      }
    },
    "0128": {
      "zh-Hant": "東陵公園",
      "en": {
        "translit": "DONGLINGGONGYUAN",
        "semantic": "Dongling Park"
      }
    },
    "0129": {
      "zh-Hant": "水泉",
      "en": {
        "translit": "SHUIQUAN",
        //"semantic": "Shuiquan"
      }
    },
    "0130": {
      "zh-Hant": "伯官北大街",
      "en": {
        "translit": "BOGUANBEIDAJIE",
        "semantic": "Boguan North Avenue"
      }
    },
    "0131": {
      "zh-Hant": "植物園",
      "en": {
        "translit": "ZHIWUYUAN",
        "semantic": "Botanical Garden"
      }
    },
    "0132": {
      "zh-Hant": "雙馬",
      "en": {
        "translit": "SHUANGMA",
        //"semantic": "Shuangma"
      }
    },
    "0257": {
      "zh-Hant": "蒲田路",
      "en": {
        "translit": "PUTIANLU",
        "semantic": "Putian Road"
      }
    },
    "0256": {
      "zh-Hant": "蒲河路",
      "en": {
        "translit": "PUHELU",
        "semantic": "Puhe Road"
      }
    },
    "0255": {
      "zh-Hant": "人傑湖公園",
      "en": {
        "translit": "RENJIEHUGONGYUAN",
        "semantic": "Renjiehu Park"
      }
    },
    "0254": {
      "zh-Hant": "遼寧大學",
      "en": {
        "translit": "LIAONINGDAXUE",
        "semantic": "Liaoning University"
      }
    },
    "0253": {
      "zh-Hant": "航空航天大學",
      "en": {
        "translit": "HANGKONGHANGTIANDAXUE",
        "semantic": "Aerospace University"
      }
    },
    "0252": {
      "zh-Hant": "師範大學",
      "en": {
        "translit": "SHIFANDAXUE",
        "semantic": "Normal University"
      }
    },
    "0251": {
      "zh-Hant": "醫學院",
      "en": {
        "translit": "YIXUEYUAN",
        "semantic": "Medical College"
      }
    },
    "0201": {
      "zh-Hant": "三臺子",
      "en": {
        "translit": "SANTAIZI",
        //"semantic": "Santaizi"
      }
    },
    "0202": {
      "zh-Hant": "陵西",
      "en": {
        "translit": "LINGXI",
        //"semantic": "Lingxi"
      }
    },
    "0203": {
      "zh-Hant": "新樂遺址",
      "en": {
        "translit": "XINLEYIZHI",
        "semantic": "Xinle Site"
      }
    },
    "0204": {
      "zh-Hant": "北陵公園",
      "en": {
        "translit": "BEILINGGONGYUAN",
        "semantic": "Beiling Park"
      }
    },
    "0205": {
      "zh-Hant": "中醫藥大學",
      "en": {
        "translit": "ZHONGYIYAODAXUE",
        "semantic": "University of Traditional <br>Chinese Medicine"
      }
    },
    "0206": {
      "zh-Hant": "岐山路",
      "en": {
        "translit": "QISHANLU",
        "semantic": "Qishan Road"
      }
    },
    "0207": {
      "zh-Hant": "瀋陽北站",
      "en": {
        "translit": "SHENYANGBEIZHAN",
        "semantic": "Shenyangbei Rwy. Sta."
      }
    },
    "0208": {
      "zh-Hant": "金融中心",
      "en": {
        "translit": "JINRONGZHONGXIN",
        "semantic": "Financial Center"
      }
    },
    "0209": {
      "zh-Hant": "人民廣場",
      "en": {
        "translit": "RENMINGUANGCHANG",
        "semantic": "People's Square"
      }
    },
    "0211": {
      "zh-Hant": "青年公園",
      "en": {
        "translit": "QINGNIANGONGYUAN",
        "semantic": "Youth Park"
      }
    },
    "0212": {
      "zh-Hant": "工業展覽館",
      "en": {
        "translit": "GONGYEZHANLANGUAN",
        "semantic": "Industrial Exhibition Center"
      }
    },
    "0213": {
      "zh-Hant": "市圖書館",
      "en": {
        "translit": "SHITUSHUGUAN",
        "semantic": "Shenyang Library"
      }
    },
    "0214": {
      "zh-Hant": "五里河",
      "en": {
        "translit": "WULIHE",
        //"semantic": "Wulihe"
      }
    },
    "0215": {
      "zh-Hant": "奧體中心",
      "en": {
        "translit": "AOTIZHONGXIN",
        "semantic": "Olympic Sports Center"
      }
    },
    "0216": {
      "zh-Hant": "營盤街",
      "en": {
        "translit": "YINGPANJIE",
        "semantic": "Yingpan Street"
      }
    },
    "0217": {
      "zh-Hant": "世紀大廈",
      "en": {
        "translit": "SHIJIDASHA",
        "semantic": "Century Mansion"
      }
    },
    "0218": {
      "zh-Hant": "白塔河路",
      "en": {
        "translit": "BAITAHELU",
        "semantic": "Baitahe Road"
      }
    },
    "0219": {
      "zh-Hant": "全運路",
      "en": {
        "translit": "QUANYUNLU",
        "semantic": "Quanyun Road"
      }
    },
    "0220": {
      "zh-Hant": "沈本大街",
      "en": {
        "translit": "SHENBENDAJIE",
        "semantic": "Shenben Avenue"
      }
    },
    "0221": {
      "zh-Hant": "沈中大街",
      "en": {
        "translit": "SHENZHONGDAJIE",
        "semantic": "Shenzhong Avenue"
      }
    },
    "0222": {
      "zh-Hant": "省博物館",
      "en": {
        "translit": "SHENGBOWUGUAN",
        "semantic": "Provincial Museum"
      }
    },
    "0223": {
      "zh-Hant": "中央公園",
      "en": {
        "translit": "ZHONGYANGGONGYUAN",
        "semantic": "Central Park"
      }
    },
    "0224": {
      "zh-Hant": "創新一路",
      "en": {
        "translit": "CHUANGXINYILU",
        "semantic": "Chuangxin First Road"
      }
    },
    "0225": {
      "zh-Hant": "綜合保稅區",
      "en": {
        "translit": "ZONGHEBAOSHUIQU",
        "semantic": "Comprehensive Bonded Zone"
      }
    },
    "0226": {
      "zh-Hant": "桃仙機場",
      "en": {
        "translit": "TAOXIANJICHANG",
        "semantic": "Taoxian Airport"
      }
    },
    "0901": {
      "zh-Hant": "怒江公園",
      "en": {
        "translit": "NUJIANGGONGYUAN",
        "semantic": "Nujiang Park"
      }
    },
    "0902": {
      "zh-Hant": "淮河街沈醫二院",
      "en": {
        "translit": "HUAIHEJIESHENYIERYUAN",
        "semantic": "Huaihe Street"
      }
    },
    "0903": {
      "zh-Hant": "皇姑屯站",
      "en": {
        "translit": "HUANGGUTUNZHAN",
        //"semantic": "Huanggutun Rwy. Sta."
      }
    },
    "0904": {
      "zh-Hant": "重型文化廣場",
      "en": {
        "translit": "ZHONGXINGWENHUAGUANGCHANG",
        "semantic": "Heavy Industry Culture Square"
      }
    },
    "0905": {
      "zh-Hant": "北二路",
      "en": {
        "translit": "BEIERLU",
        "semantic": "Bei'er Road"
      }
    },
    "0907": {
      "zh-Hant": "興華公園",
      "en": {
        "translit": "XINGHUAGONGYUAN",
        "semantic": "Xinghua Park"
      }
    },
    "0908": {
      "zh-Hant": "沈遼路",
      "en": {
        "translit": "SHENLIAOLU",
        "semantic": "Shenliao Road"
      }
    },
    "0909": {
      "zh-Hant": "滑翔",
      "en": {
        "translit": "HUAXIANG",
        //"semantic": "Huaxiang"
      }
    },
    "0910": {
      "zh-Hant": "吉力湖街",
      "en": {
        "translit": "JILIHUJIE",
        "semantic": "Jilihu Street"
      }
    },
    "0911": {
      "zh-Hant": "大通湖街",
      "en": {
        "translit": "DATONGHUJIE",
        "semantic": "Datonghu Street"
      }
    },
    "0912": {
      "zh-Hant": "曹仲",
      "en": {
        "translit": "CAOZHONG",
        //"semantic": "Caozhong"
      }
    },
    "0913": {
      "zh-Hant": "渾河站",
      "en": {
        "translit": "HUNHEZHAN",
        //"semantic": "Hunhe Rwy. Sta."
      }
    },
    "0914": {
      "zh-Hant": "勝利南街",
      "en": {
        "translit": "SHENGLINANJIE",
        "semantic": "Shengli South Street"
      }
    },
    "0915": {
      "zh-Hant": "長白南",
      "en": {
        "translit": "CHANGBAINAN",
        "semantic": "Changbai South"
      }
    },
    "0916": {
      "zh-Hant": "榆樹臺",
      "en": {
        "translit": "YUSHUTAI",
        //"semantic": "Yushutai"
      }
    },
    "0917": {
      "zh-Hant": "金陽大街",
      "en": {
        "translit": "JINYANGDAJIE",
        "semantic": "Jinyang Avenue"
      }
    },
    "0918": {
      "zh-Hant": "彩霞街",
      "en": {
        "translit": "CAIXIAJIE",
        "semantic": "Caixia Street"
      }
    },
    "0920": {
      "zh-Hant": "天成街",
      "en": {
        "translit": "TIANCHENGJIE",
        "semantic": "Tiancheng Street"
      }
    },
    "0921": {
      "zh-Hant": "朗日街",
      "en": {
        "translit": "LANGRIJIE",
        "semantic": "Langri Street"
      }
    },
    "0922": {
      "zh-Hant": "長青南街",
      "en": {
        "translit": "CHANGQINGNANJIE",
        "semantic": "Changqing South Street"
      }
    },
    "0923": {
      "zh-Hant": "建築大學",
      "en": {
        "translit": "JIANZHUDAXUE",
        "semantic": "Jianzhu University"
      }
    },
    "0924": {
      "zh-Hant": "楊官",
      "en": {
        "translit": "YANGGUAN",
        //"semantic": "Yangguan"
      }
    },
    "0925": {
      "zh-Hant": "祝科街",
      "en": {
        "translit": "ZHUKEJIE",
        "semantic": "Zhuke Street"
      }
    },
    "0926": {
      "zh-Hant": "王家灣",
      "en": {
        "translit": "WANGJIAWAN",
        "semantic": "Wangjiawan"
      }
    },
    "0927": {
      "zh-Hant": "國公寨大街",
      "en": {
        "translit": "GUOGONGZHAIDAJIE",
        "semantic": "Guogongzhai Avenue"
      }
    },
    "0928": {
      "zh-Hant": "石廟子",
      "en": {
        "translit": "SHIMIAOZI",
        //"semantic": "Shimiaozi"
      }
    },
    "0401": {
      "zh-Hant": "正新路",
      "en": {
        "translit": "ZHENGXINLU",
        "semantic": "Zhengxin Road"
      }
    },
    "0402": {
      "zh-Hant": "文官街",
      "en": {
        "translit": "WENGUANJIE",
        "semantic": "Wenguan Street"
      }
    },
    "0403": {
      "zh-Hant": "望花",
      "en": {
        "translit": "WANGHUA",
        //"semantic": "Wanghua"
      }
    },
    "0404": {
      "zh-Hant": "觀泉路",
      "en": {
        "translit": "GUANQUANLU",
        "semantic": "Guanquan Road"
      }
    },
    "0405": {
      "zh-Hant": "北大營",
      "en": {
        "translit": "BEIDAYING",
        //"semantic": "Beidaying"
      }
    },
    "0407": {
      "zh-Hant": "洮昌街",
      "en": {
        "translit": "TAOCHANGJIE",
        "semantic": "Taochang Street"
      }
    },
    "0408": {
      "zh-Hant": "瀋陽大學",
      "en": {
        "translit": "SHENYANGDAXUE",
        "semantic": "Shenyang University"
      }
    },
    "0410": {
      "zh-Hant": "皇寺路",
      "en": {
        "translit": "HUANGSILU",
        "semantic": "Huangsi Road"
      }
    },
    "0411": {
      "zh-Hant": "市府大路",
      "en": {
        "translit": "SHIFUDALU",
        "semantic": "Shifu Avenue"
      }
    },
    "0413": {
      "zh-Hant": "南五馬路",
      "en": {
        "translit": "NANWUMALU",
        "semantic": "Nanwu Road"
      }
    },
    "0414": {
      "zh-Hant": "砂陽",
      "en": {
        "translit": "SHAYANG",
        //"semantic": "Shayang"
      }
    },
    "0415": {
      "zh-Hant": "南京橋",
      "en": {
        "translit": "NANJINGQIAO",
        "semantic": "Nanjing Bridge"
      }
    },
    "0416": {
      "zh-Hant": "長白島",
      "en": {
        "translit": "CHANGBAIDAO",
        //"semantic": "Changbai Island"
      }
    },
    "0418": {
      "zh-Hant": "金倉路",
      "en": {
        "translit": "JINCANGLU",
        "semantic": "Jincang Road"
      }
    },
    "0419": {
      "zh-Hant": "雲杉路",
      "en": {
        "translit": "YUNSHANLU",
        "semantic": "Yunshan Road"
      }
    },
    "0420": {
      "zh-Hant": "紅椿路",
      "en": {
        "translit": "HONGCHUNLU",
        "semantic": "Hongchun Road"
      }
    },
    "0421": {
      "zh-Hant": "城建學院",
      "en": {
        "translit": "CHENGJIANXUEYUAN",
        "semantic": "Urban Construction University"
      }
    },
    "0422": {
      "zh-Hant": "瀋陽南站",
      "en": {
        "translit": "SHENYANGNANZHAN",
        "semantic": "Shenyangnan Rwy. Sta."
      }
    },
    "0423": {
      "zh-Hant": "創新路",
      "en": {
        "translit": "CHUANGXINLU",
        "semantic": "Chuangxin Road"
      }
    },
    "0301": {
      "zh-Hant": "李達",
      "en": {
        "translit": "LIDA",
        //"semantic": "Lida"
      }
    },
    "0302": {
      "zh-Hant": "鐵西汽車工廠",
      "en": {
        "translit": "TIEXIQICHEGONGCHANG",
        "semantic": "Tiexi Auto Factory"
      }
    },
    "0303": {
      "zh-Hant": "馬貝",
      "en": {
        "translit": "MABEI",
        //"semantic": "Mabei"
      }
    },
    "0304": {
      "zh-Hant": "中德大街",
      "en": {
        "translit": "ZHONGDEDAJIE",
        "semantic": "Sino-German Avenue"
      }
    },
    "0305": {
      "zh-Hant": "細河悠谷",
      "en": {
        "translit": "XIHEYOUGU",
        //"semantic": "Xiheyougu"
      }
    },
    "0306": {
      "zh-Hant": "翟家",
      "en": {
        "translit": "ZHAIJIA",
        //"semantic": "Zhaijia"
      }
    },
    "0307": {
      "zh-Hant": "工業大學",
      "en": {
        "translit": "GONGYEDAXUE",
        "semantic": "Industrial University"
      }
    },
    "0308": {
      "zh-Hant": "寧官",
      "en": {
        "translit": "NINGGUAN",
        //"semantic": "Ningguan"
      }
    },
    "0309": {
      "zh-Hant": "余良",
      "en": {
        "translit": "YULIANG",
        //"semantic": "Yuliang"
      }
    },
    "0310": {
      "zh-Hant": "甘官",
      "en": {
        "translit": "GANGUAN",
        //"semantic": "Ganguan"
      }
    },
    "0311": {
      "zh-Hant": "千島湖街",
      "en": {
        "translit": "QIANDAOHUJIE",
        "semantic": "Qiandaohu Street"
      }
    },
    "0312": {
      "zh-Hant": "南陽湖街",
      "en": {
        "translit": "NANYANGHUJIE",
        "semantic": "Nanyanghu Street"
      }
    },
    "0314": {
      "zh-Hant": "南李官",
      "en": {
        "translit": "NANLIGUAN",
        //"semantic": "Nanliguan"
      }
    },
    "0315": {
      "zh-Hant": "凌空",
      "en": {
        "translit": "LINGKONG",
        //"semantic": "Lingkong"
      }
    },
    "0317": {
      "zh-Hant": "南八馬路",
      "en": {
        "translit": "NANBAMALU",
        "semantic": "Nanba Road"
      }
    },
    "0318": {
      "zh-Hant": "嘉興街",
      "en": {
        "translit": "JIAXINGJIE",
        "semantic": "Jiaxing Street"
      }
    },
    "0319": {
      "zh-Hant": "方型廣場",
      "en": {
        "translit": "FANGXINGGUANGCHANG",
        "semantic": "Fangxing Square"
      }
    },
    "0320": {
      "zh-Hant": "三好街",
      "en": {
        "translit": "SANHAOJIE",
        "semantic": "Sanhao Street"
      }
    },
    "0322": {
      "zh-Hant": "中科院金屬所",
      "en": {
        "translit": "ZHONGKEYUANJINSHUSUO",
        "semantic": "Institute of Metal Research, CAS"
      }
    },
    "0323": {
      "zh-Hant": "南塔",
      "en": {
        "translit": "NANTA",
        "semantic": "South Pagoda"
      }
    },
    "0324": {
      "zh-Hant": "文富路",
      "en": {
        "translit": "WENFULU",
        "semantic": "Wenfu Road"
      }
    },
    "0325": {
      "zh-Hant": "富民街",
      "en": {
        "translit": "FUMINJIE",
        "semantic": "Fumin Street"
      }
    },
    "0327": {
      "zh-Hant": "方家欄",
      "en": {
        "translit": "FANGJIALAN",
        //"semantic": "Fangjialan"
      }
    },
    "0601": {
      "zh-Hant": "鴨綠江北街",
      "en": {
        "translit": "YALUJIANGBEIJIE",
        "semantic": "Yalujiang North Street"
      }
    },
    "0602": {
      "zh-Hant": "文儲路",
      "en": {
        "translit": "WENCHULU",
        "semantic": "Wenchu Road"
      }
    },
    "0603": {
      "zh-Hant": "觀音路",
      "en": {
        "translit": "GUANYINLU",
        "semantic": "Guanyin Road"
      }
    },
    "0604": {
      "zh-Hant": "西窯",
      "en": {
        "translit": "XIYAO",
        //"semantic": "Xiyao"
      }
    },
    "0605": {
      "zh-Hant": "金山北路",
      "en": {
        "translit": "JINSHANBEILU",
        "semantic": "Jinshan North Road"
      }
    },
    "0606": {
      "zh-Hant": "英雄公園",
      "en": {
        "translit": "YINGXIONGGONGYUAN",
        "semantic": "Heroes' Park"
      }
    },
    "0607": {
      "zh-Hant": "鐵山路",
      "en": {
        "translit": "TIESHANLU",
        "semantic": "Tieshan Road"
      }
    },
    "0608": {
      "zh-Hant": "北塔",
      "en": {
        "translit": "BEITA",
        "semantic": "North Pagoda"
      }
    },
    "0609": {
      "zh-Hant": "瀋陽大學",
      "en": {
        "translit": "SHENYANGDAXUE",
        "semantic": "Shenyang University"
      }
    },
    "0610": {
      "zh-Hant": "中街",
      "en": {
        "translit": "ZHONGJIE",
        "semantic": "Middle Street"
      }
    },
    "0611": {
      "zh-Hant": "大南門",
      "en": {
        "translit": "DANANMEN",
        //"semantic": "Great South Gate"
      }
    },
    "0612": {
      "zh-Hant": "市婦嬰醫院",
      "en": {
        "translit": "SHIFUYINGYIYUAN",
        "semantic": "Shenyang Women's and <br>Children's Hospital"
      }
    },
    "0613": {
      "zh-Hant": "大南邊門",
      "en": {
        "translit": "DANANBIANMEN",
        //"semantic": "Great South Side Gate"
      }
    },
    "0614": {
      "zh-Hant": "南塔",
      "en": {
        "translit": "NANTA",
        "semantic": "South Pagoda"
      }
    },
    "0615": {
      "zh-Hant": "文萃路",
      "en": {
        "translit": "WENCUILU",
        "semantic": "Wencui Road"
      }
    },
    "0616": {
      "zh-Hant": "市圖書館",
      "en": {
        "translit": "SHITUSHUGUAN",
        "semantic": "Shenyang Library"
      }
    },
    "0617": {
      "zh-Hant": "三好橋",
      "en": {
        "translit": "SANHAOQIAO",
        "semantic": "Sanhao Bridge"
      }
    },
    "0618": {
      "zh-Hant": "南堤西路",
      "en": {
        "translit": "NANDIXILU",
        "semantic": "Nandi West Road"
      }
    },
    "0619": {
      "zh-Hant": "長白島",
      "en": {
        "translit": "CHANGBAIDAO",
        //"semantic": "Changbai Island"
      }
    },
    "0620": {
      "zh-Hant": "馬總",
      "en": {
        "translit": "MAZONG",
        //"semantic": "Mazong"
      }
    },
    "0621": {
      "zh-Hant": "競賽",
      "en": {
        "translit": "JINGSAI",
        //"semantic": "Jingsai"
      }
    },
    "0622": {
      "zh-Hant": "渾河站",
      "en": {
        "translit": "HUNHEZHAN",
        //"semantic": "Hunhe Rwy. Sta."
      }
    },
    "0623": {
      "zh-Hant": "族興路",
      "en": {
        "translit": "ZUXINGLU",
        "semantic": "Zuxing Road"
      }
    },
    "0624": {
      "zh-Hant": "下河灣",
      "en": {
        "translit": "XIAHEWAN",
        //"semantic": "Xiahewan"
      }
    },
    "0625": {
      "zh-Hant": "滿融",
      "en": {
        "translit": "MANRONG",
        //"semantic": "Manrong"
      }
    },
    "0626": {
      "zh-Hant": "高樓子",
      "en": {
        "translit": "GAOLOUZI",
        //"semantic": "Gaolouzi"
      }
    },
    "0627": {
      "zh-Hant": "葵松路",
      "en": {
        "translit": "KUISONGLU",
        "semantic": "Kuisong Road"
      }
    },
    "0628": {
      "zh-Hant": "雪松路",
      "en": {
        "translit": "XUESONGLU",
        "semantic": "Xuesong Road"
      }
    },
    "0629": {
      "zh-Hant": "沙柳路",
      "en": {
        "translit": "SHALIULU",
        "semantic": "Shaliu Road"
      }
    },
    "T501": {
      "zh-Hant": "奧體中心",
      "en": {
        "semantic": "Olympic Center"
      }
    },
    "T502": {
      "zh-Hant": "瀋陽海關",
      "en": {
        "semantic": "Shenyang Customs"
      }
    },
    "T503": {
      "zh-Hant": "金水花城",
      "en": {
        "semantic": "Jinshuihuacheng"
      }
    },
    "T504": {
      "zh-Hant": "奧體游泳館",
      "en": {
        "semantic": "Olympic Aquatic Stadium"
      }
    },
    "T505": {
      "zh-Hant": "行政服務中心",
      "en": {
        "semantic": "Administrative<br> Service Center"
      }
    },
    "T506": {
      "zh-Hant": "渾南圖書館",
      "en": {
        "semantic": "Hunnan Library"
      }
    },
    "T507": {
      "zh-Hant": "陸軍總院",
      "en": {
        "semantic": "Lujun Hospital"
      }
    },
    "T508": {
      "zh-Hant": "渾南實驗小學",
      "en": {
        "semantic": "Hunnan Experimental<br> Primary School"
      }
    },
    "T509": {
      "zh-Hant": "萬科新里程",
      "en": {
        "semantic": "Wanke Everest Town"
      }
    },
    "T510": {
      "zh-Hant": "建築大學",
      "en": {
        "semantic": "Jianzhu University"
      }
    },
    "T511": {
      "zh-Hant": "金地濱河國際",
      "en": {
        "semantic": "Riverine Paradise"
      }
    },
    "T512": {
      "zh-Hant": "綜合保稅區",
      "en": {
        "semantic": "Free Trade Zone"
      }
    },
    "T513": {
      "zh-Hant": "萬科新城",
      "en": {
        "semantic": "Wanke New City"
      }
    },
    "T514": {
      "zh-Hant": "渾南實驗中學",
      "en": {
        "semantic": "Hunnan Experimental<br> Middle School"
      }
    },
    "T515": {
      "zh-Hant": "李巴彥",
      "en": {
        "semantic": "Libayan"
      }
    },
    "T516": {
      "zh-Hant": "楊官",
      "en": {
        "semantic": "Yangguan"
      }
    },
    "T517": {
      "zh-Hant": "溫馨港灣",
      "en": {
        "semantic": "Wenxingangwan"
      }
    },
    "T518": {
      "zh-Hant": "金地藝境",
      "en": {
        "semantic": "Brown Stone"
      }
    },
    "T519": {
      "zh-Hant": "東北冷鮮港",
      "en": {
        "semantic": "Yidu Distribution Center"
      }
    },
    "T520": {
      "zh-Hant": "天潔華爾街",
      "en": {
        "semantic": "Tianjie Wall Street"
      }
    },
    "T521": {
      "zh-Hant": "汪家馨城",
      "en": {
        "semantic": "Wangjiaxincheng"
      }
    },
    "T522": {
      "zh-Hant": "人民文化公園",
      "en": {
        "semantic": "Renminwenhuagongyuan"
      }
    },
    "T523": {
      "zh-Hant": "伯官",
      "en": {
        "semantic": "Boguan"
      }
    },
    "T524": {
      "zh-Hant": "上伯官",
      "en": {
        "semantic": "Shangboguan"
      }
    },
    "T525": {
      "zh-Hant": "玄菟郡遺址公園",
      "en": {
        "semantic": "Xuantujunyizhigongyuan"
      }
    },
    "T526": {
      "zh-Hant": "規劃館",
      "en": {
        "semantic": "Guihuaguan"
      }
    },
    "T527": {
      "zh-Hant": "中金公元啟城",
      "en": {
        "semantic": "Zhongjingongyuanqicheng"
      }
    },
    "T528": {
      "zh-Hant": "匯置城",
      "en": {
        "semantic": "Huizhicheng"
      }
    },
    "T529": {
      "zh-Hant": "李石寨",
      "en": {
        "semantic": "Lishizhai"
      }
    },
    "SYT": {
      "zh-Hant": "瀋陽站",
      "en": {
        "translit": "Shenyang Rwy. Sta.",
        "semantic": "Shenyang Rwy. Sta."
      }
    },
    "SBT": {
      "zh-Hant": "瀋陽北站",
      "en": {
        "translit": "Shenyangbei Rwy. Sta.",
        "semantic": "Shenyang North Rwy. Sta."
      }
    },
    "SOT": {
      "zh-Hant": "瀋陽南站",
      "en": {
        "translit": "Shenyangnan Rwy. Sta.",
        "semantic": "Shenyang South Rwy. Sta."
      }
    }
  },
  "lines": {
    "中国铁路": {
      "en": "China Railway",
      "zh-Hant": "中國鐵路"
    },
    "1号线": {
      "en": "Line 1",
      "zh-Hant": "1號線"
    },
    "2号线": {
      "en": "Line 2",
      "zh-Hant": "2號線"
    },
    "3号线": {
      "en": "Line 3",
      "zh-Hant": "3號線"
    },
    "4号线": {
      "en": "Line 4",
      "zh-Hant": "4號線"
    },
    "6号线": {
      "en": "Line 6",
      "zh-Hant": "6號線"
    },
    "9号线": {
      "en": "Line 9",
      "zh-Hant": "9號線"
    },
    "10号线": {
      "en": "Line 10",
      "zh-Hant": "10號線"
    },
    "有轨5号线": {
      "en": "Tram Line 5",
      "zh-Hant": "有軌5號線"
    },
    "5号线": {
      "en": "Tram Line 5",
      "zh-Hant": "5號線"
    }
  }
};

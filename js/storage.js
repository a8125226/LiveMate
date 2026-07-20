const STORAGE_PREFIX = "livemate_";

const STORAGE_KEYS = {
    lives: `${STORAGE_PREFIX}lives`,
    selectedLiveId: `${STORAGE_PREFIX}selected_live_id`,
    checklist: `${STORAGE_PREFIX}checklist`,
    budget: `${STORAGE_PREFIX}budget`,
    goods: `${STORAGE_PREFIX}goods`,
    timelines: `${STORAGE_PREFIX}timelines`,
    venueData: `${STORAGE_PREFIX}venue_data`,
    setlists: `${STORAGE_PREFIX}setlists`,
    diaries: `${STORAGE_PREFIX}diaries`,
    vlogClips: `${STORAGE_PREFIX}vlog_clips`
};

/* ==================================================
   1. 読み込み
================================================== */
function loadData(key, defaultValue = null) {

    try {

        const savedData = localStorage.getItem(key);

        if (savedData === null) {
            return defaultValue;
        }

        return JSON.parse(savedData);

    } catch (error) {

        console.error(
            `LocalStorageの読み込みに失敗しました: ${key}`,
            error
        );

        return defaultValue;

    }

}

/* ==================================================
   2. 保存
================================================== */
function saveData(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            `LocalStorageの保存に失敗しました: ${key}`,
            error
        );

        if (
            error.name === "QuotaExceededError" ||
            error.name === "NS_ERROR_DOM_QUOTA_REACHED"
        ) {

            alert(
                "保存できるデータ容量を超えました。\n" +
                "写真や動画の数を減らしてから、もう一度お試しください。"
            );

        }

        return false;

    }

}

/* ==================================================
   3. データ削除
================================================== */
function removeData(key) {

    try {

        localStorage.removeItem(key);

        return true;

    } catch (error) {

        console.error(
            `LocalStorageの削除に失敗しました: ${key}`,
            error
        );

        return false;

    }

}

/* ==================================================
   4. 配列データへの追加
================================================== */
function appendData(key, item) {

    const currentData = loadData(key, []);

    const list = Array.isArray(currentData)
        ? currentData
        : [];

    list.push(item);

    saveData(key, list);

    return list;

}

/* ==================================================
   5. IDを使った更新
================================================== */
function updateDataById(
    key,
    id,
    updatedItem,
    idField = "id"
) {

    const currentData = loadData(key, []);

    if (!Array.isArray(currentData)) {
        return [];
    }

    const updatedList = currentData.map(item => {

        if (String(item[idField]) === String(id)) {

            return {
                ...item,
                ...updatedItem
            };

        }

        return item;

    });

    saveData(key, updatedList);

    return updatedList;

}

/* ==================================================
   6. IDを使った削除
================================================== */
function deleteDataById(
    key,
    id,
    idField = "id"
) {

    const currentData = loadData(key, []);

    if (!Array.isArray(currentData)) {
        return [];
    }

    const updatedList = currentData.filter(
        item => String(item[idField]) !== String(id)
    );

    saveData(key, updatedList);

    return updatedList;

}

/* ==================================================
   7. IDを使った検索
================================================== */
function findDataById(
    key,
    id,
    idField = "id"
) {

    const currentData = loadData(key, []);

    if (!Array.isArray(currentData)) {
        return null;
    }

    return (
        currentData.find(
            item => String(item[idField]) === String(id)
        ) || null
    );

}

/* ==================================================
   8. ID生成
================================================== */
function generateId(prefix = "item") {

    const randomPart = Math.random()
        .toString(36)
        .slice(2, 9);

    return `${prefix}_${Date.now()}_${randomPart}`;

}

/* ==================================================
   9. 選択中ライブID
================================================== */
function getSelectedLiveId() {

    return localStorage.getItem(
        STORAGE_KEYS.selectedLiveId
    );

}

function setSelectedLiveId(liveId) {

    if (
        liveId === null ||
        liveId === undefined ||
        liveId === ""
    ) {

        removeData(STORAGE_KEYS.selectedLiveId);

        return;

    }

    localStorage.setItem(
        STORAGE_KEYS.selectedLiveId,
        String(liveId)
    );

}


/* ==================================================
   10. ライブ別の保存キー
================================================== */
function getLiveStorageKey(baseKey, liveId = getSelectedLiveId()) {

    if (!liveId) {
        return baseKey;
    }

    return `${baseKey}__${String(liveId)}`;

}

function loadLiveData(baseKey, defaultValue = null) {

    const scopedKey = getLiveStorageKey(baseKey);

    if (scopedKey === baseKey) {
        return defaultValue;
    }

    const scopedValue = loadData(scopedKey, undefined);

    if (scopedValue !== undefined) {
        return scopedValue;
    }

    /* 旧版の共通データは、最初に開いたライブへ一度だけ移行 */
    const migrationKey = `${baseKey}__migration_completed`;
    const migrationCompleted = loadData(migrationKey, false);

    if (!migrationCompleted) {

        const legacyValue = loadData(baseKey, undefined);

        if (legacyValue !== undefined) {
            saveData(scopedKey, legacyValue);
            saveData(migrationKey, true);
            return legacyValue;
        }

        saveData(migrationKey, true);

    }

    return defaultValue;

}

function saveLiveData(baseKey, value) {

    const selectedLiveId = getSelectedLiveId();

    if (!selectedLiveId) {
        return false;
    }

    return saveData(
        getLiveStorageKey(baseKey, selectedLiveId),
        value
    );

}

function removeLiveData(baseKey) {

    const selectedLiveId = getSelectedLiveId();

    if (!selectedLiveId) {
        return false;
    }

    return removeData(
        getLiveStorageKey(baseKey, selectedLiveId)
    );

}

/* ==================================================
   10. ライブ一覧
================================================== */
function getLives() {

    const lives = loadData(
        STORAGE_KEYS.lives,
        []
    );

    return Array.isArray(lives)
        ? lives
        : [];

}

function saveLives(lives) {

    return saveData(
        STORAGE_KEYS.lives,
        Array.isArray(lives) ? lives : []
    );

}

function getSelectedLive() {

    const selectedLiveId = getSelectedLiveId();

    const lives = getLives();

    if (lives.length === 0) {
        return null;
    }

    if (selectedLiveId) {

        const selectedLive = lives.find(
            live => String(live.id) === String(selectedLiveId)
        );

        if (selectedLive) {
            return selectedLive;
        }

    }

    const sortedLives = [...lives].sort(
        (a, b) => getLiveDateTime(a) - getLiveDateTime(b)
    );

    const now = new Date();

    const upcomingLive = sortedLives.find(
        live => getLiveDateTime(live) >= now
    );

    const fallbackLive = upcomingLive || sortedLives[0];

    if (fallbackLive) {
        setSelectedLiveId(fallbackLive.id);
    }

    return fallbackLive || null;

}

/* ==================================================
   11. 日時処理
================================================== */
function getLiveDateTime(live) {

    if (!live || !live.date) {

        return new Date(0);

    }

    const time = live.startTime || "00:00";

    const dateTime = new Date(
        `${live.date}T${time}:00`
    );

    if (Number.isNaN(dateTime.getTime())) {

        return new Date(0);

    }

    return dateTime;

}

function getLiveOpenDateTime(live) {

    if (!live || !live.date) {

        return new Date(0);

    }

    const time = live.openTime || "00:00";

    const dateTime = new Date(
        `${live.date}T${time}:00`
    );

    if (Number.isNaN(dateTime.getTime())) {

        return new Date(0);

    }

    return dateTime;

}

function isLiveFinished(live) {

    return getLiveDateTime(live) < new Date();

}

function getUpcomingLives() {

    const now = new Date();

    return getLives()
        .filter(live => getLiveDateTime(live) >= now)
        .sort(
            (a, b) =>
                getLiveDateTime(a) -
                getLiveDateTime(b)
        );

}

function getPastLives() {

    const now = new Date();

    return getLives()
        .filter(live => getLiveDateTime(live) < now)
        .sort(
            (a, b) =>
                getLiveDateTime(b) -
                getLiveDateTime(a)
        );

}

/* ==================================================
   12. 日付表示
================================================== */
function formatDateJapanese(dateText) {

    if (!dateText) {
        return "未登録";
    }

    const date = new Date(
        `${dateText}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return dateText;
    }

    return new Intl.DateTimeFormat(
        "ja-JP",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "short"
        }
    ).format(date);

}

function formatDateSlash(dateText) {

    if (!dateText) {
        return "----/--/--";
    }

    const [year, month, day] =
        dateText.split("-");

    if (!year || !month || !day) {
        return dateText;
    }

    return `${year}/${month}/${day}`;

}

function formatCurrency(value) {

    const number = Number(value) || 0;

    return `${number.toLocaleString("ja-JP")}円`;

}

/* ==================================================
   13. 数値変換
================================================== */
function toSafeNumber(value) {

    const number = Number(value);

    if (
        Number.isNaN(number) ||
        !Number.isFinite(number)
    ) {

        return 0;

    }

    return Math.max(0, number);

}

/* ==================================================
   14. 画像をData URLへ変換
================================================== */
function fileToDataUrl(file) {

    return new Promise(
        (resolve, reject) => {

            if (!file) {

                resolve("");

                return;

            }

            const reader = new FileReader();

            reader.addEventListener(
                "load",
                () => resolve(reader.result)
            );

            reader.addEventListener(
                "error",
                () => reject(
                    new Error(
                        "ファイルの読み込みに失敗しました。"
                    )
                )
            );

            reader.readAsDataURL(file);

        }
    );

}

/* ==================================================
   15. 写真サイズ確認
================================================== */
function validateImageFile(
    file,
    maxSizeMb = 1.5
) {

    if (!file) {

        return {
            valid: true,
            message: ""
        };

    }

    if (!file.type.startsWith("image/")) {

        return {
            valid: false,
            message:
                "画像ファイルを選択してください。"
        };

    }

    const maxBytes =
        maxSizeMb * 1024 * 1024;

    if (file.size > maxBytes) {

        return {
            valid: false,
            message:
                `画像サイズは${maxSizeMb}MB以下にしてください。`
        };

    }

    return {
        valid: true,
        message: ""
    };

}

/* ==================================================
   16. 文字列のHTMLエスケープ
================================================== */
function escapeHtml(value) {

    const text = String(value ?? "");

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

/* ==================================================
   17. 初期データ
================================================== */
const DEFAULT_CHECKLIST_ITEMS = [
    "チケット",
    "身分証明書",
    "モバイルバッテリー",
    "財布",
    "うちわ",
    "ペンライト",
    "双眼鏡",
    "アクリルスタンド"
];

const DEFAULT_BUDGET = {
    total: 0,
    ticket: 0,
    goods: 0,
    transport: 0,
    hotel: 0,
    food: 0,
    other: 0,
    updatedAt: null
};

function initializeStorage() {

    const checklist =
        loadData(
            STORAGE_KEYS.checklist,
            null
        );

    if (!Array.isArray(checklist)) {

        const initialChecklist =
            DEFAULT_CHECKLIST_ITEMS.map(
                name => ({
                    id: generateId("check"),
                    name,
                    checked: false
                })
            );

        saveData(
            STORAGE_KEYS.checklist,
            initialChecklist
        );

    }

    const budget =
        loadData(
            STORAGE_KEYS.budget,
            null
        );

    if (
        budget === null ||
        typeof budget !== "object" ||
        Array.isArray(budget)
    ) {

        saveData(
            STORAGE_KEYS.budget,
            DEFAULT_BUDGET
        );

    }

    const arrayKeys = [
        STORAGE_KEYS.lives,
        STORAGE_KEYS.goods,
        STORAGE_KEYS.timelines,
        STORAGE_KEYS.setlists,
        STORAGE_KEYS.diaries,
        STORAGE_KEYS.vlogClips
    ];

    arrayKeys.forEach(key => {

        const value = loadData(key, null);

        if (!Array.isArray(value)) {

            saveData(key, []);

        }

    });

    const venueData =
        loadData(
            STORAGE_KEYS.venueData,
            null
        );

    if (
        venueData === null ||
        typeof venueData !== "object" ||
        Array.isArray(venueData)
    ) {

        saveData(
            STORAGE_KEYS.venueData,
            {}
        );

    }

}

/* ==================================================
   18. 全データ初期化
================================================== */
function resetAllLiveMateData() {

    Object.values(STORAGE_KEYS)
        .forEach(key => {

            if (
                key !==
                STORAGE_KEYS.selectedLiveId
            ) {

                removeData(key);

            }

        });

    removeData(
        STORAGE_KEYS.selectedLiveId
    );

    initializeStorage();

}

/* ==================================================
   19. 初期化実行
================================================== */
initializeStorage();
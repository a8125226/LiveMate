let countdownTimer = null;

/* ==================================================
   1. 時間差を計算
================================================== */
function getCountdownData(live) {

    if (!live) {

        return {
            main: "--",
            sub: "ライブ未登録",
            header: "--",
            finished: false
        };

    }

    const now = new Date();

    const startDateTime =
        getLiveDateTime(live);

    const openDateTime =
        getLiveOpenDateTime(live);

    const startDiff =
        startDateTime.getTime() -
        now.getTime();

    const openDiff =
        openDateTime.getTime() -
        now.getTime();

    const oneMinute = 1000 * 60;
    const oneHour = oneMinute * 60;
    const oneDay = oneHour * 24;

    /* ライブ終了後 */

    if (startDiff < -oneHour * 4) {

        return {
            main: "ライブ終了",
            sub: "素敵な思い出を日記に残しましょう",
            header: "終了",
            finished: true
        };

    }

    /* 開演後 */

    if (startDiff <= 0) {

        return {
            main: "公演中",
            sub: "ライブを楽しんでください！",
            header: "公演中",
            finished: false
        };

    }

    /* 開演まで24時間以上 */

    if (startDiff >= oneDay) {

        const days =
            Math.ceil(
                startDiff / oneDay
            );

        return {
            main: `あと${days}日`,
            sub:
                `${formatDateJapanese(live.date)} 開演`,
            header: `${days}日`,
            finished: false
        };

    }

    /* 当日で開場前 */

    if (openDiff > 0) {

        const hours =
            Math.floor(
                openDiff / oneHour
            );

        const minutes =
            Math.floor(
                (openDiff % oneHour) /
                oneMinute
            );

        if (hours >= 1) {

            return {
                main:
                    `開場まで ${hours}時間${minutes}分`,
                sub:
                    `開演 ${live.startTime || "--:--"}`,
                header:
                    `${hours}時間`,
                finished: false
            };

        }

        return {
            main:
                `開場まで ${Math.max(1, minutes)}分`,
            sub:
                `開演 ${live.startTime || "--:--"}`,
            header:
                `${Math.max(1, minutes)}分`,
            finished: false
        };

    }

    /* 開場後から開演前 */

    const startHours =
        Math.floor(
            startDiff / oneHour
        );

    const startMinutes =
        Math.floor(
            (startDiff % oneHour) /
            oneMinute
        );

    if (startHours >= 1) {

        return {
            main:
                `開演まで ${startHours}時間${startMinutes}分`,
            sub:
                "入場・座席確認を済ませましょう",
            header:
                `${startHours}時間`,
            finished: false
        };

    }

    if (startMinutes <= 10) {

        return {
            main: "まもなく開演",
            sub:
                `あと${Math.max(1, startMinutes)}分です`,
            header:
                `${Math.max(1, startMinutes)}分`,
            finished: false
        };

    }

    return {
        main:
            `開演まで ${startMinutes}分`,
        sub:
            "入場・座席確認を済ませましょう",
        header:
            `${startMinutes}分`,
        finished: false
    };

}

/* ==================================================
   2. ホーム画面の表示更新
================================================== */
function renderMainCountdown() {

    const selectedLive =
        getSelectedLive();

    const countdownData =
        getCountdownData(
            selectedLive
        );

    const mainElement =
        document.getElementById(
            "mainCountdown"
        );

    if (!mainElement) {
        return;
    }

    mainElement.innerHTML = `
        <span class="countdown-primary-text">
            ${escapeHtml(countdownData.main)}
        </span>

        <small class="countdown-secondary-text">
            ${escapeHtml(countdownData.sub)}
        </small>
    `;

    mainElement.classList.toggle(
        "finished",
        countdownData.finished
    );

}

/* ==================================================
   3. ヘッダー表示更新
================================================== */
function renderHeaderCountdown() {

    const selectedLive =
        getSelectedLive();

    const countdownData =
        getCountdownData(
            selectedLive
        );

    const headerElement =
        document.getElementById(
            "headerCountdown"
        );

    if (!headerElement) {
        return;
    }

    headerElement.textContent =
        countdownData.header;

}

/* ==================================================
   4. タイトル更新
================================================== */
function updateDocumentTitle() {

    const selectedLive =
        getSelectedLive();

    if (!selectedLive) {

        document.title =
            "LiveMate | Concert Concierge";

        return;

    }

    const countdownData =
        getCountdownData(
            selectedLive
        );

    document.title =
        `${countdownData.main} | ${selectedLive.name} | LiveMate`;

}

/* ==================================================
   5. カウントダウン一括更新
================================================== */
function updateCountdown() {

    renderMainCountdown();

    renderHeaderCountdown();

    updateDocumentTitle();

}

/* ==================================================
   6. タイマー開始
================================================== */
function startCountdownTimer() {

    if (countdownTimer) {

        clearInterval(
            countdownTimer
        );

    }

    updateCountdown();

    countdownTimer =
        setInterval(
            updateCountdown,
            30 * 1000
        );

}

/* ==================================================
   7. ページ非表示時の処理
================================================== */
function handleVisibilityChange() {

    if (
        document.visibilityState ===
        "visible"
    ) {

        updateCountdown();

    }

}

/* ==================================================
   8. イベント登録
================================================== */
function initializeCountdownEvents() {

    document.addEventListener(
        "livemate:selectedlivechange",
        updateCountdown
    );

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

}

/* ==================================================
   9. 初期化
================================================== */
function initializeCountdownModule() {

    initializeCountdownEvents();

    startCountdownTimer();

}

/* ==================================================
   10. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeCountdownModule
);
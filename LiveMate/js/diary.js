let selectedDiaryPhotoData = "";
let currentDiaryRating = 0;

/* ==================================================
   1. 日記データ取得
================================================== */
function getAllDiaryItems() {

    const items = loadData(
        STORAGE_KEYS.diaries,
        []
    );

    return Array.isArray(items)
        ? items
        : [];

}

/* ==================================================
   2. 選択中ライブの日記取得
================================================== */
function getSelectedLiveDiary() {

    const selectedLiveId =
        getSelectedLiveId();

    if (!selectedLiveId) {
        return null;
    }

    return (
        getAllDiaryItems().find(
            item =>
                String(item.liveId) ===
                String(selectedLiveId)
        ) || null
    );

}

/* ==================================================
   3. 日記データ保存
================================================== */
function saveDiaryItems(items) {

    return saveData(
        STORAGE_KEYS.diaries,
        Array.isArray(items)
            ? items
            : []
    );

}

/* ==================================================
   4. 日記フォーム要素
================================================== */
function getDiaryElements() {

    return {
        form:
            document.getElementById(
                "diaryForm"
            ),

        memo:
            document.getElementById(
                "diaryMemo"
            ),

        rating:
            document.getElementById(
                "diaryRating"
            ),

        photo:
            document.getElementById(
                "diaryPhoto"
            ),

        photoPreview:
            document.getElementById(
                "diaryPhotoPreview"
            ),

        dropArea:
            document.getElementById(
                "diaryDropArea"
            ),

        starRating:
            document.getElementById(
                "starRating"
            )
    };

}

/* ==================================================
   5. 星評価表示
================================================== */
function renderStarRating(
    rating = currentDiaryRating
) {

    const buttons =
        document.querySelectorAll(
            ".star-button"
        );

    buttons.forEach(button => {

        const buttonRating =
            Number(
                button.dataset.rating
            );

        const active =
            buttonRating <= rating;

        button.classList.toggle(
            "active",
            active
        );

        const icon =
            button.querySelector("i");

        if (icon) {

            icon.classList.toggle(
                "fa-solid",
                active
            );

            icon.classList.toggle(
                "fa-regular",
                !active
            );

        }

        button.setAttribute(
            "aria-checked",
            active ? "true" : "false"
        );

    });

    const ratingInput =
        document.getElementById(
            "diaryRating"
        );

    if (ratingInput) {

        ratingInput.value =
            String(rating);

    }

}

/* ==================================================
   6. 星評価変更
================================================== */
function setDiaryRating(rating) {

    const safeRating =
        Math.min(
            5,
            Math.max(
                0,
                Number(rating) || 0
            )
        );

    currentDiaryRating =
        safeRating;

    renderStarRating(
        safeRating
    );

}

/* ==================================================
   7. 写真プレビュー
================================================== */
function renderDiaryPhotoPreview(
    photoData = selectedDiaryPhotoData
) {

    const preview =
        document.getElementById(
            "diaryPhotoPreview"
        );

    if (!preview) {
        return;
    }

    if (!photoData) {

        preview.innerHTML = "";

        return;

    }

    preview.innerHTML = `
        <div class="diary-photo-item">

            <img
                src="${photoData}"
                alt="ライブ日記に登録した写真"
            >

            <button
                type="button"
                id="removeDiaryPhotoButton"
                class="diary-photo-remove-button"
                aria-label="写真を削除"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>

        </div>
    `;

}

/* ==================================================
   8. 写真選択
================================================== */
async function processDiaryPhoto(
    file
) {

    if (!file) {
        return;
    }

    const validation =
        validateImageFile(
            file,
            1.5
        );

    if (!validation.valid) {

        showToast(
            validation.message,
            "error"
        );

        return;

    }

    try {

        selectedDiaryPhotoData =
            await fileToDataUrl(
                file
            );

        renderDiaryPhotoPreview();

        showToast(
            "写真を追加しました。",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "写真の読み込みに失敗しました。",
            "error"
        );

    }

}

/* ==================================================
   9. 写真入力変更
================================================== */
async function handleDiaryPhotoChange() {

    const input =
        document.getElementById(
            "diaryPhoto"
        );

    const file =
        input?.files?.[0];

    if (!file) {
        return;
    }

    await processDiaryPhoto(file);

}

/* ==================================================
   10. 写真削除
================================================== */
function removeDiaryPhoto() {

    selectedDiaryPhotoData = "";

    const input =
        document.getElementById(
            "diaryPhoto"
        );

    if (input) {
        input.value = "";
    }

    renderDiaryPhotoPreview();

    showToast(
        "写真を取り外しました。"
    );

}

/* ==================================================
   11. ドラッグ＆ドロップ
================================================== */
function handleDiaryDragOver(
    event
) {

    event.preventDefault();

    const dropArea =
        document.getElementById(
            "diaryDropArea"
        );

    dropArea?.classList.add(
        "dragging"
    );

}

function handleDiaryDragLeave(
    event
) {

    event.preventDefault();

    const dropArea =
        document.getElementById(
            "diaryDropArea"
        );

    dropArea?.classList.remove(
        "dragging"
    );

}

async function handleDiaryDrop(
    event
) {

    event.preventDefault();

    const dropArea =
        document.getElementById(
            "diaryDropArea"
        );

    dropArea?.classList.remove(
        "dragging"
    );

    const file =
        event.dataTransfer
            ?.files?.[0];

    if (!file) {
        return;
    }

    await processDiaryPhoto(
        file
    );

}

/* ==================================================
   12. 日記フォーム表示
================================================== */
function fillDiaryForm() {

    const elements =
        getDiaryElements();

    if (!elements.form) {
        return;
    }

    const diary =
        getSelectedLiveDiary();

    elements.memo.value =
        diary?.memo || "";

    selectedDiaryPhotoData =
        diary?.photo || "";

    currentDiaryRating =
        Number(
            diary?.rating
        ) || 0;

    renderStarRating(
        currentDiaryRating
    );

    renderDiaryPhotoPreview(
        selectedDiaryPhotoData
    );

    if (elements.photo) {

        elements.photo.value = "";

    }

}

/* ==================================================
   13. 日記保存
================================================== */
function handleDiarySubmit(
    event
) {

    event.preventDefault();

    const selectedLive =
        getSelectedLive();

    if (!selectedLive) {

        showToast(
            "先にライブを登録してください。",
            "warning"
        );

        showPage("home");

        return;

    }

    const elements =
        getDiaryElements();

    const memo =
        elements.memo
            ?.value
            .trim() || "";

    const rating =
        Number(
            elements.rating?.value
        ) || 0;

    if (
        !memo &&
        !selectedDiaryPhotoData &&
        rating === 0
    ) {

        showToast(
            "評価・感想・写真のいずれかを入力してください。",
            "warning"
        );

        return;

    }

    const allItems =
        getAllDiaryItems();

    const existingDiary =
        allItems.find(
            item =>
                String(item.liveId) ===
                String(selectedLive.id)
        );

    const diaryData = {
        id:
            existingDiary?.id ||
            generateId("diary"),

        liveId:
            selectedLive.id,

        rating,

        memo,

        photo:
            selectedDiaryPhotoData,

        createdAt:
            existingDiary?.createdAt ||
            new Date()
                .toISOString(),

        updatedAt:
            new Date()
                .toISOString()
    };

    let updatedItems;

    if (existingDiary) {

        updatedItems =
            allItems.map(
                item => {

                    if (
                        String(item.id) ===
                        String(existingDiary.id)
                    ) {

                        return diaryData;

                    }

                    return item;

                }
            );

    } else {

        updatedItems = [
            ...allItems,
            diaryData
        ];

    }

    const saved =
        saveDiaryItems(
            updatedItems
        );

    if (!saved) {

        showToast(
            "ライブ日記の保存に失敗しました。",
            "error"
        );

        return;

    }

    renderDiaryHistory();

    showToast(
        "ライブ日記を保存しました。",
        "success"
    );

}

/* ==================================================
   14. 日記履歴表示エリア作成
================================================== */
function ensureDiaryHistoryArea() {

    let historyArea =
        document.getElementById(
            "diaryHistoryArea"
        );

    if (historyArea) {
        return historyArea;
    }

    const diaryPage =
        document.getElementById(
            "diaryPage"
        );

    if (!diaryPage) {
        return null;
    }

    historyArea =
        document.createElement(
            "section"
        );

    historyArea.id =
        "diaryHistoryArea";

    historyArea.className =
        "panel diary-history-panel";

    diaryPage.appendChild(
        historyArea
    );

    return historyArea;

}

/* ==================================================
   15. 星文字列
================================================== */
function createStarText(rating) {

    const safeRating =
        Math.min(
            5,
            Math.max(
                0,
                Number(rating) || 0
            )
        );

    return (
        "★".repeat(safeRating) +
        "☆".repeat(5 - safeRating)
    );

}

/* ==================================================
   16. 日記履歴カードHTML
================================================== */
function createDiaryHistoryHtml(
    diary
) {

    const live =
        getLives().find(
            item =>
                String(item.id) ===
                String(diary.liveId)
        );

    if (!live) {
        return "";
    }

    return `
        <article class="diary-history-card">

            ${
                diary.photo
                    ? `
                        <img
                            src="${diary.photo}"
                            alt="${escapeHtml(live.name)}の思い出写真"
                        >
                    `
                    : `
                        <div class="diary-history-placeholder">
                            <i class="fa-regular fa-image"></i>
                        </div>
                    `
            }

            <div class="diary-history-content">

                <span class="diary-history-date">
                    ${escapeHtml(
                        formatDateJapanese(
                            live.date
                        )
                    )}
                </span>

                <h3>
                    ${escapeHtml(live.name)}
                </h3>

                <p class="diary-history-artist">
                    ${escapeHtml(
                        live.artistName
                    )}
                </p>

                <p class="diary-history-rating">
                    ${escapeHtml(
                        createStarText(
                            diary.rating
                        )
                    )}
                </p>

                <p class="diary-history-memo">
                    ${
                        diary.memo
                            ? escapeHtml(
                                diary.memo
                            )
                            : "感想は登録されていません。"
                    }
                </p>

                <button
                    type="button"
                    class="outline-button open-diary-live-button"
                    data-live-id="${escapeHtml(live.id)}"
                >
                    このライブを開く
                </button>

            </div>

        </article>
    `;

}

/* ==================================================
   17. 日記履歴表示
================================================== */
function renderDiaryHistory() {

    const historyArea =
        ensureDiaryHistoryArea();

    if (!historyArea) {
        return;
    }

    const diaries =
        getAllDiaryItems()
            .sort(
                (a, b) =>
                    new Date(
                        b.updatedAt
                    ) -
                    new Date(
                        a.updatedAt
                    )
            );

    const validDiaries =
        diaries.filter(
            diary =>
                getLives().some(
                    live =>
                        String(live.id) ===
                        String(diary.liveId)
                )
        );

    historyArea.innerHTML = `
        <div class="title-with-line">

            <span class="pink-line"></span>

            <div>

                <h2>
                    Diary History / ライブ日記一覧
                </h2>

                <p>
                    過去に保存したライブの感想を見返せます。
                </p>

            </div>

        </div>

        <div class="diary-history-grid">

            ${
                validDiaries.length > 0
                    ? validDiaries
                        .map(
                            createDiaryHistoryHtml
                        )
                        .join("")
                    : `
                        <div class="empty-message">
                            保存されたライブ日記はありません。
                        </div>
                    `
            }

        </div>
    `;

}

/* ==================================================
   18. 日記履歴からライブ切替
================================================== */
function handleDiaryHistoryClick(
    event
) {

    const button =
        event.target.closest(
            ".open-diary-live-button"
        );

    if (!button) {
        return;
    }

    const liveId =
        button.dataset.liveId;

    if (!liveId) {
        return;
    }

    selectLive(liveId);

    fillDiaryForm();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* ==================================================
   19. 星クリック
================================================== */
function handleStarRatingClick(
    event
) {

    const button =
        event.target.closest(
            ".star-button"
        );

    if (!button) {
        return;
    }

    setDiaryRating(
        Number(
            button.dataset.rating
        )
    );

}

/* ==================================================
   20. 写真プレビュー操作
================================================== */
function handleDiaryPreviewClick(
    event
) {

    const removeButton =
        event.target.closest(
            "#removeDiaryPhotoButton"
        );

    if (!removeButton) {
        return;
    }

    removeDiaryPhoto();

}

/* ==================================================
   21. イベント登録
================================================== */
function initializeDiaryEvents() {

    const elements =
        getDiaryElements();

    elements.form
        ?.addEventListener(
            "submit",
            handleDiarySubmit
        );

    elements.starRating
        ?.addEventListener(
            "click",
            handleStarRatingClick
        );

    elements.photo
        ?.addEventListener(
            "change",
            handleDiaryPhotoChange
        );

    elements.dropArea
        ?.addEventListener(
            "dragover",
            handleDiaryDragOver
        );

    elements.dropArea
        ?.addEventListener(
            "dragleave",
            handleDiaryDragLeave
        );

    elements.dropArea
        ?.addEventListener(
            "drop",
            handleDiaryDrop
        );

    elements.photoPreview
        ?.addEventListener(
            "click",
            handleDiaryPreviewClick
        );

    document.addEventListener(
        "livemate:selectedlivechange",
        () => {

            fillDiaryForm();

            renderDiaryHistory();

        }
    );

    document.addEventListener(
        "livemate:pagechange",
        event => {

            if (
                event.detail?.page ===
                "diary"
            ) {

                fillDiaryForm();

                renderDiaryHistory();

            }

        }
    );

    document.addEventListener(
        "click",
        handleDiaryHistoryClick
    );

}

/* ==================================================
   22. 初期化
================================================== */
function initializeDiaryModule() {

    initializeDiaryEvents();

    fillDiaryForm();

    renderDiaryHistory();

}

/* ==================================================
   23. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeDiaryModule
);
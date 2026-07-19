let selectedLivePhotoData = "";

/* ==================================================
   1. 要素取得
================================================== */
function getLiveFormElements() {

    return {
        form: document.getElementById("liveForm"),
        editingId: document.getElementById("editingLiveId"),
        liveName: document.getElementById("liveName"),
        artistName: document.getElementById("artistName"),
        venueName: document.getElementById("venueName"),
        liveDate: document.getElementById("liveDate"),
        openTime: document.getElementById("openTime"),
        startTime: document.getElementById("startTime"),
        seatInfo: document.getElementById("seatInfo"),
        livePhoto: document.getElementById("livePhoto"),
        livePhotoName: document.getElementById("livePhotoName"),
        cancelButton: document.getElementById("cancelLiveEditButton")
    };

}

/* ==================================================
   2. ライブ並び替え
================================================== */
function sortLivesByDate(lives) {

    return [...lives].sort(
        (a, b) =>
            getLiveDateTime(a) -
            getLiveDateTime(b)
    );

}

/* ==================================================
   3. ライブ登録フォームの初期化
================================================== */
function resetLiveForm() {

    const elements =
        getLiveFormElements();

    if (!elements.form) {
        return;
    }

    elements.form.reset();

    if (elements.editingId) {
        elements.editingId.value = "";
    }

    if (elements.livePhotoName) {

        elements.livePhotoName.textContent =
            "選択されていません";

    }

    selectedLivePhotoData = "";

    clearFormErrors(elements.form);

}

/* ==================================================
   4. ライブ写真選択
================================================== */
async function handleLivePhotoChange() {

    const elements =
        getLiveFormElements();

    const file =
        elements.livePhoto?.files?.[0];

    if (!file) {

        selectedLivePhotoData = "";

        if (elements.livePhotoName) {

            elements.livePhotoName.textContent =
                "選択されていません";

        }

        return;

    }

    const validation =
        validateImageFile(file, 1.5);

    if (!validation.valid) {

        showToast(
            validation.message,
            "error"
        );

        elements.livePhoto.value = "";

        selectedLivePhotoData = "";

        if (elements.livePhotoName) {

            elements.livePhotoName.textContent =
                "選択されていません";

        }

        return;

    }

    try {

        selectedLivePhotoData =
            await fileToDataUrl(file);

        if (elements.livePhotoName) {

            elements.livePhotoName.textContent =
                file.name;

        }

    } catch (error) {

        console.error(error);

        showToast(
            "写真の読み込みに失敗しました。",
            "error"
        );

    }

}

/* ==================================================
   5. ライブフォーム検証
================================================== */
function validateLiveForm() {

    const elements =
        getLiveFormElements();

    const requiredValid =
        validateRequiredFields([
            {
                input: elements.liveName,
                label: "ライブ名"
            },
            {
                input: elements.artistName,
                label: "アーティスト名"
            },
            {
                input: elements.venueName,
                label: "会場"
            },
            {
                input: elements.liveDate,
                label: "開催日"
            },
            {
                input: elements.openTime,
                label: "開場時間"
            },
            {
                input: elements.startTime,
                label: "開演時間"
            }
        ]);

    const timeValid =
        validateTimeOrder(
            elements.openTime,
            elements.startTime
        );

    return requiredValid && timeValid;

}

/* ==================================================
   6. ライブ保存
================================================== */
async function handleLiveFormSubmit(event) {

    event.preventDefault();

    const elements =
        getLiveFormElements();

    if (!validateLiveForm()) {

        showToast(
            "入力内容を確認してください。",
            "error"
        );

        return;

    }

    const existingLives =
        getLives();

    const editingId =
        elements.editingId?.value || "";

    const existingLive =
        existingLives.find(
            live =>
                String(live.id) ===
                String(editingId)
        );

    const liveData = {
        id: editingId || generateId("live"),
        name: elements.liveName.value.trim(),
        artistName:
            elements.artistName.value.trim(),
        venue:
            elements.venueName.value.trim(),
        date:
            elements.liveDate.value,
        openTime:
            elements.openTime.value,
        startTime:
            elements.startTime.value,
        seat:
            elements.seatInfo.value.trim(),
        photo:
            selectedLivePhotoData ||
            existingLive?.photo ||
            "",
        createdAt:
            existingLive?.createdAt ||
            new Date().toISOString(),
        updatedAt:
            new Date().toISOString()
    };

    let updatedLives;

    if (editingId) {

        updatedLives =
            existingLives.map(live => {

                if (
                    String(live.id) ===
                    String(editingId)
                ) {

                    return liveData;

                }

                return live;

            });

    } else {

        updatedLives = [
            ...existingLives,
            liveData
        ];

    }

    saveLives(updatedLives);

    setSelectedLiveId(liveData.id);

    ensureTimelineDefaults(liveData);

    resetLiveForm();

    renderLiveUI();

    notifySelectedLiveChanged(
        liveData.id
    );

    showToast(
        editingId
            ? "ライブ情報を更新しました。"
            : "ライブを登録しました。",
        "success"
    );

}

/* ==================================================
   7. ライブ編集
================================================== */
function startEditLive(liveId) {

    const live =
        getLives().find(
            item =>
                String(item.id) ===
                String(liveId)
        );

    if (!live) {

        showToast(
            "ライブ情報が見つかりません。",
            "error"
        );

        return;

    }

    const elements =
        getLiveFormElements();

    elements.editingId.value = live.id;
    elements.liveName.value = live.name || "";
    elements.artistName.value =
        live.artistName || "";
    elements.venueName.value =
        live.venue || "";
    elements.liveDate.value =
        live.date || "";
    elements.openTime.value =
        live.openTime || "";
    elements.startTime.value =
        live.startTime || "";
    elements.seatInfo.value =
        live.seat || "";

    selectedLivePhotoData =
        live.photo || "";

    if (elements.livePhotoName) {

        elements.livePhotoName.textContent =
            live.photo
                ? "登録済みの写真を使用"
                : "選択されていません";

    }

    elements.form.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    elements.liveName.focus();

    showToast(
        "ライブ情報を編集できます。",
        "normal"
    );

}

/* ==================================================
   8. ライブ削除
================================================== */
function requestDeleteLive(liveId) {

    const live =
        getLives().find(
            item =>
                String(item.id) ===
                String(liveId)
        );

    if (!live) {
        return;
    }

    openConfirmModal({
        title: "ライブを削除",
        message:
            `「${live.name}」を削除しますか？` +
            "関連するタイムラインやメモも削除されます。",
        confirmText: "削除する",
        onConfirm: () => {

            deleteLive(liveId);

        }
    });

}

function deleteLive(liveId) {

    const updatedLives =
        getLives().filter(
            live =>
                String(live.id) !==
                String(liveId)
        );

    saveLives(updatedLives);

    deleteRelatedLiveData(liveId);

    const selectedLiveId =
        getSelectedLiveId();

    if (
        String(selectedLiveId) ===
        String(liveId)
    ) {

        const nextLive =
            sortLivesByDate(updatedLives)[0];

        setSelectedLiveId(
            nextLive?.id || null
        );

    }

    renderLiveUI();

    notifySelectedLiveChanged(
        getSelectedLiveId()
    );

    showToast(
        "ライブを削除しました。",
        "success"
    );

}

/* ==================================================
   9. 関連データ削除
================================================== */
function deleteRelatedLiveData(liveId) {

    const relatedKeys = [
        STORAGE_KEYS.timelines,
        STORAGE_KEYS.setlists,
        STORAGE_KEYS.diaries,
        STORAGE_KEYS.vlogClips
    ];

    relatedKeys.forEach(key => {

        const items =
            loadData(key, []);

        const updatedItems =
            Array.isArray(items)
                ? items.filter(
                    item =>
                        String(item.liveId) !==
                        String(liveId)
                )
                : [];

        saveData(key, updatedItems);

    });

    const venueData =
        loadData(
            STORAGE_KEYS.venueData,
            {}
        );

    if (
        venueData &&
        typeof venueData === "object"
    ) {

        delete venueData[liveId];

        saveData(
            STORAGE_KEYS.venueData,
            venueData
        );

    }

}

/* ==================================================
   10. 選択ライブ変更
================================================== */
function selectLive(liveId) {

    const live =
        getLives().find(
            item =>
                String(item.id) ===
                String(liveId)
        );

    if (!live) {
        return;
    }

    setSelectedLiveId(liveId);

    renderLiveUI();

    notifySelectedLiveChanged(liveId);

    showToast(
        `「${live.name}」を選択しました。`,
        "success"
    );

}

/* ==================================================
   11. ライブカード生成
================================================== */
function createLiveCardHtml(live) {

    const selectedLiveId =
        getSelectedLiveId();

    const selected =
        String(selectedLiveId) ===
        String(live.id);

    const finished =
        isLiveFinished(live);

    const photoStyle = live.photo
    ? `
        style="
            background-image:
                linear-gradient(
                    rgba(255,255,255,0.82),
                    rgba(255,255,255,0.82)
                ),
                url('${live.photo}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        "
    `
    : "";

    return `
        <article
            class="live-select-card
            ${selected ? "selected" : ""}"
            data-live-id="${escapeHtml(live.id)}"
            ${photoStyle}
        >

            <div class="live-card-overlay">

                <span
                    class="live-status-badge
                    ${finished ? "history" : ""}"
                >
                    ${
                        finished
                            ? "参戦履歴"
                            : "参戦予定"
                    }
                </span>

                <h3>
                    ${escapeHtml(live.name)}
                </h3>

                <p class="live-artist">
                    ${escapeHtml(
                        live.artistName
                    )}
                </p>

                <p class="live-venue">
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHtml(
                        live.venue
                    )}
                </p>

                <div class="live-select-footer">

                    <time>
                        ${escapeHtml(
                            formatDateJapanese(
                                live.date
                            )
                        )}
                    </time>

                    <div class="live-card-buttons">

                        <button
                            type="button"
                            class="live-card-action select-live-button"
                            data-live-id="${escapeHtml(live.id)}"
                        >
                            選択
                        </button>

                        <button
                            type="button"
                            class="live-card-action edit-live-button"
                            data-live-id="${escapeHtml(live.id)}"
                        >
                            編集
                        </button>

                        <button
                            type="button"
                            class="live-card-action delete-live-button"
                            data-live-id="${escapeHtml(live.id)}"
                        >
                            削除
                        </button>

                    </div>

                </div>

            </div>

        </article>
    `;

}

/* ==================================================
   12. ライブ一覧表示
================================================== */
function renderLiveCards() {
    const container =
        document.getElementById("liveCardGrid");

    if (!container) {
        return;
    }

    const upcomingLives = getUpcomingLives();
    const pastLives = getPastLives();

    if (
        upcomingLives.length === 0 &&
        pastLives.length === 0
    ) {
        container.innerHTML = `
            <div class="empty-message">
                ライブが登録されていません。
            </div>
        `;

        return;
    }

    const upcomingHtml =
        upcomingLives.length > 0
            ? upcomingLives
                .map(createLiveCardHtml)
                .join("")
            : `
                <div class="empty-message">
                    参戦予定のライブはありません。
                </div>
            `;

    const historyHtml =
        pastLives.length > 0
            ? pastLives
                .map(createLiveCardHtml)
                .join("")
            : `
                <div class="empty-message">
                    参戦履歴はまだありません。
                </div>
            `;

    container.innerHTML = `
        <section class="live-list-group">
            <div class="live-list-heading">
                <h3>参戦予定</h3>
                <span>${upcomingLives.length}件</span>
            </div>

            <div class="live-group-grid">
                ${upcomingHtml}
            </div>
        </section>

        <section class="live-list-group">
            <div class="live-list-heading">
                <h3>参戦履歴</h3>
                <span>${pastLives.length}件</span>
            </div>

            <div class="live-group-grid">
                ${historyHtml}
            </div>
        </section>
    `;
}

/* ==================================================
   13. 次回ライブ表示
================================================== */
function renderNextConcert() {

    const selectedLive =
        getSelectedLive();

    const nameElement =
        document.getElementById(
            "nextConcertName"
        );

    const detailElement =
        document.getElementById(
            "nextConcertArtistVenue"
        );

    const dateElement =
        document.getElementById(
            "nextConcertDate"
        );

    const timeElement =
        document.getElementById(
            "nextConcertTime"
        );

    const card =
        document.getElementById(
            "nextConcertCard"
        );

    if (!selectedLive) {

        if (nameElement) {
            nameElement.textContent =
                "ライブ未登録";
        }

        if (detailElement) {
            detailElement.textContent =
                "ライブを登録してください";
        }

        if (dateElement) {
            dateElement.textContent =
                "----/--/--";
        }

        if (timeElement) {
            timeElement.textContent =
                "--:-- / --:--";
        }

        if (card) {

            card.style.backgroundImage = "";

        }

        return;

    }

    if (nameElement) {

        nameElement.textContent =
            selectedLive.name;

    }

    if (detailElement) {

        detailElement.textContent =
            `${selectedLive.artistName} / ${selectedLive.venue}`;

    }

    if (dateElement) {

        dateElement.textContent =
            formatDateSlash(
                selectedLive.date
            );

    }

    if (timeElement) {

        timeElement.textContent =
            `${selectedLive.openTime || "--:--"} / ` +
            `${selectedLive.startTime || "--:--"}`;

    }

    if (card) {
    if (selectedLive.photo) {
        card.style.backgroundImage = `
            linear-gradient(
                rgba(255, 255, 255, 0.72),
                rgba(255, 255, 255, 0.72)
            ),
            url("${selectedLive.photo}")
        `;

        card.style.backgroundSize = "cover";
        card.style.backgroundPosition = "center";
        card.style.backgroundRepeat = "no-repeat";
    } else {
        card.removeAttribute("style");
    }
}

}

/* ==================================================
   14. アクセス画面へ会場を反映
================================================== */
function reflectVenueToTravel() {

    const selectedLive =
        getSelectedLive();

    const arrivalInput =
        document.getElementById(
            "arrivalPlace"
        );

    const mapPreviewText =
        document.getElementById(
            "mapPreviewText"
        );

    if (arrivalInput) {

        arrivalInput.value =
            selectedLive?.venue || "";

    }

    if (mapPreviewText) {

        mapPreviewText.textContent =
            selectedLive
                ? `${selectedLive.venue} 周辺をGoogle Mapsで確認できます。`
                : "会場を登録すると、ここに会場名が表示されます。";

    }

}

/* ==================================================
   15. タイムライン初期予定
================================================== */
function ensureTimelineDefaults(live) {

    if (!live?.id) {
        return;
    }

    const timelines =
        loadData(
            STORAGE_KEYS.timelines,
            []
        );

    const liveItems =
        timelines.filter(
            item =>
                String(item.liveId) ===
                String(live.id)
        );

    const existingTitles =
        liveItems.map(
            item => item.title
        );

    const defaults = [];

    if (
        live.openTime &&
        !existingTitles.includes("開場")
    ) {

        defaults.push({
            id: generateId("timeline"),
            liveId: live.id,
            time: live.openTime,
            title: "開場",
            memo: "ライブ登録情報から自動追加",
            autoGenerated: true,
            createdAt:
                new Date().toISOString()
        });

    }

    if (
        live.startTime &&
        !existingTitles.includes("開演")
    ) {

        defaults.push({
            id: generateId("timeline"),
            liveId: live.id,
            time: live.startTime,
            title: "開演",
            memo: "ライブ登録情報から自動追加",
            autoGenerated: true,
            createdAt:
                new Date().toISOString()
        });

    }

    if (defaults.length > 0) {

        saveData(
            STORAGE_KEYS.timelines,
            [
                ...timelines,
                ...defaults
            ]
        );

    }

}

/* ==================================================
   16. ライブUI一括更新
================================================== */
function renderLiveUI() {

    renderLiveCards();

    renderNextConcert();

    reflectVenueToTravel();

    updateHeaderStatus();

}

/* ==================================================
   17. ライブカード操作
================================================== */
function handleLiveCardClick(event) {

    const selectButton =
        event.target.closest(
            ".select-live-button"
        );

    const editButton =
        event.target.closest(
            ".edit-live-button"
        );

    const deleteButton =
        event.target.closest(
            ".delete-live-button"
        );

    if (selectButton) {

        selectLive(
            selectButton.dataset.liveId
        );

        return;

    }

    if (editButton) {

        startEditLive(
            editButton.dataset.liveId
        );

        return;

    }

    if (deleteButton) {

        requestDeleteLive(
            deleteButton.dataset.liveId
        );

    }

}

/* ==================================================
   18. イベント登録
================================================== */
function initializeLiveEvents() {

    const elements =
        getLiveFormElements();

    if (elements.form) {

        elements.form.addEventListener(
            "submit",
            handleLiveFormSubmit
        );

    }

    if (elements.livePhoto) {

        elements.livePhoto.addEventListener(
            "change",
            handleLivePhotoChange
        );

    }

    if (elements.cancelButton) {

        elements.cancelButton.addEventListener(
            "click",
            () => {

                resetLiveForm();

                showToast(
                    "編集をキャンセルしました。"
                );

            }
        );

    }

    const liveGrid =
        document.getElementById(
            "liveCardGrid"
        );

    if (liveGrid) {

        liveGrid.addEventListener(
            "click",
            handleLiveCardClick
        );

    }

    document.addEventListener(
        "livemate:selectedlivechange",
        () => {

            renderLiveUI();

        }
    );

}

/* ==================================================
   19. 初期化
================================================== */
function initializeLiveModule() {

    initializeLiveEvents();

    renderLiveUI();

}

/* ==================================================
   20. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeLiveModule
);
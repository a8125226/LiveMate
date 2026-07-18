let vlogPreviewQueue = [];
let vlogPreviewIndex = 0;
let vlogPreviewObjectUrl = "";

/* ==================================================
   1. Vlogデータ取得
================================================== */
function getAllVlogClips() {

    const clips = loadData(
        STORAGE_KEYS.vlogClips,
        []
    );

    return Array.isArray(clips)
        ? clips
        : [];

}

/* ==================================================
   2. Vlogデータ保存
================================================== */
function saveVlogClips(clips) {

    return saveData(
        STORAGE_KEYS.vlogClips,
        Array.isArray(clips)
            ? clips
            : []
    );

}

/* ==================================================
   3. 選択中ライブのVlog素材
================================================== */
function getSelectedLiveVlogClips() {

    const selectedLiveId =
        getSelectedLiveId();

    if (!selectedLiveId) {
        return [];
    }

    return getAllVlogClips()
        .filter(
            clip =>
                String(clip.liveId) ===
                String(selectedLiveId)
        )
        .sort(
            (a, b) =>
                Number(a.order) -
                Number(b.order)
        );

}

/* ==================================================
   4. 動画の長さ取得
================================================== */
function getVideoDuration(file) {

    return new Promise(
        (resolve, reject) => {

            const video =
                document.createElement(
                    "video"
                );

            const objectUrl =
                URL.createObjectURL(file);

            video.preload = "metadata";

            video.addEventListener(
                "loadedmetadata",
                () => {

                    const duration =
                        Number(
                            video.duration
                        ) || 0;

                    URL.revokeObjectURL(
                        objectUrl
                    );

                    resolve(duration);

                }
            );

            video.addEventListener(
                "error",
                () => {

                    URL.revokeObjectURL(
                        objectUrl
                    );

                    reject(
                        new Error(
                            "動画情報を読み込めませんでした。"
                        )
                    );

                }
            );

            video.src = objectUrl;

        }
    );

}

/* ==================================================
   5. 動画ファイルをData URLへ変換
================================================== */
function videoFileToDataUrl(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.addEventListener(
                "load",
                () => {

                    resolve(
                        reader.result
                    );

                }
            );

            reader.addEventListener(
                "error",
                () => {

                    reject(
                        new Error(
                            "動画ファイルの読み込みに失敗しました。"
                        )
                    );

                }
            );

            reader.readAsDataURL(file);

        }
    );

}

/* ==================================================
   6. 秒数表示
================================================== */
function formatVideoDuration(seconds) {

    const safeSeconds =
        Math.max(
            0,
            Math.round(
                Number(seconds) || 0
            )
        );

    const minutes =
        Math.floor(
            safeSeconds / 60
        );

    const remainSeconds =
        safeSeconds % 60;

    if (minutes === 0) {

        return `${remainSeconds}秒`;

    }

    return (
        `${minutes}分` +
        `${remainSeconds}秒`
    );

}

/* ==================================================
   7. 動画追加
================================================== */
async function handleVlogVideoInputChange(
    event
) {

    const selectedLive =
        getSelectedLive();

    if (!selectedLive) {

        showToast(
            "先にライブを登録してください。",
            "warning"
        );

        event.target.value = "";

        showPage("home");

        return;

    }

    const files =
        Array.from(
            event.target.files || []
        );

    if (files.length === 0) {
        return;
    }

    let allClips =
        getAllVlogClips();

    const selectedClips =
        getSelectedLiveVlogClips();

    let nextOrder =
        selectedClips.length + 1;

    let addedCount = 0;
    let skippedCount = 0;

    for (const file of files) {

        if (
            !file.type.startsWith(
                "video/"
            )
        ) {

            skippedCount++;

            continue;

        }

        /*
         LocalStorageの容量は小さいため、
         動画ファイルは最大約8MBに制限します。
        */

        const maxSize =
            8 * 1024 * 1024;

        if (file.size > maxSize) {

            showToast(
                `「${file.name}」は8MBを超えているため追加できません。`,
                "warning",
                4000
            );

            skippedCount++;

            continue;

        }

        try {

            const duration =
                await getVideoDuration(
                    file
                );

            if (duration > 30.5) {

                showToast(
                    `「${file.name}」は30秒を超えているため追加できません。`,
                    "warning",
                    4000
                );

                skippedCount++;

                continue;

            }

            const dataUrl =
                await videoFileToDataUrl(
                    file
                );

            allClips.push({
                id:
                    generateId(
                        "vlog"
                    ),

                liveId:
                    selectedLive.id,

                title:
                    removeFileExtension(
                        file.name
                    ),

                scene:
                    guessVlogScene(
                        file.name
                    ),

                fileName:
                    file.name,

                dataUrl,

                duration,

                completed: true,

                order:
                    nextOrder,

                createdAt:
                    new Date()
                        .toISOString(),

                updatedAt:
                    new Date()
                        .toISOString()
            });

            nextOrder++;
            addedCount++;

        } catch (error) {

            console.error(error);

            skippedCount++;

        }

    }

    saveVlogClips(
        allClips
    );

    event.target.value = "";

    renderVlogClips();

    if (addedCount > 0) {

        showToast(
            `${addedCount}本の動画を追加しました。`,
            "success"
        );

    }

    if (
        addedCount === 0 &&
        skippedCount > 0
    ) {

        showToast(
            "追加できる動画がありませんでした。",
            "error"
        );

    }

}

/* ==================================================
   8. 拡張子を削除
================================================== */
function removeFileExtension(fileName) {

    return String(fileName)
        .replace(
            /\.[^/.]+$/,
            ""
        );

}

/* ==================================================
   9. ファイル名から撮影シーンを推測
================================================== */
function guessVlogScene(fileName) {

    const name =
        String(fileName)
            .toLowerCase();

    if (
        name.includes("train") ||
        name.includes("bus") ||
        name.includes("移動") ||
        name.includes("電車")
    ) {

        return "移動";

    }

    if (
        name.includes("venue") ||
        name.includes("会場") ||
        name.includes("arrival")
    ) {

        return "会場到着";

    }

    if (
        name.includes("goods") ||
        name.includes("グッズ") ||
        name.includes("item")
    ) {

        return "グッズ紹介";

    }

    if (
        name.includes("food") ||
        name.includes("食事") ||
        name.includes("meal")
    ) {

        return "食事";

    }

    if (
        name.includes("after") ||
        name.includes("感想") ||
        name.includes("comment")
    ) {

        return "ライブ後の感想";

    }

    return "ライブ当日の記録";

}

/* ==================================================
   10. VlogカードHTML
================================================== */
function createVlogClipHtml(
    clip,
    index,
    total
) {

    return `
        <article
            class="vlog-clip-card
            ${clip.completed ? "selected" : ""}"
            data-vlog-id="${escapeHtml(clip.id)}"
        >

            <input
                type="checkbox"
                class="vlog-clip-checkbox"
                data-vlog-id="${escapeHtml(clip.id)}"
                aria-label="${escapeHtml(clip.title)}をVlogに使用"
                ${clip.completed ? "checked" : ""}
            >

            <div class="vlog-clip-info">

                <input
                    type="text"
                    class="vlog-clip-title-input"
                    data-vlog-id="${escapeHtml(clip.id)}"
                    value="${escapeHtml(clip.title)}"
                    maxlength="80"
                    aria-label="動画タイトル"
                >

                <div>

                    <select
                        class="vlog-scene-select"
                        data-vlog-id="${escapeHtml(clip.id)}"
                        aria-label="撮影シーン"
                    >

                        ${createVlogSceneOptions(
                            clip.scene
                        )}

                    </select>

                    <small>
                        ${escapeHtml(
                            formatVideoDuration(
                                clip.duration
                            )
                        )}
                    </small>

                </div>

            </div>

            <div class="vlog-card-actions">

                <button
                    type="button"
                    class="vlog-preview-button"
                    data-vlog-id="${escapeHtml(clip.id)}"
                    aria-label="${escapeHtml(clip.title)}を再生"
                    title="再生"
                >
                    <i class="fa-solid fa-play"></i>
                </button>

                <div class="vlog-order-buttons">

                    <button
                        type="button"
                        class="move-vlog-up-button"
                        data-vlog-id="${escapeHtml(clip.id)}"
                        aria-label="上へ移動"
                        ${index === 0 ? "disabled" : ""}
                    >
                        ▲
                    </button>

                    <button
                        type="button"
                        class="move-vlog-down-button"
                        data-vlog-id="${escapeHtml(clip.id)}"
                        aria-label="下へ移動"
                        ${
                            index === total - 1
                                ? "disabled"
                                : ""
                        }
                    >
                        ▼
                    </button>

                </div>

                <button
                    type="button"
                    class="vlog-delete-button"
                    data-vlog-id="${escapeHtml(clip.id)}"
                    aria-label="${escapeHtml(clip.title)}を削除"
                    title="削除"
                >
                    <i class="fa-regular fa-trash-can"></i>
                </button>

            </div>

        </article>
    `;

}

/* ==================================================
   11. 撮影シーン選択肢
================================================== */
function createVlogSceneOptions(
    selectedScene
) {

    const scenes = [
        "出発",
        "移動",
        "会場到着",
        "グッズ紹介",
        "会場外観",
        "フラワースタンド",
        "ライブ前",
        "ライブ後の感想",
        "食事",
        "戦利品紹介",
        "ライブ当日の記録"
    ];

    return scenes
        .map(
            scene => `
                <option
                    value="${escapeHtml(scene)}"
                    ${
                        scene ===
                        selectedScene
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeHtml(scene)}
                </option>
            `
        )
        .join("");

}

/* ==================================================
   12. Vlog素材一覧表示
================================================== */
function renderVlogClips() {

    const container =
        document.getElementById(
            "vlogClipList"
        );

    if (!container) {
        return;
    }

    const selectedLive =
        getSelectedLive();

    if (!selectedLive) {

        container.innerHTML = `
            <div class="empty-message">
                ライブを登録するとVlog素材を管理できます。
            </div>
        `;

        return;

    }

    const clips =
        getSelectedLiveVlogClips();

    if (clips.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                動画を追加すると、ここにVlog素材が表示されます。
            </div>
        `;

        return;

    }

    container.innerHTML =
        clips
            .map(
                (clip, index) =>
                    createVlogClipHtml(
                        clip,
                        index,
                        clips.length
                    )
            )
            .join("");

}

/* ==================================================
   13. Vlog素材更新
================================================== */
function updateVlogClip(
    vlogId,
    updates
) {

    const updatedClips =
        getAllVlogClips()
            .map(
                clip => {

                    if (
                        String(clip.id) ===
                        String(vlogId)
                    ) {

                        return {
                            ...clip,
                            ...updates,
                            updatedAt:
                                new Date()
                                    .toISOString()
                        };

                    }

                    return clip;

                }
            );

    saveVlogClips(
        updatedClips
    );

}

/* ==================================================
   14. チェック状態変更
================================================== */
function toggleVlogClipCompleted(
    vlogId,
    completed
) {

    updateVlogClip(
        vlogId,
        {
            completed
        }
    );

    renderVlogClips();

}

/* ==================================================
   15. タイトル変更
================================================== */
function updateVlogClipTitle(
    vlogId,
    title
) {

    const safeTitle =
        title.trim() ||
        "タイトル未設定";

    updateVlogClip(
        vlogId,
        {
            title:
                safeTitle
        }
    );

}

/* ==================================================
   16. シーン変更
================================================== */
function updateVlogClipScene(
    vlogId,
    scene
) {

    updateVlogClip(
        vlogId,
        {
            scene
        }
    );

}

/* ==================================================
   17. 並べ替え
================================================== */
function moveVlogClip(
    vlogId,
    direction
) {

    const selectedLiveId =
        getSelectedLiveId();

    if (!selectedLiveId) {
        return;
    }

    const allClips =
        getAllVlogClips();

    const selectedClips =
        getSelectedLiveVlogClips();

    const currentIndex =
        selectedClips.findIndex(
            clip =>
                String(clip.id) ===
                String(vlogId)
        );

    if (currentIndex < 0) {
        return;
    }

    const targetIndex =
        direction === "up"
            ? currentIndex - 1
            : currentIndex + 1;

    if (
        targetIndex < 0 ||
        targetIndex >=
            selectedClips.length
    ) {

        return;

    }

    const reordered = [
        ...selectedClips
    ];

    [
        reordered[currentIndex],
        reordered[targetIndex]
    ] = [
        reordered[targetIndex],
        reordered[currentIndex]
    ];

    const orderMap =
        new Map(
            reordered.map(
                (clip, index) => [
                    String(clip.id),
                    index + 1
                ]
            )
        );

    const updatedClips =
        allClips.map(
            clip => {

                if (
                    String(clip.liveId) !==
                    String(selectedLiveId)
                ) {

                    return clip;

                }

                return {
                    ...clip,
                    order:
                        orderMap.get(
                            String(clip.id)
                        ) || clip.order,
                    updatedAt:
                        new Date()
                            .toISOString()
                };

            }
        );

    saveVlogClips(
        updatedClips
    );

    renderVlogClips();

}

/* ==================================================
   18. 動画削除
================================================== */
function requestDeleteVlogClip(
    vlogId
) {

    const clip =
        getAllVlogClips()
            .find(
                item =>
                    String(item.id) ===
                    String(vlogId)
            );

    if (!clip) {
        return;
    }

    openConfirmModal({
        title:
            "動画を削除",
        message:
            `「${clip.title}」をVlog素材から削除しますか？`,
        confirmText:
            "削除する",
        onConfirm: () => {

            deleteVlogClip(
                vlogId
            );

        }
    });

}

function deleteVlogClip(
    vlogId
) {

    const selectedLiveId =
        getSelectedLiveId();

    let updatedClips =
        getAllVlogClips()
            .filter(
                clip =>
                    String(clip.id) !==
                    String(vlogId)
            );

    const selectedClips =
        updatedClips
            .filter(
                clip =>
                    String(clip.liveId) ===
                    String(selectedLiveId)
            )
            .sort(
                (a, b) =>
                    Number(a.order) -
                    Number(b.order)
            );

    const orderMap =
        new Map(
            selectedClips.map(
                (clip, index) => [
                    String(clip.id),
                    index + 1
                ]
            )
        );

    updatedClips =
        updatedClips.map(
            clip => {

                if (
                    String(clip.liveId) !==
                    String(selectedLiveId)
                ) {

                    return clip;

                }

                return {
                    ...clip,
                    order:
                        orderMap.get(
                            String(clip.id)
                        ) || clip.order
                };

            }
        );

    saveVlogClips(
        updatedClips
    );

    stopVlogPreview();

    renderVlogClips();

    showToast(
        "動画を削除しました。",
        "success"
    );

}

/* ==================================================
   19. 単体動画プレビュー
================================================== */
function previewSingleVlogClip(
    vlogId
) {

    const clip =
        getAllVlogClips()
            .find(
                item =>
                    String(item.id) ===
                    String(vlogId)
            );

    if (
        !clip ||
        !clip.dataUrl
    ) {

        showToast(
            "動画を再生できません。",
            "error"
        );

        return;

    }

    const video =
        document.getElementById(
            "vlogPreviewVideo"
        );

    if (!video) {
        return;
    }

    stopVlogPreview();

    video.src =
        clip.dataUrl;

    video.classList.remove(
        "hidden"
    );

    video.load();

    video.play()
        .catch(
            error => {

                console.warn(error);

            }
        );

    updateVlogTheaterText(
        clip.title,
        `${clip.scene}・${formatVideoDuration(
            clip.duration
        )}`
    );

}

/* ==================================================
   20. Vlog構成プレビュー
================================================== */
function createVlogPreview() {

    const selectedLive =
        getSelectedLive();

    if (!selectedLive) {

        showToast(
            "先にライブを登録してください。",
            "warning"
        );

        return;

    }

    const clips =
        getSelectedLiveVlogClips()
            .filter(
                clip =>
                    clip.completed &&
                    clip.dataUrl
            );

    if (clips.length === 0) {

        showToast(
            "撮影済みの動画を1本以上選択してください。",
            "warning"
        );

        return;

    }

    vlogPreviewQueue =
        clips;

    vlogPreviewIndex = 0;

    playCurrentVlogPreview();

    showToast(
        `${clips.length}本の動画を順番にプレビューします。`,
        "success"
    );

}

/* ==================================================
   21. 現在の動画を再生
================================================== */
function playCurrentVlogPreview() {

    const video =
        document.getElementById(
            "vlogPreviewVideo"
        );

    if (!video) {
        return;
    }

    const clip =
        vlogPreviewQueue[
            vlogPreviewIndex
        ];

    if (!clip) {

        finishVlogPreview();

        return;

    }

    video.src =
        clip.dataUrl;

    video.classList.remove(
        "hidden"
    );

    video.load();

    updateVlogTheaterText(
        `${vlogPreviewIndex + 1} / ${vlogPreviewQueue.length}　${clip.title}`,
        `${clip.scene}・${formatVideoDuration(
            clip.duration
        )}`
    );

    video.play()
        .catch(
            error => {

                console.warn(error);

            }
        );

}

/* ==================================================
   22. 次の動画へ
================================================== */
function handleVlogPreviewEnded() {

    if (
        vlogPreviewQueue.length === 0
    ) {

        return;

    }

    vlogPreviewIndex++;

    if (
        vlogPreviewIndex >=
        vlogPreviewQueue.length
    ) {

        finishVlogPreview();

        return;

    }

    playCurrentVlogPreview();

}

/* ==================================================
   23. Vlogプレビュー完了
================================================== */
function finishVlogPreview() {

    const selectedLive =
        getSelectedLive();

    const diary =
        typeof getSelectedLiveDiary ===
            "function"
            ? getSelectedLiveDiary()
            : null;

    const video =
        document.getElementById(
            "vlogPreviewVideo"
        );

    if (video) {

        video.pause();

        video.classList.add(
            "hidden"
        );

        video.removeAttribute(
            "src"
        );

        video.load();

    }

    updateVlogTheaterText(
        selectedLive
            ? selectedLive.name
            : "Vlog完成",
        selectedLive
            ? `${formatDateJapanese(
                selectedLive.date
            )}　${diary?.memo || "素敵なライブの思い出"}`
            : "プレビューが終了しました。"
    );

    vlogPreviewQueue = [];
    vlogPreviewIndex = 0;

    showToast(
        "Vlogプレビューが終了しました。",
        "success"
    );

}

/* ==================================================
   24. プレビュー停止
================================================== */
function stopVlogPreview() {

    const video =
        document.getElementById(
            "vlogPreviewVideo"
        );

    if (video) {

        video.pause();

    }

    vlogPreviewQueue = [];
    vlogPreviewIndex = 0;

}

/* ==================================================
   25. Theater表示更新
================================================== */
function updateVlogTheaterText(
    title,
    description
) {

    const theater =
        document.getElementById(
            "vlogTheater"
        );

    if (!theater) {
        return;
    }

    const heading =
        theater.querySelector("h3");

    const paragraph =
        theater.querySelector("p");

    if (heading) {

        heading.textContent =
            title;

    }

    if (paragraph) {

        paragraph.textContent =
            description;

    }

}

/* ==================================================
   26. 一覧クリック処理
================================================== */
function handleVlogClipListClick(
    event
) {

    const previewButton =
        event.target.closest(
            ".vlog-preview-button"
        );

    const upButton =
        event.target.closest(
            ".move-vlog-up-button"
        );

    const downButton =
        event.target.closest(
            ".move-vlog-down-button"
        );

    const deleteButton =
        event.target.closest(
            ".vlog-delete-button"
        );

    if (previewButton) {

        previewSingleVlogClip(
            previewButton.dataset
                .vlogId
        );

        return;

    }

    if (upButton) {

        moveVlogClip(
            upButton.dataset.vlogId,
            "up"
        );

        return;

    }

    if (downButton) {

        moveVlogClip(
            downButton.dataset.vlogId,
            "down"
        );

        return;

    }

    if (deleteButton) {

        requestDeleteVlogClip(
            deleteButton.dataset
                .vlogId
        );

    }

}

/* ==================================================
   27. 一覧変更処理
================================================== */
function handleVlogClipListChange(
    event
) {

    const checkbox =
        event.target.closest(
            ".vlog-clip-checkbox"
        );

    const sceneSelect =
        event.target.closest(
            ".vlog-scene-select"
        );

    const titleInput =
        event.target.closest(
            ".vlog-clip-title-input"
        );

    if (checkbox) {

        toggleVlogClipCompleted(
            checkbox.dataset.vlogId,
            checkbox.checked
        );

        return;

    }

    if (sceneSelect) {

        updateVlogClipScene(
            sceneSelect.dataset.vlogId,
            sceneSelect.value
        );

        return;

    }

    if (titleInput) {

        updateVlogClipTitle(
            titleInput.dataset.vlogId,
            titleInput.value
        );

    }

}

/* ==================================================
   28. イベント登録
================================================== */
function initializeVlogEvents() {

    const input =
        document.getElementById(
            "vlogVideoInput"
        );

    input?.addEventListener(
        "change",
        handleVlogVideoInputChange
    );

    const clipList =
        document.getElementById(
            "vlogClipList"
        );

    clipList?.addEventListener(
        "click",
        handleVlogClipListClick
    );

    clipList?.addEventListener(
        "change",
        handleVlogClipListChange
    );

    const createButton =
        document.getElementById(
            "createVlogButton"
        );

    createButton?.addEventListener(
        "click",
        createVlogPreview
    );

    const previewVideo =
        document.getElementById(
            "vlogPreviewVideo"
        );

    previewVideo?.addEventListener(
        "ended",
        handleVlogPreviewEnded
    );

    document.addEventListener(
        "livemate:selectedlivechange",
        () => {

            stopVlogPreview();

            renderVlogClips();

            if (
                typeof updateVlogGuideFromTimeline ===
                "function"
            ) {

                updateVlogGuideFromTimeline();

            }

        }
    );

    document.addEventListener(
        "livemate:pagechange",
        event => {

            if (
                event.detail?.page ===
                "vlog"
            ) {

                renderVlogClips();

                if (
                    typeof updateVlogGuideFromTimeline ===
                    "function"
                ) {

                    updateVlogGuideFromTimeline();

                }

            }

        }
    );

}

/* ==================================================
   29. 初期化
================================================== */
function initializeVlogModule() {

    initializeVlogEvents();

    renderVlogClips();

}

/* ==================================================
   30. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeVlogModule
);
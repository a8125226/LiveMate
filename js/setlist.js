/* ==================================================
   1. セットリストデータ取得
================================================== */
function getAllSetlistItems() {

    const items = loadData(
        STORAGE_KEYS.setlists,
        []
    );

    return Array.isArray(items)
        ? items
        : [];

}

/* ==================================================
   2. 選択中ライブのセットリスト取得
================================================== */
function getSelectedLiveSetlist() {

    const selectedLiveId =
        getSelectedLiveId();

    if (!selectedLiveId) {
        return [];
    }

    return getAllSetlistItems()
        .filter(
            item =>
                String(item.liveId) ===
                String(selectedLiveId)
        )
        .sort(
            (a, b) =>
                Number(a.order) -
                Number(b.order)
        );

}

/* ==================================================
   3. セットリスト保存
================================================== */
function saveSetlistItems(items) {

    return saveData(
        STORAGE_KEYS.setlists,
        Array.isArray(items)
            ? items
            : []
    );

}

/* ==================================================
   4. 曲を追加
================================================== */
function handleSetlistSubmit(event) {

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

    const input =
        document.getElementById(
            "setlistSongInput"
        );

    if (!input) {
        return;
    }

    clearInputError(input);

    const songTitle =
        input.value.trim();

    if (!songTitle) {

        setInputError(
            input,
            "曲名を入力してください。"
        );

        return;

    }

    const allItems =
        getAllSetlistItems();

    const selectedItems =
        getSelectedLiveSetlist();

    const newItem = {
        id:
            generateId(
                "setlist"
            ),
        liveId:
            selectedLive.id,
        title:
            songTitle,
        order:
            selectedItems.length + 1,
        createdAt:
            new Date()
                .toISOString(),
        updatedAt:
            new Date()
                .toISOString()
    };

    saveSetlistItems([
        ...allItems,
        newItem
    ]);

    input.value = "";

    renderSetlist();

    showToast(
        "セットリストに追加しました。",
        "success"
    );

    input.focus();

}

/* ==================================================
   5. HTML生成
================================================== */
function createSetlistItemHtml(
    item,
    index
) {

    return `
        <li
            data-setlist-id="${escapeHtml(item.id)}"
        >

            <span class="setlist-song-number">
                ${index + 1}.
            </span>

            <span class="setlist-song-title">
                ${escapeHtml(item.title)}
            </span>

            <div class="setlist-item-actions">

                <button
                    type="button"
                    class="setlist-order-button move-setlist-up"
                    data-setlist-id="${escapeHtml(item.id)}"
                    aria-label="${escapeHtml(item.title)}を上へ移動"
                    title="上へ移動"
                    ${index === 0 ? "disabled" : ""}
                >
                    <i class="fa-solid fa-chevron-up"></i>
                </button>

                <button
                    type="button"
                    class="setlist-order-button move-setlist-down"
                    data-setlist-id="${escapeHtml(item.id)}"
                    aria-label="${escapeHtml(item.title)}を下へ移動"
                    title="下へ移動"
                >
                    <i class="fa-solid fa-chevron-down"></i>
                </button>

                <button
                    type="button"
                    class="setlist-delete-button"
                    data-setlist-id="${escapeHtml(item.id)}"
                    aria-label="${escapeHtml(item.title)}を削除"
                    title="削除"
                >
                    <i class="fa-regular fa-trash-can"></i>
                </button>

            </div>

        </li>
    `;

}

/* ==================================================
   6. 一覧表示
================================================== */
function renderSetlist() {

    const list =
        document.getElementById(
            "setlistList"
        );

    if (!list) {
        return;
    }

    const selectedLive =
        getSelectedLive();

    if (!selectedLive) {

        list.innerHTML = `
            <li class="setlist-empty-item">
                ライブを登録するとセットリストを保存できます。
            </li>
        `;

        return;

    }

    const items =
        getSelectedLiveSetlist();

    if (items.length === 0) {

        list.innerHTML = `
            <li class="setlist-empty-item">
                セットリストはまだ登録されていません。
            </li>
        `;

        return;

    }

    list.innerHTML =
        items
            .map(
                createSetlistItemHtml
            )
            .join("");

    const downButtons =
        list.querySelectorAll(
            ".move-setlist-down"
        );

    const lastButton =
        downButtons[
            downButtons.length - 1
        ];

    if (lastButton) {
        lastButton.disabled = true;
    }

}

/* ==================================================
   7. 並び替え
================================================== */
function moveSetlistItem(
    setlistId,
    direction
) {

    const selectedLiveId =
        getSelectedLiveId();

    if (!selectedLiveId) {
        return;
    }

    const allItems =
        getAllSetlistItems();

    const selectedItems =
        getSelectedLiveSetlist();

    const currentIndex =
        selectedItems.findIndex(
            item =>
                String(item.id) ===
                String(setlistId)
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
            selectedItems.length
    ) {

        return;

    }

    const reorderedItems = [
        ...selectedItems
    ];

    [
        reorderedItems[
            currentIndex
        ],
        reorderedItems[
            targetIndex
        ]
    ] = [
        reorderedItems[
            targetIndex
        ],
        reorderedItems[
            currentIndex
        ]
    ];

    const orderMap =
        new Map(
            reorderedItems.map(
                (item, index) => [
                    String(item.id),
                    index + 1
                ]
            )
        );

    const updatedItems =
        allItems.map(item => {

            if (
                String(item.liveId) !==
                String(selectedLiveId)
            ) {

                return item;

            }

            return {
                ...item,
                order:
                    orderMap.get(
                        String(item.id)
                    ) || item.order,
                updatedAt:
                    new Date()
                        .toISOString()
            };

        });

    saveSetlistItems(
        updatedItems
    );

    renderSetlist();

}

/* ==================================================
   8. 曲削除
================================================== */
function requestDeleteSetlistItem(
    setlistId
) {

    const item =
        getAllSetlistItems()
            .find(
                data =>
                    String(data.id) ===
                    String(setlistId)
            );

    if (!item) {
        return;
    }

    openConfirmModal({
        title:
            "曲を削除",
        message:
            `「${item.title}」をセットリストから削除しますか？`,
        confirmText:
            "削除する",
        onConfirm: () => {

            deleteSetlistItem(
                setlistId
            );

        }
    });

}

function deleteSetlistItem(
    setlistId
) {

    const selectedLiveId =
        getSelectedLiveId();

    let updatedItems =
        getAllSetlistItems()
            .filter(
                item =>
                    String(item.id) !==
                    String(setlistId)
            );

    const selectedItems =
        updatedItems
            .filter(
                item =>
                    String(item.liveId) ===
                    String(selectedLiveId)
            )
            .sort(
                (a, b) =>
                    Number(a.order) -
                    Number(b.order)
            );

    const orderMap =
        new Map(
            selectedItems.map(
                (item, index) => [
                    String(item.id),
                    index + 1
                ]
            )
        );

    updatedItems =
        updatedItems.map(
            item => {

                if (
                    String(item.liveId) !==
                    String(selectedLiveId)
                ) {

                    return item;

                }

                return {
                    ...item,
                    order:
                        orderMap.get(
                            String(item.id)
                        ) || item.order
                };

            }
        );

    saveSetlistItems(
        updatedItems
    );

    renderSetlist();

    showToast(
        "曲を削除しました。",
        "success"
    );

}

/* ==================================================
   9. 全消去
================================================== */
function requestClearSetlist() {

    const items =
        getSelectedLiveSetlist();

    if (items.length === 0) {

        showToast(
            "削除する曲がありません。"
        );

        return;

    }

    openConfirmModal({
        title:
            "セットリストを消去",
        message:
            "登録したセットリストをすべて削除しますか？",
        confirmText:
            "すべて削除",
        onConfirm:
            clearSelectedSetlist
    });

}

function clearSelectedSetlist() {

    const selectedLiveId =
        getSelectedLiveId();

    const updatedItems =
        getAllSetlistItems()
            .filter(
                item =>
                    String(item.liveId) !==
                    String(selectedLiveId)
            );

    saveSetlistItems(
        updatedItems
    );

    renderSetlist();

    showToast(
        "セットリストを消去しました。",
        "success"
    );

}

/* ==================================================
   10. テキスト作成
================================================== */
function createSetlistText() {

    const selectedLive =
        getSelectedLive();

    const items =
        getSelectedLiveSetlist();

    if (
        !selectedLive ||
        items.length === 0
    ) {

        return "";

    }

    const lines = [
        `【${selectedLive.name}】`,
        `${selectedLive.artistName}`,
        `${formatDateJapanese(
            selectedLive.date
        )} / ${selectedLive.venue}`,
        "",
        ...items.map(
            (item, index) =>
                `${index + 1}. ${item.title}`
        ),
        "",
        "#LiveMate"
    ];

    return lines.join("\n");

}

/* ==================================================
   11. クリップボードへコピー
================================================== */
async function copySetlistToClipboard() {

    const text =
        createSetlistText();

    if (!text) {

        showToast(
            "コピーするセットリストがありません。",
            "warning"
        );

        return;

    }

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard
                .writeText(text);

        } else {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value = text;
            textarea.style.position =
                "fixed";
            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();

        }

        showToast(
            "セットリストをコピーしました。",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "コピーに失敗しました。",
            "error"
        );

    }

}

/* ==================================================
   12. Canvasで画像生成
================================================== */
function drawRoundedRect(
    context,
    x,
    y,
    width,
    height,
    radius
) {

    const safeRadius =
        Math.min(
            radius,
            width / 2,
            height / 2
        );

    context.beginPath();

    context.moveTo(
        x + safeRadius,
        y
    );

    context.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        safeRadius
    );

    context.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        safeRadius
    );

    context.arcTo(
        x,
        y + height,
        x,
        y,
        safeRadius
    );

    context.arcTo(
        x,
        y,
        x + width,
        y,
        safeRadius
    );

    context.closePath();

}

function wrapCanvasText(
    context,
    text,
    maxWidth
) {

    const characters =
        [...String(text)];

    const lines = [];

    let currentLine = "";

    characters.forEach(
        character => {

            const testLine =
                currentLine +
                character;

            const width =
                context.measureText(
                    testLine
                ).width;

            if (
                width > maxWidth &&
                currentLine
            ) {

                lines.push(
                    currentLine
                );

                currentLine =
                    character;

            } else {

                currentLine =
                    testLine;

            }

        }
    );

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;

}

/* ==================================================
   13. SNS画像を書き出す
================================================== */
function exportSetlistImage() {

    const selectedLive =
        getSelectedLive();

    const items =
        getSelectedLiveSetlist();

    if (
        !selectedLive ||
        items.length === 0
    ) {

        showToast(
            "画像にするセットリストがありません。",
            "warning"
        );

        return;

    }

    const canvas =
        document.getElementById(
            "setlistShareCanvas"
        );

    if (!canvas) {

        showToast(
            "画像生成用Canvasが見つかりません。",
            "error"
        );

        return;

    }

    const context =
        canvas.getContext("2d");

    if (!context) {

        showToast(
            "画像を生成できませんでした。",
            "error"
        );

        return;

    }

    const width =
        canvas.width;

    const height =
        canvas.height;

    /* 背景 */

    const gradient =
        context.createLinearGradient(
            0,
            0,
            width,
            height
        );

    gradient.addColorStop(
        0,
        "#f2f8f6"
    );

    gradient.addColorStop(
        0.5,
        "#fff7fa"
    );

    gradient.addColorStop(
        1,
        "#fff4ee"
    );

    context.fillStyle =
        gradient;

    context.fillRect(
        0,
        0,
        width,
        height
    );

    /* メインカード */

    context.fillStyle =
        "rgba(255,255,255,0.92)";

    drawRoundedRect(
        context,
        70,
        70,
        width - 140,
        height - 140,
        52
    );

    context.fill();

    /* タイトル */

    context.fillStyle =
        "#df6489";

    context.font =
        '700 34px "M PLUS Rounded 1c", sans-serif';

    context.fillText(
        "LiveMate Setlist",
        130,
        150
    );

    context.fillStyle =
        "#292727";

    context.font =
        '800 58px "M PLUS Rounded 1c", sans-serif';

    const titleLines =
        wrapCanvasText(
            context,
            selectedLive.name,
            width - 260
        ).slice(0, 2);

    let cursorY = 235;

    titleLines.forEach(line => {

        context.fillText(
            line,
            130,
            cursorY
        );

        cursorY += 68;

    });

    context.fillStyle =
        "#777373";

    context.font =
        '700 30px "M PLUS Rounded 1c", sans-serif';

    context.fillText(
        selectedLive.artistName,
        130,
        cursorY + 8
    );

    context.font =
        '600 24px "M PLUS Rounded 1c", sans-serif';

    context.fillText(
        `${formatDateJapanese(
            selectedLive.date
        )}  ${selectedLive.venue}`,
        130,
        cursorY + 55
    );

    /* 区切り線 */

    context.strokeStyle =
        "#ece9e6";

    context.lineWidth = 3;

    context.beginPath();

    context.moveTo(
        130,
        cursorY + 95
    );

    context.lineTo(
        width - 130,
        cursorY + 95
    );

    context.stroke();

    /* 曲一覧 */

    cursorY += 155;

    const availableHeight =
        height - cursorY - 180;

    const maxRows =
        Math.max(
            1,
            Math.floor(
                availableHeight / 48
            )
        );

    const visibleItems =
        items.slice(
            0,
            maxRows
        );

    context.fillStyle =
        "#393535";

    context.font =
        '700 28px "M PLUS Rounded 1c", sans-serif';

    visibleItems.forEach(
        (item, index) => {

            const line =
                `${index + 1}. ${item.title}`;

            const wrappedLines =
                wrapCanvasText(
                    context,
                    line,
                    width - 300
                ).slice(0, 1);

            context.fillText(
                wrappedLines[0],
                150,
                cursorY
            );

            cursorY += 48;

        }
    );

    if (
        items.length >
        visibleItems.length
    ) {

        context.fillStyle =
            "#999291";

        context.font =
            '600 23px "M PLUS Rounded 1c", sans-serif';

        context.fillText(
            `ほか${items.length - visibleItems.length}曲`,
            150,
            cursorY + 5
        );

    }

    /* フッター */

    context.fillStyle =
        "#df6489";

    context.font =
        '800 26px "M PLUS Rounded 1c", sans-serif';

    context.fillText(
        "#LiveMate",
        130,
        height - 120
    );

    context.fillStyle =
        "#aaa6a6";

    context.font =
        '600 20px "M PLUS Rounded 1c", sans-serif';

    context.textAlign =
        "right";

    context.fillText(
        "Concert Concierge",
        width - 130,
        height - 120
    );

    context.textAlign =
        "left";

    /* ダウンロード */

    const safeName =
        selectedLive.name
            .replace(
                /[\\/:*?"<>|]/g,
                "_"
            )
            .slice(0, 40);

    const link =
        document.createElement("a");

    link.download =
        `${safeName}_setlist.png`;

    link.href =
        canvas.toDataURL(
            "image/png"
        );

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    showToast(
        "SNS用セットリスト画像を書き出しました。",
        "success",
        3500
    );

}

/* ==================================================
   14. 一覧操作
================================================== */
function handleSetlistClick(event) {

    const deleteButton =
        event.target.closest(
            ".setlist-delete-button"
        );

    const upButton =
        event.target.closest(
            ".move-setlist-up"
        );

    const downButton =
        event.target.closest(
            ".move-setlist-down"
        );

    if (deleteButton) {

        requestDeleteSetlistItem(
            deleteButton.dataset
                .setlistId
        );

        return;

    }

    if (upButton) {

        moveSetlistItem(
            upButton.dataset.setlistId,
            "up"
        );

        return;

    }

    if (downButton) {

        moveSetlistItem(
            downButton.dataset
                .setlistId,
            "down"
        );

    }

}

/* ==================================================
   15. イベント登録
================================================== */
function initializeSetlistEvents() {

    const form =
        document.getElementById(
            "setlistForm"
        );

    form?.addEventListener(
        "submit",
        handleSetlistSubmit
    );

    const list =
        document.getElementById(
            "setlistList"
        );

    list?.addEventListener(
        "click",
        handleSetlistClick
    );

    const clearButton =
        document.getElementById(
            "clearSetlistButton"
        );

    clearButton?.addEventListener(
        "click",
        requestClearSetlist
    );

    const copyButton =
        document.getElementById(
            "copySetlistButton"
        );

    copyButton?.addEventListener(
        "click",
        copySetlistToClipboard
    );

    const exportButton =
        document.getElementById(
            "exportSetlistImageButton"
        );

    exportButton?.addEventListener(
        "click",
        exportSetlistImage
    );

    document.addEventListener(
        "livemate:selectedlivechange",
        renderSetlist
    );

    document.addEventListener(
        "livemate:pagechange",
        event => {

            if (
                event.detail?.page ===
                "diary"
            ) {

                renderSetlist();

            }

        }
    );

}

/* ==================================================
   16. 初期化
================================================== */
function initializeSetlistModule() {

    initializeSetlistEvents();

    renderSetlist();

}

/* ==================================================
   17. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeSetlistModule
);
/* ==================================================
   1. 持ち物データ取得
================================================== */
function getChecklistItems() {

    const items = loadData(
        STORAGE_KEYS.checklist,
        []
    );

    return Array.isArray(items)
        ? items
        : [];

}

/* ==================================================
   2. 持ち物データ保存
================================================== */
function saveChecklistItems(items) {

    saveData(
        STORAGE_KEYS.checklist,
        Array.isArray(items)
            ? items
            : []
    );

}

/* ==================================================
   3. 持ち物カードHTML
================================================== */
function createChecklistItemHtml(item) {

    return `
        <article
            class="checklist-card
            ${item.checked ? "checked" : ""}"
            data-checklist-id="${escapeHtml(item.id)}"
        >

            <input
                type="checkbox"
                class="checklist-checkbox"
                id="check_${escapeHtml(item.id)}"
                data-checklist-id="${escapeHtml(item.id)}"
                ${item.checked ? "checked" : ""}
            >

            <label
                for="check_${escapeHtml(item.id)}"
            >
                ${escapeHtml(item.name)}
            </label>

            <button
                type="button"
                class="checklist-delete-button"
                data-checklist-id="${escapeHtml(item.id)}"
                aria-label="${escapeHtml(item.name)}を削除"
                title="削除"
            >
                <i class="fa-regular fa-trash-can"></i>
            </button>

        </article>
    `;

}

/* ==================================================
   4. 持ち物一覧表示
================================================== */
function renderChecklist() {

    const grid =
        document.getElementById(
            "checklistGrid"
        );

    if (!grid) {
        return;
    }

    const items =
        getChecklistItems();

    if (items.length === 0) {

        grid.innerHTML = `
            <div class="empty-message">
                持ち物が登録されていません。
            </div>
        `;

        updateChecklistProgress([]);

        return;

    }

    grid.innerHTML =
        items
            .map(createChecklistItemHtml)
            .join("");

    updateChecklistProgress(items);

}

/* ==================================================
   5. 進捗率更新
================================================== */
function updateChecklistProgress(items) {

    const percentElement =
        document.getElementById(
            "checklistPercent"
        );

    const progressBar =
        document.getElementById(
            "checklistProgressBar"
        );

    const total =
        items.length;

    const checkedCount =
        items.filter(
            item => item.checked
        ).length;

    const percent =
        total === 0
            ? 0
            : Math.round(
                checkedCount /
                total *
                100
            );

    if (percentElement) {

        percentElement.textContent =
            `${percent}%`;

    }

    if (progressBar) {

        progressBar.style.width =
            `${percent}%`;

        progressBar.parentElement
            ?.setAttribute(
                "aria-valuenow",
                String(percent)
            );

    }

}

/* ==================================================
   6. 持ち物追加
================================================== */
function handleAddChecklistItem(event) {

    event.preventDefault();

    const input =
        document.getElementById(
            "newChecklistItem"
        );

    if (!input) {
        return;
    }

    const name =
        input.value.trim();

    clearInputError(input);

    if (!name) {

        setInputError(
            input,
            "追加する持ち物を入力してください。"
        );

        return;

    }

    const items =
        getChecklistItems();

    const alreadyExists =
        items.some(
            item =>
                item.name
                    .trim()
                    .toLowerCase() ===
                name.toLowerCase()
        );

    if (alreadyExists) {

        setInputError(
            input,
            "同じ持ち物がすでに登録されています。"
        );

        return;

    }

    items.push({
        id: generateId("check"),
        name,
        checked: false,
        createdAt:
            new Date().toISOString()
    });

    saveChecklistItems(items);

    input.value = "";

    renderChecklist();

    showToast(
        "持ち物を追加しました。",
        "success"
    );

}

/* ==================================================
   7. チェック状態変更
================================================== */
function toggleChecklistItem(
    checklistId,
    checked
) {

    const items =
        getChecklistItems();

    const updatedItems =
        items.map(item => {

            if (
                String(item.id) ===
                String(checklistId)
            ) {

                return {
                    ...item,
                    checked,
                    updatedAt:
                        new Date().toISOString()
                };

            }

            return item;

        });

    saveChecklistItems(
        updatedItems
    );

    renderChecklist();

    if (
        updatedItems.length > 0 &&
        updatedItems.every(
            item => item.checked
        )
    ) {

        showToast(
            "持ち物の準備がすべて完了しました！",
            "success",
            3500
        );

    }

}

/* ==================================================
   8. 持ち物削除
================================================== */
function requestDeleteChecklistItem(
    checklistId
) {

    const item =
        getChecklistItems()
            .find(
                data =>
                    String(data.id) ===
                    String(checklistId)
            );

    if (!item) {
        return;
    }

    openConfirmModal({
        title: "持ち物を削除",
        message:
            `「${item.name}」を持ち物リストから削除しますか？`,
        confirmText: "削除する",
        onConfirm: () => {

            deleteChecklistItem(
                checklistId
            );

        }
    });

}

function deleteChecklistItem(
    checklistId
) {

    const updatedItems =
        getChecklistItems()
            .filter(
                item =>
                    String(item.id) !==
                    String(checklistId)
            );

    saveChecklistItems(
        updatedItems
    );

    renderChecklist();

    showToast(
        "持ち物を削除しました。",
        "success"
    );

}

/* ==================================================
   9. 基本リスト復元
================================================== */
function restoreDefaultChecklist() {

    const currentItems =
        getChecklistItems();

    const existingNames =
        currentItems.map(
            item =>
                item.name
                    .trim()
                    .toLowerCase()
        );

    const additionalItems =
        DEFAULT_CHECKLIST_ITEMS
            .filter(
                name =>
                    !existingNames.includes(
                        name.toLowerCase()
                    )
            )
            .map(
                name => ({
                    id: generateId("check"),
                    name,
                    checked: false,
                    createdAt:
                        new Date().toISOString()
                })
            );

    if (
        additionalItems.length === 0
    ) {

        showToast(
            "基本の持ち物はすべて登録されています。"
        );

        return;

    }

    saveChecklistItems([
        ...currentItems,
        ...additionalItems
    ]);

    renderChecklist();

    showToast(
        `${additionalItems.length}件の基本項目を復元しました。`,
        "success"
    );

}

/* ==================================================
   10. 全チェック解除
================================================== */
function resetChecklistChecks() {

    const items =
        getChecklistItems();

    if (items.length === 0) {

        showToast(
            "持ち物が登録されていません。"
        );

        return;

    }

    openConfirmModal({
        title: "チェックをリセット",
        message:
            "すべての持ち物を未チェックに戻しますか？",
        confirmText:
            "リセットする",
        onConfirm: () => {

            const resetItems =
                items.map(
                    item => ({
                        ...item,
                        checked: false,
                        updatedAt:
                            new Date().toISOString()
                    })
                );

            saveChecklistItems(
                resetItems
            );

            renderChecklist();

            showToast(
                "チェック状態をリセットしました。",
                "success"
            );

        }
    });

}

/* ==================================================
   11. 一覧クリック処理
================================================== */
function handleChecklistGridChange(
    event
) {

    const checkbox =
        event.target.closest(
            ".checklist-checkbox"
        );

    if (!checkbox) {
        return;
    }

    toggleChecklistItem(
        checkbox.dataset.checklistId,
        checkbox.checked
    );

}

function handleChecklistGridClick(
    event
) {

    const deleteButton =
        event.target.closest(
            ".checklist-delete-button"
        );

    if (!deleteButton) {
        return;
    }

    requestDeleteChecklistItem(
        deleteButton.dataset.checklistId
    );

}

/* ==================================================
   12. イベント登録
================================================== */
function initializeChecklistEvents() {

    const addForm =
        document.getElementById(
            "addChecklistForm"
        );

    if (addForm) {

        addForm.addEventListener(
            "submit",
            handleAddChecklistItem
        );

    }

    const restoreButton =
        document.getElementById(
            "restoreChecklistButton"
        );

    if (restoreButton) {

        restoreButton.addEventListener(
            "click",
            restoreDefaultChecklist
        );

        restoreButton.addEventListener(
            "dblclick",
            resetChecklistChecks
        );

    }

    const grid =
        document.getElementById(
            "checklistGrid"
        );

    if (grid) {

        grid.addEventListener(
            "change",
            handleChecklistGridChange
        );

        grid.addEventListener(
            "click",
            handleChecklistGridClick
        );

    }

    document.addEventListener(
        "livemate:pagechange",
        event => {

            if (
                event.detail?.page ===
                "checklist"
            ) {

                renderChecklist();

            }

        }
    );

}

/* ==================================================
   13. 初期化
================================================== */
function initializeChecklistModule() {

    initializeChecklistEvents();

    renderChecklist();

}

/* ==================================================
   14. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeChecklistModule
);
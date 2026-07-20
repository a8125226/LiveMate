/* ==================================================
   1. グッズデータ取得
================================================== */
function getGoodsItems() {

    const goods = loadLiveData(
        STORAGE_KEYS.goods,
        []
    );

    return Array.isArray(goods)
        ? goods
        : [];

}

/* ==================================================
   2. グッズデータ保存
================================================== */
function saveGoodsItems(goods) {

    return saveLiveData(
        STORAGE_KEYS.goods,
        Array.isArray(goods)
            ? goods
            : []
    );

}

/* ==================================================
   3. グッズ追加
================================================== */
function handleGoodsSubmit(event) {

    event.preventDefault();

    const nameInput =
        document.getElementById(
            "goodsName"
        );

    const priceInput =
        document.getElementById(
            "goodsPrice"
        );

    if (!nameInput || !priceInput) {
        return;
    }

    clearInputError(nameInput);
    clearInputError(priceInput);

    const name =
        nameInput.value.trim();

    const price =
        Number(priceInput.value);

    let valid = true;

    if (!name) {

        setInputError(
            nameInput,
            "グッズ名を入力してください。"
        );

        valid = false;

    }

    if (
        priceInput.value === "" ||
        Number.isNaN(price) ||
        price < 0
    ) {

        setInputError(
            priceInput,
            "0円以上の価格を入力してください。"
        );

        valid = false;

    }

    if (!valid) {

        showToast(
            "入力内容を確認してください。",
            "error"
        );

        return;

    }

    const goods =
        getGoodsItems();

    goods.push({
        id: generateId("goods"),
        name,
        price:
            Math.round(price),
        purchased: false,
        createdAt:
            new Date().toISOString(),
        updatedAt:
            new Date().toISOString()
    });

    saveGoodsItems(goods);

    nameInput.value = "";
    priceInput.value = "";

    renderGoods();

    notifyGoodsChanged();

    showToast(
        "グッズを追加しました。",
        "success"
    );

    nameInput.focus();

}

/* ==================================================
   4. グッズ行HTML
================================================== */
function createGoodsRowHtml(item) {

    return `
        <tr
            class="${item.purchased ? "purchased" : ""}"
            data-goods-id="${escapeHtml(item.id)}"
        >

            <td class="purchase-column">

                <input
                    type="checkbox"
                    class="goods-purchased-checkbox"
                    data-goods-id="${escapeHtml(item.id)}"
                    aria-label="${escapeHtml(item.name)}を購入済みにする"
                    ${item.purchased ? "checked" : ""}
                >

            </td>

            <td class="goods-name-cell">
                ${escapeHtml(item.name)}
            </td>

            <td class="goods-price-cell">
                ${escapeHtml(
                    formatCurrency(item.price)
                )}
            </td>

            <td class="operation-column">

                <button
                    type="button"
                    class="goods-delete-button"
                    data-goods-id="${escapeHtml(item.id)}"
                    aria-label="${escapeHtml(item.name)}を削除"
                    title="削除"
                >
                    <i class="fa-regular fa-trash-can"></i>
                </button>

            </td>

        </tr>
    `;

}

/* ==================================================
   5. グッズ一覧表示
================================================== */
function renderGoods() {

    const tableBody =
        document.getElementById(
            "goodsTableBody"
        );

    if (!tableBody) {
        return;
    }

    const goods =
        getGoodsItems();

    if (goods.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-message">
                        購入予定のグッズはありません。
                    </div>
                </td>
            </tr>
        `;

        updateGoodsSummary(goods);

        return;

    }

    const sortedGoods =
        [...goods].sort(
            (a, b) => {

                if (
                    a.purchased !==
                    b.purchased
                ) {

                    return (
                        Number(a.purchased) -
                        Number(b.purchased)
                    );

                }

                return (
                    new Date(a.createdAt) -
                    new Date(b.createdAt)
                );

            }
        );

    tableBody.innerHTML =
        sortedGoods
            .map(createGoodsRowHtml)
            .join("");

    updateGoodsSummary(goods);

}

/* ==================================================
   6. グッズ集計表示
================================================== */
function updateGoodsSummary(goods) {

    const totalCount =
        goods.length;

    const purchasedItems =
        goods.filter(
            item => item.purchased
        );

    const purchasedCount =
        purchasedItems.length;

    const plannedTotal =
        goods.reduce(
            (total, item) =>
                total +
                toSafeNumber(item.price),
            0
        );

    const purchasedTotal =
        purchasedItems.reduce(
            (total, item) =>
                total +
                toSafeNumber(item.price),
            0
        );

    let summary =
        document.getElementById(
            "goodsSummary"
        );

    if (!summary) {

        const wrapper =
            document.querySelector(
                ".goods-table-wrapper"
            );

        if (!wrapper) {
            return;
        }

        summary =
            document.createElement(
                "div"
            );

        summary.id =
            "goodsSummary";

        summary.className =
            "goods-summary";

        wrapper.insertAdjacentElement(
            "afterend",
            summary
        );

    }

    summary.innerHTML = `
        <div class="goods-summary-item">
            <span>登録数</span>
            <strong>${totalCount}点</strong>
        </div>

        <div class="goods-summary-item">
            <span>購入済み</span>
            <strong>${purchasedCount}点</strong>
        </div>

        <div class="goods-summary-item">
            <span>購入予定合計</span>
            <strong>${escapeHtml(
                formatCurrency(plannedTotal)
            )}</strong>
        </div>

        <div class="goods-summary-item highlight">
            <span>購入済み合計</span>
            <strong>${escapeHtml(
                formatCurrency(purchasedTotal)
            )}</strong>
        </div>
    `;

}

/* ==================================================
   7. 購入状態変更
================================================== */
function toggleGoodsPurchased(
    goodsId,
    purchased
) {

    const goods =
        getGoodsItems();

    const updatedGoods =
        goods.map(item => {

            if (
                String(item.id) ===
                String(goodsId)
            ) {

                return {
                    ...item,
                    purchased,
                    updatedAt:
                        new Date().toISOString()
                };

            }

            return item;

        });

    saveGoodsItems(
        updatedGoods
    );

    renderGoods();

    notifyGoodsChanged();

    const selectedItem =
        updatedGoods.find(
            item =>
                String(item.id) ===
                String(goodsId)
        );

    showToast(
        purchased
            ? `「${selectedItem?.name || "グッズ"}」を購入済みにしました。`
            : `「${selectedItem?.name || "グッズ"}」を未購入に戻しました。`,
        "success"
    );

}

/* ==================================================
   8. グッズ削除
================================================== */
function requestDeleteGoods(
    goodsId
) {

    const item =
        getGoodsItems()
            .find(
                goods =>
                    String(goods.id) ===
                    String(goodsId)
            );

    if (!item) {
        return;
    }

    openConfirmModal({
        title: "グッズを削除",
        message:
            `「${item.name}」をグッズリストから削除しますか？`,
        confirmText:
            "削除する",
        onConfirm: () => {

            deleteGoods(
                goodsId
            );

        }
    });

}

function deleteGoods(goodsId) {

    const updatedGoods =
        getGoodsItems()
            .filter(
                item =>
                    String(item.id) !==
                    String(goodsId)
            );

    saveGoodsItems(
        updatedGoods
    );

    renderGoods();

    notifyGoodsChanged();

    showToast(
        "グッズを削除しました。",
        "success"
    );

}

/* ==================================================
   9. グッズ変更通知
================================================== */
function notifyGoodsChanged() {

    document.dispatchEvent(
        new CustomEvent(
            "livemate:goodschanged",
            {
                detail: {
                    goods:
                        getGoodsItems()
                }
            }
        )
    );

}

/* ==================================================
   10. グッズ一覧操作
================================================== */
function handleGoodsTableChange(
    event
) {

    const checkbox =
        event.target.closest(
            ".goods-purchased-checkbox"
        );

    if (!checkbox) {
        return;
    }

    toggleGoodsPurchased(
        checkbox.dataset.goodsId,
        checkbox.checked
    );

}

function handleGoodsTableClick(
    event
) {

    const deleteButton =
        event.target.closest(
            ".goods-delete-button"
        );

    if (!deleteButton) {
        return;
    }

    requestDeleteGoods(
        deleteButton.dataset.goodsId
    );

}

/* ==================================================
   11. 予算連携ボタン
================================================== */
function handleSyncGoodsBudget() {

    if (
        typeof syncGoodsCostToBudget !==
        "function"
    ) {

        showToast(
            "予算機能を読み込めませんでした。",
            "error"
        );

        return;

    }

    syncGoodsCostToBudget({
        showMessage: true
    });

}

/* ==================================================
   12. イベント登録
================================================== */
function initializeGoodsEvents() {

    const form =
        document.getElementById(
            "goodsForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            handleGoodsSubmit
        );

    }

    const tableBody =
        document.getElementById(
            "goodsTableBody"
        );

    if (tableBody) {

        tableBody.addEventListener(
            "change",
            handleGoodsTableChange
        );

        tableBody.addEventListener(
            "click",
            handleGoodsTableClick
        );

    }

    const syncButton =
        document.getElementById(
            "syncGoodsBudgetButton"
        );

    if (syncButton) {

        syncButton.addEventListener(
            "click",
            handleSyncGoodsBudget
        );

    }


    document.addEventListener(
        "livemate:selectedlivechange",
        () => {
            renderGoods();
        }
    );

    document.addEventListener(
        "livemate:pagechange",
        event => {

            if (
                event.detail?.page ===
                "goods"
            ) {

                renderGoods();

            }

        }
    );

}

/* ==================================================
   13. 初期化
================================================== */
function initializeGoodsModule() {

    initializeGoodsEvents();

    renderGoods();

}

/* ==================================================
   14. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeGoodsModule
);
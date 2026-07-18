let budgetChartInstance = null;

/* ==================================================
   1. 予算データ取得
================================================== */
function getBudgetData() {

    const budget = loadData(
        STORAGE_KEYS.budget,
        DEFAULT_BUDGET
    );

    if (
        !budget ||
        typeof budget !== "object" ||
        Array.isArray(budget)
    ) {

        return {
            ...DEFAULT_BUDGET
        };

    }

    return {
        total: toSafeNumber(budget.total),
        ticket: toSafeNumber(budget.ticket),
        goods: toSafeNumber(budget.goods),
        transport: toSafeNumber(
            budget.transport
        ),
        hotel: toSafeNumber(budget.hotel),
        food: toSafeNumber(budget.food),
        other: toSafeNumber(budget.other),
        updatedAt:
            budget.updatedAt || null
    };

}

/* ==================================================
   2. 予算データ保存
================================================== */
function saveBudgetData(budget) {

    return saveData(
        STORAGE_KEYS.budget,
        {
            ...DEFAULT_BUDGET,
            ...budget,
            updatedAt:
                new Date().toISOString()
        }
    );

}

/* ==================================================
   3. フォーム要素取得
================================================== */
function getBudgetFormElements() {

    return {
        form:
            document.getElementById(
                "budgetForm"
            ),
        total:
            document.getElementById(
                "totalBudget"
            ),
        ticket:
            document.getElementById(
                "ticketCost"
            ),
        goods:
            document.getElementById(
                "goodsCost"
            ),
        transport:
            document.getElementById(
                "transportCost"
            ),
        hotel:
            document.getElementById(
                "hotelCost"
            ),
        food:
            document.getElementById(
                "foodCost"
            ),
        other:
            document.getElementById(
                "otherCost"
            )
    };

}

/* ==================================================
   4. フォームから予算取得
================================================== */
function getBudgetFromForm() {

    const elements =
        getBudgetFormElements();

    return {
        total:
            toSafeNumber(
                elements.total?.value
            ),
        ticket:
            toSafeNumber(
                elements.ticket?.value
            ),
        goods:
            toSafeNumber(
                elements.goods?.value
            ),
        transport:
            toSafeNumber(
                elements.transport?.value
            ),
        hotel:
            toSafeNumber(
                elements.hotel?.value
            ),
        food:
            toSafeNumber(
                elements.food?.value
            ),
        other:
            toSafeNumber(
                elements.other?.value
            )
    };

}

/* ==================================================
   5. 予算計算
================================================== */
function calculateBudgetSummary(
    budget
) {

    const totalSpent =
        budget.ticket +
        budget.goods +
        budget.transport +
        budget.hotel +
        budget.food +
        budget.other;

    const remaining =
        budget.total -
        totalSpent;

    return {
        totalSpent,
        remaining
    };

}

/* ==================================================
   6. フォーム表示
================================================== */
function fillBudgetForm(
    budget = getBudgetData()
) {

    const elements =
        getBudgetFormElements();

    if (elements.total) {
        elements.total.value =
            budget.total;
    }

    if (elements.ticket) {
        elements.ticket.value =
            budget.ticket;
    }

    if (elements.goods) {
        elements.goods.value =
            budget.goods;
    }

    if (elements.transport) {
        elements.transport.value =
            budget.transport;
    }

    if (elements.hotel) {
        elements.hotel.value =
            budget.hotel;
    }

    if (elements.food) {
        elements.food.value =
            budget.food;
    }

    if (elements.other) {
        elements.other.value =
            budget.other;
    }

}

/* ==================================================
   7. 予算表示更新
================================================== */
function renderBudgetSummary(
    budget = getBudgetData()
) {

    const {
        totalSpent,
        remaining
    } = calculateBudgetSummary(
        budget
    );

    const remainingElement =
        document.getElementById(
            "remainingBudget"
        );

    const totalSpentElement =
        document.getElementById(
            "totalSpent"
        );

    const chartBudgetText =
        document.getElementById(
            "chartBudgetText"
        );

    if (remainingElement) {

        remainingElement.textContent =
            formatCurrency(remaining);

        remainingElement.classList.toggle(
            "negative-value",
            remaining < 0
        );

    }

    if (totalSpentElement) {

        totalSpentElement.textContent =
            formatCurrency(totalSpent);

    }

    if (chartBudgetText) {

        chartBudgetText.textContent =
            `予算: ${formatCurrency(
                budget.total
            )}`;

    }

}

/* ==================================================
   8. 凡例データ
================================================== */
function getBudgetCategories(
    budget
) {

    return [
        {
            key: "ticket",
            label: "チケット",
            value: budget.ticket,
            color: "#df6489"
        },
        {
            key: "goods",
            label: "グッズ",
            value: budget.goods,
            color: "#7c83f6"
        },
        {
            key: "transport",
            label: "交通費",
            value: budget.transport,
            color: "#28a6d8"
        },
        {
            key: "hotel",
            label: "宿泊費",
            value: budget.hotel,
            color: "#17b985"
        },
        {
            key: "food",
            label: "食費",
            value: budget.food,
            color: "#f7bb05"
        },
        {
            key: "other",
            label: "その他",
            value: budget.other,
            color: "#b3a59d"
        }
    ];

}

/* ==================================================
   9. 円グラフ表示
================================================== */
function renderBudgetChart(
    budget = getBudgetData()
) {

    const canvas =
        document.getElementById(
            "budgetChart"
        );

    if (!canvas) {
        return;
    }

    const categories =
        getBudgetCategories(
            budget
        );

    const values =
        categories.map(
            category =>
                category.value
        );

    const hasSpending =
        values.some(
            value => value > 0
        );

    const chartValues =
        hasSpending
            ? values
            : [1];

    const chartLabels =
        hasSpending
            ? categories.map(
                category =>
                    category.label
            )
            : ["支出なし"];

    const chartColors =
        hasSpending
            ? categories.map(
                category =>
                    category.color
            )
            : ["#ece9e6"];

    if (budgetChartInstance) {

        budgetChartInstance.destroy();

    }

    if (
        typeof Chart === "undefined"
    ) {

        console.warn(
            "Chart.jsが読み込まれていません。"
        );

        return;

    }

    budgetChartInstance =
        new Chart(
            canvas,
            {
                type: "doughnut",
                data: {
                    labels:
                        chartLabels,
                    datasets: [
                        {
                            data:
                                chartValues,
                            backgroundColor:
                                chartColors,
                            borderColor:
                                "#ffffff",
                            borderWidth: 4,
                            hoverOffset: 8
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio:
                        false,
                    cutout: "67%",
                    animation: {
                        duration: 450
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled:
                                hasSpending,
                            callbacks: {
                                label:
                                    context => {

                                        const value =
                                            Number(
                                                context.raw
                                            ) || 0;

                                        return (
                                            `${context.label}: ` +
                                            formatCurrency(
                                                value
                                            )
                                        );

                                    }
                            }
                        }
                    }
                }
            }
        );

}

/* ==================================================
   10. 凡例表示
================================================== */
function renderBudgetLegend(
    budget = getBudgetData()
) {

    const legend =
        document.getElementById(
            "budgetLegend"
        );

    if (!legend) {
        return;
    }

    const categories =
        getBudgetCategories(
            budget
        );

    legend.innerHTML =
        categories
            .map(category => `
                <div class="budget-legend-item">

                    <span
                        class="legend-dot"
                        style="background:${category.color}"
                    ></span>

                    <span>
                        ${escapeHtml(category.label)}
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatCurrency(
                                category.value
                            )
                        )}
                    </strong>

                </div>
            `)
            .join("");

}

/* ==================================================
   11. 予算UI一括更新
================================================== */
function renderBudgetUI({
    fillForm = true
} = {}) {

    const budget =
        getBudgetData();

    if (fillForm) {

        fillBudgetForm(
            budget
        );

    }

    renderBudgetSummary(
        budget
    );

    renderBudgetChart(
        budget
    );

    renderBudgetLegend(
        budget
    );

}

/* ==================================================
   12. フォーム保存
================================================== */
function handleBudgetSubmit(
    event
) {

    event.preventDefault();

    const budget =
        getBudgetFromForm();

    const {
        totalSpent
    } = calculateBudgetSummary(
        budget
    );

    if (
        budget.total > 0 &&
        totalSpent >
            budget.total
    ) {

        const overAmount =
            totalSpent -
            budget.total;

        openConfirmModal({
            title:
                "予算を超えています",
            message:
                `支出予定が予算を${formatCurrency(overAmount)}超えています。` +
                "この内容で保存しますか？",
            confirmText:
                "保存する",
            onConfirm: () => {

                finalizeBudgetSave(
                    budget
                );

            }
        });

        return;

    }

    finalizeBudgetSave(
        budget
    );

}

/* ==================================================
   13. 保存確定
================================================== */
function finalizeBudgetSave(
    budget
) {

    const saved =
        saveBudgetData(
            budget
        );

    if (!saved) {

        showToast(
            "予算の保存に失敗しました。",
            "error"
        );

        return;

    }

    renderBudgetUI();

    const {
        remaining
    } = calculateBudgetSummary(
        budget
    );

    if (remaining < 0) {

        showToast(
            "予算を超えた状態で保存しました。",
            "warning",
            3500
        );

    } else {

        showToast(
            "予算を保存しました。",
            "success"
        );

    }

}

/* ==================================================
   14. 入力中のプレビュー
================================================== */
function handleBudgetInput() {

    const budget =
        getBudgetFromForm();

    renderBudgetSummary(
        budget
    );

    renderBudgetChart(
        budget
    );

    renderBudgetLegend(
        budget
    );

}

/* ==================================================
   15. 予算初期化
================================================== */
function requestResetBudget() {

    openConfirmModal({
        title: "予算を初期化",
        message:
            "入力した予算と支出をすべて0円に戻しますか？",
        confirmText:
            "初期化する",
        onConfirm:
            resetBudget
    });

}

function resetBudget() {

    saveBudgetData({
        ...DEFAULT_BUDGET
    });

    renderBudgetUI();

    showToast(
        "予算を初期化しました。",
        "success"
    );

}

/* ==================================================
   16. グッズ代自動反映
================================================== */
function getPurchasedGoodsTotal() {

    const goods =
        loadData(
            STORAGE_KEYS.goods,
            []
        );

    if (!Array.isArray(goods)) {
        return 0;
    }

    return goods
        .filter(
            item => item.purchased
        )
        .reduce(
            (
                total,
                item
            ) =>
                total +
                toSafeNumber(
                    item.price
                ),
            0
        );

}

function syncGoodsCostToBudget({
    showMessage = true
} = {}) {

    const purchasedTotal =
        getPurchasedGoodsTotal();

    const budget =
        getBudgetData();

    budget.goods =
        purchasedTotal;

    saveBudgetData(
        budget
    );

    renderBudgetUI();

    if (showMessage) {

        showToast(
            `購入済みグッズ代${formatCurrency(purchasedTotal)}を予算に反映しました。`,
            "success"
        );

    }

    document.dispatchEvent(
        new CustomEvent(
            "livemate:budgetchange",
            {
                detail: {
                    budget
                }
            }
        )
    );

}

/* ==================================================
   17. イベント登録
================================================== */
function initializeBudgetEvents() {

    const elements =
        getBudgetFormElements();

    if (elements.form) {

        elements.form.addEventListener(
            "submit",
            handleBudgetSubmit
        );

        elements.form.addEventListener(
            "input",
            handleBudgetInput
        );

    }

    const resetButton =
        document.getElementById(
            "resetBudgetButton"
        );

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            requestResetBudget
        );

    }

    const syncButton =
        document.getElementById(
            "syncGoodsBudgetButton"
        );

    if (syncButton) {

        syncButton.addEventListener(
            "click",
            () => {

                syncGoodsCostToBudget({
                    showMessage: true
                });

            }
        );

    }

    document.addEventListener(
        "livemate:pagechange",
        event => {

            if (
                event.detail?.page ===
                "budget"
            ) {

                renderBudgetUI();

            }

        }
    );

    document.addEventListener(
        "livemate:goodschanged",
        () => {

            syncGoodsCostToBudget({
                showMessage: false
            });

        }
    );

}

/* ==================================================
   18. 初期化
================================================== */
function initializeBudgetModule() {

    initializeBudgetEvents();

    renderBudgetUI();

}

/* ==================================================
   19. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeBudgetModule
);
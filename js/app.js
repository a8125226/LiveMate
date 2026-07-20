let currentPage = "home";
let pendingConfirmAction = null;
let toastTimer = null;

/* ==================================================
   1. ページ要素の取得
================================================== */
function getPageElement(pageName) {

    return document.querySelector(
        `.page[data-page="${pageName}"]`
    );

}

function getNavigationButtons() {

    return document.querySelectorAll(
        ".nav-button"
    );

}


/* ==================================================
   2. ページ切り替え
================================================== */
function showPage(pageName) {

    const targetPage = getPageElement(pageName);

    if (!targetPage) {

        console.warn(
            `ページが見つかりません: ${pageName}`
        );

        return;

    }

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active-page"
            );

        });

    targetPage.classList.add(
        "active-page"
    );

    getNavigationButtons()
        .forEach(button => {

            const isActive =
                button.dataset.page === pageName;

            button.classList.toggle(
                "active",
                isActive
            );

            button.setAttribute(
                "aria-current",
                isActive ? "page" : "false"
            );

        });

    currentPage = pageName;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    document.dispatchEvent(
        new CustomEvent(
            "livemate:pagechange",
            {
                detail: {
                    page: pageName
                }
            }
        )
    );

}

/* ==================================================
   3. ナビゲーション設定
================================================== */
function initializeNavigation() {

    getNavigationButtons()
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const pageName =
                        button.dataset.page;

                    showPage(pageName);

                }
            );

        });

}


/* ==================================================
   4. 完了通知
================================================== */
function showToast(
    message,
    type = "normal",
    duration = 2600
) {

    const toast =
        document.getElementById("toast");

    if (!toast) {
        return;
    }

    clearTimeout(toastTimer);

    toast.textContent = message;

    toast.classList.remove(
        "success",
        "error",
        "warning"
    );

    if (
        type === "success" ||
        type === "error" ||
        type === "warning"
    ) {

        toast.classList.add(type);

    }

    toast.classList.add("show");

    toastTimer = setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        duration
    );

}

/* ==================================================
   5. 確認モーダル
================================================== */
function openConfirmModal({
    title = "確認",
    message = "この操作を実行しますか？",
    confirmText = "実行する",
    onConfirm = null
} = {}) {

    const modal =
        document.getElementById(
            "confirmModal"
        );

    const titleElement =
        document.getElementById(
            "confirmModalTitle"
        );

    const messageElement =
        document.getElementById(
            "confirmModalMessage"
        );

    const confirmButton =
        document.getElementById(
            "confirmModalOkButton"
        );

    if (
        !modal ||
        !titleElement ||
        !messageElement ||
        !confirmButton
    ) {

        const accepted =
            window.confirm(message);

        if (
            accepted &&
            typeof onConfirm === "function"
        ) {

            onConfirm();

        }

        return;

    }

    titleElement.textContent = title;
    messageElement.textContent = message;
    confirmButton.textContent = confirmText;

    pendingConfirmAction =
        typeof onConfirm === "function"
            ? onConfirm
            : null;

    modal.classList.remove("hidden");

    document.body.style.overflow =
        "hidden";

    confirmButton.focus();

}

function closeConfirmModal() {

    const modal =
        document.getElementById(
            "confirmModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");

    document.body.style.overflow = "";

    pendingConfirmAction = null;

}

function initializeConfirmModal() {

    const modal =
        document.getElementById(
            "confirmModal"
        );

    const cancelButton =
        document.getElementById(
            "confirmModalCancelButton"
        );

    const confirmButton =
        document.getElementById(
            "confirmModalOkButton"
        );

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeConfirmModal
        );

    }

    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            () => {

                const action =
                    pendingConfirmAction;

                closeConfirmModal();

                if (
                    typeof action ===
                    "function"
                ) {

                    action();

                }

            }
        );

    }

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeConfirmModal();

                }

            }
        );

    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal &&
                !modal.classList.contains(
                    "hidden"
                )
            ) {

                closeConfirmModal();

            }

        }
    );

}

/* ==================================================
   6. 入力エラー表示
================================================== */
function setInputError(
    input,
    message = ""
) {

    if (!input) {
        return;
    }

    input.classList.add(
        "input-error"
    );

    let errorElement =
        input.parentElement
            ?.querySelector(
                ".error-text"
            );

    if (!errorElement) {

        errorElement =
            document.createElement("p");

        errorElement.className =
            "error-text";

        input.insertAdjacentElement(
            "afterend",
            errorElement
        );

    }

    errorElement.textContent = message;

}

function clearInputError(input) {

    if (!input) {
        return;
    }

    input.classList.remove(
        "input-error"
    );

    const errorElement =
        input.parentElement
            ?.querySelector(
                ".error-text"
            );

    if (errorElement) {
        errorElement.remove();
    }

}

function clearFormErrors(form) {

    if (!form) {
        return;
    }

    form
        .querySelectorAll(
            ".input-error"
        )
        .forEach(input => {

            input.classList.remove(
                "input-error"
            );

        });

    form
        .querySelectorAll(
            ".error-text"
        )
        .forEach(error => {

            error.remove();

        });

}

/* ==================================================
   7. 必須入力確認
================================================== */
function validateRequiredFields(
    fields
) {

    let valid = true;

    fields.forEach(fieldData => {

        const input = fieldData.input;

        const label =
            fieldData.label ||
            "この項目";

        if (!input) {
            return;
        }

        clearInputError(input);

        const value =
            String(
                input.value ?? ""
            ).trim();

        if (!value) {

            setInputError(
                input,
                `${label}を入力してください。`
            );

            valid = false;

        }

    });

    return valid;

}

/* ==================================================
   8. 日付・時刻確認
================================================== */
function validateTimeOrder(
    openTimeInput,
    startTimeInput
) {

    if (
        !openTimeInput ||
        !startTimeInput
    ) {

        return true;

    }

    clearInputError(
        startTimeInput
    );

    const openTime =
        openTimeInput.value;

    const startTime =
        startTimeInput.value;

    if (
        !openTime ||
        !startTime
    ) {

        return true;

    }

    if (startTime < openTime) {

        setInputError(
            startTimeInput,
            "開演時間は開場時間より後に設定してください。"
        );

        return false;

    }

    return true;

}

/* ==================================================
   9. ヘッダー情報更新
================================================== */
function updateHeaderStatus() {

    const artistElement =
        document.getElementById(
            "headerArtist"
        );

    const countdownElement =
        document.getElementById(
            "headerCountdown"
        );

    const selectedLive =
        getSelectedLive();

    if (artistElement) {

        artistElement.textContent =
            selectedLive
                ? selectedLive.artistName ||
                  selectedLive.name ||
                  "未登録"
                : "未登録";

    }

    if (
        countdownElement &&
        !selectedLive
    ) {

        countdownElement.textContent =
            "--";

    }

}


/* ==================================================
   10. 外部リンク
================================================== */
function openExternalUrl(url) {

    if (!url) {

        showToast(
            "リンクを開けませんでした。",
            "error"
        );

        return;

    }

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}

/* ==================================================
   11. Google Maps検索URL
================================================== */
function createGoogleMapsSearchUrl(
    keyword
) {

    const query =
        encodeURIComponent(
            keyword.trim()
        );

    return (
        "https://www.google.com/maps/search/" +
        `?api=1&query=${query}`
    );

}

function createGoogleMapsRouteUrl(
    origin,
    destination
) {

    const originQuery =
        encodeURIComponent(
            origin.trim()
        );

    const destinationQuery =
        encodeURIComponent(
            destination.trim()
        );

    return (
        "https://www.google.com/maps/dir/" +
        `?api=1&origin=${originQuery}` +
        `&destination=${destinationQuery}`
    );

}

/* ==================================================
   12. ページ変更時の共通更新
================================================== */
function initializePageChangeListener() {

    document.addEventListener(
        "livemate:pagechange",
        event => {

            const page =
                event.detail?.page;

            if (!page) {
                return;
            }

            updateHeaderStatus();

        }
    );

}

/* ==================================================
   13. ライブ追加ボタン
================================================== */
function initializeHomeButtons() {

    const showLiveFormButton =
        document.getElementById(
            "showLiveFormButton"
        );

    if (showLiveFormButton) {

        showLiveFormButton.addEventListener(
            "click",
            () => {

                showPage("home");

                const liveForm =
                    document.getElementById(
                        "liveForm"
                    );

                if (liveForm) {

                    liveForm.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                    const liveNameInput =
                        document.getElementById(
                            "liveName"
                        );

                    liveNameInput?.focus();

                }

            }
        );

    }

}

/* ==================================================
   14. フォーム入力時にエラー解除
================================================== */
function initializeInputErrorClear() {

    document.addEventListener(
        "input",
        event => {

            const target =
                event.target;

            if (
                target instanceof
                HTMLInputElement ||
                target instanceof
                HTMLTextAreaElement ||
                target instanceof
                HTMLSelectElement
            ) {

                clearInputError(
                    target
                );

            }

        }
    );

}

/* ==================================================
   15. HTMLの重複送信防止
================================================== */
function disableButtonTemporarily(
    button,
    duration = 650
) {

    if (!button) {
        return;
    }

    button.disabled = true;

    setTimeout(
        () => {

            button.disabled = false;

        },
        duration
    );

}

/* ==================================================
   16. 初期ページ決定
================================================== */
function initializeCurrentPage() {

    const activePage =
        document.querySelector(
            ".page.active-page"
        );

    if (
        activePage?.dataset.page
    ) {

        currentPage =
            activePage.dataset.page;

    } else {

        showPage("home");

    }

}

/* ==================================================
   17. アプリ初期化
================================================== */
function initializeApp() {

    initializeNavigation();

    initializeConfirmModal();

    initializePageChangeListener();

    initializeHomeButtons();

    initializeInputErrorClear();

    initializeCurrentPage();

    updateHeaderStatus();

}

/* ==================================================
   18. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
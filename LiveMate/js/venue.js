/* ==================================================
   1. 会場データ取得
================================================== */
function getAllVenueData() {

    const data = loadData(
        STORAGE_KEYS.venueData,
        {}
    );

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {

        return {};

    }

    return data;

}

/* ==================================================
   2. 選択中ライブの会場データ取得
================================================== */
function getSelectedVenueData() {

    const selectedLiveId =
        getSelectedLiveId();

    if (!selectedLiveId) {

        return {
            nearestStation: "",
            meetingPlace: "",
            meetingTime: "",
            entranceGate: "",
            lockerInfo: "",
            memo: ""
        };

    }

    const allVenueData =
        getAllVenueData();

    const venueData =
        allVenueData[selectedLiveId];

    if (
        !venueData ||
        typeof venueData !== "object"
    ) {

        return {
            nearestStation: "",
            meetingPlace: "",
            meetingTime: "",
            entranceGate: "",
            lockerInfo: "",
            memo: ""
        };

    }

    return {
        nearestStation:
            venueData.nearestStation || "",
        meetingPlace:
            venueData.meetingPlace || "",
        meetingTime:
            venueData.meetingTime || "",
        entranceGate:
            venueData.entranceGate || "",
        lockerInfo:
            venueData.lockerInfo || "",
        memo:
            venueData.memo || "",
        updatedAt:
            venueData.updatedAt || null
    };

}

/* ==================================================
   3. 会場フォーム要素
================================================== */
function getVenueFormElements() {

    return {
        form:
            document.getElementById(
                "venueForm"
            ),
        nearestStation:
            document.getElementById(
                "nearestStation"
            ),
        meetingPlace:
            document.getElementById(
                "meetingPlace"
            ),
        meetingTime:
            document.getElementById(
                "meetingTime"
            ),
        entranceGate:
            document.getElementById(
                "entranceGate"
            ),
        lockerInfo:
            document.getElementById(
                "lockerInfo"
            ),
        memo:
            document.getElementById(
                "venueMemo"
            )
    };

}

/* ==================================================
   4. フォームへ表示
================================================== */
function fillVenueForm() {

    const elements =
        getVenueFormElements();

    if (!elements.form) {
        return;
    }

    const venueData =
        getSelectedVenueData();

    elements.nearestStation.value =
        venueData.nearestStation;

    elements.meetingPlace.value =
        venueData.meetingPlace;

    elements.meetingTime.value =
        venueData.meetingTime;

    elements.entranceGate.value =
        venueData.entranceGate;

    elements.lockerInfo.value =
        venueData.lockerInfo;

    elements.memo.value =
        venueData.memo;

}

/* ==================================================
   5. 会場情報保存
================================================== */
function handleVenueSubmit(event) {

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
        getVenueFormElements();

    const allVenueData =
        getAllVenueData();

    allVenueData[selectedLive.id] = {
        nearestStation:
            elements.nearestStation.value.trim(),
        meetingPlace:
            elements.meetingPlace.value.trim(),
        meetingTime:
            elements.meetingTime.value,
        entranceGate:
            elements.entranceGate.value.trim(),
        lockerInfo:
            elements.lockerInfo.value.trim(),
        memo:
            elements.memo.value.trim(),
        updatedAt:
            new Date().toISOString()
    };

    const saved =
        saveData(
            STORAGE_KEYS.venueData,
            allVenueData
        );

    if (!saved) {

        showToast(
            "会場情報の保存に失敗しました。",
            "error"
        );

        return;

    }

    showToast(
        "会場情報を保存しました。",
        "success"
    );

}

/* ==================================================
   6. 検索対象の会場名
================================================== */
function getVenueSearchBase() {

    const selectedLive =
        getSelectedLive();

    const venueData =
        getSelectedVenueData();

    if (selectedLive?.venue) {

        return selectedLive.venue;

    }

    if (venueData.nearestStation) {

        return venueData.nearestStation;

    }

    return "";

}

/* ==================================================
   7. 周辺スポット検索
================================================== */
function searchNearbySpot(category) {

    const baseLocation =
        getVenueSearchBase();

    if (!baseLocation) {

        showToast(
            "会場または最寄り駅を登録してください。",
            "warning"
        );

        return;

    }

    const keyword =
        `${baseLocation} 周辺 ${category}`;

    const url =
        createGoogleMapsSearchUrl(
            keyword
        );

    openExternalUrl(url);

}

/* ==================================================
   8. カテゴリ検索
================================================== */
function handleSpotCategoryClick(event) {

    const button =
        event.target.closest(
            ".spot-category-button"
        );

    if (!button) {
        return;
    }

    const category =
        button.dataset.category;

    if (!category) {
        return;
    }

    searchNearbySpot(category);

}

/* ==================================================
   9. 自由検索
================================================== */
function handleCustomSpotSearch(event) {

    event.preventDefault();

    const input =
        document.getElementById(
            "customSpotKeyword"
        );

    if (!input) {
        return;
    }

    clearInputError(input);

    const keyword =
        input.value.trim();

    if (!keyword) {

        setInputError(
            input,
            "検索キーワードを入力してください。"
        );

        return;

    }

    const baseLocation =
        getVenueSearchBase();

    if (!baseLocation) {

        showToast(
            "会場または最寄り駅を登録してください。",
            "warning"
        );

        return;

    }

    const searchKeyword =
        `${baseLocation} 周辺 ${keyword}`;

    const url =
        createGoogleMapsSearchUrl(
            searchKeyword
        );

    openExternalUrl(url);

}

/* ==================================================
   10. 選択ライブ変更時
================================================== */
function handleSelectedLiveChange() {

    fillVenueForm();

}

/* ==================================================
   11. イベント登録
================================================== */
function initializeVenueEvents() {

    const elements =
        getVenueFormElements();

    if (elements.form) {

        elements.form.addEventListener(
            "submit",
            handleVenueSubmit
        );

    }

    const spotGrid =
        document.querySelector(
            ".spot-category-grid"
        );

    if (spotGrid) {

        spotGrid.addEventListener(
            "click",
            handleSpotCategoryClick
        );

    }

    const customSearchForm =
        document.getElementById(
            "customSpotSearchForm"
        );

    if (customSearchForm) {

        customSearchForm.addEventListener(
            "submit",
            handleCustomSpotSearch
        );

    }

    document.addEventListener(
        "livemate:selectedlivechange",
        handleSelectedLiveChange
    );

    document.addEventListener(
        "livemate:pagechange",
        event => {

            if (
                event.detail?.page ===
                "venue"
            ) {

                fillVenueForm();

            }

        }
    );

}

/* ==================================================
   12. 初期化
================================================== */
function initializeVenueModule() {

    initializeVenueEvents();

    fillVenueForm();

}

/* ==================================================
   13. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeVenueModule
);
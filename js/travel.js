/* ==================================================
   1. 入力要素の取得
================================================== */
function getTravelElements() {

    return {
        departure:
            document.getElementById(
                "departurePlace"
            ),

        arrival:
            document.getElementById(
                "arrivalPlace"
            ),

        openRouteMapButton:
            document.getElementById(
                "openRouteMapButton"
            ),

        travelMapButton:
            document.getElementById(
                "travelMapButton"
            ),

        mapPlaceholderButton:
            document.getElementById(
                "mapPlaceholderButton"
            ),

        shinkansenButton:
            document.getElementById(
                "shinkansenSearchButton"
            ),

        trainButton:
            document.getElementById(
                "trainSearchButton"
            ),

        busButton:
            document.getElementById(
                "busSearchButton"
            ),

        mapPreviewText:
            document.getElementById(
                "mapPreviewText"
            )
    };

}

/* ==================================================
   2. 到着地へ会場を反映
================================================== */
function reflectSelectedLiveToTravel() {

    const elements =
        getTravelElements();

    const selectedLive =
        getSelectedLive();

    if (!elements.arrival) {
        return;
    }

    const currentArrival =
        elements.arrival.value.trim();

    const selectedVenue =
        selectedLive?.venue?.trim() || "";

    if (
        !currentArrival ||
        currentArrival ===
            elements.arrival.dataset
                .autoVenue
    ) {

        elements.arrival.value =
            selectedVenue;

    }

    elements.arrival.dataset.autoVenue =
        selectedVenue;

    if (elements.mapPreviewText) {

        elements.mapPreviewText.textContent =
            selectedVenue
                ? `${selectedVenue}へのルートや周辺マップを確認できます。`
                : "会場を登録すると、ここに会場名が表示されます。";

    }

}

/* ==================================================
   3. 入力内容取得
================================================== */
function getTravelFormValues() {

    const elements =
        getTravelElements();

    return {
        departure:
            elements.departure
                ?.value
                .trim() || "",

        arrival:
            elements.arrival
                ?.value
                .trim() || ""
    };

}

/* ==================================================
   4. 入力チェック
================================================== */
function validateRouteInputs({
    requireDeparture = true,
    requireArrival = true
} = {}) {

    const elements =
        getTravelElements();

    const values =
        getTravelFormValues();

    let valid = true;

    if (elements.departure) {

        clearInputError(
            elements.departure
        );

    }

    if (elements.arrival) {

        clearInputError(
            elements.arrival
        );

    }

    if (
        requireDeparture &&
        !values.departure
    ) {

        setInputError(
            elements.departure,
            "出発地を入力してください。"
        );

        valid = false;

    }

    if (
        requireArrival &&
        !values.arrival
    ) {

        setInputError(
            elements.arrival,
            "到着地を入力してください。"
        );

        valid = false;

    }

    return valid;

}

/* ==================================================
   5. Google Mapsルート検索
================================================== */
function openGoogleMapsRoute() {

    if (
        !validateRouteInputs({
            requireDeparture: true,
            requireArrival: true
        })
    ) {

        showToast(
            "出発地と到着地を入力してください。",
            "error"
        );

        return;

    }

    const {
        departure,
        arrival
    } = getTravelFormValues();

    const url =
        createGoogleMapsRouteUrl(
            departure,
            arrival
        );

    openExternalUrl(url);

}

/* ==================================================
   6. Google Mapsで会場だけ開く
================================================== */
function openArrivalMap() {

    if (
        !validateRouteInputs({
            requireDeparture: false,
            requireArrival: true
        })
    ) {

        showToast(
            "到着地を入力してください。",
            "error"
        );

        return;

    }

    const { arrival } =
        getTravelFormValues();

    const url =
        createGoogleMapsSearchUrl(
            arrival
        );

    openExternalUrl(url);

}

/* ==================================================
   7. Google乗換検索
================================================== */
function openTrainSearch() {

    if (
        !validateRouteInputs({
            requireDeparture: true,
            requireArrival: true
        })
    ) {

        showToast(
            "出発地と到着地を入力してください。",
            "error"
        );

        return;

    }

    const {
        departure,
        arrival
    } = getTravelFormValues();

    /*
     Google Mapsの公共交通機関モードを利用します。
     travelmode=transit を付けることで電車検索になります。
    */

    const url =
        "https://www.google.com/maps/dir/" +
        "?api=1" +
        `&origin=${encodeURIComponent(departure)}` +
        `&destination=${encodeURIComponent(arrival)}` +
        "&travelmode=transit";

    openExternalUrl(url);

}

/* ==================================================
   8. 新幹線検索
================================================== */
function openShinkansenSearch() {

    if (
        !validateRouteInputs({
            requireDeparture: true,
            requireArrival: true
        })
    ) {

        showToast(
            "出発地と到着地を入力してください。",
            "error"
        );

        return;

    }

    const {
        departure,
        arrival
    } = getTravelFormValues();

    /*
     外部サービスのURL仕様が変更されても壊れにくいように、
     Google検索を経由して検索結果を表示します。
    */

    const query =
        `${departure} ${arrival} ` +
        "新幹線 料金 時刻 予約";

    const url =
        "https://www.google.com/search?q=" +
        encodeURIComponent(query);

    openExternalUrl(url);

}

/* ==================================================
   9. 高速バス検索
================================================== */
function openBusSearch() {

    if (
        !validateRouteInputs({
            requireDeparture: true,
            requireArrival: true
        })
    ) {

        showToast(
            "出発地と到着地を入力してください。",
            "error"
        );

        return;

    }

    const {
        departure,
        arrival
    } = getTravelFormValues();

    const query =
        `${departure} ${arrival} ` +
        "高速バス 夜行バス 予約";

    const url =
        "https://www.google.com/search?q=" +
        encodeURIComponent(query);

    openExternalUrl(url);

}

/* ==================================================
   10. 入力値の保存
================================================== */
const TRAVEL_STORAGE_KEY =
    "livemate_travel_input";

function saveTravelInputs() {

    const values =
        getTravelFormValues();

    saveData(
        TRAVEL_STORAGE_KEY,
        {
            departure:
                values.departure,

            arrival:
                values.arrival,

            updatedAt:
                new Date()
                    .toISOString()
        }
    );

}

/* ==================================================
   11. 入力値の復元
================================================== */
function restoreTravelInputs() {

    const elements =
        getTravelElements();

    const saved =
        loadData(
            TRAVEL_STORAGE_KEY,
            null
        );

    if (
        saved &&
        typeof saved === "object"
    ) {

        if (
            elements.departure &&
            saved.departure
        ) {

            elements.departure.value =
                saved.departure;

        }

        if (
            elements.arrival &&
            saved.arrival
        ) {

            elements.arrival.value =
                saved.arrival;

        }

    }

    reflectSelectedLiveToTravel();

}

/* ==================================================
   12. 入力変更時
================================================== */
function handleTravelInput() {

    saveTravelInputs();

}

/* ==================================================
   13. ボタンイベント登録
================================================== */
function initializeTravelButtons() {

    const elements =
        getTravelElements();

    const mapRouteButtons = [
        elements.openRouteMapButton
    ];

    mapRouteButtons.forEach(
        button => {

            button?.addEventListener(
                "click",
                openGoogleMapsRoute
            );

        }
    );

    const mapSearchButtons = [
        elements.travelMapButton,
        elements.mapPlaceholderButton
    ];

    mapSearchButtons.forEach(
        button => {

            button?.addEventListener(
                "click",
                openArrivalMap
            );

        }
    );

    elements.trainButton
        ?.addEventListener(
            "click",
            openTrainSearch
        );

    elements.shinkansenButton
        ?.addEventListener(
            "click",
            openShinkansenSearch
        );

    elements.busButton
        ?.addEventListener(
            "click",
            openBusSearch
        );

}

/* ==================================================
   14. 入力イベント登録
================================================== */
function initializeTravelInputEvents() {

    const elements =
        getTravelElements();

    elements.departure
        ?.addEventListener(
            "input",
            handleTravelInput
        );

    elements.arrival
        ?.addEventListener(
            "input",
            handleTravelInput
        );

}

/* ==================================================
   15. 選択ライブ変更時
================================================== */
function handleTravelLiveChange() {

    reflectSelectedLiveToTravel();

    saveTravelInputs();

}

/* ==================================================
   16. ページ表示時
================================================== */
function handleTravelPageChange(
    event
) {

    if (
        event.detail?.page !==
        "travel"
    ) {

        return;

    }

    reflectSelectedLiveToTravel();

}

/* ==================================================
   17. 初期化
================================================== */
function initializeTravelModule() {

    initializeTravelButtons();

    initializeTravelInputEvents();

    restoreTravelInputs();

    document.addEventListener(
        "livemate:selectedlivechange",
        handleTravelLiveChange
    );

    document.addEventListener(
        "livemate:pagechange",
        handleTravelPageChange
    );

}

/* ==================================================
   18. DOM読み込み後
================================================== */
document.addEventListener(
    "DOMContentLoaded",
    initializeTravelModule
);
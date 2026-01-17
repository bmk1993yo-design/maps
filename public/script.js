// ▼▼▼ 여기에 배포한 구글 웹앱 URL을 따옴표 안에 붙여넣으세요 ▼▼▼
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyE_bjkjlbrVTgyy9ifpVlTOMXoKEhC9Zkfg6l0yS3-a4YxkCYiCyyej8ba1eXO6L7C/exec";
const BASE_TITLE = "이천 작은가게 사랑 지도 | 지역화폐 7% 캐시백 가맹점 찾기";

var map;
var allData = [];
var currentMarkers = [];
var currentCategory = '전체'; 

// ★중요: 현재 열려있는 정보창을 기억하는 변수
var currentInfowindow = null; 

// 페이지가 로드되면 실행
window.addEventListener('DOMContentLoaded', function() {
    initMap();
    fetchData(); // 데이터 가져오기 시작
    
    // 검색창 이벤트 연결
    var searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        runFilter();
    });
});

function initMap() {
    var container = document.getElementById('map');
    var options = {
        center: new kakao.maps.LatLng(37.279, 127.442),
        level: 8
    };
    map = new kakao.maps.Map(container, options);

    var zoomControl = new kakao.maps.ZoomControl();
    map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

    // ★중요: 지도의 빈 공간을 클릭하면 정보창 닫기 (모바일 대응 핵심)
    kakao.maps.event.addListener(map, 'click', function() {
        if (currentInfowindow) {
            currentInfowindow.close();
            currentInfowindow = null;
        }
    });
}

// [핵심 변경] google.script.run 대신 fetch 사용
function fetchData() {
    // 로딩 표시 (선택사항)
    document.getElementById('store-count').innerText = "로딩중...";

    fetch(SCRIPT_URL)
        .then(response => response.json()) // JSON 데이터로 변환
        .then(result => {
            console.log("데이터 수신 성공:", result);
            initApp(result);
        })
        .catch(error => {
            console.error("데이터 불러오기 실패:", error);
            alert("데이터를 불러오는데 실패했습니다.\n새로고침을 해보세요.");
        });
}

function initApp(result) {
    allData = result.locations;
    var categories = result.categories;

    createButtons(categories);

    if (categories.length > 0) {
        setCategory(categories[0]); 
        var firstBtn = document.querySelector('.cat-btn');
        if(firstBtn) firstBtn.classList.add('active');
    }
}

function setCategory(categoryName) {
    currentCategory = categoryName;
    runFilter(); 
}

function runFilter() {
    removeMarkers(); // 마커 지울 때 정보창도 같이 초기화됨

    var rawKeyword = document.getElementById('search-input').value;
    var searchKeyword = rawKeyword.trim().toLowerCase(); 
    
    var titleText = (currentCategory === '전체' || currentCategory === 'All') ? '전체' : currentCategory;
    if (searchKeyword.length > 0) {
        document.getElementById('current-category-name').innerText = titleText + " 내 검색: " + rawKeyword;
        document.title = titleText + " 검색: " + rawKeyword + " | " + BASE_TITLE;
    } else {
        document.getElementById('current-category-name').innerText = titleText + " 목록";
        document.title = (titleText === "전체") ? BASE_TITLE : titleText + " | " + BASE_TITLE;
    }

    var filteredData = allData.filter(function(item) {
        var isCategoryMatch = (currentCategory === '전체' || currentCategory === 'All') 
                                ? true 
                                : (String(item.category) === String(currentCategory));
        
        var isSearchMatch = true;
        if (searchKeyword.length > 0) {
            var itemName = String(item.name).toLowerCase();
            var nameMatch = itemName.indexOf(searchKeyword) > -1;
            
            var addrMatch = false;
            if (item.address) {
                var itemAddr = String(item.address).toLowerCase();
                addrMatch = itemAddr.indexOf(searchKeyword) > -1;
            }
            
            isSearchMatch = nameMatch || addrMatch;
        }

        return isCategoryMatch && isSearchMatch;
    });

    updateMapAndList(filteredData);
}

function updateMapAndList(data) {
    document.getElementById('store-count').innerText = data.length;

    var bounds = new kakao.maps.LatLngBounds();
    var hasValidLocation = false; 

    for (var i = 0; i < data.length; i++) {
        var item = data[i];

        if (item.lat && item.lng) {
            var position = new kakao.maps.LatLng(item.lat, item.lng);
            var marker = new kakao.maps.Marker({
                position: position,
                map: map
            });

            currentMarkers.push(marker);
            bounds.extend(position);
            hasValidLocation = true;

            var content = '<div class="wrap_info">' + item.name + '</div>';
            var infowindow = new kakao.maps.InfoWindow({ content: content });

            // ★중요: 마커 이벤트 로직
            (function(marker, infowindow) {
                // PC용: 마우스 올리면 열림
                kakao.maps.event.addListener(marker, 'mouseover', function() { 
                    infowindow.open(map, marker); 
                });
                
                // PC용: 마우스 나가면 닫힘
                kakao.maps.event.addListener(marker, 'mouseout', function() { 
                    infowindow.close(); 
                });

                // 모바일 & PC 공용: 클릭 시 동작
                kakao.maps.event.addListener(marker, 'click', function() { 
                    if (currentInfowindow) {
                        currentInfowindow.close();
                    }
                    infowindow.open(map, marker);
                    currentInfowindow = infowindow;
                });
            })(marker, infowindow);
        }
    }

    if (hasValidLocation) {
        map.setBounds(bounds);
    }

    updateStoreList(data);
}

function updateStoreList(data) {
    var tbody = document.getElementById('store-tbody');
    tbody.innerHTML = ''; 

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px; color:#888;">검색 결과가 없습니다. 😢</td></tr>';
        return;
    }

    data.forEach(function(item) {
        var tr = document.createElement('tr');
        var addressText = item.address ? item.address : "주소 정보 없음";
        var badge = "";
        if (!item.lat || !item.lng) {
            badge = '<span style="color:#e74c3c; border:1px solid #e74c3c; font-size:11px; padding:1px 4px; border-radius:4px; margin-left:5px;">지도 미표시</span>';
        }

        tr.innerHTML = `
            <td><div class="store-name">${item.name}${badge}</div></td>
            <td><div class="store-addr">${addressText}</div></td>
        `;
        tbody.appendChild(tr);
    });
}

function createButtons(list) {
    var box = document.getElementById('category-box');
    box.innerHTML = ''; 

    list.forEach(function(catName) {
        var btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.innerText = catName;
        
        btn.onclick = function() {
            var btns = document.querySelectorAll('.cat-btn');
            btns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            setCategory(catName); 
        };
        
        box.appendChild(btn);
    });
}

function removeMarkers() {
    for (var i = 0; i < currentMarkers.length; i++) {
        currentMarkers[i].setMap(null);
    }
    currentMarkers = [];
    currentInfowindow = null; 
}

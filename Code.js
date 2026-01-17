// [수정됨] 웹앱 접속 시 HTML 대신 'JSON 데이터'를 반환하는 함수
function doGet(e) {
  
  // 1. 데이터를 가져오는 함수 실행
  const data = getMapData();
  
  // 2. 결과를 JSON 문자열로 변환하여 반환 (CORS 문제 해결 및 데이터 전송용)
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// [기존 유지] 데이터와 분류 목록을 한 번에 가져오는 함수
function getMapData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 지도 데이터 가져오기 (Icheon 시트)
  const mapSheet = ss.getSheetByName('Icheon');
  
  // 데이터가 있는지 확인 (없으면 빈 배열 반환)
  if (!mapSheet) {
    return { locations: [], categories: ["전체"] };
  }

  // 데이터가 있는 전체 범위 가져오기
  const mapData = mapSheet.getDataRange().getValues();
  
  const locations = [];
  
  // 1행(헤더) 건너뛰고 2행부터 시작
  for (let i = 1; i < mapData.length; i++) {
    let row = mapData[i];
    
    // [중요 수정사항 유지]
    // 위도(D열), 경도(E열)가 없어도 데이터를 무조건 가져옵니다.
    // 프론트엔드에서 lat, lng가 null일 경우 주소를 좌표로 변환하는 로직을 추가해야 할 수도 있습니다.
    
    locations.push({
      name: row[1],      // B열: 상호명 (Index 1)
      address: row[2],   // C열: 주소 (Index 2)
      lat: row[3] ? row[3] : null, // D열: 위도
      lng: row[4] ? row[4] : null, // E열: 경도
      category: row[5]   // F열: 분류 (Index 5)
    });
  }
  
  // 2. 분류 목록 가져오기 (Sorting 시트)
  const sortSheet = ss.getSheetByName('Sorting');
  let categories = [];
  
  if (sortSheet) {
    const sortData = sortSheet.getDataRange().getValues();
    // A열의 모든 값을 버튼 이름으로 가져옴
    for (let i = 0; i < sortData.length; i++) {
      // 빈 칸인 경우 건너뛰기
      if (sortData[i][0] && sortData[i][0] !== "") { 
        categories.push(sortData[i][0]);
      }
    }
  } else {
    // 혹시 Sorting 시트가 없으면 기본값
    categories = ["전체"]; 
  }

  // 두 가지 데이터를 묶어서 전달
  return {
    locations: locations,
    categories: categories
  };
}
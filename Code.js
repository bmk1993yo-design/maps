// 웹앱 접속 시 index.html 파일을 보여주는 함수
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('이천 작은가게 사랑 지도') 
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 데이터와 분류 목록을 한 번에 가져오는 함수
function getMapData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 지도 데이터 가져오기 (Icheon 시트)
  const mapSheet = ss.getSheetByName('Icheon');
  
  // 데이터가 있는 전체 범위 가져오기
  // (만약 데이터가 10000행 등으로 너무 많으면 속도를 위해 범위를 지정하는 것이 좋지만, 일단은 전체로 합니다)
  const mapData = mapSheet.getDataRange().getValues();
  
  const locations = [];
  
  // 1행(헤더) 건너뛰고 2행부터 시작
  for (let i = 1; i < mapData.length; i++) {
    let row = mapData[i];
    
    // [중요 수정사항]
    // if (row[3] && row[4]) { ... } 조건을 제거했습니다.
    // 이제 위도(D열), 경도(E열)가 없어도 데이터를 무조건 가져옵니다.
    
    locations.push({
      name: row[1],      // B열: 상호명 (Index 1)
      address: row[2],   // C열: 주소 (Index 2) - ★ 시트의 C열에 주소가 있어야 합니다!
      lat: row[3] ? row[3] : null, // D열: 위도 (없으면 null)
      lng: row[4] ? row[4] : null, // E열: 경도 (없으면 null)
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
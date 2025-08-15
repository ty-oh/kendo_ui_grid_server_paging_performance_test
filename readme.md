# Kendo UI Grid 성능 비교 테스트
## 목적

동일한 데이터셋을 대상으로 서버 페이징·정렬(Server Paging/Sorting) 방식과 클라이언트 페이징·정렬(Client-side) 방식의 성능 차이를 비교합니다.
이를 통해 대량 데이터 처리 시 어떤 방식을 선택할지 판단할 수 있도록 네트워크 지연 시간, 서버 쿼리 실행 시간, 서버 힙 메모리 사용량, 반환 행수 등의 지표를 수집합니다.

## 테스트 내용

- 상단 Grid: 서버에서 ORDER BY + LIMIT/OFFSET으로 정렬·페이징 처리

- 하단 Grid: 전체 데이터를 한 번에 받아서 브라우저 메모리에 저장 후 로컬에서 정렬·페이징 처리

- 측정 항목

    - 네트워크 왕복 시간(RTT, ms)

    - 서버 쿼리 실행 시간(ms)

    - 서버 힙 메모리 사용량(MB)

    - 반환 행수(rows)

- 데이터베이스: PostgreSQL (서버 처리용 / 클라이언트 처리용 컨테이너 각각 1개씩)

## 실행 방법
### 1. PostgreSQL 컨테이너 실행
```bash
# 서버 처리용 DB (5433)
docker run --name pg-perf-ss \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=perfdb \
  -p 5433:5432 -d postgres:16

# 클라이언트 처리용 DB (5434)
docker run --name pg-perf-cs \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=perfdb \
  -p 5434:5432 -d postgres:16
```

### 2. 시드 데이터 적재
```bash
# 서버 처리용 DB
docker cp seed.sql pg-perf-ss:/seed.sql
docker exec -it pg-perf-ss bash -lc "psql -U postgres -d perfdb -f /seed.sql"

# 클라이언트 처리용 DB
docker cp seed.sql pg-perf-cs:/seed.sql
docker exec -it pg-perf-cs bash -lc "psql -U postgres -d perfdb -f /seed.sql"
```

### 3. Node.js 패키지 설치
```bash
npm install
```

### 4. 백엔드 서버 실행
```bash
# 터미널 1
npm run server:ss    # http://localhost:3001

# 터미널 2
npm run server:cs    # http://localhost:3002
```

### 5. 브라우저 접속
```
http://localhost:3001
```

- 상단 Grid: 서버 페이징·정렬

- 하단 Grid: 클라이언트 페이징·정렬

- 각 Grid의 툴바에서 측정값 확인 가능

---

## 결과 해석

- 서버 페이징·정렬

    - 필요한 데이터만 가져와서 네트워크·메모리 사용량 적음

    - 대규모 데이터셋에서도 브라우저 부하 적음

    - 페이지 이동·정렬 시마다 서버 요청 발생

    - DB 인덱스 성능 따라 속도 차이 남

- 클라이언트 페이징·정렬

    - 최초 로딩 후 정렬·페이징 즉시 반응

    - 서버 요청 거의 없음

    - 초기 전체 로드 시 네트워크·메모리 부하 큼

    - 데이터 많으면 로딩 느리고 메모리 사용량 급증

- 결론

    - 데이터 작고 반복 정렬·필터 많으면 클라이언트 방식 유리

    - 데이터 크고 메모리 제한 있으면 서버 방식 유리

    - 네트워크 환경·DB 인덱스 최적화 상태·사용 패턴에 따라 선택
Last Stand: Circle Defense 실행 방법
=========================================

CORS 에러 때문에 index.html을 직접 열면 실행되지 않습니다.
다음 방법 중 하나를 사용하세요:

방법 1: Python 서버 사용 (권장)
-------------------------------
1. run-game.bat 파일을 더블클릭
2. 브라우저가 자동으로 열립니다
3. http://localhost:8000 에서 게임 플레이

방법 2: Chrome 보안 해제 (빠른 실행)
-----------------------------------
1. chrome-launcher.bat 파일을 더블클릭
2. 바로 게임이 실행됩니다
3. 게임 후 Chrome 완전 종료 필요

방법 3: VSCode Live Server
--------------------------
1. VSCode에서 폴더 열기
2. index.html 우클릭
3. "Open with Live Server" 선택

방법 4: Node.js 사용
-------------------
1. 명령 프롬프트에서:
   cd C:\Users\kafli\Desktop\survival-shooter
   npx http-server -p 8080 -o

게임 조작법:
-----------
- WASD: 이동
- 마우스: 조준
- 좌클릭: 사격
- 스페이스: 대시
- ESC: 일시정지

문제 해결:
---------
- Python이 없다면: https://www.python.org/downloads/
- Node.js가 없다면: https://nodejs.org/
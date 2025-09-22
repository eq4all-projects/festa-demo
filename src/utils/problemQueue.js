// 문제 중복 방지를 위한 큐 시스템 (localStorage 사용)
class ProblemQueue {
  constructor(maxSize = 5, storageKey = "problemQueue") {
    this.maxSize = maxSize;
    this.storageKey = storageKey;
    this.queue = this.loadFromStorage();
  }

  // localStorage에서 큐 로드
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load queue from storage:", error);
      return [];
    }
  }

  // localStorage에 큐 저장
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Failed to save queue to storage:", error);
    }
  }

  // 큐에 문제가 있는지 확인
  contains(problem) {
    return this.queue.includes(problem);
  }

  // 새 문제를 큐에 추가 (큐가 가득 차면 맨 앞 문제 제거)
  enqueue(problem) {
    if (this.queue.length >= this.maxSize) {
      this.queue.shift(); // 맨 앞 문제 제거
    }
    this.queue.push(problem);
    this.saveToStorage(); // 변경사항 저장
  }

  // 큐에서 사용 가능한 문제들 반환 (큐에 없는 문제들만)
  getAvailableProblems(allProblems) {
    return allProblems.filter((problem) => !this.contains(problem));
  }

  // 큐 상태 확인용 (디버깅)
  getQueue() {
    return [...this.queue];
  }

  // 큐 초기화
  clear() {
    this.queue = [];
    this.saveToStorage(); // 변경사항 저장
  }
}

// 전역 큐 인스턴스들 (Easy/Hard 모드별로 분리, 각각 다른 localStorage 키 사용)
export const easyModeQueue = new ProblemQueue(5, "easyModeQueue");
export const hardModeQueue = new ProblemQueue(5, "hardModeQueue");

export default ProblemQueue;

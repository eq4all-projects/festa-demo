// 문제 중복 방지를 위한 큐 시스템
class ProblemQueue {
  constructor(maxSize = 5) {
    this.queue = [];
    this.maxSize = maxSize;
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
  }
}

// 전역 큐 인스턴스들 (Easy/Hard 모드별로 분리)
export const easyModeQueue = new ProblemQueue(5);
export const hardModeQueue = new ProblemQueue(5);

export default ProblemQueue;

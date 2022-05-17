import type { IMicrowaveTimer } from "./types"

export class MicrowaveTimer implements IMicrowaveTimer {
  public startTs: number
  public finishTs?: number
  public duration?: number
  public stopTimer: () => string | number

  public constructor(now?: number, formatted: boolean = false) {
    const { start, timer } = this.createTimer(now ?? this.getNow(), formatted)
    this.startTs = start
    this.stopTimer = timer
  }

  private getNow() {
    return typeof performance < "u" ? performance.now() : Date.now()
  }

  private createTimer(now = this.getNow(), formatted: boolean = false) {
    return {
      start: now,
      timer: () => {
        this.finishTs = this.getNow()
        this.duration = this.finishTs - now
        return formatted ? this.duration.toFixed(2) + "ms" : this.duration
      },
    }
  }
}

export const CARD_NICKNAMES: Record<number, string> = {
  1: "尖", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6",
  7: "7", 8: "8", 9: "9", 10: "10", 11: "丁勾", 12: "皮蛋",
};

export type NarrationTone = "normal" | "excited" | "sad" | "alarm" | "bot";

export class AudioNarrator {
  private queue: Array<{ text: string; tone: NarrationTone }> = [];
  private speaking = false;
  private muted = false;
  private unlocked = false;

  unlock() {
    this.unlocked = true;
    this.flush();
  }

  mute(value = true) {
    this.muted = value;
    if (value) this.cancel();
  }

  isMuted() { return this.muted; }

  enqueue(text: string, tone: NarrationTone = "normal") {
    if (!text.trim() || this.muted) return;
    this.queue.push({ text, tone });
    this.flush();
  }

  cancel() {
    this.queue = [];
    this.speaking = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  private flush() {
    if (!this.unlocked || this.muted || this.speaking || !this.queue.length) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.queue = [];
      return;
    }
    const item = this.queue.shift();
    if (!item) return;
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.lang = "zh-CN";
    const delivery = {
      normal: { rate: 1.18, pitch: 1.05, volume: 1 },
      excited: { rate: 1.28, pitch: 1.22, volume: 1 },
      sad: { rate: 1.02, pitch: 0.82, volume: 0.9 },
      alarm: { rate: 1.34, pitch: 1.32, volume: 1 },
      bot: { rate: 1.08, pitch: 0.92, volume: 0.9 },
    }[item.tone];
    utterance.rate = delivery.rate;
    utterance.pitch = delivery.pitch;
    utterance.volume = delivery.volume;
    this.speaking = true;
    utterance.onend = utterance.onerror = () => {
      this.speaking = false;
      this.flush();
    };
    window.speechSynthesis.speak(utterance);
  }
}

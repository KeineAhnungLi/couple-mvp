export const CARD_NICKNAMES: Record<number, string> = {
  1: "尖", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6",
  7: "7", 8: "8", 9: "9", 10: "10", 11: "丁勾", 12: "皮蛋",
};

export const AUDIO_ASSETS = {
  mismatchCry: "/assets/audio/custom_mismatch_cry.mp3",
  secondTrioAlarm: "/assets/audio/custom_second_trio_alarm.mp3",
  victory: "/assets/audio/custom_victory.mp3",
  defeatCry: "/assets/audio/custom_defeat_cry.mp3",
  defeatMimimi: "/assets/audio/custom_defeat_mimimi.mp3",
} as const;

export class AudioNarrator {
  private queue: string[] = [];
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

  enqueue(text: string) {
    if (!text.trim() || this.muted) return;
    this.queue.push(text);
    this.flush();
  }

  cancel() {
    this.queue = [];
    this.speaking = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  playAsset(path: string) {
    if (this.muted || !this.unlocked) return;
    const audio = new Audio(path);
    audio.volume = 0.75;
    void audio.play().catch(() => undefined);
  }

  private flush() {
    if (!this.unlocked || this.muted || this.speaking || !this.queue.length) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.queue = [];
      return;
    }
    const utterance = new SpeechSynthesisUtterance(this.queue.shift());
    utterance.lang = "zh-CN";
    utterance.rate = 1.03;
    this.speaking = true;
    utterance.onend = utterance.onerror = () => {
      this.speaking = false;
      this.flush();
    };
    window.speechSynthesis.speak(utterance);
  }
}


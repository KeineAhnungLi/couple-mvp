"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./trio-game.module.css";

interface CardView {
  id?: string;
  index?: number;
  value: number | null;
  removed?: boolean;
}

interface PlayerView {
  id: string;
  name: string;
  is_bot: boolean;
  hand_count: number;
  hand: CardView[] | null;
  trios: number[];
}

interface RevealView {
  source: "table" | "hand";
  value: number;
  player_id: string | null;
  table_index: number | null;
}

interface GameState {
  code: string;
  started: boolean;
  finished: boolean;
  resolving: boolean;
  winner_id: string | null;
  current_player_id: string | null;
  players: PlayerView[];
  table: CardView[];
  reveals: RevealView[];
  you: { id: string; name: string };
}

interface TrioGameProps {
  identityToken: string;
  viewerName: string;
}

export const TrioGame = ({ identityToken, viewerName }: TrioGameProps) => {
  const [state, setState] = useState<GameState | null>(null);
  const [phase, setPhase] = useState("正在进入情侣房间…");
  const [error, setError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const connectSocket = useCallback(
    (code: string) => {
      if (stoppedRef.current) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(
        `${protocol}//${window.location.host}/ws/trio/${code}`,
        ["trio", identityToken],
      );
      socketRef.current = socket;
      socket.onopen = () => {
        setPhase("已连接");
        setError("");
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as
          | { type: "state"; state: GameState }
          | { type: "error"; message: string };
        if (message.type === "state") {
          setState(message.state);
          setError("");
        } else {
          setError(message.message);
        }
      };
      socket.onerror = () => setError("实时连接出现异常，正在重试…");
      socket.onclose = (event) => {
        if (stoppedRef.current || event.code === 4000) return;
        setPhase("连接已断开，正在重连…");
        reconnectTimerRef.current = setTimeout(() => connectSocket(code), 1500);
      };
    },
    [identityToken],
  );

  useEffect(() => {
    stoppedRef.current = false;
    const controller = new AbortController();

    const enterRoom = async () => {
      try {
        const response = await fetch("/api/trio/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: identityToken }),
          signal: controller.signal,
        });
        const result = (await response.json()) as { code?: string; detail?: string };
        if (!response.ok || !result.code) {
          throw new Error(result.detail || "无法进入 Trio 房间");
        }
        connectSocket(result.code);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "无法进入 Trio 房间");
        setPhase("连接失败");
      }
    };

    void enterRoom();
    return () => {
      stoppedRef.current = true;
      controller.abort();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close(1000, "page closed");
    };
  }, [connectSocket, identityToken]);

  const send = (payload: object) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      setError("实时连接尚未就绪");
      return;
    }
    socketRef.current.send(JSON.stringify(payload));
  };

  if (!state) {
    return (
      <section className={styles.panel} aria-live="polite">
        <div className={styles.loader} />
        <p className={styles.centerTitle}>{phase}</p>
        <p className={styles.muted}>当前身份：{viewerName}</p>
        {error ? <p className={styles.error}>{error}</p> : null}
      </section>
    );
  }

  const me = state.players.find((player) => player.id === state.you.id);
  const current = state.players.find(
    (player) => player.id === state.current_player_id,
  );
  const winner = state.players.find((player) => player.id === state.winner_id);
  const myTurn = state.current_player_id === state.you.id;

  return (
    <div className={styles.game}>
      {!state.started ? (
        <section className={styles.panel}>
          <div className={styles.roomHeading}>
            <div>
              <h2>等待另一半加入</h2>
              <p className={styles.muted}>房间 {state.code} · 无需复制房间码</p>
            </div>
            <span className={styles.live}>实时</span>
          </div>
          <div className={styles.lobbyPlayers}>
            {state.players.map((player) => (
              <div className={styles.lobbyPlayer} key={player.id}>
                <span>{player.is_bot ? "🤖" : "💗"}</span>
                <strong>{player.name}</strong>
                {player.id === state.you.id ? <small>你</small> : null}
                {player.is_bot ? <small>规则 Bot</small> : null}
              </div>
            ))}
            <div className={styles.emptySeat}>等待第二位真人玩家…</div>
          </div>
          <p className={styles.hint}>另一位情侣账号打开 Trio 后，三人牌局会自动开始。</p>
        </section>
      ) : (
        <>
          <section className={styles.status} aria-live="polite">
            <strong>
              {state.finished
                ? `${winner?.name || "玩家"} 获胜！`
                : state.resolving
                  ? "正在结算翻牌…"
                  : myTurn
                    ? "轮到你了"
                    : `等待 ${current?.name || "玩家"} 行动`}
            </strong>
            <span>
              {state.reveals.length
                ? `本轮：${state.reveals.map((reveal) => reveal.value).join("、")}`
                : "找出三张相同数字"}
            </span>
          </section>

          <section className={styles.players}>
            {state.players.map((player) => (
              <article
                className={`${styles.player} ${player.id === state.current_player_id ? styles.active : ""}`}
                key={player.id}
              >
                <div className={styles.playerHeading}>
                  <strong>
                    {player.name} {player.is_bot ? "🤖" : ""}
                    {player.id === state.you.id ? "（你）" : ""}
                  </strong>
                  <span>{player.hand_count} 张</span>
                </div>
                <div className={styles.trios}>
                  {player.trios.length
                    ? player.trios.map((value, index) => (
                        <span key={`${value}-${index}`}>{value}</span>
                      ))
                    : "尚未获得 Trio"}
                </div>
                {!state.finished && player.hand_count > 0 ? (
                  <div className={styles.ends}>
                    <button
                      disabled={!myTurn || state.resolving}
                      onClick={() =>
                        send({
                          action: "reveal_hand",
                          target_player_id: player.id,
                          side: "low",
                        })
                      }
                    >
                      翻 LOW
                    </button>
                    <button
                      disabled={!myTurn || state.resolving}
                      onClick={() =>
                        send({
                          action: "reveal_hand",
                          target_player_id: player.id,
                          side: "high",
                        })
                      }
                    >
                      翻 HIGH
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </section>

          <section className={styles.panel}>
            <h2>桌面牌</h2>
            <div className={styles.table}>
              {state.table.map((card) => (
                <button
                  key={card.index}
                  className={`${styles.card} ${card.value !== null ? styles.faceUp : ""} ${card.removed ? styles.removed : ""}`}
                  disabled={
                    !myTurn ||
                    state.finished ||
                    state.resolving ||
                    card.removed ||
                    card.value !== null
                  }
                  onClick={() => send({ action: "reveal_table", index: card.index })}
                  aria-label={card.value === null ? `翻开桌面第 ${(card.index ?? 0) + 1} 张牌` : `数字 ${card.value}`}
                >
                  {card.removed ? "" : (card.value ?? "?")}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <h2>你的手牌</h2>
            <div className={styles.hand}>
              {(me?.hand || []).map((card) => (
                <div className={`${styles.card} ${styles.ownCard}`} key={card.id}>
                  {card.value}
                </div>
              ))}
            </div>
            <p className={styles.hint}>只有你能看到完整手牌；其他玩家只能请求翻 LOW 或 HIGH。</p>
          </section>

          {state.finished ? (
            <button className={styles.newGame} onClick={() => window.location.reload()}>
              开始新一局
            </button>
          ) : null}
        </>
      )}
      {error ? <p className={styles.toast}>{error}</p> : null}
    </div>
  );
};

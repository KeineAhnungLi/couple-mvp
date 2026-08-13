"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioNarrator, CARD_NICKNAMES, type NarrationTone } from "@/lib/trio-narration";
import styles from "./trio-game.module.css";

interface CardView { id?: string; index?: number; value: number | null; removed?: boolean }
interface PlayerView { id: string; name: string; is_bot: boolean; hand_count: number; hand: CardView[] | null; trios: number[] }
interface RevealView { source: "table" | "hand"; value: number; card_name: string; player_id: string | null; table_index: number | null; side?: "low" | "high" }
interface TurnRecord { actor_player_id: string; reveals: RevealView[]; result: string; trio_value: number | null; next_player_id: string | null }
interface GameEvent { type: "game_event"; event: string; sequence: number; actor_player_id?: string; target_player_id?: string; player_name?: string; source?: "table" | "hand"; side?: "low" | "high"; table_index?: number; value?: number; card_name?: string; reveal_count?: number; winner_id?: string }
interface ReplayPlayer { id: string; name: string; is_bot: boolean; hand_count: number; trios: number[] }
interface ReplayStep { sequence: number; event: string; phase: string; current_player_id: string | null; players: ReplayPlayer[]; table: CardView[]; reveals: RevealView[]; actor_player_id?: string; target_player_id?: string; value?: number; card_name?: string; result?: string; winner_id?: string }
interface ReplaySummary { id: string; started_at: number; ended_at: number; player_count: number; winner_name: string | null; end_reason: string; players: { name: string; is_bot: boolean }[]; step_count: number }
interface ReplayDetail extends ReplaySummary { replay: ReplayStep[] }
interface GameState {
  code: string; started: boolean; finished: boolean; resolving: boolean; phase: string;
  phase_deadline: number | null; winner_id: string | null; current_player_id: string | null;
  ended_by_player_id: string | null; end_reason: string | null;
  host_id: string; target_player_count: number;
  players: PlayerView[]; table: CardView[]; reveals: RevealView[]; you: { id: string; name: string };
  last_event: GameEvent | null; last_turn: TurnRecord | null; summary_deadline: number | null;
  summary_ack_player_ids: string[]; summary_human_count: number;
}
interface TrioGameProps { identityToken: string; viewerName: string }

const Card = ({ card, back = false, compact = false, selectable = false, onClick }: {
  card?: CardView | RevealView; back?: boolean; compact?: boolean; selectable?: boolean; onClick?: () => void;
}) => {
  const value = back ? null : card?.value;
  return (
    <button className={`${styles.card} ${back ? styles.cardBack : styles.cardFace} ${compact ? styles.compactCard : ""} ${selectable ? styles.selectable : ""}`}
      disabled={!selectable} onClick={onClick} aria-label={back ? "盖着的牌" : value ? `牌 ${CARD_NICKNAMES[value]}` : "空位"}>
      {back ? <span className={styles.backMark}>✦</span> : value ? <><small>{CARD_NICKNAMES[value]}</small><strong>{value}</strong><i>❖</i></> : null}
    </button>
  );
};

export const TrioGame = ({ identityToken, viewerName }: TrioGameProps) => {
  const [state, setState] = useState<GameState | null>(null);
  const [phaseText, setPhaseText] = useState("正在进入情侣房间…");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [spotlightReveal, setSpotlightReveal] = useState<RevealView | null>(null);
  const [muted, setMuted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [rulesOpen, setRulesOpen] = useState(false);
  const [history, setHistory] = useState<ReplaySummary[]>([]);
  const [replayOpen, setReplayOpen] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [selectedReplay, setSelectedReplay] = useState<ReplayDetail | null>(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);
  const narratorRef = useRef(new AudioNarrator());
  const lastSequenceRef = useRef(0);
  const repeatRef = useRef("");
  const stateRef = useRef<GameState | null>(null);

  const playerName = useCallback((id?: string) => {
    const current = stateRef.current;
    const index = current?.players.findIndex((player) => player.id === id) ?? -1;
    if (index < 0) return "玩家";
    return current?.players[index].name.trim() || `${index + 1}号玩家`;
  }, []);

  const narrateEvent = useCallback((event: GameEvent) => {
    if (event.sequence <= lastSequenceRef.current) return;
    lastSequenceRef.current = event.sequence;
    const narrator = narratorRef.current;
    let text = "";
    let tone: NarrationTone = "normal";
    if (event.event === "hand_reveal_requested") {
      setSpotlightReveal(null);
      const key = `${event.actor_player_id}:${event.target_player_id}:${event.side}`;
      text = `${playerName(event.target_player_id)}，${repeatRef.current === key ? "还是" : ""}康康你${event.side === "high" ? "最大" : "最小"}的！`;
      repeatRef.current = key;
    } else if (event.event === "table_reveal_requested") {
      setSpotlightReveal(null);
      text = "我要康康桌子上的这张牌！";
      repeatRef.current = "";
    } else if (event.event === "card_revealed") {
      if (typeof event.value === "number" && event.card_name && event.source) {
        setSpotlightReveal({ source: event.source, value: event.value, card_name: event.card_name, player_id: event.target_player_id || null, table_index: event.table_index ?? null, side: event.side });
      }
      if (event.source === "table") text = `桌子上的这张牌，是一张${event.card_name}！`;
      else if (event.target_player_id === event.actor_player_id) text = `哈哈，我${event.side === "high" ? "最大" : "最小"}的是一张${event.card_name}！`;
      else text = `${playerName(event.target_player_id)}${event.side === "high" ? "最大" : "最小"}的牌，是一张${event.card_name}！`;
    } else if (event.event === "mismatch") {
      text = event.reveal_count === 3 ? "啊啊啊啊啊啊啊就差一点啊啊啊啊啊啊！" : "怎么不一样啊！";
      tone = "sad";
    } else if (event.event === "trio_collected") {
      text = `三个${event.card_name}，归我啦！`;
      tone = "excited";
    } else if (event.event === "second_trio_alert") {
      text = `警报警报！${event.player_name || playerName(event.actor_player_id)}已经有两个 Trio 了！`;
      tone = "alarm";
    } else if (event.event === "bot_thinking") {
      text = "电脑琢磨一下……";
      tone = "bot";
    } else if (event.event === "game_over") {
      const won = event.winner_id === stateRef.current?.you.id;
      text = won ? "恭喜你赢下这局！" : `${playerName(event.winner_id)}赢下了这局！`;
      tone = won ? "excited" : "sad";
    } else if (event.event === "game_ended") {
      text = `${event.player_name || playerName(event.actor_player_id)}结束了本局游戏。`;
      setSpotlightReveal(null);
    } else if (event.event === "turn_started") {
      setAnnouncement("");
      setSpotlightReveal(null);
    }
    if (text) {
      setAnnouncement(text);
      narrator.enqueue(text, tone);
    }
  }, [playerName]);

  const connectSocket = useCallback((code: string) => {
    if (stoppedRef.current) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/trio/${code}`, ["trio", identityToken]);
    socketRef.current = socket;
    socket.onopen = () => { setPhaseText("实时连接正常"); setError(""); };
    socket.onmessage = (messageEvent) => {
      const message = JSON.parse(messageEvent.data) as { type: "state"; state: GameState } | GameEvent | { type: "error"; message: string };
      if (message.type === "state") {
        stateRef.current = message.state;
        setState(message.state);
        setError("");
      } else if (message.type === "game_event") narrateEvent(message);
      else setError(message.message);
    };
    socket.onerror = () => setError("实时连接出现异常，正在重试…");
    socket.onclose = (event) => {
      if (stoppedRef.current || event.code === 4000) return;
      setPhaseText("连接已断开，正在重连…");
      reconnectTimerRef.current = setTimeout(() => connectSocket(code), 1500);
    };
  }, [identityToken, narrateEvent]);

  useEffect(() => {
    stoppedRef.current = false;
    const controller = new AbortController();
    void fetch("/api/trio/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: identityToken }), signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { code?: string; detail?: string; history?: ReplaySummary[] };
        if (!response.ok || !result.code) throw new Error(result.detail || "无法进入 Trio 房间");
        setHistory(result.history || []);
        connectSocket(result.code);
      }).catch((caught) => {
        if (!controller.signal.aborted) { setError(caught instanceof Error ? caught.message : "无法进入 Trio 房间"); setPhaseText("连接失败"); }
      });
    return () => {
      stoppedRef.current = true; controller.abort(); narratorRef.current.cancel();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close(1000, "page closed");
    };
  }, [connectSocket, identityToken]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!replayOpen || !replayPlaying || !selectedReplay?.replay.length) return;
    const timer = window.setInterval(() => {
      setReplayIndex((current) => {
        if (current >= selectedReplay.replay.length - 1) {
          setReplayPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1200);
    return () => window.clearInterval(timer);
  }, [replayOpen, replayPlaying, selectedReplay?.replay.length]);

  const send = (payload: object) => {
    narratorRef.current.unlock();
    if (socketRef.current?.readyState !== WebSocket.OPEN) return setError("实时连接尚未就绪");
    socketRef.current.send(JSON.stringify(payload));
  };
  const toggleMute = () => {
    const next = !muted; setMuted(next); narratorRef.current.unlock(); narratorRef.current.mute(next);
  };
  const openReplay = async (replayId: string) => {
    setReplayLoading(true); setError(""); narratorRef.current.cancel();
    try {
      const response = await fetch(`/api/trio/replays/${encodeURIComponent(replayId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: identityToken }) });
      const result = await response.json() as ReplayDetail & { detail?: string };
      if (!response.ok || !result.replay) throw new Error(result.detail || "无法读取这局回放");
      setSelectedReplay(result); setReplayIndex(0); setReplayOpen(true); setReplayPlaying(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "无法读取这局回放"); }
    finally { setReplayLoading(false); }
  };

  const seats = useMemo(() => {
    if (!state) return { me: undefined, opponents: [] as PlayerView[] };
    const me = state.players.find((player) => player.id === state.you.id);
    return { me, opponents: state.players.filter((player) => player.id !== state.you.id) };
  }, [state]);

  const replayStep = selectedReplay?.replay[replayIndex];
  const replayActor = replayStep?.players.find((player) => player.id === replayStep.actor_player_id);
  const replayLabel = replayStep ? ({ game_started: "牌局开始", table_reveal_requested: `${replayActor?.name || "玩家"}选择桌牌`, hand_reveal_requested: `${replayActor?.name || "玩家"}选择手牌`, card_revealed: `翻开 ${replayStep.card_name || replayStep.value}`, mismatch: "未能配成", trio_collected: `${replayActor?.name || "玩家"}收下 Trio`, turn_summary: "回合结束", turn_started: "下一回合", bot_thinking: `${replayActor?.name || "电脑"}思考中`, game_over: "决出胜者", game_ended: "本局结束" } as Record<string, string>)[replayStep.event] || replayStep.event : "";
  const ReplayViewer = () => replayOpen && selectedReplay && replayStep ? <div className={styles.modalBackdrop}><section className={styles.replay}>
    <button className={styles.close} onClick={() => { setReplayOpen(false); setReplayPlaying(false); }}>×</button><small>{selectedReplay.player_count} 人场回放 · {replayIndex + 1}/{selectedReplay.replay.length}</small><h2>{replayLabel}</h2>
    <div className={styles.replayScore}>{replayStep.players.map((player) => <div className={player.id === replayStep.current_player_id ? styles.replayActive : ""} key={player.id}><strong>{player.is_bot ? "AI · " : ""}{player.name}</strong><span>{player.hand_count} 张 · {player.trios.length} Trio</span></div>)}</div>
    <div className={styles.replayTable}>{replayStep.table.map((card) => card.removed ? <div className={styles.cardSlot} key={card.index}/> : <Card key={card.index} card={card} back={card.value === null}/>)}</div>
    <div className={styles.summaryCards}>{replayStep.reveals.map((reveal, index) => <Card card={reveal} key={index}/>)}</div>
    <div className={styles.replayControls}><button onClick={() => setReplayIndex(0)} disabled={replayIndex === 0}>开头</button><button onClick={() => setReplayIndex((value) => Math.max(0, value - 1))} disabled={replayIndex === 0}>上一步</button><button onClick={() => setReplayPlaying((value) => !value)}>{replayPlaying ? "暂停" : "播放"}</button><button onClick={() => setReplayIndex((value) => Math.min(selectedReplay.replay.length - 1, value + 1))} disabled={replayIndex === selectedReplay.replay.length - 1}>下一步</button></div>
  </section></div> : null;

  if (!state) return <section className={styles.loading}><div className={styles.loader}/><strong>{phaseText}</strong><span>当前身份：{viewerName}</span>{error && <p>{error}</p>}</section>;
  if (!state.started) return (
    <section className={styles.lobby}>
      <div className={styles.logo}>TRIO</div><h2>等另一半入座</h2>
      <p>房间 {state.code} 已为你们自动建立，无需分享房间码。</p>
      {state.you.id === state.host_id && <div className={styles.modePicker}><strong>选择牌局人数</strong><div><button className={state.target_player_count === 3 ? styles.selectedMode : ""} onClick={() => send({ action: "set_couple_mode", player_count: 3 })}>3 人 · 1 电脑</button><button className={state.target_player_count === 4 ? styles.selectedMode : ""} onClick={() => send({ action: "set_couple_mode", player_count: 4 })}>4 人 · 2 电脑</button></div><small>另一半入座后由你开始牌局，开局后不可更改。</small></div>}
      {state.you.id !== state.host_id && <p>当前选择：{state.target_player_count} 人场 · {state.target_player_count - 2} 个电脑玩家</p>}
      <div className={`${styles.lobbySeats} ${state.target_player_count === 4 ? styles.fourLobbySeats : ""}`}>{state.players.map((player, index) => <div key={player.id}><span>{player.is_bot ? "BOT" : index + 1}</span><strong>{player.name}</strong><small>{player.is_bot ? "规则机器人 · 已就绪" : "真人玩家 · 已就绪"}</small></div>)}{Array.from({ length: Math.max(0, state.target_player_count - state.players.length) }).map((_, index) => <div className={styles.emptySeat} key={index}>等待第二位真人玩家…</div>)}</div>
      {state.you.id === state.host_id && <button className={styles.startGame} disabled={state.players.filter((player) => !player.is_bot).length !== 2} onClick={() => send({ action: "start" })}>{state.players.filter((player) => !player.is_bot).length === 2 ? `开始 ${state.target_player_count} 人牌局` : "等待另一半入座"}</button>}
      {state.you.id !== state.host_id && <p>等待首位玩家确认模式并开始。</p>}
      <section className={styles.history}><div><h3>之前的对局</h3><small>最近 {history.length} 局 · 只保存公开过程</small></div>{history.length ? <div className={styles.historyList}>{history.map((item) => <button disabled={replayLoading} onClick={() => void openReplay(item.id)} key={item.id}><span><strong>{item.player_count} 人场 · {item.winner_name ? `${item.winner_name} 获胜` : "主动结束"}</strong><small>{new Date(item.ended_at * 1000).toLocaleString("zh-CN")} · {item.step_count} 步</small></span><b>回放 ›</b></button>)}</div> : <p>还没有已完成的牌局。完成一局后，记录会出现在这里。</p>}</section>
      <ReplayViewer />
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );

  const myTurn = state.current_player_id === state.you.id;
  const actionable = myTurn && state.phase === "WAITING_FOR_ACTION";
  const summarySeconds = Math.max(0, Math.ceil(((state.summary_deadline || 0) * 1000 - now) / 1000));
  const readyHumans = state.players.filter((player) => !player.is_bot && state.summary_ack_player_ids.includes(player.id)).length;
  const winner = state.players.find((player) => player.id === state.winner_id);
  const endedBy = state.players.find((player) => player.id === state.ended_by_player_id);

  const PlayerSeat = ({ player, position }: { player?: PlayerView; position: "left" | "top" | "right" | "self" }) => {
    if (!player) return null;
    const active = player.id === state.current_player_id;
    const own = position === "self";
    return <section className={`${styles.seat} ${styles[position]} ${active ? styles.activeSeat : ""}`}>
      <div className={styles.avatar}>{player.is_bot ? "AI" : player.name.slice(0, 1).toUpperCase()}</div>
      <div className={styles.identity}><strong>{player.name}{own ? " · 你" : ""}</strong><small>{active ? (state.phase === "WAITING_FOR_ACTION" ? "正在行动" : "回合进行中") : player.is_bot ? "规则 Bot" : "在线"}</small></div>
      <span className={styles.count}>{player.hand_count} 张</span>
      {!own && <div className={styles.opponentCards}>{Array.from({ length: Math.min(player.hand_count, 9) }).map((_, index) => <Card key={index} back compact />)}</div>}
      <div className={styles.trophies}><label>已收</label>{player.trios.length ? player.trios.map((value, index) => <b key={`${value}-${index}`}>{CARD_NICKNAMES[value]}</b>) : <span>—</span>}</div>
      {!state.finished && player.hand_count > 0 && !own && <div className={styles.edgeActions}><button disabled={!actionable} onClick={() => send({ action: "reveal_hand", target_player_id: player.id, side: "low" })}>LOW</button><button disabled={!actionable} onClick={() => send({ action: "reveal_hand", target_player_id: player.id, side: "high" })}>HIGH</button></div>}
    </section>;
  };

  return <main className={styles.game} onPointerDown={() => narratorRef.current.unlock()}>
    <header className={styles.gameBar}><div><b>✦ TRIO {state.players.length} 人场</b><span>房间 {state.code}</span></div><div><span>{phaseText}</span><button onClick={toggleMute}>{muted ? "🔇 开启声音" : "🔊 声音"}</button><button onClick={() => setRulesOpen(true)}>规则</button>{!state.finished && <button className={styles.endGame} onClick={() => { if (window.confirm("确定结束本局游戏吗？另一位玩家也会立即退出本局。")) send({ action: "end_game" }); }}>结束本局</button>}</div></header>
    <div className={`${styles.tableShell} ${state.players.length === 4 ? styles.fourPlayer : ""}`}>
      <div className={styles.felt} />
      {seats.opponents.map((player, index) => <PlayerSeat key={player.id} player={player} position={(seats.opponents.length === 3 ? ["left", "top", "right"] : ["left", "right"])[index] as "left" | "top" | "right"} />)}
      <section className={styles.centerTable} aria-label="中央桌牌">
        {state.table.map((card) => card.removed ? <div className={styles.cardSlot} key={card.index}/> : <Card key={card.index} card={card} back={card.value === null} selectable={actionable && card.value === null} onClick={() => send({ action: "reveal_table", index: card.index })}/>) }
      </section>
      {announcement && <aside className={styles.announcement}>{spotlightReveal ? <div className={styles.announcementCard}><Card card={spotlightReveal}/></div> : <span>📣</span>}<strong>{announcement}</strong></aside>}
      <PlayerSeat player={seats.me} position="self" />
      <section className={styles.myHand}>{(seats.me?.hand || []).map((card, index, cards) => {
        const side = index === 0 ? "low" : index === cards.length - 1 ? "high" : null;
        return <div className={styles.handCard} style={{ "--offset": `${(index - (cards.length - 1) / 2) * 2.1}px`, "--tilt": `${(index - (cards.length - 1) / 2) * 1.6}deg` } as React.CSSProperties} key={card.id}>
          <Card card={card} selectable={Boolean(side && actionable)} onClick={side ? () => send({ action: "reveal_hand", target_player_id: state.you.id, side }) : undefined}/>{side && <em>{side.toUpperCase()}</em>}
        </div>;
      })}</section>
      <div className={styles.turnHint}>{state.finished ? `${winner?.name || "玩家"} 获胜` : actionable ? "轮到你：选择桌牌，或任意玩家的 LOW / HIGH" : state.phase === "TURN_SUMMARY" ? "本回合小结" : state.last_event?.event === "bot_thinking" ? "电脑琢磨一下……" : "请等待本回合演出完成"}</div>
    </div>

    {state.phase === "TURN_SUMMARY" && state.last_turn && <div className={styles.modalBackdrop}><section className={styles.summary}>
      <small>本回合小结 · {summarySeconds}s</small><h2>{state.last_turn.result === "trio" ? "TRIO!" : "这次没有配成"}</h2>
      <p>{playerName(state.last_turn.actor_player_id)} 翻开了</p>
      <div className={styles.summaryCards}>{state.last_turn.reveals.map((reveal, index) => <Card card={reveal} key={index}/>)}</div>
      {state.last_turn.trio_value && <strong>获得三个 {CARD_NICKNAMES[state.last_turn.trio_value]}</strong>}
      <p>下一位：{playerName(state.last_turn.next_player_id || undefined)}</p>
      <button disabled={state.summary_ack_player_ids.includes(state.you.id)} onClick={() => send({ action: "skip_summary" })}>{state.summary_ack_player_ids.includes(state.you.id) ? "你已准备" : `跳过等待 · ${readyHumans}/${state.summary_human_count}`}</button>
    </section></div>}
    {state.finished && <div className={styles.modalBackdrop}><section className={styles.summary}><small>牌局结束</small><h2>{state.end_reason === "ended_by_player" ? "本局已结束" : winner?.id === state.you.id ? "你赢了！" : `${winner?.name || "玩家"} 获胜`}</h2>{state.end_reason === "ended_by_player" ? <p>{endedBy?.id === state.you.id ? "你结束了本局游戏。" : `${endedBy?.name || "另一位玩家"}结束了本局游戏。`}</p> : <div className={styles.summaryCards}>{state.last_turn?.reveals.map((reveal, index) => <Card card={reveal} key={index}/>)}</div>}<button onClick={() => window.location.reload()}>返回主页</button></section></div>}
    {rulesOpen && <div className={styles.modalBackdrop} onClick={() => setRulesOpen(false)}><section className={styles.rules} onClick={(event) => event.stopPropagation()}><button className={styles.close} onClick={() => setRulesOpen(false)}>×</button><h2>怎么玩</h2><p>情侣房间可选 3 人场（2 真人 + 1 电脑）或 4 人场（2 真人 + 2 电脑）。</p><p>轮流翻牌，每次只能翻桌牌，或任意玩家手中当前最小（LOW）/最大（HIGH）的牌。</p><p>连续翻出三个相同数字即可收下一组 Trio；拿到三个 Trio，或拿到数字 7 的 Trio，立即获胜。</p><p>第二或第三张不相同，本回合结束。牌局结束后可逐步回放全部公开动作，隐藏牌始终由服务器保护。</p></section></div>}
    {error && <p className={styles.toast}>{error}</p>}
  </main>;
};

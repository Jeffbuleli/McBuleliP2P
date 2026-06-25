import type { BotBillingMode, BotPlanId } from "@/lib/bot-config";
import { billingToKeyEnvironment } from "@/lib/bot-config";
import {
  parseBotFuturesConfig,
  resolveSmartExitTimeframe,
} from "@/lib/bot-futures-config";
import { classifyBinanceAuthError } from "@/lib/binance-api-validate";
import {
  listUserBinanceCredentials,
  loadUserBinanceCredentials,
} from "@/lib/bot-credentials-service";
import { botAccessAllows } from "@/lib/bot-privilege";
import {
  appendBotExecutionLog,
  getLatestBotExecutionLogDetail,
  getLatestExecutionLogAt,
  hasRecentExecutionLog,
  markBotInstanceSuccess,
  setBotInstanceError,
} from "@/lib/bot-instance-service";
import {
  evaluateMaxHold,
  FUTURES_CLOSE_LOG_ACTIONS,
  getFuturesEntryIntervalBlock,
  isInReentryCooldown,
} from "@/lib/bot-futures-lifecycle";
import { fetchBinanceFuturesMarkPrice } from "@/lib/binance-user-client";
import {
  findOtherFuturesOpen,
  listFuturesOpenPositions,
} from "@/lib/bot-futures-positions";
import {
  futuresSignedPost,
  resolveFuturesApiKind,
} from "@/lib/binance-futures-routing";
import { runSmartGate, signalSummary } from "@/lib/bot-intelligence";
import { isHigherTimeframe } from "@/lib/bot-candle-timeframe-utils";
import {
  multiTfGateSummary,
  runMultiTfSmartGate,
} from "@/lib/bot-intelligence/multi-tf-gate";
import {
  classifyExecutionError,
  runFuturesDecisionOrchestrator,
} from "@/lib/bot-decision";
import {
  getSmoothedScoreState,
  setSmoothedScoreState,
} from "@/lib/bot-decision/score-state";
import {
  isBreakevenArmed,
  shouldClosePosition,
} from "@/lib/bot-futures-breakeven";
import {
  evaluateTrailingStop,
  peakProfitIncreased,
} from "@/lib/bot-futures-trailing";
import { unrealizedProfitPct } from "@/lib/bot-futures-smart-exit";
import { runFuturesSmartExitCheck } from "@/lib/bot-futures-smart-exit";
import {
  evaluateAiPositionExit,
  getAiSignal,
  runAiAssistGate,
} from "@/lib/bot-ai-signal";
import { refreshAiSignalFromTaIfStale } from "@/lib/bot-ai-ta-fallback";

function formatFuturesQty(qty: number): string {
  if (qty >= 1) return qty.toFixed(3);
  if (qty >= 0.01) return qty.toFixed(4);
  return qty.toFixed(6);
}

function qtyFromMargin(marginUsdt: number, leverage: number, price: number): string {
  const notional = marginUsdt * leverage;
  return formatFuturesQty(notional / price);
}

export async function tickFuturesUmInstance(args: {
  instanceId: string;
  userId: string;
  planId: BotPlanId;
  billing: BotBillingMode;
  config: Record<string, unknown>;
  lastExecutedAt: Date | null;
  signalInstanceId?: string;
  readOnlySignal?: boolean;
}): Promise<{ ran: boolean; skipped?: string }> {
  const signalId = args.signalInstanceId ?? args.instanceId;
  const readOnlySignal = args.readOnlySignal ?? false;
  const allowed = await botAccessAllows(args.userId, args.planId, args.billing);
  if (!allowed) {
    return { ran: false, skipped: "no_active_subscription" };
  }

  const cfg = parseBotFuturesConfig(args.config);
  if (!cfg) {
    await setBotInstanceError(args.instanceId, "Invalid futures config");
    return { ran: false, skipped: "invalid_config" };
  }

  const env = billingToKeyEnvironment(args.billing);
  const creds = await loadUserBinanceCredentials(args.userId, env);
  const credMeta = (await listUserBinanceCredentials(args.userId)).find(
    (c) => c.environment === env,
  );
  if (!creds) {
    const hint =
      env === "demo"
        ? "bots_error_demo_futures_keys"
        : "bots_err_no_keys";
    await setBotInstanceError(args.instanceId, hint);
    return { ran: false, skipped: "no_keys" };
  }
  if (credMeta && !credMeta.futuresOk) {
    const raw = credMeta.lastValidationError ?? "";
    const hint =
      env === "demo"
        ? classifyBinanceAuthError(env, "futures", raw) !==
          "bots_error_binance_generic"
          ? classifyBinanceAuthError(env, "futures", raw)
          : "bots_error_demo_futures_keys"
        : classifyBinanceAuthError(env, "futures", raw) !==
            "bots_error_binance_generic"
          ? classifyBinanceAuthError(env, "futures", raw)
          : "bots_error_live_futures_keys";
    await setBotInstanceError(args.instanceId, hint);
    return { ran: false, skipped: "no_keys" };
  }

  const margin = Number(cfg.marginUsdt);
  if (!Number.isFinite(margin) || margin < 10) {
    await setBotInstanceError(args.instanceId, "marginUsdt too small (min 10)");
    return { ran: false, skipped: "amount_too_small" };
  }

  const mark = await fetchBinanceFuturesMarkPrice(env, cfg.symbol);
  if (!mark) {
    await setBotInstanceError(args.instanceId, "Could not fetch futures mark price");
    return { ran: false, skipped: "price_unavailable" };
  }

  const futuresKind = await resolveFuturesApiKind(
    env,
    creds,
    credMeta?.futuresApiKind,
  );

  try {
    const openSnaps = await listFuturesOpenPositions({
      environment: env,
      creds,
      apiKind: futuresKind,
    });
    const onConfig = openSnaps.find((p) => p.symbol === cfg.symbol);
    const onOther = findOtherFuturesOpen(openSnaps, cfg.symbol);

    if (onConfig) {
      if (cfg.aiAssistMode) {
        const aiSig = await getAiSignal(
          signalId,
          cfg.aiSignalMaxAgeMs ?? 120_000,
        );
        const xExit = evaluateAiPositionExit({
          positionSide: cfg.side,
          signal: aiSig,
          aiAssistMode: true,
        });
        if (xExit.exit) {
          const closeSide = onConfig.amt > 0 ? "SELL" : "BUY";
          const order = await futuresSignedPost({
            environment: env,
            creds,
            kind: futuresKind,
            pathKey: "order",
            params: {
              symbol: cfg.symbol,
              side: closeSide,
              type: "MARKET",
              quantity: formatFuturesQty(Math.abs(onConfig.amt)),
              reduceOnly: "true",
            },
          });
          await markBotInstanceSuccess(args.instanceId);
          await appendBotExecutionLog({
            instanceId: args.instanceId,
            userId: args.userId,
            planId: args.planId,
            action: "futures_ai_x_close",
            detail: {
              symbol: cfg.symbol,
              kind: xExit.kind,
              reason: xExit.reason,
              ai: aiSig
                ? {
                    x_position_action: aiSig.x_position_action,
                    x_sentiment: aiSig.x_sentiment,
                    confidence: aiSig.confidence,
                    x_new_direction: aiSig.x_new_direction,
                  }
                : null,
              order,
            },
          });

          if (xExit.kind === "close_and_reverse" && xExit.reverseTo) {
            const reverseSide = xExit.reverseTo;
            const smart = {
              smartMode: cfg.smartMode,
              minSignalScore: cfg.minSignalScore,
              timeframe: cfg.timeframe,
            };
            const intent = reverseSide === "LONG" ? "long" : "short";
            const useMultiTf =
              cfg.multiTfGateMode &&
              cfg.confirmTimeframe &&
              isHigherTimeframe(cfg.timeframe, cfg.confirmTimeframe);
            const gate = useMultiTf
              ? await runMultiTfSmartGate({
                  environment: env,
                  symbol: cfg.symbol,
                  market: "futures",
                  smart,
                  intent,
                  confirmTimeframe: cfg.confirmTimeframe!,
                })
              : await runSmartGate({
                  environment: env,
                  symbol: cfg.symbol,
                  market: "futures",
                  smart,
                  intent,
                });
            const aiGate = runAiAssistGate({
              botSide: reverseSide,
              minAiConfidence: cfg.minAiConfidence,
              signal: aiSig,
              aiAssistMode: true,
              allowXReverse: true,
            });
            if (gate.ok && aiGate.ok) {
              await futuresSignedPost({
                environment: env,
                creds,
                kind: futuresKind,
                pathKey: "leverage",
                params: {
                  symbol: cfg.symbol,
                  leverage: String(cfg.leverage),
                },
              });
              const openOrderSide = reverseSide === "LONG" ? "BUY" : "SELL";
              const revOrder = await futuresSignedPost({
                environment: env,
                creds,
                kind: futuresKind,
                pathKey: "order",
                params: {
                  symbol: cfg.symbol,
                  side: openOrderSide,
                  type: "MARKET",
                  quantity: qtyFromMargin(margin, cfg.leverage, mark),
                },
              });
              await appendBotExecutionLog({
                instanceId: args.instanceId,
                userId: args.userId,
                planId: args.planId,
                action: "futures_ai_x_reverse_open",
                detail: {
                  symbol: cfg.symbol,
                  side: reverseSide,
                  order: revOrder,
                },
              });
            }
          }
          return { ran: true };
        }
      }

      const breakevenLatched = await hasRecentExecutionLog(
        args.instanceId,
        "futures_breakeven_armed",
        30 * 24 * 60 * 60 * 1000,
      );
      const breakevenArmed = isBreakevenArmed({
        side: cfg.side,
        entry: onConfig.entry,
        mark,
        breakevenMode: cfg.breakevenMode,
        breakevenTriggerPct: cfg.breakevenTriggerPct,
        latched: breakevenLatched,
      });

      if (
        cfg.breakevenMode &&
        breakevenArmed &&
        !breakevenLatched
      ) {
        const profitPct = unrealizedProfitPct({
          side: cfg.side,
          entry: onConfig.entry,
          mark,
        });
        await appendBotExecutionLog({
          instanceId: args.instanceId,
          userId: args.userId,
          planId: args.planId,
          action: "futures_breakeven_armed",
          detail: {
            symbol: cfg.symbol,
            entry: onConfig.entry,
            mark,
            profitPct,
            triggerPct: cfg.breakevenTriggerPct,
            profile: cfg.traderProfile,
          },
        });
      }

      const positionWindowMs = 30 * 24 * 60 * 60 * 1000;
      const peakDetail = cfg.trailingMode
        ? await getLatestBotExecutionLogDetail(
            args.instanceId,
            "futures_trailing_peak",
            positionWindowMs,
          )
        : null;
      const storedPeak =
        typeof peakDetail?.peakProfitPct === "number" &&
        Number.isFinite(peakDetail.peakProfitPct)
          ? peakDetail.peakProfitPct
          : null;

      const trailing = evaluateTrailingStop({
        side: cfg.side,
        entry: onConfig.entry,
        mark,
        trailingMode: cfg.trailingMode,
        trailingPct: cfg.trailingPct,
        trailingTriggerPct: cfg.trailingTriggerPct,
        storedPeakProfitPct: storedPeak,
      });

      if (
        cfg.trailingMode &&
        peakProfitIncreased(storedPeak, trailing.peakProfitPct)
      ) {
        await appendBotExecutionLog({
          instanceId: args.instanceId,
          userId: args.userId,
          planId: args.planId,
          action: "futures_trailing_peak",
          detail: {
            symbol: cfg.symbol,
            entry: onConfig.entry,
            mark,
            peakProfitPct: trailing.peakProfitPct,
            profile: cfg.traderProfile,
          },
        });
      }

      if (trailing.shouldClose) {
        const closeSide = onConfig.amt > 0 ? "SELL" : "BUY";
        const order = await futuresSignedPost({
          environment: env,
          creds,
          kind: futuresKind,
          pathKey: "order",
          params: {
            symbol: cfg.symbol,
            side: closeSide,
            type: "MARKET",
            quantity: formatFuturesQty(Math.abs(onConfig.amt)),
            reduceOnly: "true",
          },
        });
        await markBotInstanceSuccess(args.instanceId);
        await appendBotExecutionLog({
          instanceId: args.instanceId,
          userId: args.userId,
          planId: args.planId,
          action: "futures_trailing_close",
          detail: {
            symbol: cfg.symbol,
            mark,
            entry: onConfig.entry,
            peakProfitPct: trailing.peakProfitPct,
            profitPct: trailing.currentProfitPct,
            retracePct: trailing.retracePct,
            trailingPct: cfg.trailingPct,
            order,
          },
        });
        return { ran: true };
      }

      const closeReason = shouldClosePosition({
        side: cfg.side,
        entry: onConfig.entry,
        mark,
        stopLossPct: cfg.stopLossPct,
        takeProfitPct: cfg.takeProfitPct,
        breakevenArmed,
      });
      if (closeReason) {
        const closeSide = onConfig.amt > 0 ? "SELL" : "BUY";
        const order = await futuresSignedPost({
          environment: env,
          creds,
          kind: futuresKind,
          pathKey: "order",
          params: {
            symbol: cfg.symbol,
            side: closeSide,
            type: "MARKET",
            quantity: formatFuturesQty(Math.abs(onConfig.amt)),
            reduceOnly: "true",
          },
        });
        await markBotInstanceSuccess(args.instanceId);
        await appendBotExecutionLog({
          instanceId: args.instanceId,
          userId: args.userId,
          planId: args.planId,
          action: closeReason === "sl" ? "futures_sl_close" : "futures_tp_close",
          detail: {
            symbol: cfg.symbol,
            mark,
            entry: onConfig.entry,
            breakevenArmed,
            order,
          },
        });
        return { ran: true };
      }

      if (cfg.smartExitMode) {
        const exitTf = resolveSmartExitTimeframe(cfg);
        const exitCheck = await runFuturesSmartExitCheck({
          environment: env,
          symbol: cfg.symbol,
          positionSide: cfg.side,
          entry: onConfig.entry,
          mark,
          config: {
            smartExitMode: true,
            minReversalScore: cfg.minReversalScore,
            minProfitPctForSmartExit: cfg.minProfitPctForSmartExit,
            timeframe: exitTf,
          },
        });
        if (exitCheck.close) {
          const closeSide = onConfig.amt > 0 ? "SELL" : "BUY";
          const order = await futuresSignedPost({
            environment: env,
            creds,
            kind: futuresKind,
            pathKey: "order",
            params: {
              symbol: cfg.symbol,
              side: closeSide,
              type: "MARKET",
              quantity: formatFuturesQty(Math.abs(onConfig.amt)),
              reduceOnly: "true",
            },
          });
          await markBotInstanceSuccess(args.instanceId);
          await appendBotExecutionLog({
            instanceId: args.instanceId,
            userId: args.userId,
            planId: args.planId,
            action: "futures_smart_close",
            detail: {
              symbol: cfg.symbol,
              mark,
              entry: onConfig.entry,
              profitPct: exitCheck.profitPct,
              signal: signalSummary(exitCheck.signal),
              score: exitCheck.signal.score,
              reasons: exitCheck.signal.reasons,
              order,
            },
          });
          return { ran: true };
        }

        const holdReason = exitCheck.close ? null : exitCheck.reason;
        if (
          holdReason &&
          !(await hasRecentExecutionLog(
            args.instanceId,
            "smart_exit_hold",
            60 * 60 * 1000,
          ))
        ) {
          await appendBotExecutionLog({
            instanceId: args.instanceId,
            userId: args.userId,
            planId: args.planId,
            action: "smart_exit_hold",
            detail: {
              reason: holdReason,
              profitPct: exitCheck.profitPct,
              score: exitCheck.signal?.score,
              signal: exitCheck.signal
                ? signalSummary(exitCheck.signal)
                : null,
              timeframe: exitTf,
            },
          });
        }
      }

      return { ran: false, skipped: "position_open" };
    }

    if (onOther) {
      await setBotInstanceError(
        args.instanceId,
        `Open position on ${onOther.symbol} — close it or set the bot to that pair`,
      );
      return { ran: false, skipped: "other_symbol_open" };
    }

    const entryInterval = await getFuturesEntryIntervalBlock({
      instanceId: args.instanceId,
      intervalHours: cfg.intervalHours,
    });
    if (entryInterval.blocked) {
      if (
        !(await hasRecentExecutionLog(
          args.instanceId,
          "tick_skip",
          60 * 60 * 1000,
        ))
      ) {
        await appendBotExecutionLog({
          instanceId: args.instanceId,
          userId: args.userId,
          planId: args.planId,
          action: "tick_skip",
          detail: {
            reason: "interval_not_elapsed",
            remainingMinutes: entryInterval.remainingMinutes,
            intervalHours: cfg.intervalHours,
            lastEntryAt: entryInterval.lastEntryAt?.toISOString() ?? null,
          },
        });
      }
      return { ran: false, skipped: "interval_not_elapsed" };
    }

    const lastCloseAt = await getLatestExecutionLogAt(
      args.instanceId,
      [...FUTURES_CLOSE_LOG_ACTIONS],
      7 * 24 * 60 * 60 * 1000,
    );
    const cooldown = isInReentryCooldown({
      reentryCooldownMinutes: cfg.reentryCooldownMinutes,
      lastCloseAt,
    });
    if (cooldown.blocked) {
      return { ran: false, skipped: "reentry_cooldown" };
    }

    const smart = {
      smartMode: cfg.smartMode,
      minSignalScore: cfg.minSignalScore,
      timeframe: cfg.timeframe,
    };
    const useMultiTf =
      cfg.multiTfGateMode &&
      cfg.confirmTimeframe &&
      isHigherTimeframe(cfg.timeframe, cfg.confirmTimeframe);

    if (cfg.aiAssistMode) {
      await refreshAiSignalFromTaIfStale({
        instanceId: readOnlySignal ? signalId : args.instanceId,
        environment: env,
        symbol: cfg.symbol,
        side: cfg.side,
        smart,
        maxAgeMs: cfg.aiSignalMaxAgeMs ?? 120_000,
      });
    }

    const prevSmooth = await getSmoothedScoreState(signalId);
    const aiSignal = await getAiSignal(
      signalId,
      cfg.aiSignalMaxAgeMs ?? 120_000,
    );

    const decision = await runFuturesDecisionOrchestrator({
      instanceId: args.instanceId,
      environment: env,
      symbol: cfg.symbol,
      botSide: cfg.side,
      smart,
      confirmTimeframe: useMultiTf ? cfg.confirmTimeframe : null,
      aiSignal,
      aiAssistMode: cfg.aiAssistMode,
      leverage: cfg.leverage,
      marginUsdt: margin,
      fundingRate: undefined,
      markPrice: mark,
      previousSmoothedScore: prevSmooth,
    });

    if (decision.status === "IGNORED") {
      const { trace } = decision;
      const t = decision.technical;
      const summary =
        t?.confirmSignal && cfg.confirmTimeframe
          ? multiTfGateSummary(
              t.tradeSignal,
              t.confirmSignal,
              cfg.timeframe,
              cfg.confirmTimeframe,
            )
          : t
            ? signalSummary(t.tradeSignal)
            : null;
      await appendBotExecutionLog({
        instanceId: args.instanceId,
        userId: args.userId,
        planId: args.planId,
        action: "decision_skip",
        detail: {
          trace,
          legacy_skip: trace.category === "TECHNICAL" ? "smart_blocked" : trace.category === "AI" ? "ai_signal_hold" : trace.reason_code,
          summary,
          score: trace.score,
          minRequired: cfg.minSignalScore,
          technical: t
            ? {
                signal: t.signal,
                confidence: t.confidence,
                regime: t.market_regime,
                reasons: t.reasons,
              }
            : null,
          ai: decision.ai
            ? {
                sentiment: decision.ai.sentiment,
                confidence: decision.ai.confidence,
                warning_level: decision.ai.warning_level,
                leverage_modifier: decision.ai.leverage_modifier,
                notes: decision.ai.ai_notes,
              }
            : null,
          risk: decision.risk ?? null,
        },
      });
      return { ran: false, skipped: trace.reason_code };
    }

    if (!readOnlySignal) {
      await setSmoothedScoreState(args.instanceId, decision.technical.score);
    }

    const execLev = decision.execution.leverage ?? decision.risk.leverage;
    const execMargin = decision.execution.marginUsdt ?? margin;

    await futuresSignedPost({
      environment: env,
      creds,
      kind: futuresKind,
      pathKey: "leverage",
      params: {
        symbol: cfg.symbol,
        leverage: String(execLev),
      },
    });

    const openSide = cfg.side === "LONG" ? "BUY" : "SELL";
    const order = await futuresSignedPost({
      environment: env,
      creds,
      kind: futuresKind,
      pathKey: "order",
      params: {
        symbol: cfg.symbol,
        side: openSide,
        type: "MARKET",
        quantity: qtyFromMargin(execMargin, execLev, mark),
      },
    });

    await markBotInstanceSuccess(args.instanceId);
    await appendBotExecutionLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      action: "futures_open",
      detail: {
        symbol: cfg.symbol,
        side: cfg.side,
        leverage: execLev,
        marginUsdt: execMargin,
        mark,
        signal: signalSummary(decision.technical.tradeSignal),
        decision_trace_id: decision.trace_id,
        technical: {
          score: decision.technical.score,
          confidence: decision.technical.confidence,
          regime: decision.technical.market_regime,
        },
        ai: {
          sentiment: decision.ai.sentiment,
          warning: decision.ai.warning_level,
          leverage_modifier: decision.ai.leverage_modifier,
        },
        risk_level: decision.risk.risk_level,
        order,
      },
    });
    return { ran: true };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Futures order failed";
    const market =
      env === "demo" || futuresKind === "fapi" ? "futures" : "portfolio";
    const code = classifyBinanceAuthError(env, market, raw);
    const msg = code !== "bots_error_binance_generic" ? code : raw;
    const execErr = classifyExecutionError(raw);
    await setBotInstanceError(args.instanceId, msg);
    await appendBotExecutionLog({
      instanceId: args.instanceId,
      userId: args.userId,
      planId: args.planId,
      action: "error",
      detail: {
        message: msg,
        execution: execErr,
        reason_code: execErr.reason_code,
      },
    });
    return { ran: false, skipped: execErr.reason_code };
  }
}

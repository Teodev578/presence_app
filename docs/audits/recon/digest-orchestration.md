# Digest — Agentic coding with sub-agents and multi-agent teams (practitioner/industry research, 2025–2026)

Research firewall: every claim below is grounded in material retrieved from the web during this run (search results + fetched pages). Anything I could not verify is labeled. "VERIFIED" = 2+ independent sources agree; "SINGLE-SOURCE" = one source only; "CONTRADICTED" = sources disagree (disagreement reported).

---

## 1. Claims

### Q1 — When does delegation to sub-agents help vs hurt?

**C1. Delegation pays for context-noisy, read-only side work; the subagent burns tokens in its own window and returns a summary.** VERIFIED.
Sources: Anthropic claude.com blog "How and when to use subagents" (2026-04-07: "Use one when a side task would flood your main conversation with search results, logs, or file contents you won't reference again"); OpenAI Codex docs "Subagents" ("use parallel agents for read-heavy tasks such as exploration, tests, triage, and summarization"); HN 45556075 (redhale: "isolate context-noisy subtasks… unlocks much longer-running loops"; simonw: "worthwhile only as a token context management tool"); HN 45181577 (macrolime: "The ideal sub agent is one that can take a simple question, use up massive amounts of tokens answering it, and then return a simple answer"); Cognition "Multi-Agents: What's Actually Working" (2026-04-22: "most multi-agent setups in the world are limited to 'readonly' subagents… these mostly resemble tool calls").

**C2. Token cost is real and multiplicative; every spawn carries a fixed context-setup cost that must be measured before budgeting.** VERIFIED (existence and direction), magnitude figures SINGLE-SOURCE per measurement.
- Anthropic (2025-06-13): "agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats." (internal data; the single most-cited number in the ecosystem)
- Rulestack dev.to measurement (2026-08-20): headline "~436k tokens per subagent spawn before reading a file" — **self-corrected 2026-08-24 to 54,154 tokens** of true fixed cost (the 436k figure double-counted cached prefixes). Break-even for same-model delegation: ~30–50k tokens of reading (post-correction); ~10k when routed to a cheaper model.
- Simon Willison (HN 45556075, Oct 2025): 5 subtasks "consumed 50,000+ tokens each… because each one had to consume duplicate information."
- GitHub anthropics/claude-code #74318 (2026): local profiling of 95 sessions / ~1,800 subagents / 6.8B input tokens; subagent caching strategy inflates prompt spend ~14%; every subagent re-sends ~30k tokens of identical static context (CLAUDE.md + rules + skills).
- GitHub openai/codex #39808 (2026): "Subagent fan-out can increase usage… even when subagents use smaller models."
- Community report (search snippet, Reddit r/ClaudeAI): "My Claude code spawned almost 90 agents in parallel which of course killed my usage limit in like two minutes."

**C3. Parallelism cuts wall-clock time for independent work, at the cost of spawn latency (each subagent re-gathers context from scratch).** VERIFIED (direction); magnitude SINGLE-SOURCE.
Anthropic: parallel subagents + parallel tool calls "cut research time by up to 90% for complex queries." Claude.com blog: "Three subagents working in parallel complete in roughly the time one would take." Counterweight: Claude Code docs/community (via gregpriday mirror): "Subagents start off with a clean slate each time they are invoked and may add latency as they gather context."

**C4. Named failure modes of multi-agent setups reported by practitioners.** VERIFIED (each mode attested in ≥2 independent sources):
- **Over-delegation / reflexive spawning** for work that should be done inline (GitHub anthropics/claude-code #27645, 2026-02-22: "burned through tokens… for straightforward find-and-replace style fixes, direct edits are 5-10x more token-efficient"; Anthropic itself: early agents "spawning 50 subagents for simple queries").
- **Context loss at the handoff** ("the main agent will essentially just summarize what was done… i don't know if there was project drift" — r/ClaudeAI; "Claude Code Agent is context-rich, while claude subagents are context-poor" — HN 45181577).
- **Write conflicts / conflicting implicit decisions** when agents edit in parallel (Cognition 2025 & 2026; Codex docs "Be more careful with parallel write-heavy workflows"; HN 46993479 _sinelaw_: mature projects have cross-cutting features where "two agents would add similar overlapping mechanisms").
- **Unobservability / black boxes**: "sub-agents… are black boxes, and we can't see what's going on inside them and cannot intervene" (HN 45181577); "You can't observe what 20 agents are doing" (HN 46993598).
- **Orphaned or destroyed work**: dev.to Rulestack series part 8: "A Claude Code subagent wrote 25 posts into our working tree. The parent's git rebase --skip erased all 25."
- **Herding overhead eats the gains**: HN 46993479 (Aurornis): "As you scale up the sub-agents you spend so much time managing the herd and trying to backtrack when things go wrong that you would have been better off handling it serially with yourself in the loop."
- **Human supervision becomes the bottleneck**: HN 46993479 (hrishikesh-s): "The sweet-spot is 2-3 agents co-ordinating at a time and me overseeing everything."

**C5. Delegation hurts most for: small tasks, sequential dependent work, same-file edits, and mature codebases with curated project knowledge.** VERIFIED.
Claude.com blog "When shouldn't you use subagents" lists exactly these four cases plus "too many specialist agents" ("Most teams settle on a handful of well-scoped agents rather than a sprawling roster"). HN 45181577 (rapind): "only use subagents for stuff that is very compartmentalized because they're hard to monitor and prone to failure with complex codebases where agents live and die by project knowledge curated in files like CLAUDE.md." HN 45181577 (beefcake): 40-subagent R refactor — "Cost-wise (and speed-wise!) it was mayhem as every subagent re-read the script… The lesson is that subagents are often costly overkill." Anthropic itself: "most coding tasks involve fewer truly parallelizable tasks than research."

---

### Q2 — Agent teams / persona plugins: real value or theater?

**C6. Named role personas ("lead frontend", "DBA", "QA auditor") draw mostly skeptical practitioner reaction; task-shaped agents get better reviews.** VERIFIED (3+ independent voices).
- HN 45181577 (touristtam): "Make agents for tasks, not roles… For code review, I don't use a code reviewer agent, instead I've defined a dozen code reviewing tasks."
- HN 45181577 (zachwills): "Telling the LLM that it is an experienced product manager doesn't make it an experienced product manager, it just makes it sound like one. This is like launching an entire team of 'fake it til you make it' employees."
- HN 45181577 (sixhobbits): "I often see people making these sub agents modelled on roles like product manager, back end developer… the results were pretty bad compared to just using CC with no agent specific instructions."
- Reddit r/ClaudeAI (planning thread, ~Mar 2026): "there's only one Claude — one with multiple perspectives/personas. Using a 'different' agent with a different persona is just superficial. Just tell it to change persona/perspectives." Same commenter concedes: different *models* per role can be valuable.
- Cognition 2025 explicitly calls prompt-gimmick personas wrong: "Prompt engineering encourages gimmicky techniques like 'you're a senior software engineer'."

**C7. Counterpoint: a minority report value from role frameworks when roles carry checklists/templates/tasks, and reject the roles-vs-tasks framing.** CONTRADICTED (minority defends).
HN 45181577 (redhale, re BMad): "BMAD has roles, but to those are attached other documents the persona should be using (checklist, template, tasks)." (mindwok): "Role based works well in some cases. Task based well in others. It's a false choice." Ecosystem supply exists (persona packs: addyosmani/agent-skills, ratnesh-maurya/cursor-claude-personas "38 role-based AI persona packs", c-level-agents suites), but that is supply, not evidence of outcome gains.

**C8. Claude "Agent Teams" (multi-instance, mailbox/task-list coordination) is viewed as repackaging with real but narrow value; docs admit the cost.** SINGLE-SOURCE per datum, mixed sentiment.
r/ClaudeCode (~Sep 2026): "about 80% marketing spin for something subagents already did well and 20% useful"; other users argue live inter-agent communication is "a game changer" versus one-shot subagents, since one-shot subagents "each would burn a lot of extra token doing a 'finished' work". Official docs (mirrors of code.claude.com/docs/agent-teams): "Agent teams add coordination overhead and use significantly more tokens than a single session"; teams can form unprompted when Claude names a subagent.

---

### Q3 — Orchestration patterns that work

**C9. The "keep it simple, one agent unless X" default is the closest thing to a consensus.** VERIFIED.
Cognition 2025: "The simplest way to follow the principles is to just use a single-threaded linear agent… the simple architecture will get you very far." HN 46993598 (gck1): "Even Anthropic research articles consistently demonstrate they themselves use one agent, and just tune the harness around it." HN 46993479 (avaer): "people who run 15 agents… could probably use 1 or 2 and a better multi-page prompt and have the same results for a fraction of the cost." Interview-prep synthesis of the two canonical posts: "Default answer: start with a single agent; go multi only when a specific bottleneck (context, parallelism, or specialization) demands it." dev.to "Do You Actually Need a Multi-Agent System?" (2026-06-09) argues the same.

**C10. The pattern vendors and practitioners converge on: many agents may contribute *intelligence* (reads, review, research), but *writes* stay single-threaded.** VERIFIED.
Cognition 2026: "multi-agent systems work best today when writes stay single-threaded and the additional agents contribute intelligence rather than actions." LangChain (Harrison Chase, 2025-06-16): "read actions are inherently more parallelizable than write actions… conflicting write actions typically produce far worse outcomes" — noting Anthropic's research system deliberately writes the final synthesis in a single agent call. Codex docs: parallel reads recommended, parallel writes cautioned.

**C11. Reviewer/worker split is the most-attested working pattern — and it works best when the reviewer has a clean context (no shared history).** VERIFIED (pattern); bug-yield numbers SINGLE-SOURCE (Cognition).
Cognition 2026: "Devin Review catches an average of 2 bugs per PR, of which roughly 58% are severe… we found this technique to work best when the coding and review agents do not share any context beforehand" — because attention math ("Context Rot") makes the fresh-context reviewer smarter, and it can question the user's own bad instructions. HN 46993479 (petesergeant): "'Claude writes, Codex reviews' has shown huge promise… it means I trust the code coming out much more." dev.to comment thread (Rulestack): "independent review goes to a different model from the parent, because a same-model reviewer tends to share the blind spot it is meant to expose." Anthropic appendix and claude.com blog both recommend independent verification subagents.

**C12. Orchestrator-worker with explicit delegation briefs and effort-scaling rules is the working synthesis pattern; without explicit briefs, workers duplicate and diverge.** VERIFIED (mechanism), effort-scale numbers SINGLE-SOURCE (Anthropic).
Anthropic: "Without detailed task descriptions, agents duplicate work, leave gaps" (example: two subagents duplicated 2025 supply-chain searches); embedded scaling rules: simple → 1 agent/3–10 tool calls; comparisons → 2–4 subagents; complex → 10+ subagents. HN 44920521: "spawn a subagent to do each task in X, give it Y context" keeps the main agent's context clean. ClaudeLog: explicit step-by-step delegation instructions are needed or Claude stays "reserved" about subagent use.

**C13. Unstructured swarms and free-form agent-to-agent negotiation are discounted; the practical shape is map-reduce-and-manage (manager splits, children execute, manager synthesizes).** VERIFIED.
Cognition 2026: "We think the unstructured-swarm approach… is mostly a distraction. The practical shape is map-reduce-and-manage." r/AI_Agents (Jun 2025): "Most 'multi-agent orchestration' is just a single agent calling a function. Stop rebranding function calls as agents." Cognition 2025: agents today "are not quite able to engage in this style of long-context proactive discourse with much more reliability than you would get with a single agent."

**C14. Supporting infrastructure practitioners actually use: per-agent isolation via git worktrees/containers, deterministic hooks/queues instead of LLM orchestration, and caps on fan-out.** VERIFIED.
HN 46993479: multiple reports of git worktrees + devcontainers per agent; blakec runs "84 hooks… No framework, no runtime. Just files," and reports "The 'multi-agent is worse than serial' take is true when agents share context. Stops being true when you give planning agents their own session… and implementation agents their own." Codex config defaults: `agents.max_threads = 6`, `agents.max_depth = 1` ("Keep the default unless you specifically need recursive delegation… raising this value can turn broad delegation instructions into repeated fan-out"). Anthropic uses rainbow deployments and durable checkpoints.

---

### Q4 — Keeping sub-agent output from degrading quality

**C15. Compressed handoffs lose decisions; the mitigations are full-trace/context sharing, filesystem artifacts instead of summary relay, and external checklists.** VERIFIED.
Cognition 2025 principles: "Share context, and share full agent traces, not just individual messages"; "Actions carry implicit decisions, and conflicting decisions carry bad results" (the Flappy-Bird example: two subagents produce incompatible halves). Anthropic appendix: "Subagent output to a filesystem to minimize the 'game of telephone'" — workers persist artifacts and pass references, "prevents information loss during multi-stage processing." Anthropic also stores the research plan in Memory because the 200k window truncates. CertiK white-box study (arXiv 2607.17937): after a verified 2.4M-char load and native compaction, a delegated worker "reports losing an opaque contract"; "an external detailed checklist can repair the main failure mode." Cognition 2026 on manager/child delegation: "Agents assume they share state with their children when they don't."

**C16. Sycophancy / premature consensus between agents is documented in research; the reviewer-loop counter-evidence says clean context and cross-model routing blunt it.** CONTRADICTED (report both sides).
- For: "Peacemaker or Troublemaker: How Sycophancy Shapes Multi-Agent Debate" (arXiv 2509.23055) — sycophancy "can collapse debates into premature consensus," with "debater-driven and judge-driven failure modes, where either the debating agents cave too easily or the judge agent rubber-stamps the majority" (per toknow.ai's summary of the paper); gains from sycophancy control "remain marginal overall." Aggregate writeup "AI Agent Teams Look Amazing but Rarely Work" claims multi-agent debate fails to beat single-agent CoT on most benchmarks while costing more.
- Against / nuance: Cognition 2026 argues two instances of the same model "does not quite make them self-biased… They don't have egos," and clean-context review measurably catches bugs. Practitioners (dev.to comments) route review to a *different* model to avoid shared blind spots. HN 46993479 (petesergeant's cross-vendor pair) and (zachwills: "setting Gemini cli and Claude code taking turns in designing reviewing, implementing and testing each other") report gains from cross-model review.

**C17. Orphaned work and unintegrated output are recurring; the fix is an explicit communication bridge and a human/lead synthesis step.** VERIFIED.
Cognition 2026: "the communication bridge between the coding agent and review agent… is key to preventing looping, disobeying the user, doing work that is out of scope." Rulestack dev.to part 8: subagent's 25 written posts destroyed by the parent's git operation. r/ClaudeAI complaint thread: "I'll tell it to ensure the agent reports back on certain things and it still won't." Cognition 2026: "Cross-agent communication… doesn't happen by default, because models haven't been trained in environments where it needed to."

**C18. Verification must be a first-class role; unchecked pipelines hallucinate and compound errors.** VERIFIED (mechanism).
MAST (Cemri et al., arXiv 2503.13657): "Task Verification" = 21.3% of all annotated failures (premature termination 7.82%, no/incomplete verification 6.82%, incorrect verification 6.66%). Anthropic (via AI-curriculum summary of the post): the system "was observed to hallucinate without explicit verifier roles" (secondary summary; the fetched Anthropic post itself stresses LLM-as-judge + human evals and end-state evaluation). dev.to/HN 46993479 (0xecro1): "The review pipeline should be heavier than the generation pipeline."

---

### Q5 — Concrete numbers and surveys

**N1. Token economics** (see C2): 4× (agent vs chat) / 15× (multi-agent vs chat) — Anthropic; per-spawn fixed overhead 54,154 tokens measured (corrected from 436k) — Rulestack; ~30k static tokens re-sent per subagent — GitHub #74318; >50k tokens per trivial subtask — simonw; cache optimization can cut subagent prompt spend ~14% / total ~8% — GitHub #74318.

**N2. Performance** (all SINGLE-SOURCE, all internal): +90.2% for Opus-4-lead + Sonnet-4 workers vs single Opus 4 on Anthropic's internal research eval (not reproducible; breadth-first research tasks, "does not generalise to coding tasks" per the EndogenAI analysis); token usage alone explains 80% of BrowseComp variance; parallelization cut research time "up to 90%"; self-improved tool descriptions cut task completion time 40%. Devin Review: 2 bugs/PR average, ~58% severe (Cognition). Devin enterprise usage ~8× in 6 months (Cognition).

**N3. Failure-mode distribution** (MAST, Cemri et al. 2025, 1,600+ annotated traces across 7 frameworks, κ=0.88): Specification Issues 41.8%, Inter-Agent Misalignment 36.9%, Task Verification 21.3%; top single modes: step repetition 17.14%, disobey task spec 10.98%, unaware of termination 9.82%, premature termination 7.82%. CAUTION: a widely circulating "41–86.7% of multi-agent systems fail in production" figure appears in secondary aggregations (e.g. a GitHub research doc) but I did **not** verify it in the primary arXiv text this run — treat as UNVERIFIED SECONDARY.

**N4. Adoption surveys** (Stack Overflow Developer Survey 2025, 49,000+ respondents, published 2025-07-29): only 31% of developers currently use AI agents; 52% "don't use agents or stick to simpler AI tools"; 38% have no plans to adopt; among users, 69% report productivity gains; 87% concerned about agent accuracy and 81% about data security/privacy; agent-orchestration tooling among agent builders: Ollama 51%, LangChain 33%. Trust in AI accuracy overall is negative (46% distrust vs 33% trust; only 3.1% "highly trust"). Cognition reports ~8× growth in enterprise Devin usage over 6 months (vendor-reported). JetBrains Developer Ecosystem Survey 2026 preliminary (vendor page): ~23% of developers still primarily write code manually — tangential, thin.

**N5. Open empirical question, acknowledged on HN**: "Is there any hard evidence that subagent flows give actual developers better experience than just using CC without?" → "Judging by the lack of responses and my own experience: no." (HN 45181577, awb + reply). No controlled developer-experiment comparing subagent workflows to single-agent was found in this run.

---

## 2. Source table

| # | Title | Site / publisher | URL | Date | Relevance |
|---|---|---|---|---|---|
| 1 | Don't Build Multi-Agents (Walden Yan) | Cognition blog | https://cognition.com/blog/dont-build-multi-agents | 2025-06-12 | Canonical anti-multi-agent argument: share full traces; actions carry implicit decisions; single-threaded agent default |
| 2 | How we built our multi-agent research system | Anthropic Engineering | https://www.anthropic.com/engineering/built-multi-agent-research-system | 2025-06-13 | Canonical pro pattern (orchestrator-worker); 90.2% / 15× / 4× numbers; failure modes; delegation briefs; filesystem artifacts |
| 3 | Multi-Agents: What's Actually Working (Walden Yan) | Cognition blog | https://cognition.com/blog/multi-agents-working | 2026-04-22 | Partial retraction/update: writes single-threaded, clean-context reviewer loop, smart-friend, map-reduce-and-manage |
| 4 | A Claude Code subagent costs ~436k tokens… (with correction) | dev.to (Rulestack) | https://dev.to/rulestack/a-claude-code-subagent-costs-436k-tokens-before-it-reads-a-single-file-measured-with-the-1ja9 | 2026-08-20, corrected 2026-08-24 | Only public per-spawn cost measurement with self-correction (54k fixed cost); break-even math; routing rules |
| 5 | How to use Claude Code subagents to parallelize development (thread) | Hacker News | https://news.ycombinator.com/item?id=45181577 | Sept 2025 | Large practitioner thread: tasks-not-roles, persona skepticism, context-poor subagents, costly-overkill case |
| 6 | Ask HN: Are you using an agent orchestrator to write code? | Hacker News | https://news.ycombinator.com/item?id=46993479 | c. Feb 2026 | Skeptics vs power users; herding overhead; 2–3 agent sweet spot; worktrees; review-heavy pipelines; Yegge FOMO critique |
| 7 | Sub-agent token cost exchange (simonw et al.) on "Superpowers" thread | Hacker News | https://news.ycombinator.com/item?id=45556075 | Oct 2025 | simonw: 50k+ tokens per subtask; "worthwhile only as a token context management tool" |
| 8 | How and when to use subagents in Claude Code | claude.com blog (Anthropic) | https://claude.com/blog/subagents-in-claude-code | 2026-04-07 | Vendor guidance: when to delegate (5 signals) and when not (4 anti-patterns incl. too many specialists) |
| 9 | How and when to build multi-agent systems (Harrison Chase) | LangChain blog | https://www.langchain.com/blog/how-and-when-to-build-multi-agent-systems | 2025-06-16 | Reconciles #1 and #2: context engineering + "read easier than write" |
| 10 | How are you managing the use of explicitly spawned subagents? | GitHub Discussions, openai/codex #23184 | https://github.com/openai/codex/discussions/23184 | 2026-05-17 | Practitioner asks when subagents are worth the cost; 0 replies — evidence the question is unsettled |
| 11 | 2025 Stack Overflow Developer Survey — AI section | Stack Overflow | https://survey.stackoverflow.co/2025/ai | 2025-07-29 | Adoption data: 31% use agents, 38% no plans, 69% productivity gain among users, trust deficit |
| 12 | Why Do Multi-Agent LLM Systems Fail? (Cemri et al., MAST) | arXiv 2503.13657 | https://arxiv.org/abs/2503.13657 | 2025-03-17 (v3 2025-10-26) | 14-mode failure taxonomy, category shares, per-mode percentages (via search-retrieved text) |
| 13 | Subagents: Why you should probably be using them more (+ auto-TL;DR) | Reddit r/ClaudeAI | https://www.reddit.com/r/ClaudeAI/comments/1pz3c6v/ | c. Aug 2026 (inferred) | Pro-delegation OP; mod TL;DR: majority cites usage limits, context loss, manageability (search snippets; page fetch blocked) |
| 14 | I don't use subagents because… | Reddit r/ClaudeAI | https://www.reddit.com/r/ClaudeAI/comments/1mqbc2q/ | unknown | Transparency/verification gap: parent only summarizes; drift undetectable (search snippet) |
| 15 | Claude Agent Teams hype, isn't this just multi-agent orchestration? | Reddit r/ClaudeCode | https://www.reddit.com/r/ClaudeCode/comments/1r1n4z5/ | c. Sep 2026 (inferred) | "80% marketing spin… 20% useful"; live agent-to-agent communication as the delta (search snippet) |
| 16 | Claude Code: How to Plan with sub-agents | Reddit r/ClaudeAI | https://www.reddit.com/r/ClaudeAI/comments/1lt1rki/ | c. Mar 2026 (inferred) | Parallel agents produce competing plans; persona-is-superficial comment (search snippet) |
| 17 | Subagent spawning wastes tokens on tasks that should be done directly | GitHub anthropics/claude-code #27645 | https://github.com/anthropics/claude-code/issues/27645 | 2026-02-22 | Over-delegation bug report; direct edits 5–10× cheaper for batch fixes (search snippet) |
| 18 | Subagent prompt-cache strategy inflates prompt spend ~14% | GitHub anthropics/claude-code #74318 | https://github.com/anthropics/claude-code/issues/74318 | 2026 (approx.) | 95 sessions / 1,800 subagents / 6.8B tokens profiled; ~30k static tokens re-sent per spawn (search snippet) |
| 19 | Subagents (docs) | OpenAI Codex docs | https://developers.openai.com/codex/subagents | current | Vendor guidance: explicit-spawn-only, read-heavy parallelism, more tokens than single-agent runs (search snippet) |
| 20 | Subagent fan-out can increase usage | GitHub openai/codex #39808 | https://github.com/openai/codex/issues/39808 | 2026 (recent) | Fan-out cost problem in Codex too (search snippet) |
| 21 | Concurrent subagents instantly drain usage quota | GitHub openai/codex #9748 | https://github.com/openai/codex/issues/9748 | unknown | Usage-metering failure on fan-out (search snippet) |
| 22 | Create custom subagents (docs) | Claude Code docs | https://code.claude.com/docs/en/subagents.md | current | Built-in Explore/Plan; 15k-token description warning; route to cheaper models (search snippet) |
| 23 | Building agents with the Claude Agent SDK / Codex subagents — via agentic-principles repo | GitHub mwroh-dev/agentic-principles | https://github.com/mwroh-dev/agentic-principles/blob/main/confirmed/architecture/subagent-per-task-isolation.md | unknown | Compiles vendor quotes: "isolated 200K-token context"; "Don't assume subagent outputs are correct"; context pollution/rot named by OpenAI (search snippet; secondary compilation) |
| 24 | Peacemaker or Troublemaker: How Sycophancy Shapes Multi-Agent Debate | arXiv 2509.23055 | https://arxiv.org/html/2509.23055 | 2025 | Inter-agent sycophancy collapses debate into premature consensus (search snippet) |
| 25 | AI Agent Teams Look Amazing but Rarely Work | toknow.ai | https://toknow.ai/posts/ai-agent-teams-multi-agent-hype-impractical/index.pdf | unknown | Aggregates sycophancy/debate-collapse findings; "single-agent problems being solved with multi-agent overhead" (search snippet; secondary) |
| 26 | Two camps: throw more agents vs Beads (Show HN thread) | Hacker News | https://news.ycombinator.com/item?id=46993598 | c. Aug 2026 | "One agent with a good harness wins"; multi-agent only when context exceeds one window (search snippet) |
| 27 | From AI to Agents to Agencies (thread; rbren/OpenHands) | Hacker News | https://news.ycombinator.com/item?id=44507919 | 2025-07-09 | "We've tested multi-agent systems a bunch with OpenHands and have never really seen a bump on benchmark scores" (search snippet) |
| 28 | Support for higher/configurable sub-agent spawning limits | GitHub openai/codex #16183 | https://github.com/openai/codex/issues/16183 | 2026-03-29 | Codex defaults: max_threads 6, max_depth 1 (search snippet) |
| 29 | Why Cognition does not use multi-agent systems (Jason Liu) | jxnl.co | https://jxnl.co/writing/2025/09/11/why-cognition-does-not-use-multi-agent-systems | 2025-09-11 | Independent restatement of context-loss/conflicting-decisions critique (search snippet) |
| 30 | Do You Actually Need a Multi-Agent System? | dev.to | https://dev.to/tuomo_pisama/do-you-actually-need-a-multi-agent-system-3a3j | 2026-06-09 | "Start single" position with citations to #1/#2/#12 (search snippet) |
| 31 | Everyone's hyped on MultiAgents but they crash hard in production | Reddit r/AI_Agents | https://www.reddit.com/r/AI_Agents/comments/1lldyms/ | 2025-06-26 | "Most 'multi-agent orchestration' is just a single agent calling a function"; context drift, weird merges (search snippet) |
| 32 | Agent teams docs (mirrors) | GitHub bartvanhoey/pleaseai claude-code-docs | https://github.com/bartvanhoey/claude-code-docs/blob/main/docs/agent-teams.md | current | "Agent teams add coordination overhead and use significantly more tokens than a single session" (search snippet) |
| 33 | When and How Context Rot Appears in Coding Agents (CertiK) | arXiv 2607.17937 | https://arxiv.org/pdf/2607.17937 | 2026 | White-box study: delegated worker loses an opaque contract after compaction; external checklist repairs main failure (search snippet) |
| 34 | What Challenges Do Developers Face in AI Agent Systems? (SO study) | arXiv 2510.25423 | https://arxiv.org/html/2510.25423v1 | 2025 | 4,783 SO agent posts analyzed; multi-agent topologies among hardest topics (search snippet) |

Reddit pages refused direct fetching (anti-bot); Reddit evidence above comes from search-result snippets retrieved this run and is flagged accordingly.

---

## 3. Notable verbatim quotes (short, attributed)

- "Share context, and share full agent traces, not just individual messages." / "Actions carry implicit decisions, and conflicting decisions carry bad results." — Walden Yan, Cognition, "Don't Build Multi-Agents" (2025-06-12)
- "In 2025, running multiple agents in collaboration only results in fragile systems." — Walden Yan, Cognition (2025-06-12)
- "Multi-agent systems work best today when writes stay single-threaded and the additional agents contribute intelligence rather than actions." — Walden Yan, Cognition, "Multi-Agents: What's Actually Working" (2026-04-22)
- "We think the unstructured-swarm approach… is mostly a distraction." — Cognition (2026-04-22)
- "Agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats." — Anthropic Engineering (2025-06-13)
- "Most coding tasks involve fewer truly parallelizable tasks than research, and LLM agents are not yet great at coordinating and delegating to other agents in real time." — Anthropic Engineering (2025-06-13)
- "Early agents made errors like spawning 50 subagents for simple queries." — Anthropic Engineering (2025-06-13)
- "Subagent output to a filesystem to minimize the 'game of telephone.'" — Anthropic Engineering, appendix (2025-06-13)
- "Telling the LLM that it is an experienced product manager doesn't make it an experienced product manager, it just makes it sound like one." — HN user zachwills (2025-09-13)
- "Make agents for tasks, not roles." — HN user touristtam (2025-09-23)
- "Claude Code Agent is context-rich, while claude subagents are context-poor." — HN user simianwords (2025-09-13)
- "The lesson is that subagents are often costly overkill." — HN user beefcake (2025-09-13)
- "I think they're worthwhile only as a token context management tool." — Simon Willison, HN (2025-10)
- "As you scale up the sub-agents you spend so much time managing the herd… you would have been better off handling it serially with yourself in the loop." — HN user Aurornis (c. 2026-02)
- "The 'multi-agent is worse than serial' take is true when agents share context. Stops being true when you give planning agents their own session and implementation agents their own." — HN user blakec (c. 2026-02)
- "The headline figure is wrong… the fixed cost in this repository is 54,154 tokens, not ~436k." — Rulestack, dev.to correction (2026-08-24)
- "Agent teams add coordination overhead and use significantly more tokens than a single session." — Claude Code agent-teams docs (mirrored)
- "Most multi-agent orchestration is just a single agent calling a function. Stop rebranding function calls as agents." — Reddit r/AI_Agents commenter (2025-06)
- "We've tested multi-agent systems a bunch with OpenHands and have never really seen a bump on benchmark scores despite the massive increase in complexity." — HN user rbren (OpenHands), (2025-07-09)

---

## 4. Coverage gaps (honest absence report)

1. **No controlled experiment** comparing developer outcomes with vs without sub-agent workflows was found. This absence is itself attested on HN ("Is there any hard evidence…? Judging by the lack of responses and my own experience: no").
2. **Reddit could not be fetched directly** (bot blocking); Reddit claims rest on search snippets — weaker provenance than fetched pages. Sentiment proportions on r/ClaudeAI (e.g. "the majority against") derive from an auto-generated TL;DR, not a counted sample.
3. **GitHub Discussions of anthropics/claude-code and mattpocock/skills** were not reached this run; openai/codex discussion #23184 fetched but had zero replies. Vendor GitHub *issues* were covered via search snippets instead.
4. **No survey isolates multi-agent/sub-agent adoption.** SO 2025 covers "AI agents" generally (31% use); SO announced an agents-focused survey in April 2026, but I found no published 2026 agent-orchestration results this run.
5. **Persona/agent-team value has zero quantitative evidence** either way — only anecdote and ecosystem supply (persona packs, marketplace plugins). "Theater vs value" cannot be settled beyond opinion weight.
6. **The "41–86.7% MAS failure rate"** circulating in secondary writeups was not verified against the MAST primary paper text this run; the verified MAST figures are category shares (41.8/36.9/21.3) and per-mode percentages.
7. **Anthropic's 90.2% gain is an internal, unreproducible eval** and is explicitly noted (by Anthropic and secondary analyses) as not generalizing to coding tasks; no independent replication exists.
8. **Latency trade-offs** are attested only qualitatively plus one vendor "up to 90% time cut"; no independent wall-clock measurements of sub-agent vs inline work were found.

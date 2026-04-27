import { useState, useEffect, useMemo } from "react";
import "./App.css";

const MODEL_OPTIONS = ["RandomForest", "CatBoost", "XGBoost"];

const PITCH_COLORS = {
  "Four-seam fastball": { bg:"#E6F1FB", text:"#0C447C" },
  "Slider":    { bg:"#FAECE7", text:"#712B13" },
  "Changeup":  { bg:"#EAF3DE", text:"#27500A" },
  "Curveball": { bg:"#EEEDFE", text:"#3C3489" },
  "Cutter":    { bg:"#FAEEDA", text:"#633806" },
  "Sinker":    { bg:"#E1F5EE", text:"#085041" },
  "Splitter":  { bg:"#FBEAF0", text:"#72243E" },
};

const CATEGORIES = [
  { id: "physics",  label: "Physics"  },
  { id: "movement", label: "Movement" },
  { id: "release",  label: "Release"  },
  { id: "count",    label: "Count"    },
  { id: "game",     label: "Game State" },
  { id: "bases",    label: "Bases"    },
  { id: "player",   label: "Player"   },
];

const defaultForm = {
  release_speed: "", release_spin_rate: "", spin_axis: "",
  pfx_x: "", pfx_z: "",
  vx0: "", vy0: "", vz0: "",
  ax: "", ay: "", az: "",
  release_pos_x: "", release_pos_y: "", release_pos_z: "",
  release_extension: "",
  balls: "0", strikes: "0",
  outs_when_up: "0", inning: "1", inning_topbot: "Top",
  home_score_diff: "", n_thruorder_pitcher: "",
  on_1b: "No", on_2b: "No", on_3b: "No", 
  p_throws: "", stand: "",
};

// ── Data table constants (unchanged) ──────────────────────
const DEFAULT_VISIBLE_COLS = new Set([
  "game_date", "player_name", "pitch_type", "pitch_name",
  "p_throws", "stand", "balls", "strikes",
  "outs_when_up", "inning", "inning_topbot", "home_score_diff", "n_thruorder_pitcher",
  "on_1b", "on_2b", "on_3b",
  "release_speed", "release_spin_rate", "spin_axis",
]);

const CATEGORICAL_COLS = new Set([
  "pitch_type", "pitch_name", "player_name", "p_throws", "stand",
  "inning_topbot", "description", "events", "bb_type", "game_type",
  "home_team", "away_team", "type", "des",
  "on_1b", "on_2b", "on_3b", "if_fielding_alignment", "of_fielding_alignment",
  "game_date",
]);

function isNumericCol(colName, sampleVal) {
  if (CATEGORICAL_COLS.has(colName)) return false;
  return typeof sampleVal === "number";
}

const COL_LABELS = {
  p_throws: "Pitcher Hand", stand: "Batter Side", inning_topbot: "Top/Bot",
  outs_when_up: "Outs", home_score_diff: "Score Diff",
  n_thruorder_pitcher: "Times Thru Order",
  on_1b: "On 1B", on_2b: "On 2B", on_3b: "On 3B",
  release_speed: "Velo (mph)", release_spin_rate: "Spin Rate",
  release_pos_x: "Rel X", release_pos_z: "Rel Z", release_pos_y: "Rel Y",
  release_extension: "Extension", spin_axis: "Spin Axis",
  pfx_x: "PFX X", pfx_z: "PFX Z", plate_x: "Plate X", plate_z: "Plate Z",
  sz_top: "SZ Top", sz_bot: "SZ Bot", hc_x: "HC X", hc_y: "HC Y",
  vx0: "Vx0", vy0: "Vy0", vz0: "Vz0", ax: "Ax", ay: "Ay", az: "Az",
  bb_type: "BB Type", hit_distance_sc: "Hit Dist",
  launch_speed: "Exit Velo", launch_angle: "Launch Angle",
  launch_speed_angle: "Speed/Angle", effective_speed: "Eff. Speed",
  estimated_ba_using_speedangle: "xBA",
  estimated_woba_using_speedangle: "xwOBA",
  estimated_slg_using_speedangle: "xSLG",
  woba_value: "wOBA Val", woba_denom: "wOBA Denom",
  babip_value: "BABIP", iso_value: "ISO",
  delta_home_win_exp: "Delta Win Exp", delta_run_exp: "Delta Run Exp",
  delta_pitcher_run_exp: "Delta Pitcher RE",
  home_win_exp: "Home Win Exp", bat_win_exp: "Bat Win Exp",
  bat_score: "Bat Score", fld_score: "Fld Score",
  bat_score_diff: "Bat Score Diff",
  post_away_score: "Post Away", post_home_score: "Post Home",
  post_bat_score: "Post Bat", post_fld_score: "Post Fld",
  if_fielding_alignment: "IF Align", of_fielding_alignment: "OF Align",
  game_pk: "Game PK", game_year: "Year", game_type: "Game Type",
  game_date: "Date", at_bat_number: "AB #", pitch_number: "Pitch #",
  n_priorpa_thisgame_player_at_bat: "Prior PAs",
  pitcher_days_since_prev_game: "P Days Since",
  batter_days_since_prev_game: "B Days Since",
  pitcher_days_until_next_game: "P Days Until",
  batter_days_until_next_game: "B Days Until",
  age_pit: "Pitcher Age", age_bat: "Batter Age",
  age_pit_legacy: "Pitcher Age (L)", age_bat_legacy: "Batter Age (L)",
  api_break_z_with_gravity: "Break Z",
  api_break_x_arm: "Break X (Arm)", api_break_x_batter_in: "Break X (Bat)",
  arm_angle: "Arm Angle", bat_speed: "Bat Speed",
  swing_length: "Swing Length", attack_angle: "Attack Angle",
  attack_direction: "Attack Dir", swing_path_tilt: "Swing Tilt",
  intercept_ball_minus_batter_pos_x_inches: "Intercept X",
  intercept_ball_minus_batter_pos_y_inches: "Intercept Y",
  hyper_speed: "Hyper Speed", hit_location: "Hit Loc",
  fielder_2: "C", fielder_3: "1B (F)", fielder_4: "2B (F)",
  fielder_5: "3B (F)", fielder_6: "SS", fielder_7: "LF",
  fielder_8: "CF", fielder_9: "RF",
  spin_dir: "Spin Dir",
  spin_rate_deprecated: "Spin Rate (dep)",
  break_angle_deprecated: "Break Angle (dep)",
  break_length_deprecated: "Break Len (dep)",
  tfs_deprecated: "TFS (dep)", tfs_zulu_deprecated: "TFS Zulu (dep)",
  sv_id: "SV ID", umpire: "Umpire",
};

function formatColLabel(col) {
  if (COL_LABELS[col]) return COL_LABELS[col];
  return col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const COL_WIDTHS = {
  game_date: 95, player_name: 145, pitch_type: 55, pitch_name: 130,
  p_throws: 60, stand: 60, balls: 48, strikes: 52, outs_when_up: 48,
  inning: 50, inning_topbot: 65, home_score_diff: 78, n_thruorder_pitcher: 105,
  on_1b: 52, on_2b: 52, on_3b: 52,
  release_speed: 82, release_spin_rate: 78, spin_axis: 72,
  description: 180, events: 130, zone: 50, des: 200,
  home_team: 70, away_team: 70, type: 45,
  at_bat_number: 48, pitch_number: 52, game_year: 52,
};
const DEFAULT_COL_WIDTH = 85;

// ── Shared Field wrapper ───────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

// ── Prediction page ────────────────────────────────────────
function PredictionPage() {
  const [activeCat, setActiveCat] = useState("physics");
  const [form, setForm]           = useState(defaultForm);
  const [results, setResults]     = useState({ RandomForest: null, CatBoost: null, XGBoost: null });
  const [loading, setLoading]     = useState({ RandomForest: false, CatBoost: false, XGBoost: false });
  const [animating, setAnimating] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const buildPayload = (modelName) => ({
    release_speed:      parseFloat(form.release_speed)      || null,
    release_spin_rate:  parseFloat(form.release_spin_rate)  || null,
    spin_axis:          parseFloat(form.spin_axis)          || null,
    pfx_x: parseFloat(form.pfx_x) || null,
    pfx_z: parseFloat(form.pfx_z) || null,
    vx0:   parseFloat(form.vx0)   || null,
    vy0:   parseFloat(form.vy0)   || null,
    vz0:   parseFloat(form.vz0)   || null,
    ax:    parseFloat(form.ax)    || null,
    ay:    parseFloat(form.ay)    || null,
    az:    parseFloat(form.az)    || null,
    release_pos_x:     parseFloat(form.release_pos_x)     || null,
    release_pos_y:     parseFloat(form.release_pos_y)     || null,
    release_pos_z:     parseFloat(form.release_pos_z)     || null,
    release_extension: parseFloat(form.release_extension) || null,
    balls:               parseInt(form.balls),
    strikes:             parseInt(form.strikes),
    outs_when_up:        parseInt(form.outs_when_up),
    inning:              parseInt(form.inning),
    inning_topbot:       form.inning_topbot || null,
    home_score_diff:     parseFloat(form.home_score_diff) || 0,
    n_thruorder_pitcher: parseInt(form.n_thruorder_pitcher) || 1,
    on_1b:    form.on_1b  === "Yes" ? 1 : 0,
    on_2b:    form.on_2b  === "Yes" ? 1 : 0,
    on_3b:    form.on_3b  === "Yes" ? 1 : 0,
    pitcher:  parseFloat(form.pitcher) || null,
    p_throws: form.p_throws || null,
    stand:    form.stand    || null,
    model_name: modelName,
    top_k: 3,
  });

  const handlePredict = async () => {
    setAnimating(true);
    setLoading({ RandomForest: true, CatBoost: true, XGBoost: true });
    setResults({ RandomForest: null, CatBoost: null, XGBoost: null });

    await Promise.allSettled(
      MODEL_OPTIONS.map(async (modelName) => {
        try {
          const res = await fetch("http://localhost:8000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayload(modelName)),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setResults((prev) => ({
            ...prev,
            [modelName]: {
              pitch:    data.top_prediction,
              conf:     data.confidence,
              allProbs: data.all_predictions,
            },
          }));
        } catch (err) {
          setResults((prev) => ({ ...prev, [modelName]: { error: err.message } }));
        } finally {
          setLoading((prev) => ({ ...prev, [modelName]: false }));
        }
      })
    );

    setTimeout(() => setAnimating(false), 600);
  };

  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="prediction-layout">
      {/* ── Left panel ── */}
      <div className="left-panel">
        <div className="cat-tabs">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`cat-tab ${activeCat === c.id ? "active" : ""}`}
              onClick={() => setActiveCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="form-body">
          {activeCat === "physics" && (
            <>
              <Field label="Release speed (mph)">
                <input type="number" step="0.1" placeholder="e.g. 93.4  (40–110)"
                  value={form.release_speed} onChange={(e) => set("release_speed", e.target.value)} />
              </Field>
              <Field label="Spin rate (rpm)">
                <input type="number" placeholder="e.g. 2300  (500–4000)"
                  value={form.release_spin_rate} onChange={(e) => set("release_spin_rate", e.target.value)} />
              </Field>
              <Field label="Spin axis (°)">
                <input type="number" placeholder="e.g. 215  (0–360)"
                  value={form.spin_axis} onChange={(e) => set("spin_axis", e.target.value)} />
              </Field>
            </>
          )}

          {activeCat === "movement" && (
            <>
              <div className="field-row">
                <Field label="pfx_x (in)">
                  <input type="number" step="0.01" placeholder="e.g. -6.2"
                    value={form.pfx_x} onChange={(e) => set("pfx_x", e.target.value)} />
                </Field>
                <Field label="pfx_z (in)">
                  <input type="number" step="0.01" placeholder="e.g. 9.1"
                    value={form.pfx_z} onChange={(e) => set("pfx_z", e.target.value)} />
                </Field>
              </div>
              <div className="field-row">
                <Field label="vx0"><input type="number" step="0.1" value={form.vx0} onChange={(e) => set("vx0", e.target.value)} /></Field>
                <Field label="vy0"><input type="number" step="0.1" value={form.vy0} onChange={(e) => set("vy0", e.target.value)} /></Field>
                <Field label="vz0"><input type="number" step="0.1" value={form.vz0} onChange={(e) => set("vz0", e.target.value)} /></Field>
              </div>
              <div className="field-row">
                <Field label="ax"><input type="number" step="0.1" value={form.ax} onChange={(e) => set("ax", e.target.value)} /></Field>
                <Field label="ay"><input type="number" step="0.1" value={form.ay} onChange={(e) => set("ay", e.target.value)} /></Field>
                <Field label="az"><input type="number" step="0.1" value={form.az} onChange={(e) => set("az", e.target.value)} /></Field>
              </div>
            </>
          )}

          {activeCat === "release" && (
            <>
              <div className="field-row">
                <Field label="pos_x (ft)">
                  <input type="number" step="0.01" value={form.release_pos_x} onChange={(e) => set("release_pos_x", e.target.value)} />
                </Field>
                <Field label="pos_y (ft)">
                  <input type="number" step="0.01" value={form.release_pos_y} onChange={(e) => set("release_pos_y", e.target.value)} />
                </Field>
                <Field label="pos_z (ft)">
                  <input type="number" step="0.01" value={form.release_pos_z} onChange={(e) => set("release_pos_z", e.target.value)} />
                </Field>
              </div>
              <Field label="Extension (ft)">
                <input type="number" step="0.01" placeholder="e.g. 6.2"
                  value={form.release_extension} onChange={(e) => set("release_extension", e.target.value)} />
              </Field>
            </>
          )}

          {activeCat === "count" && (
            <div className="field-row">
              <Field label="Balls">
                <select value={form.balls} onChange={(e) => set("balls", e.target.value)}>
                  {[0,1,2,3].map(n => <option key={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Strikes">
                <select value={form.strikes} onChange={(e) => set("strikes", e.target.value)}>
                  {[0,1,2].map(n => <option key={n}>{n}</option>)}
                </select>
              </Field>
            </div>
          )}

          {activeCat === "game" && (
            <>
              <div className="field-row">
                <Field label="Outs">
                  <select value={form.outs_when_up} onChange={(e) => set("outs_when_up", e.target.value)}>
                    {[0,1,2].map(n => <option key={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="Inning">
                  <select value={form.inning} onChange={(e) => set("inning", e.target.value)}>
                    {[1,2,3,4,5,6,7,8,9].map(n => <option key={n}>{n}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Top / Bottom">
                <select value={form.inning_topbot} onChange={(e) => set("inning_topbot", e.target.value)}>
                  <option>Top</option><option>Bottom</option>
                </select>
              </Field>
              <Field label="Score differential">
                <input type="number" value={form.home_score_diff}
                  onChange={(e) => set("home_score_diff", e.target.value)} placeholder="e.g. -2, 0, 3" />
              </Field>
              <Field label="Times through order">
                <input type="number" min="1" max="3" value={form.n_thruorder_pitcher}
                  onChange={(e) => set("n_thruorder_pitcher", e.target.value)} placeholder="1-3" />
              </Field>
            </>
          )}

          {activeCat === "bases" && (
            <>
              {["on_1b","on_2b","on_3b"].map((k, i) => (
                <Field key={k} label={`Runner on ${i+1}B`}>
                  <select value={form[k]} onChange={(e) => set(k, e.target.value)}>
                    <option>No</option><option>Yes</option>
                  </select>
                </Field>
              ))}
            </>
          )}

          {activeCat === "player" && (
            <>
              <Field label="Pitcher hand">
                <select value={form.p_throws} onChange={(e) => set("p_throws", e.target.value)}>
                  <option value="">Select...</option>
                  <option>R</option><option>L</option>
                </select>
              </Field>
              <Field label="Batter stance">
                <select value={form.stand} onChange={(e) => set("stand", e.target.value)}>
                  <option value="">Select...</option>
                  <option>R</option><option>L</option><option>S</option>
                </select>
              </Field>
            </>
          )}
        </div>

        <button className="predict-btn" onClick={handlePredict} disabled={anyLoading || animating}>
          {anyLoading ? "Predicting..." : "Predict pitch"}
        </button>
      </div>

      {/* ── Right panel — three model results ── */}
      <div className="right-panel">
        {MODEL_OPTIONS.map((modelName) => {
          const res = results[modelName];
          const isLoading = loading[modelName];
          const colors = res?.pitch ? (PITCH_COLORS[res.pitch] || { bg:"#f5f5f5", text:"#333" }) : null;
          return (
            <div key={modelName} className="result-card">
              <div className="result-model-name">{modelName}</div>
              {isLoading && <div className="result-conf">Predicting...</div>}
              {!isLoading && !res && <div className="result-conf">—</div>}
              {!isLoading && res?.error && <div className="result-conf" style={{color:"#c0392b"}}>Error: {res.error}</div>}
              {!isLoading && res?.pitch && (
                <>
                  <div className="result-label">Predicted pitch</div>
                  <div
                    className="result-pitch"
                    style={{ background: colors.bg, color: colors.text,
                             padding: "4px 14px", borderRadius: 20, display: "inline-block" }}
                  >
                    {res.pitch}
                  </div>
                  <div className="result-conf">{res.conf}% confidence</div>
                  <div className="result-alts">
                    {res.allProbs?.slice(1).map(({ pitch_type, probability }) => {
                      const c = PITCH_COLORS[pitch_type] || { bg:"#f0f0f0", text:"#555" };
                      return (
                        <span key={pitch_type} className="alt-badge"
                          style={{ background: c.bg, color: c.text }}>
                          {pitch_type} {probability}%
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Data table (unchanged from your original) ──────────────
function DataTable() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE_COLS);
  const [showColPicker, setShowColPicker] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetch("http://localhost:8000/data?limit=200")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} — is the backend running on port 8000?`);
        return r.json();
      })
      .then(({ data, total }) => {
        setRows(data ?? []);
        setTotal(total ?? 0);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const allCols = useMemo(() => (rows.length > 0 ? Object.keys(rows[0]) : []), [rows]);

  const colMeta = useMemo(() => {
    if (!rows.length) return {};
    const meta = {};
    allCols.forEach((col) => {
      const sample = rows.find((r) => r[col] != null)?.[col];
      const numeric = isNumericCol(col, sample);
      if (numeric) {
        const vals = rows.map((r) => r[col]).filter((v) => v != null && !isNaN(v));
        meta[col] = { type: "numeric", min: Math.min(...vals), max: Math.max(...vals) };
      } else {
        const unique = [...new Set(rows.map((r) => String(r[col] ?? "")))].sort();
        meta[col] = { type: "categorical", options: unique };
      }
    });
    return meta;
  }, [rows, allCols]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    for (const [col, f] of Object.entries(filters)) {
      const val = row[col];
      if (f.type === "numeric") {
        if (f.min !== "" && f.min != null && Number(val) < Number(f.min)) return false;
        if (f.max !== "" && f.max != null && Number(val) > Number(f.max)) return false;
      } else {
        if (f.value && f.value !== "__all__" && String(val) !== f.value) return false;
      }
    }
    return true;
  }), [rows, filters]);

  const displayedCols = useMemo(
    () => allCols.filter((c) => visibleCols.has(c)),
    [allCols, visibleCols]
  );

  const toggleCol = (col) => setVisibleCols((prev) => {
    const next = new Set(prev); next.has(col) ? next.delete(col) : next.add(col); return next;
  });
  const setFilter = (col, patch) => setFilters((prev) => ({
    ...prev, [col]: { ...(colMeta[col] || {}), ...(prev[col] || {}), ...patch },
  }));
  const clearFilter = (col) => setFilters((prev) => { const next = {...prev}; delete next[col]; return next; });
  const activeFilterCount = Object.keys(filters).length;

  if (loading) return <div className="table-state">Loading data...</div>;
  if (error)   return (
    <div className="table-state table-error">
      Error: {error}<br/>
      <small>Check that uvicorn is running on port 8000 (<code>uvicorn main:app --reload --port 8000</code>)</small>
    </div>
  );
  if (!rows.length) return <div className="table-state">No data found.</div>;

  const predictionCols = allCols.filter(c => DEFAULT_VISIBLE_COLS.has(c));
  const additionalCols = allCols.filter(c => !DEFAULT_VISIBLE_COLS.has(c));

  return (
    <div className="data-tab">
      <div className="data-toolbar">
        <div className="toolbar-left">
          <span className="data-count">{filteredRows.length.toLocaleString()} / {total.toLocaleString()} rows</span>
          {activeFilterCount > 0 && (
            <button className="clear-btn" onClick={() => setFilters({})}>
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </button>
          )}
        </div>
        <button className="col-toggle-btn" onClick={() => setShowColPicker((x) => !x)}>
          {showColPicker ? "Hide columns" : "Edit columns"} ({visibleCols.size}/{allCols.length})
        </button>
      </div>

      {showColPicker && (
        <div className="col-picker">
          <div className="col-picker-header">
            <span className="col-picker-title">Select columns to display</span>
            <div className="col-picker-actions">
              <button onClick={() => setVisibleCols(new Set(DEFAULT_VISIBLE_COLS))}>Reset</button>
              <button onClick={() => setVisibleCols(new Set(allCols))}>All</button>
              <button onClick={() => setVisibleCols(new Set())}>None</button>
            </div>
          </div>
          <div className="col-picker-sections">
            <div className="col-picker-section">
              <div className="col-picker-section-label">Prediction features</div>
              <div className="col-picker-pills">
                {predictionCols.map((col) => (
                  <button key={col} className={`col-pill ${visibleCols.has(col) ? "active" : ""}`} onClick={() => toggleCol(col)}>
                    <span className="col-pill-dot"></span>{formatColLabel(col)}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-picker-section">
              <div className="col-picker-section-label">Additional columns</div>
              <div className="col-picker-pills">
                {additionalCols.map((col) => (
                  <button key={col} className={`col-pill ${visibleCols.has(col) ? "active" : ""}`} onClick={() => toggleCol(col)}>
                    <span className="col-pill-dot"></span>{formatColLabel(col)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {displayedCols.map((col) => (
                <th key={col} style={{ minWidth: COL_WIDTHS[col] ?? DEFAULT_COL_WIDTH }}>
                  <div className="th-inner">
                    <span className="col-name">{formatColLabel(col)}</span>
                    <span className={`col-type-badge ${colMeta[col]?.type}`}>
                      {colMeta[col]?.type === "numeric" ? "#" : "Aa"}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
            <tr className="filter-row">
              {displayedCols.map((col) => {
                const meta = colMeta[col];
                const f = filters[col] || {};
                if (!meta) return <th key={col}></th>;
                return (
                  <th key={col} className="filter-cell">
                    {meta.type === "numeric" ? (
                      <div className="num-filter">
                        <input type="number" placeholder={meta.min?.toFixed(1)} value={f.min ?? ""}
                          onChange={(e) => setFilter(col, { type: "numeric", min: e.target.value })} />
                        <span>-</span>
                        <input type="number" placeholder={meta.max?.toFixed(1)} value={f.max ?? ""}
                          onChange={(e) => setFilter(col, { type: "numeric", max: e.target.value })} />
                        {(f.min || f.max) && <button className="filter-x" onClick={() => clearFilter(col)}>x</button>}
                      </div>
                    ) : (
                      <div className="cat-filter">
                        <select value={f.value ?? "__all__"} onChange={(e) => {
                          const v = e.target.value;
                          if (v === "__all__") clearFilter(col);
                          else setFilter(col, { type: "categorical", value: v });
                        }}>
                          <option value="__all__">All</option>
                          {meta.options.map((o) => <option key={o} value={o}>{o || "(empty)"}</option>)}
                        </select>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, i) => (
              <tr key={i}>
                {displayedCols.map((col) => (
                  <td key={col}>
                    {row[col] == null ? (
                      <span className="null-val">-</span>
                    ) : typeof row[col] === "number" ? (
                      Number.isInteger(row[col]) ? row[col] : row[col].toFixed(2)
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("Prediction");
  return (
    <div className="app">
      <nav className="tab-bar">
        {["Prediction", "Data table"].map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      <main>
        {tab === "Prediction" ? <PredictionPage /> : <DataTable />}
      </main>
    </div>
  );
}
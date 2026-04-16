import { useState } from "react";
import "./App.css"

const TABS = ["Prediction", "Data"]

const CATEGORIES = [
  { id: "player", label: "Player" },
  { id: "count", label: "Count" },
  { id: "game", label: "Game State" },
  { id: "bases", label: "Bases" },
  { id: "pitch", label: "Pitch Data" },
]

const PITCH_TYPES = [
  "Four-seam fastball", "Slider", "Changeup",
  "Curveball", "Cutter", "Sinker", "Splitter",
];

const defaultForm = {
  p_throws: "",
  stands: "",
  balls: "0",
  strikes: "0",
  outs_when_up: "0",
  inning: "1",
  inning_topbot: "Top",
  home_score_diff:"",
  n_thruorder_pitcher: "",
  on_1b: "No",
  on_2b: "No",
  on_3b: "No",
  release_speed: "",
  release_spin_rate: "",
  spin_axis: ""
}

function PredictionPage() {
  const [activeCat, setActiveCat] = useState("player");
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [animating, setAnimating] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePredict = () => {
    setAnimating(true);
    setTimeout(() => {
      const pitch = PITCH_TYPES[Math.floor(Math.random() * PITCH_TYPES.length)];
      const conf = (55 + Math.random() * 35).toFixed(1);
      setResult({ pitch, conf });
      setAnimating(false);
    }, 600);
  };

  return (
    <div className="prediction-layout">
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
          {activeCat === "player" && (
            <>
              <Field label="Pitcher hand">
                <select value={form.p_throws} onChange={(e) => set("p_throws", e.target.value)}>
                  <option value="">Select…</option>
                  <option>R</option><option>L</option>
                </select>
              </Field>
              <Field label="Batter stance">
                <select value={form.stand} onChange={(e) => set("stand", e.target.value)}>
                  <option value="">Select…</option>
                  <option>R</option><option>L</option><option>S</option>
                </select>
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
                <input type="number" value={form.home_score_diff} onChange={(e) => set("home_score_diff", e.target.value)} placeholder="e.g. -2, 0, 3" />
              </Field>
              <Field label="Times through order">
                <input type="number" min="1" max="3" value={form.n_thruorder_pitcher} onChange={(e) => set("n_thruorder_pitcher", e.target.value)} placeholder="1–3" />
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

          {activeCat === "pitch" && (
            <>
              <Field label="Release speed (mph)">
                <input type="number" value={form.release_speed} onChange={(e) => set("release_speed", e.target.value)} placeholder="e.g. 93.4" />
              </Field>
              <Field label="Spin rate (rpm)">
                <input type="number" value={form.release_spin_rate} onChange={(e) => set("release_spin_rate", e.target.value)} placeholder="e.g. 2300" />
              </Field>
              <Field label="Spin axis (°)">
                <input type="number" value={form.spin_axis} onChange={(e) => set("spin_axis", e.target.value)} placeholder="0–360" />
              </Field>
            </>
          )}
        </div>

        <button className="predict-btn" onClick={handlePredict} disabled={animating}>
          {animating ? "Predicting…" : "Predict pitch ›"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("Prediction");
  return (
    <div className="app">
      <nav className="tab-bar">
        {["Prediction", "Data table"].map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>
      <main>{tab === "Prediction" ? <PredictionPage /> : <div className="empty-page">Data Table Coming Soon</div>}</main>
    </div>
  );
}

export default App;
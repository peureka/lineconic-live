#!/usr/bin/env node
// ============================================================
// LINECONIC DECK GENERATOR V1.0
// ============================================================
//
// Reads a single CSV and generates two HTML presentation decks:
//   1. INLINE — answer slide after every question
//   2. SHEET  — questions only, answer list after each round's score slide
//
// USAGE:
//   node generate_deck.js SHOW.csv
//   node generate_deck.js SHOW.csv --name "Friday Night"
//
// OUTPUT:
//   SHOW_INLINE.html
//   SHOW_SHEET.html
//
// ────────────────────────────────────────────────────────────
// CSV COLUMNS (Google Sheets → File → Download → .csv)
// ────────────────────────────────────────────────────────────
//
// slide_number   — Optional. Row order = slide order. Can be blank.
// section        — Groups slides. Shown in top-left HUD. Used to
//                  group answer sheets (all questions between two
//                  "score" rows in the same section become one sheet).
// slide_type     — Determines rendering. See list below.
// primary_text   — Main text on screen.
// secondary_text — Subtitle, hint, or multi-line (use | separator).
// answer         — The answer. NEVER shown on question slides.
//                  Generates answer slides (inline) or answer
//                  sheets (sheet mode). Leave blank for non-questions.
// answer_source  — Source attribution on answer slides/sheets.
//                  For acronym_q, also shown as footer hint on the
//                  question slide. For source_q, hidden entirely.
// notes          — Internal only. Never rendered. Use for bonus
//                  markers: include "bonus" and point value like
//                  "bonus 3pts" and the answer sheet will tag it.
//
// ────────────────────────────────────────────────────────────
// SLIDE TYPES
// ────────────────────────────────────────────────────────────
//
// OPERATIONAL:
//   attract           Pink "L" pulse loop
//   fishbowl          Red flag instruction (pink border)
//   round_title       primary = title, secondary = subtitle
//   tier_title         Scoring rules. secondary = |-separated lines
//   bonus_marker      Gold border "BONUS — X POINTS"
//   score             "ROUND COMPLETE" — triggers answer sheet in sheet mode
//   intermission      Break. primary = title, secondary = subtitle
//   warning           Countdown text
//   blackout          Pure black
//   transition_beat   Empty beat
//   verdict           "THE VERDICT"
//   sentence          Penance. secondary = |-separated lines
//   receipt_rain      Pink pulse
//   last_line         Closing line (white border)
//   endcard           Pink "L" + secondary tagline
//
// QUESTIONS:
//   source_q          Full line shown. No hint. answer = source name.
//   acronym_q         Acronym shown. answer_source = footer hint.
//                     answer = decoded line.
//
// CONTENT (non-scored):
//   fluency_line      Line shown (white border)
//   fluency_source    Source reveal
//   doa_ref           Reference (white border)
//   doa_verdict_dead  Pink "DEAD"
//   doa_verdict_alive Cyan "ALIVE"
//   hotseat_rules     Instructions. secondary = |-separated
//   hotseat_prompt    Line shown to crowd (cyan border). answer_source = hint
//
// ────────────────────────────────────────────────────────────
// EDITING GUIDE
// ────────────────────────────────────────────────────────────
//
// To change a question:     Edit primary_text + answer + answer_source
// To change slide copy:     Edit primary_text and/or secondary_text
// To reorder slides:        Move rows up/down in the sheet
// To add a slide:           Insert a row, set slide_type + text
// To remove a slide:        Delete the row
// To change the Sentence:   Edit the sentence row's secondary_text
// To change the Last Line:  Edit the last_line row's primary_text
// To change scoring rules:  Edit the tier_title row's secondary_text
// To change section labels: Edit the section column
//
// The | character in secondary_text creates line breaks on screen.
// ============================================================

const fs = require("fs");
const path = require("path");

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node generate_deck.js <csv_file> [--name \"Show Name\"]");
  process.exit(1);
}
const nameIdx = process.argv.indexOf("--name");
const showName = nameIdx >= 0 ? process.argv[nameIdx + 1] : path.basename(csvPath, ".csv");

// ── CSV Parser (handles Google Sheets export quirks) ──
function parseCSV(text) {
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (vals[idx] || "").trim(); });
    if (!obj.slide_type) continue; // skip blank rows
    rows.push(obj);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = []; let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } }
    else if (ch === "," && !inQ) { result.push(cur); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

// ── Read ──
const raw = fs.readFileSync(csvPath, "utf-8");
const allRows = parseCSV(raw);
console.log(`Loaded: ${allRows.length} rows from ${csvPath}`);

// ── Build slides ──
function buildSlides(mode) {
  const slides = [];
  let currentSection = "";
  let sectionAnswers = [];
  let qnum = 0;

  function flushAnswerSheet() {
    if (mode === "sheet" && sectionAnswers.length > 0) {
      const ansText = sectionAnswers.map(a => {
        const src = a.source ? " : " + a.source : "";
        const tag = a.bonusTag || "";
        return a.qnum + ". " + a.answer + src + tag;
      }).join("|");
      const title = currentSection.replace(/^ROUND \d+: /, "").replace(/^ROUND \d+ /, "") + " : ANSWERS";
      slides.push({
        slide_type: "answer_sheet",
        section: currentSection,
        primary_text: title,
        secondary_text: ansText,
      });
      sectionAnswers = [];
    }
  }

  for (const row of allRows) {
    const type = row.slide_type;
    const section = row.section || currentSection;

    if (section !== currentSection) {
      currentSection = section;
      qnum = 0;
    }

    const hasAnswer = ["source_q", "acronym_q"].includes(type) && row.answer;

    if (hasAnswer) {
      qnum++;

      // Question slide — answer NEVER shown here
      slides.push({
        slide_type: type,
        section,
        primary_text: row.primary_text || "",
        secondary_text: type === "acronym_q" ? (row.answer_source || "") : "",
      });

      // Track for answer sheet
      const notes = (row.notes || "").toLowerCase();
      const ptsMatch = notes.match(/(\d+)\s*p/);
      const bonusTag = notes.includes("bonus") && ptsMatch ? " [" + ptsMatch[1] + "pts]" : "";
      sectionAnswers.push({
        qnum,
        answer: (row.answer || "").toUpperCase(),
        source: row.answer_source || "",
        bonusTag,
      });

      // Inline mode — generate answer slide
      if (mode === "inline") {
        if (type === "source_q") {
          slides.push({
            slide_type: "source_a",
            section,
            primary_text: (row.answer || "").toUpperCase(),
            secondary_text: "",
          });
        } else {
          slides.push({
            slide_type: "acronym_a",
            section,
            primary_text: (row.answer || "").toUpperCase(),
            secondary_text: row.answer_source || "",
          });
        }
      }
    }
    else if (type === "score") {
      // Score slide first, then flush answer sheet after it
      slides.push({
        slide_type: type,
        section,
        primary_text: row.primary_text || "",
        secondary_text: row.secondary_text || "",
      });
      flushAnswerSheet();
    }
    else {
      // Pass-through: every other slide type rendered as-is
      slides.push({
        slide_type: type,
        section,
        primary_text: row.primary_text || "",
        secondary_text: row.secondary_text || "",
      });
    }
  }

  return slides;
}

// ── HTML Renderer ──
// ── HTML Renderer (template-based) ──
function buildHTML(slides, title) {
  const data = JSON.stringify(slides);
  const templatePath = require("path").join(__dirname, "TEMPLATE.html");
  let html = fs.readFileSync(templatePath, "utf-8");
  html = html.replace("%%TITLE%%", esc(title));
  html = html.replace("%%DATA%%", data);
  return html;
}

function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

// ── Generate ──
const inlineSlides = buildSlides("inline");
const sheetSlides = buildSlides("sheet");

const base = path.basename(csvPath, ".csv");
const inlinePath = base + "_INLINE.html";
const sheetPath = base + "_SHEET.html";

fs.writeFileSync(inlinePath, buildHTML(inlineSlides, "LINECONIC LIVE"));
fs.writeFileSync(sheetPath, buildHTML(sheetSlides, "LINECONIC LIVE"));

console.log(`\nINLINE: ${inlineSlides.length} slides → ${inlinePath} (${(fs.statSync(inlinePath).size / 1024).toFixed(0)}KB)`);
console.log(`SHEET:  ${sheetSlides.length} slides → ${sheetPath} (${(fs.statSync(sheetPath).size / 1024).toFixed(0)}KB)`);
console.log(`\nDone. Open in browser. Press F for fullscreen. H for host controls. S for score bug. T for timer.`);

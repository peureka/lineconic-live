import { parseCSV } from './csv-parser.js';

const TIMED_TYPES = ['source_q', 'acronym_q', 'hotseat_prompt'];

/**
 * Map a CSV row object to the slide schema.
 * @param {Object} row - Object with named fields from CSV headers
 * @param {number} index - 0-based index in the flat slide list
 */
export function mapSlide(row, index) {
  const slideNum = parseInt(row.slide_number, 10) || (index + 1);
  const id = 's' + String(slideNum).padStart(3, '0');
  const type = row.slide_type;

  const content = {
    primary: row.primary_text || '',
    secondary: row.secondary_text || '',
  };

  if (row.answer) content.answer = row.answer;
  if (row.answer_source) content.source = row.answer_source;

  // Extract bonus points from notes
  let points = null;
  const notes = (row.notes || '').toLowerCase();
  const ptsMatch = notes.match(/(\d+)\s*p/);
  if (ptsMatch) {
    points = parseInt(ptsMatch[1], 10);
  }

  return {
    id,
    type,
    content,
    reveal_state: 'hidden',
    team: 'neutral',
    timer_seconds: TIMED_TYPES.includes(type) ? 30 : null,
    host_notes: row.notes || null,
    points,
  };
}

/**
 * Generate a section ID from a section name.
 * Lowercase, spaces/colons/special chars → hyphens, trim trailing hyphens.
 */
function sectionId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Group an array of row objects into sections.
 * @param {Object[]} rows - Array of row objects with 'section' field
 * @returns {Object[]} Array of { id, name, slides[] }
 */
export function groupIntoSections(rows) {
  const sections = [];
  let currentName = null;
  let currentSlides = [];

  rows.forEach((row, i) => {
    if (row.section !== currentName) {
      if (currentName !== null) {
        sections.push({
          id: sectionId(currentName),
          name: currentName,
          slides: currentSlides,
        });
      }
      currentName = row.section;
      currentSlides = [];
    }
    currentSlides.push(mapSlide(row, i));
  });

  if (currentName !== null) {
    sections.push({
      id: sectionId(currentName),
      name: currentName,
      slides: currentSlides,
    });
  }

  return sections;
}

/**
 * Generate a show ID from a show name.
 */
function showId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Full pipeline: parse CSV → map rows to objects → group into sections → return ROS.
 * @param {string} csvString - Raw CSV text
 * @param {string} showName - Name of the show
 */
export function buildRunOfShow(csvString, showName) {
  const rawRows = parseCSV(csvString);
  const headers = rawRows[0];

  // Convert array rows to objects
  const rows = [];
  for (let i = 1; i < rawRows.length; i++) {
    const vals = rawRows[i];
    const obj = {};
    headers.forEach((h, idx) => { obj[h.trim()] = (vals[idx] || '').trim(); });
    if (!obj.slide_type) continue; // skip rows with no type
    rows.push(obj);
  }

  const sections = groupIntoSections(rows);

  return {
    id: showId(showName),
    name: showName,
    sections,
    created: Date.now(),
  };
}

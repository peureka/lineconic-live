import { describe, it, expect } from 'vitest';
import { parseCSV } from '../../lib/csv-parser.js';
import { buildRunOfShow, mapSlide, groupIntoSections } from '../../lib/ros-builder.js';
import fs from 'fs';

describe('CSV Parser', () => {
  it('strips UTF-8 BOM', () => {
    const input = '\uFEFFa,b,c\n1,2,3';
    const rows = parseCSV(input);
    expect(rows[0][0]).toBe('a');
  });

  it('normalizes CRLF to LF', () => {
    const input = 'a,b\r\n1,2\r\n';
    const rows = parseCSV(input);
    expect(rows.length).toBe(2); // header + 1 data row
  });

  it('handles quoted fields with commas', () => {
    const input = 'a,b\n"hello, world",2';
    const rows = parseCSV(input);
    expect(rows[1][0]).toBe('hello, world');
  });

  it('handles escaped quotes inside quoted fields', () => {
    const input = 'a,b\n"he said ""hello""",2';
    const rows = parseCSV(input);
    expect(rows[1][0]).toBe('he said "hello"');
  });

  it('skips blank rows', () => {
    const input = 'a,b\n1,2\n\n3,4';
    const rows = parseCSV(input);
    expect(rows.length).toBe(3); // header + 2 data rows
  });

  it('parses the actual SHOW_MASTER_V2.csv', () => {
    const csv = fs.readFileSync('SHOW_MASTER_V2.csv', 'utf8');
    const rows = parseCSV(csv);
    // Header + 161 data rows
    expect(rows.length).toBeGreaterThan(100);
    // First data row is slide 1, attract
    expect(rows[1][1]).toBe('PRE-SHOW');
    expect(rows[1][2]).toBe('attract');
  });
});

describe('ROS Builder — mapSlide', () => {
  it('maps a source_q row correctly', () => {
    const row = {
      slide_number: '5',
      section: 'ROUND 1: GUESS THE SOURCE',
      slide_type: 'source_q',
      primary_text: 'DID I STUTTER?',
      secondary_text: '',
      answer: 'The Office',
      answer_source: '',
      notes: '',
    };
    const slide = mapSlide(row, 4);
    expect(slide.type).toBe('source_q');
    expect(slide.content.primary).toBe('DID I STUTTER?');
    expect(slide.content.answer).toBe('The Office');
    expect(slide.reveal_state).toBe('hidden');
    expect(slide.timer_seconds).toBe(30);
    expect(slide.id).toBe('s005');
  });

  it('maps an acronym_q row correctly', () => {
    const row = {
      slide_number: '27',
      section: 'ROUND 2: SCREEN',
      slide_type: 'acronym_q',
      primary_text: 'I.A.K.',
      secondary_text: '',
      answer: 'I AM KENOUGH',
      answer_source: 'Barbie',
      notes: '',
    };
    const slide = mapSlide(row, 26);
    expect(slide.type).toBe('acronym_q');
    expect(slide.content.primary).toBe('I.A.K.');
    expect(slide.content.answer).toBe('I AM KENOUGH');
    expect(slide.content.source).toBe('Barbie');
    expect(slide.timer_seconds).toBe(30);
  });

  it('extracts bonus points from notes', () => {
    const row = {
      slide_number: '10',
      section: 'ROUND 1',
      slide_type: 'source_q',
      primary_text: 'TEST',
      secondary_text: '',
      answer: 'Answer',
      answer_source: '',
      notes: 'bonus 3pts',
    };
    const slide = mapSlide(row, 9);
    expect(slide.points).toBe(3);
  });

  it('maps an attract slide', () => {
    const row = {
      slide_number: '1',
      section: 'PRE-SHOW',
      slide_type: 'attract',
      primary_text: 'L',
      secondary_text: '',
      answer: '',
      answer_source: '',
      notes: '',
    };
    const slide = mapSlide(row, 0);
    expect(slide.type).toBe('attract');
    expect(slide.content.primary).toBe('L');
    expect(slide.team).toBe('neutral');
  });

  it('maps hotseat_prompt with 30s timer', () => {
    const row = {
      slide_number: '154',
      section: 'BONUS: HOT SEAT',
      slide_type: 'hotseat_prompt',
      primary_text: 'BABY SHARK',
      secondary_text: '',
      answer: '',
      answer_source: 'Pinkfong',
      notes: '',
    };
    const slide = mapSlide(row, 153);
    expect(slide.type).toBe('hotseat_prompt');
    expect(slide.timer_seconds).toBe(30);
  });

  it('maps operational slides (fishbowl, round_title, etc.)', () => {
    const row = {
      slide_number: '2',
      section: 'WARM-UP',
      slide_type: 'fishbowl',
      primary_text: 'WRITE YOUR RED FLAG.',
      secondary_text: 'DROP IT IN THE BOWL.',
      answer: '',
      answer_source: '',
      notes: '',
    };
    const slide = mapSlide(row, 1);
    expect(slide.type).toBe('fishbowl');
    expect(slide.content.primary).toBe('WRITE YOUR RED FLAG.');
    expect(slide.content.secondary).toBe('DROP IT IN THE BOWL.');
  });
});

describe('ROS Builder — groupIntoSections', () => {
  it('groups rows by section column', () => {
    const rows = [
      { section: 'A', slide_type: 'attract', primary_text: 'L', secondary_text: '', answer: '', answer_source: '', notes: '', slide_number: '1' },
      { section: 'A', slide_type: 'fishbowl', primary_text: 'X', secondary_text: '', answer: '', answer_source: '', notes: '', slide_number: '2' },
      { section: 'B', slide_type: 'round_title', primary_text: 'R1', secondary_text: '', answer: '', answer_source: '', notes: '', slide_number: '3' },
    ];
    const sections = groupIntoSections(rows);
    expect(sections.length).toBe(2);
    expect(sections[0].name).toBe('A');
    expect(sections[0].slides.length).toBe(2);
    expect(sections[1].name).toBe('B');
    expect(sections[1].slides.length).toBe(1);
  });

  it('generates section IDs from names', () => {
    const rows = [
      { section: 'ROUND 1: GUESS THE SOURCE', slide_type: 'round_title', primary_text: 'R1', secondary_text: '', answer: '', answer_source: '', notes: '', slide_number: '1' },
    ];
    const sections = groupIntoSections(rows);
    expect(sections[0].id).toBe('round-1-guess-the-source');
  });
});

describe('ROS Builder — buildRunOfShow (full integration)', () => {
  it('builds the complete Run of Show from the real CSV', () => {
    const csv = fs.readFileSync('SHOW_MASTER_V2.csv', 'utf8');
    const ros = buildRunOfShow(csv, 'THE SPLIT — TABLE FORMAT V2');

    expect(ros.id).toBe('the-split-table-format-v2');
    expect(ros.name).toBe('THE SPLIT — TABLE FORMAT V2');
    expect(ros.sections.length).toBeGreaterThan(8);
    expect(typeof ros.created).toBe('number');

    // Count total slides
    const totalSlides = ros.sections.reduce((a, s) => a + s.slides.length, 0);
    expect(totalSlides).toBe(161);

    // First slide is attract
    expect(ros.sections[0].slides[0].type).toBe('attract');
    expect(ros.sections[0].slides[0].content.primary).toBe('L');

    // Last slide is endcard
    const lastSection = ros.sections[ros.sections.length - 1];
    const lastSlide = lastSection.slides[lastSection.slides.length - 1];
    expect(lastSlide.type).toBe('endcard');

    // Check a known acronym_q
    const round2 = ros.sections.find(s => s.name.includes('ROUND 2'));
    expect(round2).toBeDefined();
    const iak = round2.slides.find(s => s.content.primary === 'I.A.K.');
    expect(iak).toBeDefined();
    expect(iak.content.answer).toBe('I AM KENOUGH');
    expect(iak.content.source).toBe('Barbie');

    // Every slide has an id
    ros.sections.forEach(section => {
      section.slides.forEach(slide => {
        expect(slide.id).toBeTruthy();
        expect(slide.type).toBeTruthy();
        expect(slide.team).toBe('neutral');
        expect(slide.reveal_state).toBe('hidden');
      });
    });
  });
});

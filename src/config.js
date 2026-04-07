import { GENERAL, SHORTCUTS } from './config/general.js';
import { FIXTURES_META, DEFAULT_FIXTURES } from './config/fixtures.js';
import { LIGHTBOX } from './config/lightboxes.js';
import { CALLOUTS } from './config/callouts.js';
import { MANNEQUIN_FILE, MANNEQUIN_SCALE_ADJUST, DEFAULT_MANNEQUINS } from './config/mannequins.js';
import { DEFAULT_LAYOUT } from './config/default_layout.js';
import { MERCHANDISE } from './config/merch.js';

export const CONFIG = {
  ...GENERAL,
  FIXTURES_META,
  MANNEQUIN_FILE,
  MANNEQUIN_SCALE_ADJUST,
  LIGHTBOX,
  CALLOUTS,
  DEFAULT_MANNEQUINS,
  DEFAULT_FIXTURES,
  DEFAULT_LAYOUT,
  SHORTCUTS,
  MERCHANDISE,
};

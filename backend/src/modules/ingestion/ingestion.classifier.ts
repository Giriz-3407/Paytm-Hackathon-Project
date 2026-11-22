import type { CATEGORIES } from '../../constants';

type Category = (typeof CATEGORIES)[number];

/**
 * Rule-based first pass (PRD §12 "cheap rule-based prefilter"). It only decides whether a
 * headline looks like a crisis report and roughly where; it never invents severity or impact.
 * Order matters: the first matching category wins.
 */
const CATEGORY_RULES: [Category, RegExp][] = [
  ['Cyclone', /\b(cyclone|cyclonic storm|depression over the bay|landfall)\b/i],
  ['Earthquake', /\b(earthquakes?|tremors?|magnitude \d|quake|seismic)\b/i],
  ['Landslide', /\b(landslides?|landslips?|mudslides?|land subsidence|rockfall)\b/i],
  ['Flood', /\b(floods?|flooded|flooding|waterlogg\w*|inundat\w*|submerged|swollen river|overflowing)\b/i],
  ['Heatwave', /\b(heat ?wave|heatstroke|heat stroke|severe heat|scorching)\b/i],
  ['Industrial', /\b(factory (blast|explosion|fire)|chemical (leak|plant)|gas leak|boiler (blast|explosion)|industrial accident|plant explosion|firecracker (unit|factory) blast)\b/i],
  ['Fire', /\b(fire broke out|blaze|gutted|fire tenders?|firefighters?|massive fire|major fire|forest fire|wildfire)\b/i],
  ['Severe weather', /\b(cloudburst|thunderstorms?|hailstorm|lightning|red alert|orange alert|heavy rain(fall)?|squall|dust storm)\b/i],
];

/** Headlines that mention a hazard word without reporting a current event. */
const NOT_A_CURRENT_EVENT =
  /\b(recalls?|remembers?|anniversary|years? (ago|after|since)|documentary|movie|film|web series|sensex|nifty|share price|stocks?)\b/i;

/** Tracker sites publish a feed entry for every tiny tremor; those are not incidents worth tracking. */
export const MIN_EARTHQUAKE_MAGNITUDE = 3;

function magnitudeOf(text: string): number | null {
  // "mag. 3.4", "magnitude 5.2" and "2.8 magnitude" / "4.1-magnitude"
  const m =
    text.match(/\bmag(?:nitude|\.)?\s*(\d+(?:\.\d+)?)/i) ??
    text.match(/(\d+(?:\.\d+)?)[\s-]*magnitude\b/i);
  return m ? Number(m[1]) : null;
}

export function classifyCategory(text: string): Category | null {
  if (NOT_A_CURRENT_EVENT.test(text)) return null;
  for (const [category, pattern] of CATEGORY_RULES) {
    if (!pattern.test(text)) continue;
    if (category === 'Earthquake') {
      const magnitude = magnitudeOf(text);
      if (magnitude !== null && magnitude < MIN_EARTHQUAKE_MAGNITUDE) return null;
    }
    return category;
  }
  return null;
}

export interface Place {
  city: string;
  state: string;
  district: string;
  coordinates: [number, number];
  precision: 'city' | 'state';
}

// [name, state, lat, lng, aliases...]  Coordinates are reference points, not impact areas.
type Entry = [string, string, number, number, ...string[]];

const CITIES: Entry[] = [
  ['Mumbai', 'Maharashtra', 19.076, 72.8777, 'Bombay'],
  ['Pune', 'Maharashtra', 18.5204, 73.8567],
  ['Nagpur', 'Maharashtra', 21.1458, 79.0882],
  ['Delhi', 'Delhi', 28.6139, 77.209, 'New Delhi'],
  ['Noida', 'Uttar Pradesh', 28.5355, 77.391],
  ['Gurugram', 'Haryana', 28.4595, 77.0266, 'Gurgaon'],
  ['Kolkata', 'West Bengal', 22.5726, 88.3639, 'Calcutta'],
  ['Chennai', 'Tamil Nadu', 13.0827, 80.2707, 'Madras'],
  ['Coimbatore', 'Tamil Nadu', 11.0168, 76.9558],
  ['Madurai', 'Tamil Nadu', 9.9252, 78.1198],
  ['Bengaluru', 'Karnataka', 12.9716, 77.5946, 'Bangalore'],
  ['Mangaluru', 'Karnataka', 12.9141, 74.856, 'Mangalore'],
  ['Hyderabad', 'Telangana', 17.385, 78.4867],
  ['Ahmedabad', 'Gujarat', 23.0225, 72.5714],
  ['Surat', 'Gujarat', 21.1702, 72.8311],
  ['Jaipur', 'Rajasthan', 26.9124, 75.7873],
  ['Lucknow', 'Uttar Pradesh', 26.8467, 80.9462],
  ['Kanpur', 'Uttar Pradesh', 26.4499, 80.3319],
  ['Varanasi', 'Uttar Pradesh', 25.3176, 82.9739],
  ['Patna', 'Bihar', 25.5941, 85.1376],
  ['Bhubaneswar', 'Odisha', 20.2961, 85.8245],
  ['Cuttack', 'Odisha', 20.4625, 85.883],
  ['Puri', 'Odisha', 19.8135, 85.8312],
  ['Guwahati', 'Assam', 26.1445, 91.7362],
  ['Silchar', 'Assam', 24.8333, 92.7789],
  ['Dibrugarh', 'Assam', 27.4728, 94.912],
  ['Kochi', 'Kerala', 9.9312, 76.2673, 'Cochin'],
  ['Thiruvananthapuram', 'Kerala', 8.5241, 76.9366, 'Trivandrum'],
  ['Kozhikode', 'Kerala', 11.2588, 75.7804, 'Calicut'],
  ['Dehradun', 'Uttarakhand', 30.3165, 78.0322],
  ['Shimla', 'Himachal Pradesh', 31.1048, 77.1734],
  ['Srinagar', 'Jammu and Kashmir', 34.0837, 74.7973],
  ['Jammu', 'Jammu and Kashmir', 32.7266, 74.857],
  ['Visakhapatnam', 'Andhra Pradesh', 17.6868, 83.2185, 'Vizag'],
  ['Vijayawada', 'Andhra Pradesh', 16.5062, 80.648],
  ['Bhopal', 'Madhya Pradesh', 23.2599, 77.4126],
  ['Indore', 'Madhya Pradesh', 22.7196, 75.8577],
  ['Raipur', 'Chhattisgarh', 21.2514, 81.6296],
  ['Ranchi', 'Jharkhand', 23.3441, 85.3096],
  ['Chandigarh', 'Chandigarh', 30.7333, 76.7794],
  ['Ludhiana', 'Punjab', 30.901, 75.8573],
  ['Amritsar', 'Punjab', 31.634, 74.8723],
  ['Gangtok', 'Sikkim', 27.3389, 88.6065],
  ['Imphal', 'Manipur', 24.817, 93.9368],
  ['Shillong', 'Meghalaya', 25.5788, 91.8933],
  ['Aizawl', 'Mizoram', 23.7271, 92.7176],
  ['Kohima', 'Nagaland', 25.6701, 94.1077],
  ['Agartala', 'Tripura', 23.8315, 91.2868],
  ['Itanagar', 'Arunachal Pradesh', 27.0844, 93.6053],
  ['Panaji', 'Goa', 15.4909, 73.8278],
];

const STATES: Entry[] = [
  ['Maharashtra', 'Maharashtra', 19.7515, 75.7139],
  ['Gujarat', 'Gujarat', 22.2587, 71.1924],
  ['Rajasthan', 'Rajasthan', 27.0238, 74.2179],
  ['Uttar Pradesh', 'Uttar Pradesh', 27.1, 80.9],
  ['Bihar', 'Bihar', 25.0961, 85.3131],
  ['West Bengal', 'West Bengal', 22.9868, 87.855],
  ['Odisha', 'Odisha', 20.9517, 85.0985, 'Orissa'],
  ['Assam', 'Assam', 26.2006, 92.9376],
  ['Kerala', 'Kerala', 10.8505, 76.2711],
  ['Tamil Nadu', 'Tamil Nadu', 11.1271, 78.6569],
  ['Karnataka', 'Karnataka', 15.3173, 75.7139],
  ['Andhra Pradesh', 'Andhra Pradesh', 15.9129, 79.74],
  ['Telangana', 'Telangana', 18.1124, 79.0193],
  ['Madhya Pradesh', 'Madhya Pradesh', 22.9734, 78.6569],
  ['Chhattisgarh', 'Chhattisgarh', 21.2787, 81.8661],
  ['Jharkhand', 'Jharkhand', 23.6102, 85.2799],
  ['Uttarakhand', 'Uttarakhand', 30.0668, 79.0193],
  ['Himachal Pradesh', 'Himachal Pradesh', 31.1048, 77.1734],
  ['Jammu and Kashmir', 'Jammu and Kashmir', 33.7782, 76.5762, 'J&K', 'Kashmir'],
  ['Ladakh', 'Ladakh', 34.1526, 77.5771],
  ['Punjab', 'Punjab', 31.1471, 75.3412],
  ['Haryana', 'Haryana', 29.0588, 76.0856],
  ['Goa', 'Goa', 15.2993, 74.124],
  ['Sikkim', 'Sikkim', 27.533, 88.5122],
  ['Arunachal Pradesh', 'Arunachal Pradesh', 28.218, 94.7278],
  ['Nagaland', 'Nagaland', 26.1584, 94.5624],
  ['Manipur', 'Manipur', 24.6637, 93.9063],
  ['Mizoram', 'Mizoram', 23.1645, 92.9376],
  ['Tripura', 'Tripura', 23.9408, 91.9882],
  ['Meghalaya', 'Meghalaya', 25.467, 91.3662],
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&');
const compile = (entries: Entry[]) =>
  entries.map((e) => ({
    entry: e,
    pattern: new RegExp(`(?<![\\w])(${[e[0], ...e.slice(4)].map((n) => escape(n as string)).join('|')})(?![\\w])`, 'i'),
  }));

const CITY_MATCHERS = compile(CITIES);
const STATE_MATCHERS = compile(STATES);

/**
 * Finds the Indian place mentioned earliest in the text. Cities win over states at the same
 * position because they are more specific; state-only matches are labelled "(state-level)" so the
 * UI never implies a precise pin. Returns null rather than guessing when nothing matches.
 */
export function locatePlace(rawText: string): Place | null {
  // Timezone labels such as "(Kolkata time)" or "IST" are not locations.
  const text = rawText.replace(/\b(kolkata|india|indian)\s+(standard\s+)?time\b/gi, ' ');
  let best: { index: number; place: Place } | null = null;
  const consider = (index: number, place: Place) => {
    if (!best || index < best.index || (index === best.index && place.precision === 'city')) {
      best = { index, place };
    }
  };
  for (const { entry, pattern } of CITY_MATCHERS) {
    const m = pattern.exec(text);
    if (!m) continue;
    const [city, state, lat, lng] = entry;
    consider(m.index, { city, state, district: city, coordinates: [lat, lng], precision: 'city' });
  }
  for (const { entry, pattern } of STATE_MATCHERS) {
    const m = pattern.exec(text);
    if (!m) continue;
    const [, state, lat, lng] = entry;
    consider(m.index, {
      city: `${state} (state-level)`,
      state,
      district: state,
      coordinates: [lat, lng],
      precision: 'state',
    });
  }
  return (best as { place: Place } | null)?.place ?? null;
}

/**
 * Location comes from the headline only. Snippets from tracker and aggregator sites often list
 * unrelated nearby cities ("felt in Kolkata"), which would pin an incident to the wrong place;
 * skipping the article is safer than guessing.
 */
export function locateArticle(title: string): Place | null {
  return locatePlace(title);
}

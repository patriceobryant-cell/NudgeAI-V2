/**
 * Static content for NudgeAI: relationship taxonomy, seeded example data and the
 * idea bank that powers the Ideas page and dashboard suggestions.
 */

export const RELATIONSHIPS = [
  'Partner',
  'Spouse',
  'Child',
  'Parent',
  'Sibling',
  'Friend',
  'Family',
  'Coworker',
  'Employee',
  'Manager',
  'Mentor',
  'Other',
]

export const LOVE_LANGUAGES = [
  'Words of affirmation',
  'Quality time',
  'Acts of service',
  'Receiving gifts',
  'Physical touch',
]

/** Check-in rhythms, with the cadence in days used to detect overdue people. */
export const CADENCES = [
  { label: 'Every few days', days: 3 },
  { label: 'Weekly', days: 7 },
  { label: 'Every two weeks', days: 14 },
  { label: 'Monthly', days: 30 },
  { label: 'Quarterly', days: 90 },
  { label: 'Occasionally', days: 180 },
]

export const CADENCE_DAYS = Object.fromEntries(CADENCES.map((c) => [c.label, c.days]))

export const ACCENTS = ['teal', 'coral', 'amber', 'olive', 'plum', 'charcoal']

export const REPEATS = ['Never', 'Daily', 'Weekly', 'Every two weeks', 'Monthly', 'Yearly']

export const MOMENT_KINDS = [
  'Called',
  'Texted',
  'Met up',
  'Sent a gift',
  'Wrote a note',
  'Shared a meal',
  'Other',
]

/** Conversation prompts, shuffled through on the dashboard and Ideas page. */
export const STARTERS = [
  'What has been giving you energy lately?',
  'What is something you wish more people understood about you?',
  'What tiny moment from this week do you want to remember?',
  'If we had a completely free afternoon, what would you choose to do?',
  'Who has shaped the way you see the world?',
  'What are you quietly looking forward to?',
  'What is something you changed your mind about recently?',
  'What does a genuinely good week look like for you right now?',
  'What is the kindest thing someone has done for you lately?',
  'What are you working on that you are proud of?',
]

/**
 * Ideas grouped by category. Each idea can name the relationships it suits best
 * so the Ideas page can tailor the list to a specific person.
 */
export const IDEA_BANK = [
  { category: 'Small gestures', text: 'Leave a short handwritten note somewhere they will find it later', fits: ['Partner', 'Spouse', 'Child', 'Parent'] },
  { category: 'Small gestures', text: 'Bring back their favourite snack without being asked', fits: ['Partner', 'Spouse', 'Child', 'Friend', 'Coworker'] },
  { category: 'Small gestures', text: 'Take one recurring chore off their plate this week', fits: ['Partner', 'Spouse', 'Parent', 'Sibling'] },
  { category: 'Small gestures', text: 'Send a photo that brings back a happy shared memory', fits: [] },
  { category: 'Small gestures', text: 'Queue up a song that reminds you of them and tell them why', fits: ['Friend', 'Partner', 'Sibling'] },

  { category: 'Quality time', text: 'Plan one hour together with no phones in the room', fits: ['Partner', 'Spouse', 'Child', 'Friend'] },
  { category: 'Quality time', text: 'Let them pick the activity and go along with genuine enthusiasm', fits: ['Child', 'Partner', 'Spouse'] },
  { category: 'Quality time', text: 'Invite them on a walk with no agenda beyond talking', fits: ['Friend', 'Parent', 'Sibling', 'Coworker'] },
  { category: 'Quality time', text: 'Cook something together instead of ordering in', fits: ['Partner', 'Spouse', 'Family', 'Child'] },
  { category: 'Quality time', text: 'Put a standing date on the calendar so it stops being "soon"', fits: ['Friend', 'Sibling', 'Parent'] },

  { category: 'Words that land', text: 'Name one specific thing they did this week that helped you', fits: [] },
  { category: 'Words that land', text: 'Send a voice note instead of a text — tone carries more than words', fits: ['Friend', 'Parent', 'Sibling', 'Partner'] },
  { category: 'Words that land', text: 'Tell them what you admire about how they handle something hard', fits: [] },
  { category: 'Words that land', text: 'Thank them for something they probably think went unnoticed', fits: [] },
  { category: 'Words that land', text: 'Say the compliment you have been thinking but never said out loud', fits: [] },

  { category: 'Celebrate them', text: 'Mark a win they downplayed with something small but real', fits: [] },
  { category: 'Celebrate them', text: 'Frame a printed photo from a day you both loved', fits: ['Partner', 'Spouse', 'Parent', 'Family'] },
  { category: 'Celebrate them', text: 'Build a tiny care package around one thing they love', fits: ['Friend', 'Child', 'Partner', 'Coworker'] },
  { category: 'Celebrate them', text: 'Give an experience you can share rather than an object', fits: ['Partner', 'Spouse', 'Child', 'Friend'] },
  { category: 'Celebrate them', text: 'Tell someone else how great they are — where they can hear it', fits: [] },

  { category: 'Check in well', text: 'Ask a follow-up question about the thing they mentioned last time', fits: [] },
  { category: 'Check in well', text: 'Call with no goal other than hearing how they actually are', fits: ['Parent', 'Friend', 'Sibling', 'Mentor'] },
  { category: 'Check in well', text: 'Ask what would make their week measurably easier, then do it', fits: ['Partner', 'Spouse', 'Employee', 'Coworker'] },
  { category: 'Check in well', text: 'Check in on the hard thing they told you about — by name', fits: [] },
  { category: 'Check in well', text: 'Ask about their people: who is on their mind right now?', fits: [] },

  { category: 'At work', text: 'Recognise a specific contribution where their peers can see it', fits: ['Employee', 'Coworker', 'Manager'] },
  { category: 'At work', text: 'Send a short note to them and their manager about great work', fits: ['Employee', 'Coworker'] },
  { category: 'At work', text: 'Offer focused help on the one task that is blocking them', fits: ['Coworker', 'Employee'] },
  { category: 'At work', text: 'Give credit for their idea in the next meeting, out loud', fits: ['Coworker', 'Employee'] },
  { category: 'At work', text: 'Ask what priority would help most, then protect their time for it', fits: ['Employee', 'Manager', 'Mentor'] },
  { category: 'At work', text: 'Share a growth opportunity that matches something they are good at', fits: ['Employee', 'Mentor'] },
]

export const IDEA_CATEGORIES = [...new Set(IDEA_BANK.map((idea) => idea.category))]

/** Fallback suggestion used on the dashboard hero when nothing else fits. */
export const DEFAULT_SUGGESTION = 'Send a message that names one thing you appreciate about them.'

const iso = (offsetDays) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

/** Example content shown on a first visit so the app is never empty. */
export const SEED_PEOPLE = [
  {
    id: 'seed-maya',
    name: 'Maya',
    relationship: 'Partner',
    birthday: '1992-04-18',
    anniversary: '2020-09-12',
    favorites: 'Peonies, oat lattes, mystery novels',
    notes: 'Loves slow Saturday mornings. Ask about the pottery class.',
    loveLanguage: 'Quality time',
    cadence: 'Weekly',
    accent: 'coral',
    lastConnected: iso(-9),
    createdAt: iso(-120),
  },
  {
    id: 'seed-dad',
    name: 'Dad',
    relationship: 'Parent',
    birthday: '1962-11-08',
    anniversary: '',
    favorites: 'Gardening, jazz records, crossword puzzles',
    notes: 'Ask how the tomatoes are doing this year.',
    loveLanguage: 'Acts of service',
    cadence: 'Weekly',
    accent: 'amber',
    lastConnected: iso(-3),
    createdAt: iso(-120),
  },
  {
    id: 'seed-jordan',
    name: 'Jordan',
    relationship: 'Friend',
    birthday: '1991-03-24',
    anniversary: '',
    favorites: 'Live music, long trail runs',
    notes: 'Training for a 10K in the spring.',
    loveLanguage: 'Words of affirmation',
    cadence: 'Monthly',
    accent: 'olive',
    lastConnected: iso(-41),
    createdAt: iso(-120),
  },
]

export const SEED_REMINDERS = [
  {
    id: 'seed-reminder-1',
    personId: 'seed-maya',
    title: 'Plan a screen-free evening together',
    date: iso(1),
    time: '18:30',
    repeat: 'Never',
    notes: '',
    done: false,
    createdAt: iso(-2),
  },
  {
    id: 'seed-reminder-2',
    personId: 'seed-dad',
    title: 'Call to hear about the garden',
    date: iso(0),
    time: '17:00',
    repeat: 'Weekly',
    notes: '',
    done: false,
    createdAt: iso(-7),
  },
]

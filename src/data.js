export const relationships = ['Spouse','Partner','Child','Parent','Friend','Employee','Boss','Coworker','Family','Other']

export const suggestionBank = {
  Spouse: ['Leave a tiny note where they will find it','Plan an hour with no phones','Name one thing they did this week that helped you'],
  Partner: ['Leave a tiny note where they will find it','Plan an hour with no phones','Name one thing they did this week that helped you'],
  Child: ['Let them choose tonight’s shared activity','Ask what made them proud today','Hide an encouraging note in their bag'],
  Parent: ['Call just to hear one of their stories','Send a photo that brings back a happy memory','Ask if there is one errand you can take off their list'],
  Friend: ['Send the song that reminds you of them','Make a concrete plan instead of saying “soon”','Celebrate a small win they recently shared'],
  Employee: ['Recognize a specific contribution publicly','Ask what would make their week easier','Give feedback focused on their growth'],
  Boss: ['Share specific appreciation for their support','Offer a concise update before they ask','Ask what priority would help the team most'],
  Coworker: ['Offer focused help on one task','Give credit for an idea in the next meeting','Invite them for a quick coffee break'],
  Family: ['Share a favorite family memory','Plan a simple meal together','Check in about something important to them'],
  Other: ['Send a thoughtful check-in','Share a sincere, specific compliment','Invite them to spend a little time together']
}

export const starters = [
  'What has been giving you energy lately?',
  'What is something you wish people understood about you?',
  'What is a tiny moment from this week you want to remember?',
  'If we had a completely free afternoon, what would you choose?',
  'Who has shaped the way you see the world?',
  'What are you looking forward to right now?'
]

export const seedPeople = [
  {id:'p1',name:'Maya',relationship:'Partner',birthday:'',anniversary:'2020-09-12',notes:'Loves slow Saturday mornings',favorites:'Peonies, oat lattes, mystery novels',loveLanguage:'Quality time',frequency:'Weekly',color:'coral'},
  {id:'p2',name:'Dad',relationship:'Parent',birthday:'1962-11-08',anniversary:'',notes:'Ask about the garden',favorites:'Gardening and jazz',loveLanguage:'Acts of service',frequency:'Weekly',color:'amber'},
  {id:'p3',name:'Jordan',relationship:'Friend',birthday:'1991-03-24',anniversary:'',notes:'Training for a 10K',favorites:'Live music',loveLanguage:'Words of affirmation',frequency:'Monthly',color:'olive'}
]

export const seedReminders = [
  {id:'r1',personId:'p1',title:'Plan a screen-free evening',date:new Date(Date.now()+86400000).toISOString().slice(0,10),time:'18:00',repeat:'Never',done:false},
]

export const ideaCategories = {
  'Encouragement': ['Send a voice note naming a strength you admire','Celebrate a small win they may have overlooked','Tell them why you believe in what they are building'],
  'Gifts': ['Create a tiny care package around their favorite snack','Give an experience you can enjoy together','Print and frame a meaningful shared photo'],
  'Conversation': starters,
  'Appreciation': ['Thank them for one specific, recent action','Share a memory that shows the difference they make','Write three things you never want to take for granted'],
  'Employee recognition': ['Recognize their impact in the next team meeting','Send a specific note to them and their leader','Offer a growth opportunity aligned with their strengths']
}

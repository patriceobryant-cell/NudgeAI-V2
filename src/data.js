export const relationships = ['Partner','Child','Parent','Friend','Employee','Boss','Coworker','Other']

export const suggestionBank = {
  Partner: ['Leave a tiny note where they will find it','Plan an hour with no phones','Name one thing they did this week that helped you'],
  Child: ['Let them choose tonight’s shared activity','Ask what made them proud today','Hide an encouraging note in their bag'],
  Parent: ['Call just to hear one of their stories','Send a photo that brings back a happy memory','Ask if there is one errand you can take off their list'],
  Friend: ['Send the song that reminds you of them','Make a concrete plan instead of saying “soon”','Celebrate a small win they recently shared'],
  Employee: ['Recognize a specific contribution publicly','Ask what would make their week easier','Give feedback focused on their growth'],
  Boss: ['Share specific appreciation for their support','Offer a concise update before they ask','Ask what priority would help the team most'],
  Coworker: ['Offer focused help on one task','Give credit for an idea in the next meeting','Invite them for a quick coffee break'],
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
  {id:'p1',name:'Maya',relationship:'Partner',birthday:'',anniversary:'2020-09-12',notes:'Loves slow Saturday mornings',color:'coral'},
  {id:'p2',name:'Dad',relationship:'Parent',birthday:'1962-11-08',anniversary:'',notes:'Ask about the garden',color:'amber'},
  {id:'p3',name:'Jordan',relationship:'Friend',birthday:'1991-03-24',anniversary:'',notes:'',color:'olive'}
]

export const seedReminders = [
  {id:'r1',personId:'p1',title:'Plan a screen-free evening',date:new Date(Date.now()+86400000).toISOString().slice(0,10),time:'18:00',repeat:'Never',done:false},
]

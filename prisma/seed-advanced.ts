import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helpers pour générer des dates réalistes
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function subtractYears(years: number): Date {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)
  return date
}

// Données riches et réalistes
const firstNames = {
  homme: ['Alexandre', 'Antoine', 'Arthur', 'Benjamin', 'Charles', 'Damien', 'David', 'Étienne', 'François', 'Gabriel', 'Guillaume', 'Hugo', 'Jean', 'Julien', 'Laurent', 'Luc', 'Marc', 'Mathieu', 'Maxime', 'Nicolas', 'Olivier', 'Paul', 'Pierre', 'Raphaël', 'Romain', 'Sébastien', 'Simon', 'Thomas', 'Victor', 'Vincent'],
  femme: ['Amélie', 'Anne', 'Audrey', 'Camille', 'Caroline', 'Catherine', 'Céline', 'Charlotte', 'Chloé', 'Claire', 'Élise', 'Élodie', 'Emma', 'Florence', 'Isabelle', 'Julie', 'Laura', 'Léa', 'Louise', 'Manon', 'Marie', 'Marine', 'Nathalie', 'Pauline', 'Sarah', 'Sophie', 'Valérie', 'Virginie']
}

const lastNames = ['Bernard', 'Blanc', 'Bonnet', 'Chevalier', 'Clement', 'David', 'Dubois', 'Dufour', 'Dupont', 'Durand', 'Faure', 'Fontaine', 'Fournier', 'Garcia', 'Garnier', 'Gauthier', 'Girard', 'Lambert', 'Laurent', 'Leclerc', 'Lemoine', 'Leroy', 'Lopez', 'Marchand', 'Martin', 'Mercier', 'Moreau', 'Morel', 'Moulin', 'Muller', 'Nguyen', 'Perrin', 'Petit', 'Richard', 'Robert', 'Robin', 'Roux', 'Roy', 'Simon', 'Thomas']

const companies = ['TechCorp', 'InnovaLabs', 'DigitalWorks', 'StartupHub', 'CreativeAgency', 'DataSolutions', 'CloudServices', 'Freelance', 'SoftwareCo', 'WebFactory', 'DesignStudio', 'ConsultingGroup', 'MediaGroup', 'FinanceCorp', 'HealthTech', 'EduTech', 'GreenEnergy', 'FoodDelivery', 'E-Commerce', 'TravelTech']

const interactionNotes = {
  message: [
    'Échangé sur nos projets du moment',
    'Discussion rapide pour prendre des nouvelles',
    'Conversation intéressante sur nos expériences récentes',
    'Planification d\'une future rencontre',
    'Partage d\'articles et de ressources',
    'Discussion sur l\'actualité',
    'Échange de photos de vacances',
    'Conseil mutuel sur un sujet professionnel',
    'Rattrapage après une longue période',
    'Discussion légère et sympathique',
    'Partage d\'une anecdote drôle',
    'Soutien moral dans une période difficile',
    'Félicitations pour une réussite',
    'Organisation d\'un événement ensemble',
    '',
  ],
  call: [
    'Appel pour prendre des nouvelles en détail',
    'Discussion approfondie sur nos vies respectives',
    'Appel vidéo convivial',
    'Consultation pour un conseil important',
    'Longue conversation très enrichissante',
    'Appel rapide pour coordonner une rencontre',
    'Discussion sur un projet commun',
    'Rattrapage téléphonique de qualité',
    'Échange d\'idées et de perspectives',
    'Appel de soutien',
    '',
  ],
  meeting: [
    'Déjeuner au restaurant, excellente discussion',
    'Café en terrasse, moment très agréable',
    'Sortie culturelle ensemble (musée, expo)',
    'Dîner chez l\'un de nous, soirée mémorable',
    'Balade dans le parc, conversation profonde',
    'Soirée jeux de société entre amis',
    'Week-end ensemble, moments inoubliables',
    'Rencontre imprévue qui s\'est prolongée',
    'Activité sportive ensemble',
    'Événement social (mariage, anniversaire)',
    'Sortie au cinéma suivie d\'un verre',
    'Brunch du dimanche très sympa',
    'Randonnée ensemble dans la nature',
    'Concert ou spectacle suivi d\'une discussion',
    'Apéritif improvisé qui a duré',
    '',
  ],
  email: [
    'Échange d\'emails professionnels',
    'Coordination par email pour un projet',
    'Partage de documents et ressources',
    'Email de félicitations ou remerciements',
    'Discussion formelle par email',
    '',
  ]
}

const journalTemplates = [
  {
    title: 'Moment marquant',
    content: 'Aujourd\'hui, {firstName} et moi avons partagé un moment vraiment spécial. {detail}. Je me sens chanceux/se de l\'avoir dans ma vie.',
  },
  {
    title: 'Discussion profonde',
    content: '{firstName} m\'a confié {detail}. Cela m\'a permis de mieux comprendre sa situation et de renforcer notre lien.',
  },
  {
    title: 'Évolution de la relation',
    content: 'Je remarque que ma relation avec {firstName} évolue positivement. {detail}. C\'est vraiment enrichissant.',
  },
  {
    title: 'Gratitude',
    content: 'Je suis reconnaissant/e envers {firstName} pour {detail}. C\'est ce genre d\'attention qui fait toute la différence.',
  },
  {
    title: 'Souvenir partagé',
    content: 'Nous avons évoqué avec {firstName} ce souvenir de {detail}. C\'était nostalgique et touchant.',
  },
  {
    title: 'Projet commun',
    content: 'Nous avons avancé sur notre projet {detail} avec {firstName}. C\'est motivant de collaborer ainsi.',
  },
  {
    title: 'Difficulté traversée',
    content: '{firstName} traverse une période difficile avec {detail}. J\'essaie d\'être présent/e et de soutenir au mieux.',
  },
  {
    title: 'Célébration',
    content: 'Célébration de {detail} avec {firstName}. Moment de joie partagée et de fierté mutuelle.',
  },
]

const journalDetails = [
  'ses projets professionnels et personnels',
  'une confidence importante sur sa famille',
  'ses aspirations et rêves pour l\'avenir',
  'les défis qu\'il/elle rencontre actuellement',
  'notre première rencontre il y a quelques années',
  'un voyage qu\'on aimerait faire ensemble',
  'son soutien dans un moment difficile',
  'sa promotion professionnelle',
  'la naissance de son enfant',
  'son déménagement récent',
  'ses nouvelles passions et hobbies',
  'un conflit résolu avec bienveillance',
]

const conversationTopics = [
  'Lui demander comment se passe son nouveau projet professionnel',
  'Prendre des nouvelles de sa famille, notamment ses enfants',
  'Discuter de nos objectifs pour l\'année prochaine',
  'Parler de ses vacances et de ses projets de voyage',
  'Échanger sur nos lectures récentes',
  'Demander son avis sur un sujet qui me préoccupe',
  'Partager mes expériences récentes',
  'Organiser une sortie culturelle ensemble',
  'Discuter de nos passions communes',
  'Évoquer des souvenirs partagés',
  'Parler de ses hobbies et nouvelles activités',
  'Échanger sur l\'actualité et nos points de vue',
]

const conversationQuestions = [
  'Comment va sa santé suite à son problème récent ?',
  'A-t-il/elle besoin d\'aide pour son projet ?',
  'Qu\'est-ce qu\'il/elle pense de la situation actuelle ?',
  'Comment s\'est passé son rendez-vous important ?',
  'Est-ce qu\'il/elle a des projets pour les prochaines vacances ?',
  'Comment se sent-il/elle dans son nouveau poste ?',
  'A-t-il/elle avancé sur ses objectifs personnels ?',
  'Qu\'est-ce qui le/la passionne en ce moment ?',
]

const giftIdeas = [
  { title: 'Livre sur {hobby}', minPrice: 15, maxPrice: 35, url: true },
  { title: 'Coffret {type} premium', minPrice: 30, maxPrice: 80, url: false },
  { title: 'Accessoire pour {hobby}', minPrice: 25, maxPrice: 150, url: true },
  { title: 'Bon cadeau {type}', minPrice: 40, maxPrice: 100, url: false },
  { title: 'Objet décoratif pour son intérieur', minPrice: 20, maxPrice: 60, url: true },
  { title: 'Expérience {type}', minPrice: 50, maxPrice: 200, url: true },
  { title: 'Vêtement ou accessoire de mode', minPrice: 35, maxPrice: 120, url: true },
  { title: 'Gadget technologique', minPrice: 40, maxPrice: 300, url: true },
  { title: 'Kit ou cours pour apprendre {hobby}', minPrice: 45, maxPrice: 150, url: true },
  { title: 'Article de sport ou fitness', minPrice: 30, maxPrice: 180, url: true },
]

const giftVariables = {
  hobby: ['la photographie', 'la cuisine', 'le jardinage', 'la musique', 'le sport', 'l\'art', 'la lecture', 'le bricolage'],
  type: ['de thé', 'de café', 'de vin', 'gastronomique', 'restaurant', 'spa', 'aventure', 'culturelle', 'bien-être'],
}

const customFieldsTemplates = [
  { label: 'Plat préféré', values: ['Pasta carbonara', 'Sushi', 'Couscous', 'Paella', 'Pizza margherita', 'Bœuf bourguignon', 'Pad Thai', 'Burger gourmet', 'Risotto', 'Curry indien'] },
  { label: 'Boisson préférée', values: ['Café', 'Thé vert', 'Vin rouge', 'Bière artisanale', 'Jus d\'orange', 'Cocktail mojito', 'Chocolat chaud', 'Smoothie', 'Eau pétillante'] },
  { label: 'Hobby principal', values: ['Photographie', 'Randonnée', 'Lecture', 'Cuisine', 'Jardinage', 'Musique', 'Peinture', 'Sport', 'Voyage', 'Cinéma', 'Jeux vidéo'] },
  { label: 'Film préféré', values: ['Inception', 'Le Parrain', 'Pulp Fiction', 'Amélie Poulain', 'Interstellar', 'Gladiator', 'Forrest Gump', 'The Matrix', 'La La Land'] },
  { label: 'Genre musical', values: ['Rock', 'Jazz', 'Classique', 'Électro', 'Pop', 'Hip-hop', 'Blues', 'Folk', 'Indie', 'Variété française'] },
  { label: 'Sport pratiqué', values: ['Tennis', 'Football', 'Natation', 'Course à pied', 'Yoga', 'Vélo', 'Escalade', 'Danse', 'Musculation', 'Randonnée'] },
  { label: 'Livre favori', values: ['1984', 'L\'Étranger', 'Harry Potter', 'Le Petit Prince', 'Sapiens', 'L\'Alchimiste', 'Orgueil et Préjugés', 'Les Misérables'] },
  { label: 'Destination de rêve', values: ['Japon', 'Nouvelle-Zélande', 'Islande', 'Italie', 'Canada', 'Australie', 'Norvège', 'Grèce', 'Bali', 'Patagonie'] },
  { label: 'Couleur préférée', values: ['Bleu', 'Vert', 'Rouge', 'Violet', 'Orange', 'Noir', 'Blanc', 'Jaune', 'Rose', 'Gris'] },
  { label: 'Allergies', values: ['Arachides', 'Fruits de mer', 'Lactose', 'Gluten', 'Pollen', 'Aucune'] },
  { label: 'Animal préféré', values: ['Chien', 'Chat', 'Dauphin', 'Éléphant', 'Loup', 'Oiseau', 'Cheval', 'Panda'] },
  { label: 'Saison préférée', values: ['Printemps', 'Été', 'Automne', 'Hiver'] },
]

async function main() {
  console.log('🌱 Début du seeding avancé...\n')

  // Créer l'utilisateur
  const passwordHash = await bcrypt.hash('demo2024', 12)
  const user = await prisma.user.create({
    data: {
      name: 'Sophie Martin',
      email: 'sophie.martin@example.com',
      passwordHash,
    },
  })

  console.log('✅ Utilisateur créé:', user.email)

  // Créer les cercles avec des configurations variées
  const circles = await Promise.all([
    prisma.circle.create({
      data: { userId: user.id, name: 'Famille proche', color: '#ef4444', frequency: 7, weeklyTarget: 3 },
    }),
    prisma.circle.create({
      data: { userId: user.id, name: 'Famille élargie', color: '#f97316', frequency: 30, weeklyTarget: 1 },
    }),
    prisma.circle.create({
      data: { userId: user.id, name: 'Meilleurs amis', color: '#3b82f6', frequency: 14, weeklyTarget: 2 },
    }),
    prisma.circle.create({
      data: { userId: user.id, name: 'Amis proches', color: '#06b6d4', frequency: 21, weeklyTarget: 1 },
    }),
    prisma.circle.create({
      data: { userId: user.id, name: 'Collègues actuels', color: '#8b5cf6', frequency: 7, weeklyTarget: 5 },
    }),
    prisma.circle.create({
      data: { userId: user.id, name: 'Anciens collègues', color: '#a855f7', frequency: 60, weeklyTarget: 1 },
    }),
    prisma.circle.create({
      data: { userId: user.id, name: 'Sports & Fitness', color: '#10b981', frequency: 14, weeklyTarget: 2 },
    }),
    prisma.circle.create({
      data: { userId: user.id, name: 'Voisinage', color: '#f59e0b', frequency: 60, weeklyTarget: 1 },
    }),
    prisma.circle.create({
      data: { userId: user.id, name: 'Communauté & Loisirs', color: '#ec4899', frequency: 30, weeklyTarget: 1 },
    }),
    prisma.circle.create({
      data: { userId: user.id, name: 'Networking professionnel', color: '#6366f1', frequency: 90, weeklyTarget: 1 },
    }),
  ])

  console.log('✅ Cercles créés:', circles.length)

  // Définir les contacts avec leurs cercles
  const contactsData: Array<{
    gender: 'homme' | 'femme'
    circle: number
    tags: string[]
    ageRange: [number, number]
    relationship: string
    yearsKnown: [number, number]
    company?: boolean
  }> = [
    // Famille proche (10)
    ...Array.from({ length: 10 }, (_, i) => ({
      gender: (i % 2 === 0 ? 'femme' : 'homme') as 'homme' | 'femme',
      circle: 0,
      tags: ['famille', ['mère', 'père', 'sœur', 'frère', 'enfant', 'conjoint'][i % 6]],
      ageRange: [30, 70] as [number, number],
      relationship: 'Famille',
      yearsKnown: [10, 40] as [number, number],
    })),
    // Famille élargie (12)
    ...Array.from({ length: 12 }, (_, i) => ({
      gender: (i % 2 === 0 ? 'femme' : 'homme') as 'homme' | 'femme',
      circle: 1,
      tags: ['famille', ['cousin', 'tante', 'oncle', 'neveu', 'nièce'][i % 5]],
      ageRange: [20, 75] as [number, number],
      relationship: 'Famille',
      yearsKnown: [5, 35] as [number, number],
    })),
    // Meilleurs amis (8)
    ...Array.from({ length: 8 }, (_, i) => ({
      gender: (i % 2 === 0 ? 'femme' : 'homme') as 'homme' | 'femme',
      circle: 2,
      tags: ['ami', 'proche'],
      ageRange: [25, 45] as [number, number],
      relationship: 'Ami',
      yearsKnown: [5, 20] as [number, number],
    })),
    // Amis proches (15)
    ...Array.from({ length: 15 }, (_, i) => ({
      gender: (i % 3 === 0 ? 'femme' : 'homme') as 'homme' | 'femme',
      circle: 3,
      tags: ['ami'],
      ageRange: [25, 50] as [number, number],
      relationship: 'Ami',
      yearsKnown: [2, 15] as [number, number],
    })),
    // Collègues actuels (12)
    ...Array.from({ length: 12 }, (_, i) => ({
      gender: (i % 2 === 0 ? 'femme' : 'homme') as 'homme' | 'femme',
      circle: 4,
      tags: ['collègue', i < 2 ? 'manager' : i < 5 ? 'équipe' : 'autre service'],
      ageRange: [25, 55] as [number, number],
      relationship: 'Collègue',
      yearsKnown: [0.5, 5] as [number, number],
      company: true,
    })),
    // Anciens collègues (10)
    ...Array.from({ length: 10 }, (_, i) => ({
      gender: (i % 2 === 0 ? 'femme' : 'homme') as 'homme' | 'femme',
      circle: 5,
      tags: ['collègue', 'ancien'],
      ageRange: [25, 60] as [number, number],
      relationship: 'Collègue',
      yearsKnown: [3, 15] as [number, number],
      company: true,
    })),
    // Sports & Fitness (8)
    ...Array.from({ length: 8 }, (_, i) => ({
      gender: (i % 2 === 0 ? 'femme' : 'homme') as 'homme' | 'femme',
      circle: 6,
      tags: ['ami', 'sport'],
      ageRange: [25, 50] as [number, number],
      relationship: 'Ami',
      yearsKnown: [1, 8] as [number, number],
    })),
    // Voisinage (6)
    ...Array.from({ length: 6 }, (_, i) => ({
      gender: (i % 2 === 0 ? 'femme' : 'homme') as 'homme' | 'femme',
      circle: 7,
      tags: ['voisin'],
      ageRange: [30, 70] as [number, number],
      relationship: 'Voisin',
      yearsKnown: [0.5, 10] as [number, number],
    })),
    // Communauté & Loisirs (10)
    ...Array.from({ length: 10 }, (_, i) => ({
      gender: (i % 2 === 0 ? 'femme' : 'homme') as 'homme' | 'femme',
      circle: 8,
      tags: ['ami', 'loisir'],
      ageRange: [25, 60] as [number, number],
      relationship: 'Ami',
      yearsKnown: [1, 12] as [number, number],
    })),
    // Networking professionnel (9)
    ...Array.from({ length: 9 }, (_, i) => ({
      gender: (i % 2 === 0 ? 'femme' : 'homme') as 'homme' | 'femme',
      circle: 9,
      tags: ['professionnel', 'réseau'],
      ageRange: [30, 60] as [number, number],
      relationship: 'Professionnel',
      yearsKnown: [0.5, 10] as [number, number],
      company: true,
    })),
  ]

  console.log('🔄 Création de', contactsData.length, 'contacts...\n')

  const createdContacts = []
  const usedNames = new Set<string>()

  for (let i = 0; i < contactsData.length; i++) {
    const data = contactsData[i]
    const circle = circles[data.circle]

    // Générer un nom unique
    let firstName: string, lastName: string, fullName: string
    do {
      const genderKey = data.gender as 'homme' | 'femme'
      firstName = firstNames[genderKey][Math.floor(Math.random() * firstNames[genderKey].length)]
      lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      fullName = `${firstName} ${lastName}`
    } while (usedNames.has(fullName))
    usedNames.add(fullName)

    // Générer un âge et une date de naissance
    const age = data.ageRange[0] + Math.floor(Math.random() * (data.ageRange[1] - data.ageRange[0]))
    const birthday = new Date()
    birthday.setFullYear(birthday.getFullYear() - age)
    birthday.setMonth(Math.floor(Math.random() * 12))
    birthday.setDate(Math.floor(Math.random() * 28) + 1)

    const contact = await prisma.contact.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        email: `${firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${lastName.toLowerCase()}@example.com`,
        phone: `06${Math.floor(Math.random() * 90000000) + 10000000}`,
        company: data.company ? companies[Math.floor(Math.random() * companies.length)] : '',
        relationType: data.relationship,
        birthday,
        desiredFrequency: circle.frequency,
        notes: '',
      },
    })

    // Ajouter les tags
    for (const tag of data.tags) {
      await prisma.contactRelationTag.create({
        data: { contactId: contact.id, tag },
      })
    }

    // Ajouter au cercle
    await prisma.circleMember.create({
      data: { contactId: contact.id, circleId: circle.id },
    })

    createdContacts.push({ ...contact, yearsKnown: data.yearsKnown, circleFreq: circle.frequency })

    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ ${i + 1}/${contactsData.length} contacts créés`)
    }
  }

  console.log('✅ Tous les contacts créés:', createdContacts.length, '\n')

  // Générer des interactions réalistes sur plusieurs années
  console.log('🔄 Création des interactions historiques...\n')

  const now = new Date()
  let totalInteractions = 0

  for (const contact of createdContacts) {
    const yearsKnown = contact.yearsKnown[0] + Math.random() * (contact.yearsKnown[1] - contact.yearsKnown[0])
    const startDate = subtractYears(yearsKnown)
    const frequency = contact.circleFreq

    // Calculer le nombre d'interactions attendues
    const daysKnown = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const expectedInteractions = Math.floor(daysKnown / frequency)

    // Ajouter de la variabilité (±30%)
    const numInteractions = Math.floor(expectedInteractions * (0.7 + Math.random() * 0.6))

    // Générer les interactions avec une distribution réaliste
    for (let i = 0; i < numInteractions; i++) {
      // Distribution des types d'interactions
      let type: string
      const rand = Math.random()
      if (frequency <= 7) {
        // Contacts fréquents: plus de messages et appels
        if (rand < 0.5) type = 'message'
        else if (rand < 0.75) type = 'call'
        else if (rand < 0.95) type = 'meeting'
        else type = 'email'
      } else if (frequency <= 30) {
        // Contacts réguliers: équilibré
        if (rand < 0.4) type = 'message'
        else if (rand < 0.65) type = 'call'
        else if (rand < 0.9) type = 'meeting'
        else type = 'email'
      } else {
        // Contacts occasionnels: plus de rencontres
        if (rand < 0.3) type = 'message'
        else if (rand < 0.5) type = 'call'
        else if (rand < 0.85) type = 'meeting'
        else type = 'email'
      }

      // Date aléatoire dans la période connue
      const happenedAt = randomDate(startDate, now)

      const notes = interactionNotes[type as keyof typeof interactionNotes]
      const note = notes[Math.floor(Math.random() * notes.length)]

      await prisma.interaction.create({
        data: {
          contactId: contact.id,
          type,
          note,
          happenedAt,
        },
      })
      totalInteractions++
    }

    if (createdContacts.indexOf(contact) % 10 === 0) {
      console.log(`  ✓ Interactions créées pour ${createdContacts.indexOf(contact) + 1}/${createdContacts.length} contacts`)
    }
  }

  console.log('✅ Interactions créées:', totalInteractions, '\n')

  // Générer des entrées de journal riches
  console.log('🔄 Création des entrées de journal...\n')

  let totalJournal = 0
  const journalContactsCount = Math.min(50, createdContacts.length)

  for (let i = 0; i < journalContactsCount; i++) {
    const contact = createdContacts[i]
    const numEntries = Math.floor(Math.random() * 8) + 2 // 2-10 entrées

    for (let j = 0; j < numEntries; j++) {
      const template = journalTemplates[Math.floor(Math.random() * journalTemplates.length)]
      const detail = journalDetails[Math.floor(Math.random() * journalDetails.length)]

      const content = template.content
        .replace(/{firstName}/g, contact.firstName)
        .replace(/{detail}/g, detail)

      const yearsKnown = contact.yearsKnown[0] + Math.random() * (contact.yearsKnown[1] - contact.yearsKnown[0])
      const startDate = subtractYears(yearsKnown)
      const happenedAt = randomDate(startDate, now)

      await prisma.journalEntry.create({
        data: {
          contactId: contact.id,
          type: 'note',
          title: template.title,
          content,
          happenedAt,
          private: Math.random() > 0.5,
        },
      })
      totalJournal++
    }
  }

  console.log('✅ Entrées de journal créées:', totalJournal, '\n')

  // Générer des rappels variés
  console.log('🔄 Création des rappels...\n')

  let totalReminders = 0
  const reminderContactsCount = Math.min(30, createdContacts.length)

  for (let i = 0; i < reminderContactsCount; i++) {
    const contact = createdContacts[Math.floor(Math.random() * createdContacts.length)]
    const numReminders = Math.floor(Math.random() * 3) + 1

    for (let j = 0; j < numReminders; j++) {
      const daysFromNow = Math.floor(Math.random() * 60) - 10 // Entre -10 et +50 jours
      const dueDate = addDays(now, daysFromNow)

      const titles = [
        `Souhaiter bon anniversaire à ${contact.firstName}`,
        `Prendre des nouvelles de ${contact.firstName}`,
        `Organiser une sortie avec ${contact.firstName}`,
        `Rappeler ${contact.firstName} pour le projet`,
        `Envoyer un message à ${contact.firstName}`,
        `Appeler ${contact.firstName}`,
        `Féliciter ${contact.firstName} pour son événement`,
        `Inviter ${contact.firstName} à dîner`,
      ]

      await prisma.reminder.create({
        data: {
          contactId: contact.id,
          title: titles[Math.floor(Math.random() * titles.length)],
          dueAt: dueDate,
          done: daysFromNow < -5 ? Math.random() > 0.3 : false,
        },
      })
      totalReminders++
    }
  }

  console.log('✅ Rappels créés:', totalReminders, '\n')

  // Générer des idées cadeaux
  console.log('🔄 Création des idées cadeaux...\n')

  let totalGifts = 0
  const giftContactsCount = Math.min(40, createdContacts.length)

  for (let i = 0; i < giftContactsCount; i++) {
    const contact = createdContacts[Math.floor(Math.random() * createdContacts.length)]
    const numGifts = Math.floor(Math.random() * 4) + 1

    for (let j = 0; j < numGifts; j++) {
      const template = giftIdeas[Math.floor(Math.random() * giftIdeas.length)]
      let title = template.title

      // Remplacer les variables
      if (title.includes('{hobby}')) {
        const hobby = giftVariables.hobby[Math.floor(Math.random() * giftVariables.hobby.length)]
        title = title.replace('{hobby}', hobby)
      }
      if (title.includes('{type}')) {
        const type = giftVariables.type[Math.floor(Math.random() * giftVariables.type.length)]
        title = title.replace('{type}', type)
      }

      const price = template.minPrice + Math.random() * (template.maxPrice - template.minPrice)
      const url = template.url && Math.random() > 0.4 ? `https://example.com/product${Math.floor(Math.random() * 1000)}` : ''

      const notes = [
        `${contact.firstName} en a parlé récemment`,
        'Correspond à ses goûts',
        'Idée originale',
        'À offrir pour son anniversaire',
        'Repéré en discutant ensemble',
        '',
      ]

      await prisma.giftIdea.create({
        data: {
          contactId: contact.id,
          title,
          price: Math.round(price * 100) / 100,
          url,
          note: notes[Math.floor(Math.random() * notes.length)],
          purchased: Math.random() > 0.7,
        },
      })
      totalGifts++
    }
  }

  console.log('✅ Idées cadeaux créées:', totalGifts, '\n')

  // Générer des dates importantes
  console.log('🔄 Création des dates importantes...\n')

  let totalDates = 0

  // Anniversaires
  for (const contact of createdContacts) {
    if (contact.birthday) {
      await prisma.importantDate.create({
        data: {
          contactId: contact.id,
          title: 'Anniversaire',
          date: contact.birthday,
          recurring: true,
          remindDays: 7,
        },
      })
      totalDates++
    }
  }

  // Anniversaires de rencontre
  for (let i = 0; i < Math.min(30, createdContacts.length); i++) {
    const contact = createdContacts[i]
    const yearsKnown = contact.yearsKnown[0] + Math.random() * (contact.yearsKnown[1] - contact.yearsKnown[0])
    const meetingDate = subtractYears(yearsKnown)
    meetingDate.setMonth(Math.floor(Math.random() * 12))
    meetingDate.setDate(Math.floor(Math.random() * 28) + 1)

    await prisma.importantDate.create({
      data: {
        contactId: contact.id,
        title: 'Anniversaire de notre rencontre',
        date: meetingDate,
        recurring: true,
        remindDays: 7,
      },
    })
    totalDates++
  }

  // Autres dates importantes
  const otherDates = ['Anniversaire de mariage', 'Diplôme', 'Promotion', 'Déménagement', 'Naissance enfant']
  for (let i = 0; i < 25; i++) {
    const contact = createdContacts[Math.floor(Math.random() * createdContacts.length)]
    const date = randomDate(subtractYears(5), now)

    await prisma.importantDate.create({
      data: {
        contactId: contact.id,
        title: otherDates[Math.floor(Math.random() * otherDates.length)],
        date,
        recurring: Math.random() > 0.5,
        remindDays: 7,
      },
    })
    totalDates++
  }

  console.log('✅ Dates importantes créées:', totalDates, '\n')

  // Générer des items de conversation
  console.log('🔄 Création des items de conversation...\n')

  let totalConversation = 0
  const conversationContactsCount = Math.min(50, createdContacts.length)

  for (let i = 0; i < conversationContactsCount; i++) {
    const contact = createdContacts[Math.floor(Math.random() * createdContacts.length)]
    const numItems = Math.floor(Math.random() * 5) + 1

    for (let j = 0; j < numItems; j++) {
      const isTopic = Math.random() > 0.5
      const items = isTopic ? conversationTopics : conversationQuestions

      await prisma.conversationItem.create({
        data: {
          contactId: contact.id,
          kind: isTopic ? 'topic' : 'question',
          title: items[Math.floor(Math.random() * items.length)],
          detail: Math.random() > 0.7 ? 'Important à ne pas oublier' : '',
          done: Math.random() > 0.6,
          private: Math.random() > 0.5,
        },
      })
      totalConversation++
    }
  }

  console.log('✅ Items de conversation créés:', totalConversation, '\n')

  // Générer des champs personnalisés
  console.log('🔄 Création des champs personnalisés...\n')

  let totalCustomFields = 0

  for (const contact of createdContacts) {
    const numFields = Math.floor(Math.random() * 6) + 2 // 2-8 champs par contact

    const selectedFields = [...customFieldsTemplates]
      .sort(() => Math.random() - 0.5)
      .slice(0, numFields)

    for (const field of selectedFields) {
      const value = field.values[Math.floor(Math.random() * field.values.length)]

      await prisma.customField.create({
        data: {
          contactId: contact.id,
          label: field.label,
          value,
          private: Math.random() > 0.6,
        },
      })
      totalCustomFields++
    }
  }

  console.log('✅ Champs personnalisés créés:', totalCustomFields, '\n')

  // Créer des liens entre contacts
  console.log('🔄 Création des liens entre contacts...\n')

  let totalLinks = 0

  // Lier les membres de la famille entre eux
  const familyContacts = createdContacts.filter(c => c.relationType === 'Famille')
  for (let i = 0; i < familyContacts.length - 1; i++) {
    for (let j = i + 1; j < familyContacts.length; j++) {
      if (Math.random() > 0.4) {
        try {
          await prisma.contactLink.create({
            data: {
              fromContactId: familyContacts[i].id,
              toContactId: familyContacts[j].id,
              source: 'manual',
              label: 'Famille',
            },
          })
          totalLinks++
        } catch {
          // Ignore les doublons
        }
      }
    }
  }

  // Lier quelques amis entre eux
  const friendContacts = createdContacts.filter(c => c.relationType === 'Ami')
  for (let i = 0; i < 30; i++) {
    const contact1 = friendContacts[Math.floor(Math.random() * friendContacts.length)]
    const contact2 = friendContacts[Math.floor(Math.random() * friendContacts.length)]

    if (contact1.id !== contact2.id) {
      try {
        await prisma.contactLink.create({
          data: {
            fromContactId: contact1.id,
            toContactId: contact2.id,
            source: 'mention',
            label: 'Amis communs',
          },
        })
        totalLinks++
      } catch {
        // Ignore les doublons
      }
    }
  }

  console.log('✅ Liens entre contacts créés:', totalLinks, '\n')

  console.log('\n✨ Seeding avancé terminé avec succès!\n')
  console.log('═══════════════════════════════════════════════════')
  console.log('📧 Email: sophie.martin@example.com')
  console.log('🔑 Mot de passe: demo2024')
  console.log('═══════════════════════════════════════════════════\n')
  console.log('📊 Résumé détaillé:')
  console.log(`   - ${createdContacts.length} contacts`)
  console.log(`   - ${totalInteractions} interactions (sur plusieurs années)`)
  console.log(`   - ${totalReminders} rappels`)
  console.log(`   - ${totalGifts} idées cadeaux`)
  console.log(`   - ${totalJournal} entrées de journal`)
  console.log(`   - ${totalDates} dates importantes`)
  console.log(`   - ${totalConversation} items de conversation`)
  console.log(`   - ${totalCustomFields} champs personnalisés`)
  console.log(`   - ${totalLinks} liens entre contacts`)
  console.log('═══════════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

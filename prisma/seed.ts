import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

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

  // Créer les cercles
  const circles = await Promise.all([
    prisma.circle.create({
      data: {
        userId: user.id,
        name: 'Famille proche',
        color: '#ef4444',
        frequency: 7,
        weeklyTarget: 3,
      },
    }),
    prisma.circle.create({
      data: {
        userId: user.id,
        name: 'Meilleurs amis',
        color: '#3b82f6',
        frequency: 14,
        weeklyTarget: 2,
      },
    }),
    prisma.circle.create({
      data: {
        userId: user.id,
        name: 'Collègues',
        color: '#8b5cf6',
        frequency: 30,
        weeklyTarget: 1,
      },
    }),
    prisma.circle.create({
      data: {
        userId: user.id,
        name: 'Sports & Loisirs',
        color: '#10b981',
        frequency: 21,
        weeklyTarget: 1,
      },
    }),
    prisma.circle.create({
      data: {
        userId: user.id,
        name: 'Voisins',
        color: '#f59e0b',
        frequency: 60,
        weeklyTarget: 1,
      },
    }),
  ])

  console.log('✅ Cercles créés:', circles.length)

  // Générer des contacts
  const contacts = [
    // Famille proche (7)
    { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@example.com', phone: '0601020304', relationType: 'Famille', tags: ['famille', 'sœur'], circle: 0, birthday: new Date(1988, 5, 15) },
    { firstName: 'Pierre', lastName: 'Martin', email: 'pierre.martin@example.com', phone: '0601020305', relationType: 'Famille', tags: ['famille', 'frère'], circle: 0, birthday: new Date(1990, 2, 22) },
    { firstName: 'Claire', lastName: 'Dubois', email: 'claire.dubois@example.com', phone: '0601020306', relationType: 'Famille', tags: ['famille', 'mère'], circle: 0, birthday: new Date(1960, 8, 10) },
    { firstName: 'Jean', lastName: 'Martin', email: 'jean.martin@example.com', phone: '0601020307', relationType: 'Famille', tags: ['famille', 'père'], circle: 0, birthday: new Date(1958, 11, 5) },
    { firstName: 'Lucas', lastName: 'Bernard', email: 'lucas.bernard@example.com', phone: '0601020308', relationType: 'Famille', tags: ['famille', 'cousin'], circle: 0, birthday: new Date(1995, 3, 18) },
    { firstName: 'Emma', lastName: 'Rousseau', email: 'emma.rousseau@example.com', phone: '0601020309', relationType: 'Famille', tags: ['famille', 'tante'], circle: 0, birthday: new Date(1970, 7, 25) },
    { firstName: 'Thomas', lastName: 'Martin', email: 'thomas.martin@example.com', phone: '0601020310', relationType: 'Famille', tags: ['famille', 'oncle'], circle: 0, birthday: new Date(1965, 1, 12) },

    // Meilleurs amis (8)
    { firstName: 'Julie', lastName: 'Leroy', email: 'julie.leroy@example.com', phone: '0602030405', relationType: 'Ami', tags: ['ami', 'proche'], circle: 1, birthday: new Date(1992, 4, 8) },
    { firstName: 'Mathieu', lastName: 'Petit', email: 'mathieu.petit@example.com', phone: '0602030406', relationType: 'Ami', tags: ['ami', 'proche'], circle: 1, birthday: new Date(1991, 9, 14) },
    { firstName: 'Sarah', lastName: 'Moreau', email: 'sarah.moreau@example.com', phone: '0602030407', relationType: 'Ami', tags: ['ami', 'proche'], circle: 1, birthday: new Date(1993, 6, 20) },
    { firstName: 'Alexandre', lastName: 'Simon', email: 'alex.simon@example.com', phone: '0602030408', relationType: 'Ami', tags: ['ami', 'proche'], circle: 1, birthday: new Date(1990, 10, 3) },
    { firstName: 'Camille', lastName: 'Laurent', email: 'camille.laurent@example.com', phone: '0602030409', relationType: 'Ami', tags: ['ami', 'proche'], circle: 1, birthday: new Date(1994, 2, 17) },
    { firstName: 'Nicolas', lastName: 'Michel', email: 'nicolas.michel@example.com', phone: '0602030410', relationType: 'Ami', tags: ['ami', 'proche'], circle: 1, birthday: new Date(1989, 11, 28) },
    { firstName: 'Laura', lastName: 'Garcia', email: 'laura.garcia@example.com', phone: '0602030411', relationType: 'Ami', tags: ['ami', 'proche'], circle: 1, birthday: new Date(1992, 5, 9) },
    { firstName: 'Julien', lastName: 'Bonnet', email: 'julien.bonnet@example.com', phone: '0602030412', relationType: 'Ami', tags: ['ami', 'proche'], circle: 1, birthday: new Date(1991, 8, 22) },

    // Collègues (10)
    { firstName: 'David', lastName: 'Dupont', email: 'david.dupont@tech-corp.com', phone: '0603040506', company: 'TechCorp', relationType: 'Collègue', tags: ['collègue'], circle: 2, birthday: new Date(1987, 3, 5) },
    { firstName: 'Sophie', lastName: 'Roux', email: 'sophie.roux@tech-corp.com', phone: '0603040507', company: 'TechCorp', relationType: 'Collègue', tags: ['collègue', 'manager'], circle: 2, birthday: new Date(1985, 7, 19) },
    { firstName: 'Marc', lastName: 'Fournier', email: 'marc.fournier@tech-corp.com', phone: '0603040508', company: 'TechCorp', relationType: 'Collègue', tags: ['collègue'], circle: 2, birthday: new Date(1990, 1, 14) },
    { firstName: 'Isabelle', lastName: 'Girard', email: 'isabelle.girard@tech-corp.com', phone: '0603040509', company: 'TechCorp', relationType: 'Collègue', tags: ['collègue'], circle: 2, birthday: new Date(1988, 9, 27) },
    { firstName: 'Antoine', lastName: 'Blanc', email: 'antoine.blanc@tech-corp.com', phone: '0603040510', company: 'TechCorp', relationType: 'Collègue', tags: ['collègue'], circle: 2, birthday: new Date(1993, 4, 11) },
    { firstName: 'Céline', lastName: 'Faure', email: 'celine.faure@tech-corp.com', phone: '0603040511', company: 'TechCorp', relationType: 'Collègue', tags: ['collègue'], circle: 2, birthday: new Date(1991, 6, 8) },
    { firstName: 'Vincent', lastName: 'Lambert', email: 'vincent.lambert@startup.io', phone: '0603040512', company: 'Startup.io', relationType: 'Collègue', tags: ['collègue', 'externe'], circle: 2, birthday: new Date(1989, 10, 16) },
    { firstName: 'Nathalie', lastName: 'Mercier', email: 'nathalie.mercier@freelance.com', phone: '0603040513', company: 'Freelance', relationType: 'Collègue', tags: ['collègue', 'freelance'], circle: 2, birthday: new Date(1986, 2, 23) },
    { firstName: 'Olivier', lastName: 'Chevalier', email: 'olivier.chevalier@tech-corp.com', phone: '0603040514', company: 'TechCorp', relationType: 'Collègue', tags: ['collègue'], circle: 2, birthday: new Date(1992, 5, 30) },
    { firstName: 'Valérie', lastName: 'Roussel', email: 'valerie.roussel@tech-corp.com', phone: '0603040515', company: 'TechCorp', relationType: 'Collègue', tags: ['collègue', 'RH'], circle: 2, birthday: new Date(1984, 11, 7) },

    // Sports & Loisirs (6)
    { firstName: 'François', lastName: 'Moreno', email: 'francois.moreno@example.com', phone: '0604050607', relationType: 'Ami', tags: ['ami', 'sport'], circle: 3, birthday: new Date(1990, 8, 4) },
    { firstName: 'Audrey', lastName: 'Perrin', email: 'audrey.perrin@example.com', phone: '0604050608', relationType: 'Ami', tags: ['ami', 'sport'], circle: 3, birthday: new Date(1993, 3, 21) },
    { firstName: 'Maxime', lastName: 'Robin', email: 'maxime.robin@example.com', phone: '0604050609', relationType: 'Ami', tags: ['ami', 'sport'], circle: 3, birthday: new Date(1991, 7, 15) },
    { firstName: 'Élodie', lastName: 'Clement', email: 'elodie.clement@example.com', phone: '0604050610', relationType: 'Ami', tags: ['ami', 'loisir'], circle: 3, birthday: new Date(1989, 12, 2) },
    { firstName: 'Sébastien', lastName: 'Gauthier', email: 'sebastien.gauthier@example.com', phone: '0604050611', relationType: 'Ami', tags: ['ami', 'sport'], circle: 3, birthday: new Date(1987, 5, 19) },
    { firstName: 'Marina', lastName: 'Lopez', email: 'marina.lopez@example.com', phone: '0604050612', relationType: 'Ami', tags: ['ami', 'loisir'], circle: 3, birthday: new Date(1994, 9, 26) },

    // Voisins (4)
    { firstName: 'Philippe', lastName: 'Renard', email: 'philippe.renard@example.com', phone: '0605060708', relationType: 'Voisin', tags: ['voisin'], circle: 4, birthday: new Date(1975, 4, 13) },
    { firstName: 'Monique', lastName: 'Dufour', email: 'monique.dufour@example.com', phone: '0605060709', relationType: 'Voisin', tags: ['voisin'], circle: 4, birthday: new Date(1968, 10, 8) },
    { firstName: 'Benoît', lastName: 'Lemoine', email: 'benoit.lemoine@example.com', phone: '0605060710', relationType: 'Voisin', tags: ['voisin'], circle: 4, birthday: new Date(1982, 1, 25) },
    { firstName: 'Caroline', lastName: 'Marchand', email: 'caroline.marchand@example.com', phone: '0605060711', relationType: 'Voisin', tags: ['voisin'], circle: 4, birthday: new Date(1979, 6, 17) },
  ]

  console.log('🔄 Création des contacts...')

  const createdContacts = []
  for (const contactData of contacts) {
    const { tags, circle, ...data } = contactData
    const contact = await prisma.contact.create({
      data: {
        ...data,
        userId: user.id,
        desiredFrequency: circle === 0 ? 7 : circle === 1 ? 14 : circle === 2 ? 30 : circle === 3 ? 21 : 60,
      },
    })

    // Ajouter les tags
    for (const tag of tags) {
      await prisma.contactRelationTag.create({
        data: {
          contactId: contact.id,
          tag,
        },
      })
    }

    // Ajouter au cercle
    await prisma.circleMember.create({
      data: {
        contactId: contact.id,
        circleId: circles[circle].id,
      },
    })

    createdContacts.push(contact)
  }

  console.log('✅ Contacts créés:', createdContacts.length)

  // Générer des interactions pour chaque contact
  console.log('🔄 Création des interactions...')

  const interactionTypes = ['message', 'call', 'meeting', 'email']
  const interactionNotes = [
    'Discussion sur le projet en cours',
    'Pris des nouvelles',
    'Planifié une sortie ensemble',
    'Échange sur les vacances',
    'Parlé du travail',
    'Discuté de nos projets respectifs',
    'Rattrapage sympathique',
    'Point sur la situation',
    'Café improvisé',
    'Déjeuner ensemble',
    'Appel vidéo',
    'Messages échangés toute la soirée',
    'Rencontre rapide au supermarché',
    'Discussion intéressante sur la vie',
    '',
  ]

  let totalInteractions = 0
  for (const contact of createdContacts) {
    // Nombre variable d'interactions selon le cercle
    const numInteractions = contact.desiredFrequency <= 7 ? 15 : contact.desiredFrequency <= 14 ? 10 : contact.desiredFrequency <= 30 ? 6 : 3

    for (let i = 0; i < numInteractions; i++) {
      const daysAgo = Math.floor(Math.random() * 90) // Dans les 90 derniers jours
      const happenedAt = new Date()
      happenedAt.setDate(happenedAt.getDate() - daysAgo)

      await prisma.interaction.create({
        data: {
          contactId: contact.id,
          type: interactionTypes[Math.floor(Math.random() * interactionTypes.length)],
          note: interactionNotes[Math.floor(Math.random() * interactionNotes.length)],
          happenedAt,
        },
      })
      totalInteractions++
    }
  }

  console.log('✅ Interactions créées:', totalInteractions)

  // Ajouter des rappels pour certains contacts
  console.log('🔄 Création des rappels...')
  const sampleContacts = createdContacts.slice(0, 12)
  let totalReminders = 0

  for (const contact of sampleContacts) {
    const daysFromNow = Math.floor(Math.random() * 30) - 5 // Entre -5 et +25 jours
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysFromNow)

    const reminders = [
      `Souhaiter bon anniversaire à ${contact.firstName}`,
      `Prendre des nouvelles de ${contact.firstName}`,
      `Organiser une sortie avec ${contact.firstName}`,
      `Rappeler ${contact.firstName} pour le projet`,
      `Envoyer un message à ${contact.firstName}`,
    ]

    await prisma.reminder.create({
      data: {
        contactId: contact.id,
        title: reminders[Math.floor(Math.random() * reminders.length)],
        dueAt: dueDate,
        done: daysFromNow < -2 ? Math.random() > 0.5 : false,
      },
    })
    totalReminders++
  }

  console.log('✅ Rappels créés:', totalReminders)

  // Ajouter des idées cadeaux
  console.log('🔄 Création des idées cadeaux...')
  const giftIdeas = [
    { title: 'Livre sur la photographie', price: 29.99, url: '' },
    { title: 'Coffret de thé premium', price: 45.00, url: '' },
    { title: 'Écouteurs sans fil', price: 89.90, url: 'https://example.com/product1' },
    { title: 'Plante décorative', price: 25.50, url: '' },
    { title: 'Cadre photo personnalisé', price: 35.00, url: 'https://example.com/product2' },
    { title: 'Bon cadeau restaurant', price: 50.00, url: '' },
    { title: 'Montre connectée', price: 199.00, url: 'https://example.com/product3' },
    { title: 'Sac à dos de randonnée', price: 79.99, url: '' },
    { title: 'Cours de cuisine', price: 120.00, url: '' },
    { title: 'Jeu de société', price: 39.90, url: '' },
  ]

  let totalGifts = 0
  for (let i = 0; i < 15; i++) {
    const contact = createdContacts[Math.floor(Math.random() * createdContacts.length)]
    const gift = giftIdeas[Math.floor(Math.random() * giftIdeas.length)]

    await prisma.giftIdea.create({
      data: {
        contactId: contact.id,
        title: gift.title,
        price: gift.price,
        url: gift.url,
        note: Math.random() > 0.7 ? 'Il/Elle en a parlé récemment' : '',
        purchased: Math.random() > 0.8,
      },
    })
    totalGifts++
  }

  console.log('✅ Idées cadeaux créées:', totalGifts)

  // Ajouter des entrées de journal
  console.log('🔄 Création des entrées de journal...')
  const journalTitles = [
    'Soirée mémorable',
    'Discussion importante',
    'Rencontre inattendue',
    'Moment de partage',
    'Confidence',
    'Projet commun',
    'Anniversaire',
    'Réflexion personnelle',
  ]

  const journalContents = [
    'Nous avons passé une excellente soirée ensemble. La conversation était fluide et enrichissante.',
    'Discussion profonde sur nos aspirations et nos projets futurs.',
    'Rencontre imprévue qui s\'est transformée en moment agréable.',
    'Partage d\'expériences et de conseils mutuels.',
    'Moment de confiance où nous avons pu nous ouvrir l\'un à l\'autre.',
    'Nous avons commencé à planifier un projet ensemble, très motivant !',
    'Célébration d\'anniversaire, ambiance chaleureuse et conviviale.',
    'Réflexion sur notre amitié/relation et ce qu\'elle m\'apporte.',
  ]

  let totalJournal = 0
  for (let i = 0; i < 20; i++) {
    const contact = createdContacts[Math.floor(Math.random() * createdContacts.length)]
    const daysAgo = Math.floor(Math.random() * 60)
    const happenedAt = new Date()
    happenedAt.setDate(happenedAt.getDate() - daysAgo)

    await prisma.journalEntry.create({
      data: {
        contactId: contact.id,
        type: 'note',
        title: journalTitles[Math.floor(Math.random() * journalTitles.length)],
        content: journalContents[Math.floor(Math.random() * journalContents.length)],
        happenedAt,
        private: Math.random() > 0.6,
      },
    })
    totalJournal++
  }

  console.log('✅ Entrées de journal créées:', totalJournal)

  // Ajouter des dates importantes
  console.log('🔄 Création des dates importantes...')
  let totalDates = 0

  for (const contact of createdContacts.slice(0, 15)) {
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

  // Ajouter quelques dates anniversaires de rencontre
  for (let i = 0; i < 8; i++) {
    const contact = createdContacts[Math.floor(Math.random() * createdContacts.length)]
    const meetingDate = new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)

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

  console.log('✅ Dates importantes créées:', totalDates)

  // Ajouter des items de conversation
  console.log('🔄 Création des items de conversation...')
  const conversationTopics = [
    { kind: 'topic', title: 'Lui demander comment se passe son nouveau projet' },
    { kind: 'question', title: 'Qu\'est-ce qu\'il pense de la situation actuelle ?' },
    { kind: 'topic', title: 'Parler de mes vacances' },
    { kind: 'question', title: 'Comment va sa famille ?' },
    { kind: 'topic', title: 'Discuter du dernier film qu\'on a vu' },
    { kind: 'question', title: 'A-t-il besoin d\'aide pour son déménagement ?' },
    { kind: 'topic', title: 'Organiser une sortie restaurant' },
    { kind: 'question', title: 'Prendre des nouvelles de sa santé' },
  ]

  let totalConversation = 0
  for (let i = 0; i < 25; i++) {
    const contact = createdContacts[Math.floor(Math.random() * createdContacts.length)]
    const item = conversationTopics[Math.floor(Math.random() * conversationTopics.length)]

    await prisma.conversationItem.create({
      data: {
        contactId: contact.id,
        kind: item.kind,
        title: item.title,
        detail: Math.random() > 0.7 ? 'Important à ne pas oublier' : '',
        done: Math.random() > 0.7,
        private: Math.random() > 0.5,
      },
    })
    totalConversation++
  }

  console.log('✅ Items de conversation créés:', totalConversation)

  // Ajouter des champs personnalisés
  console.log('🔄 Création des champs personnalisés...')
  const customFieldsData = [
    { label: 'Plat préféré', value: 'Pasta carbonara' },
    { label: 'Hobby principal', value: 'Photographie' },
    { label: 'Film préféré', value: 'Inception' },
    { label: 'Musique préférée', value: 'Rock alternatif' },
    { label: 'Couleur préférée', value: 'Bleu' },
    { label: 'Allergies', value: 'Arachides' },
    { label: 'Sport pratiqué', value: 'Tennis' },
    { label: 'Livre favori', value: '1984' },
  ]

  let totalCustomFields = 0
  for (let i = 0; i < 30; i++) {
    const contact = createdContacts[Math.floor(Math.random() * createdContacts.length)]
    const field = customFieldsData[Math.floor(Math.random() * customFieldsData.length)]

    await prisma.customField.create({
      data: {
        contactId: contact.id,
        label: field.label,
        value: field.value,
        private: Math.random() > 0.6,
      },
    })
    totalCustomFields++
  }

  console.log('✅ Champs personnalisés créés:', totalCustomFields)

  // Créer quelques liens entre contacts (mentions)
  console.log('🔄 Création des liens entre contacts...')
  let totalLinks = 0

  // Lier les membres de la famille entre eux
  const familyContacts = createdContacts.slice(0, 7)
  for (let i = 0; i < familyContacts.length - 1; i++) {
    for (let j = i + 1; j < familyContacts.length; j++) {
      if (Math.random() > 0.5) {
        await prisma.contactLink.create({
          data: {
            fromContactId: familyContacts[i].id,
            toContactId: familyContacts[j].id,
            source: 'manual',
            label: 'Famille',
          },
        })
        totalLinks++
      }
    }
  }

  // Lier quelques amis entre eux
  const friendContacts = createdContacts.slice(7, 15)
  for (let i = 0; i < 5; i++) {
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

  console.log('✅ Liens entre contacts créés:', totalLinks)

  console.log('\n✨ Seeding terminé avec succès!')
  console.log('\n📧 Email: sophie.martin@example.com')
  console.log('🔑 Mot de passe: demo2024')
  console.log('\n📊 Résumé:')
  console.log(`   - ${createdContacts.length} contacts`)
  console.log(`   - ${totalInteractions} interactions`)
  console.log(`   - ${totalReminders} rappels`)
  console.log(`   - ${totalGifts} idées cadeaux`)
  console.log(`   - ${totalJournal} entrées de journal`)
  console.log(`   - ${totalDates} dates importantes`)
  console.log(`   - ${totalConversation} items de conversation`)
  console.log(`   - ${totalCustomFields} champs personnalisés`)
  console.log(`   - ${totalLinks} liens entre contacts`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

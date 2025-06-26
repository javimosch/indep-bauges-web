/**
 * Test script to create sample pages for testing the database-driven page system
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the Page model
const Page = require('./src/models/Page');

async function createTestPages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/indep-bauges');
    console.log('Connected to MongoDB');

    // Sample pages to create
    const samplePages = [
      {
        slug: 'co-working-spaces',
        title: 'Espaces de Co-working',
        content: `
          <h2>Nos Espaces de Travail Partagé</h2>
          <p>Découvrez nos espaces de co-working dans le massif des Bauges, conçus pour favoriser la collaboration et la créativité entre professionnels indépendants.</p>
          
          <h3>Espace Principal</h3>
          <p>Un open space lumineux avec vue sur les montagnes, équipé de postes de travail modulables et d'une connexion internet haut débit.</p>
          
          <h3>Salles de Réunion</h3>
          <p>Deux salles de réunion équipées pour vos rendez-vous clients et sessions de brainstorming.</p>
          
          <h3>Espace Détente</h3>
          <p>Un coin cuisine et détente pour vos pauses, avec vue panoramique sur les Bauges.</p>
        `,
        template: 'default',
        layout: 'default',
        status: 'published',
        author: 'admin',
        meta: {
          description: 'Espaces de co-working dans les Bauges pour freelances et entrepreneurs',
          keywords: ['co-working', 'bauges', 'espace de travail', 'freelance']
        },
        settings: {
          showInNavigation: true,
          navigationOrder: 1
        }
      },
      {
        slug: 'about-us',
        title: 'À Propos de Notre Association',
        content: `
          <h2>Notre Histoire</h2>
          <p>Les Indép'en Bauges est née de la volonté de créer un réseau solidaire de professionnels indépendants dans le massif des Bauges.</p>
          
          <h3>Notre Mission</h3>
          <p>Favoriser l'entraide, le partage d'expériences et la collaboration entre freelances et entrepreneurs du territoire.</p>
          
          <h3>Nos Valeurs</h3>
          <ul>
            <li><strong>Solidarité</strong> : Nous nous entraidons dans nos projets</li>
            <li><strong>Qualité de vie</strong> : Concilier travail et cadre de vie exceptionnel</li>
            <li><strong>Innovation</strong> : Encourager les nouvelles façons de travailler</li>
            <li><strong>Territoire</strong> : Contribuer au développement local</li>
          </ul>
        `,
        template: 'default',
        layout: 'default',
        status: 'published',
        author: 'admin',
        meta: {
          description: 'Découvrez l\'histoire et les valeurs de l\'association Les Indép\'en Bauges',
          keywords: ['association', 'bauges', 'freelance', 'entrepreneurs', 'histoire']
        },
        settings: {
          showInNavigation: true,
          navigationOrder: 2
        }
      },
      {
        slug: 'contact-us',
        title: 'Contactez-nous',
        content: `
          <h2>Nous Contacter</h2>
          <p>Vous souhaitez rejoindre notre association ou en savoir plus sur nos activités ? N'hésitez pas à nous contacter !</p>
          
          <h3>Informations Pratiques</h3>
          <p><strong>Adresse :</strong><br>
          Maison des Associations<br>
          73630 Le Châtelard</p>
          
          <p><strong>Email :</strong><br>
          <a href="mailto:contact@independants-bauges.fr">contact@independants-bauges.fr</a></p>
          
          <p><strong>Téléphone :</strong><br>
          06 XX XX XX XX</p>
          
          <h3>Horaires d'Ouverture</h3>
          <p>Du lundi au vendredi : 9h00 - 18h00<br>
          Samedi : 9h00 - 12h00</p>
        `,
        template: 'contact',
        layout: 'default',
        status: 'published',
        author: 'admin',
        meta: {
          description: 'Contactez l\'association Les Indép\'en Bauges - Horaires, adresse et informations pratiques',
          keywords: ['contact', 'bauges', 'association', 'adresse', 'horaires']
        },
        settings: {
          showInNavigation: true,
          navigationOrder: 3
        }
      },
      {
        slug: 'welcome',
        title: 'Bienvenue dans les Bauges',
        content: `
          <h2>Un Territoire d'Exception</h2>
          <p>Le massif des Bauges offre un cadre de vie unique pour développer votre activité professionnelle tout en profitant d'un environnement naturel préservé.</p>
          
          <h3>Pourquoi Choisir les Bauges ?</h3>
          <ul>
            <li>Proximité avec les grandes villes (Chambéry, Annecy)</li>
            <li>Qualité de vie exceptionnelle</li>
            <li>Communauté dynamique de professionnels</li>
            <li>Espaces de travail modernes</li>
          </ul>
          
          <p>Rejoignez-nous pour découvrir toutes les opportunités qu'offre notre territoire !</p>
        `,
        template: 'landing',
        layout: 'default',
        status: 'published',
        author: 'admin',
        meta: {
          description: 'Découvrez pourquoi les Bauges sont le territoire idéal pour les professionnels indépendants',
          keywords: ['bauges', 'territoire', 'qualité de vie', 'freelance', 'montagne'],
          ogImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1470'
        },
        settings: {
          showInNavigation: false,
          navigationOrder: 0
        }
      }
    ];

    // Create pages
    for (const pageData of samplePages) {
      try {
        // Check if page already exists
        const existingPage = await Page.findOne({ slug: pageData.slug });
        
        if (existingPage) {
          console.log(`Page "${pageData.slug}" already exists, skipping...`);
          continue;
        }

        // Create new page
        const page = new Page(pageData);
        await page.save();
        
        console.log(`✓ Created page: ${pageData.title} (/${pageData.slug})`);
      } catch (error) {
        console.error(`✗ Error creating page "${pageData.slug}":`, error.message);
      }
    }

    console.log('\n🎉 Test pages creation completed!');
    console.log('\nYou can now test the following URLs:');
    console.log('- http://localhost:3000/co-working-spaces');
    console.log('- http://localhost:3000/about-us');
    console.log('- http://localhost:3000/contact-us');
    console.log('- http://localhost:3000/welcome');
    console.log('\nAdmin page management: Login as admin and look for the "Pages" button');

  } catch (error) {
    console.error('Error creating test pages:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createTestPages();
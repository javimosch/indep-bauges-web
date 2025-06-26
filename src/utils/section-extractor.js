/**
 * Content extraction utility to migrate legacy sections to database
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

class SectionExtractor {
  constructor() {
    this.sectionsPath = path.join(__dirname, '../sections');
    this.extractedContent = {};
  }
  
  async extractAllSections() {
    console.log('🔄 Starting section extraction...');
    
    const sections = [
      'hero',
      'about', 
      'services',
      'members',
      'testimonials',
      'contact',
      'newsletter'
    ];
    
    for (const sectionName of sections) {
      try {
        const content = await this.extractSection(sectionName);
        this.extractedContent[sectionName] = content;
        console.log(`✅ Extracted: ${sectionName}`);
      } catch (error) {
        console.error(`❌ Error extracting ${sectionName}:`, error.message);
        // Create placeholder content if extraction fails
        this.extractedContent[sectionName] = {
          content: `<div class="section-placeholder"><h2>${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Section</h2><p>Content will be migrated here.</p></div>`,
          order: sections.indexOf(sectionName) + 1,
          visible: true
        };
      }
    }
    
    console.log('✅ Section extraction completed');
    return this.extractedContent;
  }
  
  async extractSection(sectionName) {
    const sectionFile = path.join(this.sectionsPath, `${sectionName}.html`);
    
    try {
      // Check if section file exists
      await fs.access(sectionFile);
      
      // Read section content
      const rawContent = await fs.readFile(sectionFile, 'utf8');
      
      // Parse and clean the content
      const cleanedContent = this.cleanSectionContent(rawContent, sectionName);
      
      return {
        content: cleanedContent,
        order: this.getSectionOrder(sectionName),
        visible: true,
        originalFile: `${sectionName}.html`
      };
      
    } catch (error) {
      throw new Error(`Failed to extract section ${sectionName}: ${error.message}`);
    }
  }
  
  cleanSectionContent(rawContent, sectionName) {
    try {
      // Create a DOM to parse and clean the content
      const dom = new JSDOM(`<!DOCTYPE html><html><body>${rawContent}</body></html>`);
      const document = dom.window.document;
      
      // Find the main section element or create one
      let sectionElement = document.querySelector('section');
      
      if (!sectionElement) {
        // If no section tag, wrap content in a section
        const bodyContent = document.body.innerHTML;
        sectionElement = document.createElement('section');
        sectionElement.innerHTML = bodyContent;
        sectionElement.id = sectionName;
        sectionElement.className = `section-${sectionName}`;
      }
      
      // Ensure section has proper ID and class
      if (!sectionElement.id) {
        sectionElement.id = sectionName;
      }
      
      if (!sectionElement.className.includes(`section-${sectionName}`)) {
        sectionElement.className += ` section-${sectionName}`;
      }
      
      // Clean up any script tags (they'll be handled separately)
      const scripts = sectionElement.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      
      // Return the cleaned HTML
      return sectionElement.outerHTML;
      
    } catch (error) {
      console.warn(`Warning: Could not parse ${sectionName} as HTML, using raw content`);
      // Fallback: wrap raw content in a section
      return `<section id="${sectionName}" class="section-${sectionName}">${rawContent}</section>`;
    }
  }
  
  getSectionOrder(sectionName) {
    const defaultOrder = {
      'hero': 1,
      'about': 2,
      'services': 3,
      'members': 4,
      'testimonials': 5,
      'contact': 6,
      'newsletter': 7
    };
    
    return defaultOrder[sectionName] || 999;
  }
  
  async extractMetadata() {
    try {
      // Try to extract metadata from head.html
      const headFile = path.join(this.sectionsPath, 'head.html');
      const headContent = await fs.readFile(headFile, 'utf8');
      
      // Parse head content for title and meta tags
      const dom = new JSDOM(`<!DOCTYPE html><html><head>${headContent}</head></html>`);
      const document = dom.window.document;
      
      const title = document.querySelector('title')?.textContent || 'Les Indép\'en Bauges';
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || 'Association de freelances et entrepreneurs indépendants dans les Bauges';
      const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',').map(k => k.trim()) || ['freelance', 'bauges', 'entrepreneurs', 'association'];
      
      return {
        title,
        description,
        keywords
      };
      
    } catch (error) {
      console.warn('Could not extract metadata from head.html, using defaults');
      return {
        title: 'Les Indép\'en Bauges',
        description: 'Association de freelances et entrepreneurs indépendants dans les Bauges',
        keywords: ['freelance', 'bauges', 'entrepreneurs', 'association']
      };
    }
  }
  
  generateHomePageData(extractedSections, metadata) {
    // Generate content summary from sections for the required content field
    const contentSummary = this.generateContentSummary(extractedSections);
    
    return {
      slug: 'home',
      title: metadata.title,
      content: contentSummary, // Generated summary of sections
      template: 'home',
      layout: 'default',
      status: 'published',
      author: 'migration-tool',
      meta: {
        description: metadata.description,
        keywords: metadata.keywords
      },
      settings: {
        showInNavigation: false, // Home page doesn't need to be in navigation
        navigationOrder: 0,
        requireAuth: false
      },
      sections: extractedSections,
      migrationInfo: {
        migratedAt: new Date(),
        originalSections: Object.keys(extractedSections),
        migrationVersion: '1.0.0'
      }
    };
  }
  
  generateContentSummary(sections) {
    // Create a summary of all sections for the content field
    const sectionNames = Object.keys(sections);
    const summary = `
      <div class="home-page-summary">
        <h2>Page d'accueil - Les Ind�p'en Bauges</h2>
        <p>Cette page contient ${sectionNames.length} sections:</p>
        <ul>
          ${sectionNames.map(name => `<li>${name.charAt(0).toUpperCase() + name.slice(1)}</li>`).join('')}
        </ul>
        <p><em>Le contenu est g�r� via le syst�me de sections dans la base de donn�es.</em></p>
      </div>
    `;
    
    return summary.trim();
  }
  
  async createBackup() {
    const backupDir = path.join(__dirname, '../sections-backup');
    
    try {
      // Create backup directory
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy all section files
      const sectionFiles = await fs.readdir(this.sectionsPath);
      
      for (const file of sectionFiles) {
        const sourcePath = path.join(this.sectionsPath, file);
        const backupPath = path.join(backupDir, file);
        await fs.copyFile(sourcePath, backupPath);
      }
      
      // Create backup info file
      const backupInfo = {
        createdAt: new Date(),
        originalPath: this.sectionsPath,
        files: sectionFiles,
        purpose: 'Backup before migration to database-driven home page'
      };
      
      await fs.writeFile(
        path.join(backupDir, 'backup-info.json'),
        JSON.stringify(backupInfo, null, 2)
      );
      
      console.log(`✅ Backup created at: ${backupDir}`);
      return backupDir;
      
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }
}

module.exports = SectionExtractor;